export interface NoteEntity {
  id: string
  userId: string
  doctorId?: string
  content?: string
  createdAt: Date | string
  updatedAt: Date | string
  doctor?: {
    id?: string
    name?: string
    typeOfCredential?: string
    credential?: string
    state?: string
  }
}
