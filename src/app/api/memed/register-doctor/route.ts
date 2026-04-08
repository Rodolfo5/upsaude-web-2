import { randomUUID } from 'crypto'

import { NextResponse } from 'next/server'

import { memedService } from '@/services/memed'
import { updateUserDoc } from '@/services/user'
import { getMemedIdForSpecialty } from '@/utils/specialtyHelpers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      externalId,
      name,
      surname,
      email,
      cpf,
      birthDate,
      crm,
      crmState,
      phone,
      gender,
      cityId,
      specialtyId: bodySpecialtyId,
      specialty: bodySpecialty,
    } = body

    // Aceita specialty (slug do grupo) ou specialtyId; para CRM convertemos slug → ID Memed
    const specialtyId =
      bodySpecialtyId ??
      (bodySpecialty ? getMemedIdForSpecialty(bodySpecialty) : undefined)

    if (!name || !surname || !crm || !crmState) {
      return NextResponse.json(
        {
          success: false,
          error: 'Campos obrigatórios: name, surname, crm, crmState',
        },
        { status: 400 },
      )
    }

    const cleanCrm = crm.replace(/\D/g, '')
    if (cleanCrm.length === 0) {
      return NextResponse.json(
        { success: false, error: 'CRM inválido' },
        { status: 400 },
      )
    }

    if (crmState.length !== 2) {
      return NextResponse.json(
        { success: false, error: 'Estado do CRM deve ter 2 caracteres' },
        { status: 400 },
      )
    }

    const finalExternalId = externalId || randomUUID()

    const result = await memedService.registerDoctor({
      externalId: finalExternalId,
      name,
      surname,
      email,
      cpf,
      birthDate,
      crm: cleanCrm,
      crmState: crmState.toUpperCase(),
      phone,
      gender,
      cityId,
      specialtyId,
    })

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    if (finalExternalId && result.prescriberToken) {
      try {
        const updateData: {
          token?: string
          memedId?: string
          memedRegistered?: boolean
        } = {
          token: result.prescriberToken,
        }

        if (result.memedId) {
          updateData.memedId = result.memedId
          updateData.memedRegistered = true
        }

        await updateUserDoc(finalExternalId, updateData)
      } catch (updateError) {
        console.error('Erro ao atualizar usuário com token:', updateError)
      }
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('❌ Erro na API de cadastro Memed:', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    })
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Erro interno do servidor ao cadastrar médico na Memed',
      },
      { status: 500 },
    )
  }
}
