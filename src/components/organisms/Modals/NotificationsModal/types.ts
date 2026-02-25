export interface NotificationsModalProps {
  children: React.ReactNode
  recipientId: string | undefined
  open?: boolean
  onOpenChange?: (open: boolean) => void
  align?: 'left' | 'center' | 'left-expanded'
}
