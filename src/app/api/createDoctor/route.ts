import { NextResponse } from 'next/server'

import { adminFirestore, getAdminApp } from '@/config/firebase/firebaseAdmin'
import {
  forbiddenRouteResponse,
  hasRouteUserRole,
  requireAuthenticatedRouteUser,
} from '@/lib/server/routeAuth'
import {
  createUserAuthAdmin,
  deleteUserAuthAdmin,
} from '@/services/firebase/firebaseAdmin'
import { memedService } from '@/services/memed'
import { UserRole, UserStatus } from '@/types/entities/user'
import { generateRandomPassword } from '@/utils/generateRandomPassword'
import { getMemedIdForSpecialty } from '@/utils/specialtyHelpers'

interface CreateDoctorRequest {
  name: string
  email: string
  cpf: string
  birthDate: string
  state: string
  crm?: string
  crmState?: string
  specialty?: string
}

interface CreateDoctorResponse {
  uid: string | null
  password: string | null
  error: string | null
  success: boolean
  rolledBack?: boolean
  warnings?: string[]
}

const removeUndefinedFields = (value: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined),
  )

const normalizeEmail = (email: string) => email.trim().toLowerCase()

const normalizeDigits = (value?: string) => value?.replace(/\D/g, '') ?? ''

const parseBirthDate = (value: string) => {
  const parsedDate = new Date(value)
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
}

const getErrorStatus = (message: string) => {
  if (message.includes('Email já está em uso')) {
    return 409
  }

  return 400
}

async function rollbackAuthUser(uid: string) {
  const { error } = await deleteUserAuthAdmin(uid)
  return !error
}

export async function POST(
  request: Request,
): Promise<NextResponse<CreateDoctorResponse>> {
  try {
    const authResult = await requireAuthenticatedRouteUser(request)

    if ('response' in authResult) {
      return authResult.response as NextResponse<CreateDoctorResponse>
    }

    const { user } = authResult

    if (!hasRouteUserRole(user, [UserRole.ADMIN])) {
      return forbiddenRouteResponse(
        'Apenas administradores podem cadastrar medicos.',
      ) as NextResponse<CreateDoctorResponse>
    }

    const body = (await request.json()) as Partial<CreateDoctorRequest>
    const name = body.name?.trim() ?? ''
    const email = normalizeEmail(body.email ?? '')
    const cpf = normalizeDigits(body.cpf)
    const birthDate = body.birthDate ? parseBirthDate(body.birthDate) : null
    const state = body.state?.trim().toUpperCase() ?? ''
    const crm = normalizeDigits(body.crm)
    const crmState = body.crmState?.trim().toUpperCase() ?? ''
    const specialty = body.specialty?.trim() || undefined

    if (!name || !email || !cpf || !birthDate || !state) {
      return NextResponse.json(
        {
          uid: null,
          password: null,
          error:
            'Dados invalidos. Informe nome, email, CPF, data de nascimento e estado.',
          success: false,
        },
        { status: 400 },
      )
    }

    if (crm && crmState.length !== 2) {
      return NextResponse.json(
        {
          uid: null,
          password: null,
          error: 'Informe a UF do CRM com 2 caracteres.',
          success: false,
        },
        { status: 400 },
      )
    }

    await getAdminApp()

    const db = adminFirestore()

    if (crm) {
      const existingDoctorSnapshot = await db
        .collection('users')
        .where('credential', '==', crm)
        .where('typeOfCredential', '==', 'CRM')
        .where('role', '==', UserRole.DOCTOR)
        .limit(10)
        .get()

      const crmAlreadyInUse = existingDoctorSnapshot.docs.some(
        (docSnapshot) => {
          const data = docSnapshot.data()
          const storedState =
            typeof data.credentialState === 'string'
              ? data.credentialState
              : typeof data.state === 'string'
                ? data.state
                : ''

          return storedState.toUpperCase() === crmState
        },
      )

      if (crmAlreadyInUse) {
        return NextResponse.json(
          {
            uid: null,
            password: null,
            error: 'CRM ja esta em uso por outro medico.',
            success: false,
          },
          { status: 409 },
        )
      }
    }

    const password = generateRandomPassword()
    const authCreation = await createUserAuthAdmin(email, password)

    if (!authCreation.uid || authCreation.error) {
      const errorMessage =
        authCreation.error || 'Erro ao criar conta de autenticacao.'

      return NextResponse.json(
        {
          uid: null,
          password: null,
          error: errorMessage,
          success: false,
        },
        { status: getErrorStatus(errorMessage) },
      )
    }

    const uid = authCreation.uid
    const warnings: string[] = []

    try {
      await db
        .collection('users')
        .doc(uid)
        .set(
          removeUndefinedFields({
            id: uid,
            uid,
            name,
            email,
            cpf,
            birthDate,
            state,
            credential: crm || undefined,
            credentialState: crm ? crmState : undefined,
            typeOfCredential: crm ? 'CRM' : undefined,
            specialty,
            role: UserRole.DOCTOR,
            status: UserStatus.APPROVED,
            currentStep: 2,
            isCompleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        )
    } catch (firestoreError) {
      console.error('Erro ao persistir medico no Firestore:', firestoreError)

      const rolledBack = await rollbackAuthUser(uid)

      return NextResponse.json(
        {
          uid: null,
          password: null,
          error: rolledBack
            ? 'Nao foi possivel concluir o cadastro do medico. A conta de autenticacao foi revertida.'
            : 'Nao foi possivel concluir o cadastro do medico e a reversao automatica da conta falhou.',
          success: false,
          rolledBack,
        },
        { status: 500 },
      )
    }

    if (crm && crmState) {
      try {
        const nameParts = name.split(/\s+/)
        const firstName = nameParts[0] || name
        const surname = nameParts.slice(1).join(' ') || firstName

        const memedResult = await memedService.registerDoctor({
          externalId: uid,
          name: firstName,
          surname,
          email,
          cpf,
          birthDate: birthDate.toISOString(),
          crm,
          crmState,
          specialtyId: specialty
            ? getMemedIdForSpecialty(specialty)
            : undefined,
        })

        if (memedResult.success) {
          await db
            .collection('users')
            .doc(uid)
            .set(
              removeUndefinedFields({
                memedId: memedResult.memedId,
                memedRegistered: Boolean(
                  memedResult.memedId || memedResult.prescriberToken,
                ),
                token: memedResult.prescriberToken,
                updatedAt: new Date(),
              }),
              { merge: true },
            )
        } else if (memedResult.error) {
          warnings.push(
            `Medico criado, mas nao foi possivel registrar na Memed: ${memedResult.error}`,
          )
        }
      } catch (memedError) {
        console.error('Erro ao registrar medico na Memed:', memedError)
        warnings.push(
          'Medico criado, mas ocorreu uma falha ao sincronizar o cadastro com a Memed.',
        )
      }
    }

    return NextResponse.json(
      {
        uid,
        password,
        error: null,
        success: true,
        warnings,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Erro na API createDoctor:', error)

    return NextResponse.json(
      {
        uid: null,
        password: null,
        error: 'Erro interno do servidor.',
        success: false,
      },
      { status: 500 },
    )
  }
}
