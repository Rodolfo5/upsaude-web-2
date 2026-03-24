export type AgoraTokenRole = 'host' | 'guest'

export interface GenerateAgoraUidParams {
  userId: string
  callId: string
  role: AgoraTokenRole
  consultationId?: string
  requestId?: string
}

export const generateAgoraNumericUid = ({
  userId,
  callId,
  role,
  consultationId,
  requestId,
}: GenerateAgoraUidParams): number => {
  const callScope = consultationId || callId
  const uniqueString =
    role === 'host'
      ? `${userId}-${callScope}-${callId}-host`
      : `${userId}-${callScope}-${requestId || callId}-guest`

  let hash = 0

  for (let i = 0; i < uniqueString.length; i++) {
    const char = uniqueString.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }

  const numericUid = Math.abs(hash) % 2147483647

  return Math.max(10000, numericUid)
}
