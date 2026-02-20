import { Timestamp } from 'firebase/firestore'

export interface MessageEntity {
  id: string
  senderId: string
  receiverId: string
  text: string
  type: string
  createdAt: Timestamp
  fileUrl?: string
  fileName?: string
  fileType?: string
}
