export type SoapFieldKey = 'subjective' | 'objective' | 'assessment' | 'plan'

export interface SoapNotesPanelProps {
  activeTab: 'prontuario' | 'soap'
  onChangeTab: (tab: 'prontuario' | 'soap') => void
  soapData: Record<SoapFieldKey, string>
  editingFields: Record<SoapFieldKey, boolean>
  startEditing: (field: SoapFieldKey) => void
  saveField: (field: SoapFieldKey, value: string) => void | Promise<void>
  updateLocalData: (field: SoapFieldKey, value: string) => void
  patientId?: string | null
}
