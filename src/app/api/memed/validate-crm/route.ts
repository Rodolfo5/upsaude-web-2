import { NextResponse } from 'next/server'

import { checkCrmInUse } from '@/services/doctor'
import { memedService } from '@/services/memed'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { crm, crmState, excludeUserId, skipMemedValidation } = body

    if (!crm || !crmState) {
      return NextResponse.json(
        { error: 'CRM e estado são obrigatórios' },
        { status: 400 },
      )
    }

    const cleanCrm = crm.replace(/\D/g, '')
    if (cleanCrm.length === 0) {
      return NextResponse.json({ error: 'CRM inválido' }, { status: 400 })
    }

    if (crmState.length !== 2) {
      return NextResponse.json(
        { error: 'Estado do CRM deve ter 2 caracteres' },
        { status: 400 },
      )
    }

    const upperCrmState = crmState.toUpperCase()

    // 1. Primeiro verifica se o CRM já está em uso no banco de dados local
    const crmInUseCheck = await checkCrmInUse(
      cleanCrm,
      upperCrmState,
      excludeUserId,
    )

    if (crmInUseCheck.inUse) {
      const errorMessage = `CRM já está sendo usado por outro médico: ${crmInUseCheck.doctor?.name || 'N/A'} (${crmInUseCheck.doctor?.email || 'N/A'})`

      return NextResponse.json(
        {
          valid: false,
          inUse: true,
          inUseBy: crmInUseCheck.doctor,
          error: errorMessage,
        },
        { status: 200 },
      )
    }

    // 2. Se não está em uso localmente, valida na Memed (se não foi solicitado para pular)
    if (skipMemedValidation) {
      // Apenas validação local - retorna sucesso se não está em uso
      return NextResponse.json(
        {
          valid: true,
          inUse: false,
          skipMemedValidation: true,
        },
        { status: 200 },
      )
    }

    // Validação completa: local + Memed
    const result = await memedService.validateCrm({
      crm: cleanCrm,
      crmState: upperCrmState,
    })

    // Adiciona informações sobre uso local
    const response = {
      ...result,
      inUse: false,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('❌ Erro na API de validação CRM:', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    })
    return NextResponse.json(
      {
        valid: false,
        inUse: false,
        error:
          error instanceof Error
            ? error.message
            : 'Erro interno do servidor ao validar CRM',
      },
      { status: 500 },
    )
  }
}
