import { NextResponse } from 'next/server'

import { adminFirestore, getAdminApp } from '@/config/firebase/firebaseAdmin'
import {
  findUserDocumentByAnyId,
  forbiddenRouteResponse,
  hasRouteUserRole,
  isAdminRouteUser,
  isSameRouteUser,
  requireAuthenticatedRouteUser,
} from '@/lib/server/routeAuth'
import {
  createUserAuthAdmin,
  deleteUserAuthAdmin,
} from '@/services/firebase/firebaseAdmin'
import { UserRole, UserStatus } from '@/types/entities/user'
import { generateRandomPassword } from '@/utils/generateRandomPassword'

interface CreatePatientRequest {
  name: string
  email: string
  phone: string
  doctorId?: string
  steps?: string
}

interface CreatePatientResponse {
  uid: string | null
  password: string | null
  error: string | null
  success: boolean
  rolledBack?: boolean
  warnings?: string[]
}

const normalizeEmail = (email: string) => email.trim().toLowerCase()

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
): Promise<NextResponse<CreatePatientResponse>> {
  try {
    const authResult = await requireAuthenticatedRouteUser(request)

    if ('response' in authResult) {
      return authResult.response as NextResponse<CreatePatientResponse>
    }

    const { user } = authResult

    if (!hasRouteUserRole(user, [UserRole.ADMIN, UserRole.DOCTOR])) {
      return forbiddenRouteResponse(
        'Apenas administradores ou medicos podem cadastrar pacientes.',
      ) as NextResponse<CreatePatientResponse>
    }

    const body = (await request.json()) as Partial<CreatePatientRequest>
    const name = body.name?.trim() ?? ''
    const email = normalizeEmail(body.email ?? '')
    const phone = body.phone?.trim() ?? ''
    const steps = body.steps?.trim() || 'step1'

    if (!name || !email || !phone) {
      return NextResponse.json(
        {
          uid: null,
          password: null,
          error: 'Dados invalidos. Informe nome, email e telefone.',
          success: false,
        },
        { status: 400 },
      )
    }

    await getAdminApp()

    const db = adminFirestore()

    let resolvedDoctorId = body.doctorId?.trim() ?? ''

    if (isAdminRouteUser(user)) {
      if (!resolvedDoctorId) {
        return NextResponse.json(
          {
            uid: null,
            password: null,
            error: 'doctorId e obrigatorio para cadastro de paciente pelo admin.',
            success: false,
          },
          { status: 400 },
        )
      }
    } else {
      if (resolvedDoctorId && !isSameRouteUser(user, resolvedDoctorId)) {
        return NextResponse.json(
          {
            uid: null,
            password: null,
            error:
              'O medico autenticado so pode cadastrar pacientes vinculados a propria conta.',
            success: false,
          },
          { status: 403 },
        )
      }

      resolvedDoctorId = user.userDocId || user.uid
    }

    const doctorDoc = await findUserDocumentByAnyId(db, resolvedDoctorId)
    const doctorData = doctorDoc?.data()

    if (!doctorDoc?.exists || doctorData?.role !== UserRole.DOCTOR) {
      return NextResponse.json(
        {
          uid: null,
          password: null,
          error: 'O medico informado nao foi encontrado.',
          success: false,
        },
        { status: 400 },
      )
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

    try {
      await db.collection('users').doc(uid).set({
        id: uid,
        uid,
        name,
        email,
        phoneNumber: phone,
        doctorId: doctorDoc.id,
        steps,
        role: UserRole.PATIENT,
        status: UserStatus.APPROVED,
        currentStep: 1,
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    } catch (firestoreError) {
      console.error('Erro ao persistir paciente no Firestore:', firestoreError)

      const rolledBack = await rollbackAuthUser(uid)

      return NextResponse.json(
        {
          uid: null,
          password: null,
          error: rolledBack
            ? 'Nao foi possivel concluir o cadastro do paciente. A conta de autenticacao foi revertida.'
            : 'Nao foi possivel concluir o cadastro do paciente e a reversao automatica da conta falhou.',
          success: false,
          rolledBack,
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        uid,
        password,
        error: null,
        success: true,
        warnings: [],
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Erro na API createPatient:', error)

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
