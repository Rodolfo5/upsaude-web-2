'use client'

import { Link, UserPlus } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/atoms/Button/button'
import { DataTable } from '@/components/organisms/DataTable/dataTable'
import { CreateDoctorModal } from '@/components/organisms/Modals/CreateDoctorModal/createDoctorModal'
import { InviteDoctorModal } from '@/components/organisms/Modals/InviteDoctorModal/inviteDoctorModal'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import useAllUsers from '@/hooks/queries/useAllUsers'
import { UserRole } from '@/types/entities/user'

import { doctorColumns } from './doctorColumns'
import { patientColumns } from './patientColumns'

export default function AdminUsuariosPage() {
  const { data: users } = useAllUsers()
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isCreateNewDoctorOpen, setIsCreateNewDoctorOpen] = useState(false)

  const { doctors, patients } = useMemo(() => {
    if (!users) {
      return { doctors: [], patients: [] }
    }

    const doctorsList = users.filter((user) => user.role === UserRole.DOCTOR)
    const patientsList = users.filter((user) => user.role === UserRole.PATIENT)

    return { doctors: doctorsList, patients: patientsList }
  }, [users])

  return (
    <div className="flex h-screen w-full flex-col bg-white px-16">
      <h1 className="mt-24 text-2xl font-bold tracking-tight text-brand-purple-dark">
        Usuários do Sistema
      </h1>

      <Tabs defaultValue="doctors" className="mt-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="doctors">Médicos</TabsTrigger>
          <TabsTrigger value="patients">Pacientes</TabsTrigger>
        </TabsList>

        <TabsContent value="doctors" className="mt-4">
          <DataTable
            columns={doctorColumns}
            data={doctors}
            tableDescription="Gerencie todos os médicos cadastrados."
            searchColumn="name"
            searchInputPlaceholder="Buscar médico..."
            mainAction={
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
            }
          />
        </TabsContent>

        <TabsContent value="patients" className="mt-4">
          <DataTable
            columns={patientColumns}
            data={patients}
            tableDescription="Gerencie todos os pacientes cadastrados."
            searchColumn="name"
            searchInputPlaceholder="Buscar paciente por nome..."
          />
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
