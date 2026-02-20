/**
 * Endpoint para envio de SMS utilizando a API do Infobip.
 *
 * Este endpoint recebe uma requisição POST com os dados necessários para enviar um SMS.
 * Ele utiliza a API do Infobip para enviar o SMS.
 *
 * @param request - A requisição HTTP contendo os dados do SMS.
 * @returns Uma resposta JSON indicando sucesso ou erro.
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/sms', {
 *   method: 'POST',
 *   body: JSON.stringify({
 *     to: '+5511999999999',
 *     message: 'Sua conta foi criada com sucesso!',
 *   }),
 * });
 *
 * const result = await response.json();
 * if (result.error) {
 *   console.error('Erro ao enviar SMS:', result.error);
 * } else {
 *   console.log('SMS enviado com sucesso!');
 * }
 * ```
 */
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { to, message }: { to: string; message: string } = await request.json()

  const baseUrl = process.env.INFOBIP_BASE_URL
  const apiKey = process.env.INFOBIP_API_KEY
  const from = process.env.INFOBIP_SMS_FROM

  if (!baseUrl || !apiKey || !from) {
    console.error('Variáveis de ambiente do Infobip não configuradas')
    return NextResponse.json({
      error: 'Configuração do Infobip incompleta',
    })
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort()
  }, 60000)

  const url = 'https://api.infobip.com/sms/2/text/advanced'
  const formattedPhone = to.startsWith('55') ? to : `55${to.replace(/^\+/, '')}`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `App ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            destinations: [{ to: formattedPhone }],
            from: '29175',
            text: message,
          },
        ],
      }),
      signal: controller.signal,
      redirect: 'follow',
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Erro na API do Infobip:', errorData)
      return NextResponse.json({
        error: `Erro ao enviar SMS: ${response.status} ${response.statusText}`,
      })
    }

    await response.json()
    return NextResponse.json({ error: null })
  } catch (error) {
    console.error('Erro ao enviar SMS:', error)
    return NextResponse.json({
      error:
        error instanceof Error
          ? error.message
          : 'Erro desconhecido ao enviar SMS',
    })
  }
}
