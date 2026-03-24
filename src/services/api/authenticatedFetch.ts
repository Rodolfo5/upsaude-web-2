import { auth } from '@/config/firebase/firebase'

export async function getAuthenticatedHeaders(
  headers?: HeadersInit,
): Promise<Headers> {
  const nextHeaders = new Headers(headers)
  const currentUser = auth.currentUser

  if (currentUser) {
    const token = await currentUser.getIdToken()
    nextHeaders.set('Authorization', `Bearer ${token}`)
  }

  return nextHeaders
}

export async function getAuthenticatedJsonHeaders(
  headers?: HeadersInit,
): Promise<Headers> {
  const nextHeaders = await getAuthenticatedHeaders(headers)

  if (!nextHeaders.has('Content-Type')) {
    nextHeaders.set('Content-Type', 'application/json')
  }

  return nextHeaders
}

export function getApiErrorMessage(
  data: unknown,
  fallback = 'Erro ao processar a requisicao.',
) {
  if (!data || typeof data !== 'object') {
    return fallback
  }

  if ('error' in data && typeof data.error === 'string' && data.error.trim()) {
    return data.error
  }

  if (
    'message' in data &&
    typeof data.message === 'string' &&
    data.message.trim()
  ) {
    return data.message
  }

  return fallback
}

export async function postAuthenticatedJson<T = unknown>(
  input: RequestInfo | URL,
  body: unknown,
  init?: Omit<RequestInit, 'body' | 'headers' | 'method'> & {
    headers?: HeadersInit
    method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  },
) {
  const response = await fetch(input, {
    ...init,
    method: init?.method ?? 'POST',
    headers: await getAuthenticatedJsonHeaders(init?.headers),
    body: JSON.stringify(body),
  })

  const data = (await response.json().catch(() => null)) as T | null

  return {
    response,
    data,
  }
}
