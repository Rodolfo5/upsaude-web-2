export interface PdfMessageProps {
  fileName: string
  fileUrl: string
  isOwnMessage: boolean
  createdAt: { toDate?: () => Date } | Date
}

