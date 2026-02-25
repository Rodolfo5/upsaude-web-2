import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore'
import { NextResponse } from 'next/server'

import firebaseApp from '@/config/firebase/firebase'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { doctorId } = body

    if (!doctorId) {
      return NextResponse.json(
        { success: false, error: 'doctorId é obrigatório' },
        { status: 400 },
      )
    }

    const db = getFirestore(firebaseApp)
    const doctorRef = doc(db, 'users', doctorId)
    const doctorDoc = await getDoc(doctorRef)

    if (!doctorDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Médico não encontrado' },
        { status: 404 },
      )
    }

    const doctorData = doctorDoc.data()

    // Verificar se é médico
    if (doctorData.role !== 'DOCTOR') {
      return NextResponse.json(
        { success: false, error: 'Usuário não é médico' },
        { status: 400 },
      )
    }

    // Verificar se já está registrado
    if (doctorData.memedRegistered || doctorData.memedId) {
      return NextResponse.json(
        {
          success: true,
          alreadyRegistered: true,
          memedId: doctorData.memedId,
          message: 'Médico já está registrado na Memed',
        },
        { status: 200 },
      )
    }

    // credentialState = UF do CRM. state = estado de moradia do médico (não usar para Memed).
    const credentialStateUF = (doctorData.credentialState || '')
      .toString()
      .toUpperCase()

    if (
      !doctorData.credential ||
      !credentialStateUF ||
      doctorData.typeOfCredential !== 'CRM'
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Médico não possui CRM válido. Apenas médicos com CRM podem ser registrados na Memed.',
        },
        { status: 400 },
      )
    }

    // Separar nome e sobrenome
    const nameParts = (doctorData.name || '').trim().split(/\s+/)
    const firstName = nameParts[0] || doctorData.name || ''
    const surname = nameParts.slice(1).join(' ') || firstName

    // Formatar data de nascimento
    let formattedBirthDate: string | undefined
    if (doctorData.birthDate) {
      const birthDate =
        typeof doctorData.birthDate === 'string'
          ? new Date(doctorData.birthDate)
          : doctorData.birthDate.toDate
            ? doctorData.birthDate.toDate()
            : doctorData.birthDate

      if (birthDate && !isNaN(birthDate.getTime())) {
        const day = String(birthDate.getDate()).padStart(2, '0')
        const month = String(birthDate.getMonth() + 1).padStart(2, '0')
        const year = birthDate.getFullYear()
        formattedBirthDate = `${day}/${month}/${year}`
      }
    }

    // Registrar na Memed
    const memedResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/memed/register-doctor`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          externalId: doctorId,
          name: firstName,
          surname,
          email: doctorData.email || '',
          cpf: doctorData.cpf || '',
          birthDate: formattedBirthDate || '',
          crm: doctorData.credential,
          crmState: credentialStateUF,
          specialty: doctorData.specialty,
        }),
      },
    )

    const memedResult = await memedResponse.json()

    if (memedResult.success && memedResult.memedId) {
      // Atualizar com memedId e token
      const updateData: Record<string, unknown> = {
        memedId: memedResult.memedId,
        memedRegistered: true,
        updatedAt: new Date(),
      }

      if (memedResult.prescriberToken) {
        updateData.token = memedResult.prescriberToken
      }

      await setDoc(doctorRef, updateData, { merge: true })

      return NextResponse.json(
        {
          success: true,
          memedId: memedResult.memedId,
          message: 'Médico registrado na Memed com sucesso',
        },
        { status: 200 },
      )
    } else {
      // Verificar se já existe na Memed
      const errorMessage = memedResult.error || ''
      const errorText = errorMessage.toLowerCase()
      const alreadyExists =
        errorText.includes('já existe') ||
        errorText.includes('already exists') ||
        errorText.includes('duplicate')

      if (alreadyExists) {
        // Tentar buscar o memedId existente
        const memedIdResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/memed/get-doctor-memed-id`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              crm: doctorData.credential,
              crmState: credentialStateUF,
              externalId: doctorId,
              cpf: doctorData.cpf?.replace(/\D/g, ''),
            }),
          },
        )

        const memedIdResult = await memedIdResponse.json()

        if (memedIdResult.found && memedIdResult.memedId) {
          await setDoc(
            doctorRef,
            {
              memedId: memedIdResult.memedId,
              memedRegistered: true,
              updatedAt: new Date(),
            },
            { merge: true },
          )

          return NextResponse.json(
            {
              success: true,
              memedId: memedIdResult.memedId,
              message:
                'Médico já existia na Memed. Vinculado ao registro existente.',
            },
            { status: 200 },
          )
        } else {
          // Marcar como registrado mesmo sem memedId
          await setDoc(
            doctorRef,
            {
              memedRegistered: true,
              updatedAt: new Date(),
            },
            { merge: true },
          )

          return NextResponse.json(
            {
              success: true,
              message:
                'Médico já existe na Memed, mas não foi possível obter memedId. Marcado como registrado.',
            },
            { status: 200 },
          )
        }
      } else {
        return NextResponse.json(
          {
            success: false,
            error: `Erro ao registrar na Memed: ${errorMessage}`,
          },
          { status: 400 },
        )
      }
    }
  } catch (error) {
    console.error('❌ Erro na API de registro de médico existente:', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    })

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Erro interno ao registrar médico',
      },
      { status: 500 },
    )
  }
}
