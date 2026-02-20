export interface AbsenceModalProps {
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  onSave: (data: { date: Date; startHour: string; endHour: string }) => void
  loading?: boolean
}
