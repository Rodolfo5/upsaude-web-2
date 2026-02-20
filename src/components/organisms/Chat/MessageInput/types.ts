export interface SelectedFile {
  file: File
  fileName: string
  fileSize: number
}

export interface MessageInputProps {
  messageText: string
  isSending: boolean
  selectedFile: SelectedFile | null
  onMessageChange: (value: string) => void
  onFileSelect: (file: File) => void
  onFileRemove: () => void
  onSend: () => void
}
