export interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle: string
  buttonText: string
  onButtonClick: () => void
  illustration?: React.ReactNode
}
