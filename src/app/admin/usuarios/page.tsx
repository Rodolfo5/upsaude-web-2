'use client'

import { Link, UserPlus } from 'lucide-react'
import { type ReactNode, useMemo, useState } from 'react'

import { Button } from '@/components/atoms/Button/button'
import { DataTable } from '@/components/organisms/DataTable/dataTable'
import { CreateDoctorModal } from '@/components/organisms/Modals/CreateDoctorModal/createDoctorModal'
import { InviteDoctorModal } from '@/components/organisms/Modals/InviteDoctorModal/inviteDoctorModal'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAdminUsersPage } from '@/hooks/queries/useAdminUsersPage'
import { DoctorEntity, PatientEntity, UserRole } from '@/types/entities/user'

import { doctorColumns } from './doctorColumns'
import { patientColumns } from './patientColumns'

const PAGE_SIZE = 10

function CursorPagination({
  currentPage,
  hasNextPage,
  isLoading,
  onNext,
  onPrevious,
  canGoBack,
}: {
  currentPage: number
  hasNextPage: boolean
  isLoading: boolean
  onNext: () => void
  onPrevious: () => void
  canGoBack: boolean
}) {
  return (
    <div className="mt-4 flex items-center justify-between gap-4">
      <p className="text-sm text-gray-500">
        Página {currentPage}
        {isLoading ? ' • Atualizando...' : ''}
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={!canGoBack || isLoading}
        >
          Anterior
        </Button>
        <Button variant="success" onClick={onNext} disabled={!hasNextPage || isLoading}>
          Próxima
        </Button>
      </div>
    </div>
  )
}

function DoctorsTabContent({
  mainAction,
}: {
  mainAction: ReactNode
}) {
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null])
  const currentCursor = cursorStack[cursorStack.length - 1]

  const { data, isLoading, isFetching } = useAdminUsersPage({
    role: UserRole.DOCTOR,
    limit: PAGE_SIZE,
    cursor: currentCursor,
  })

  const doctors = useMemo(
    () => (data?.users ?? []) as DoctorEntity[],
    [data?.users],
  )

  const handleNextPage = () => {
    if (!data?.nextCursor) return

    setCursorStack((previous) => [...previous, data.nextCursor!])
  }

  const handlePreviousPage = () => {
    setCursorStack((previous) =>
      previous.length > 1 ? previous.slice(0, -1) : previous,
    )
  }

  return (
    <>
      <DataTable
        columns={doctorColumns}
        data={doctors}
        tableDescription="Gerencie todos os médicos cadastrados."
        searchColumn="name"
        searchInputPlaceholder="Buscar médico nesta página..."
        mainAction={mainAction}
        pageSize={PAGE_SIZE}
        hidePagination
      />

      <CursorPagination
        currentPage={cursorStack.length}
        hasNextPage={Boolean(data?.hasNextPage)}
        isLoading={isLoading || isFetching}
        onNext={handleNextPage}
        onPrevious={handlePreviousPage}
        canGoBack={cursorStack.length > 1}
      />
    </>
  )
}

function PatientsTabContent() {
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null])
  const currentCursor = cursorStack[cursorStack.length - 1]

  const { data, isLoading, isFetching } = useAdminUsersPage({
    role: UserRole.PATIENT,
    limit: PAGE_SIZE,
    cursor: currentCursor,
  })

  const patients = useMemo(
    () => (data?.users ?? []) as PatientEntity[],
    [data?.users],
  )

  const handleNextPage = () => {
    if (!data?.nextCursor) return

    setCursorStack((previous) => [...previous, data.nextCursor!])
  }

  const handlePreviousPage = () => {
    setCursorStack((previous) =>
      previous.length > 1 ? previous.slice(0, -1) : previous,
    )
  }

  return (
    <>
      <DataTable
        columns={patientColumns}
        data={patients}
        tableDescription="Gerencie todos os pacientes cadastrados."
        searchColumn="name"
        searchInputPlaceholder="Buscar paciente nesta página..."
        pageSize={PAGE_SIZE}
        hidePagination
      />

      <CursorPagination
        currentPage={cursorStack.length}
        hasNextPage={Boolean(data?.hasNextPage)}
        isLoading={isLoading || isFetching}
        onNext={handleNextPage}
        onPrevious={handlePreviousPage}
        canGoBack={cursorStack.length > 1}
      />
    </>
  )
}

export default function AdminUsuariosPage() {
  const [activeTab, setActiveTab] = useState<'doctors' | 'patients'>('doctors')
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isCreateNewDoctorOpen, setIsCreateNewDoctorOpen] = useState(false)

  const doctorActions = (
    <>
      <Button
        variant="success"
        size="md"
        onClick={() => setIsCreateNewDoctorOpen(true)}
        icon={<UserPlus className="h-4 w-4" />}
      >
        Adicionar Novo Médico
      </Button>
      <Button
        variant="success"
        size="md"
        onClick={() => setIsInviteModalOpen(true)}
        icon={<Link className="h-4 w-4" />}
      >
        Convidar Novo Médico
      </Button>
    </>
  )

  return (
    <div className="flex h-screen w-full flex-col bg-white px-16">
      <h1 className="mt-24 text-2xl font-bold tracking-tight text-brand-purple-dark">
        Usuários do Sistema
      </h1>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'doctors' | 'patients')}
        className="mt-6"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="doctors">Médicos</TabsTrigger>
          <TabsTrigger value="patients">Pacientes</TabsTrigger>
        </TabsList>

        <TabsContent value="doctors" className="mt-4">
          {activeTab === 'doctors' && (
            <DoctorsTabContent mainAction={doctorActions} />
          )}
        </TabsContent>

        <TabsContent value="patients" className="mt-4">
          {activeTab === 'patients' && <PatientsTabContent />}
        </TabsContent>
      </Tabs>

      <InviteDoctorModal
        isOpen={isInviteModalOpen}
        setIsOpen={setIsInviteModalOpen}
      />
      <CreateDoctorModal
        isOpen={isCreateNewDoctorOpen}
        setIsOpen={setIsCreateNewDoctorOpen}
      />
    </div>
  )
}
