'use client'

import LoadingComponent from '@/components/atoms/Loading/loading'
import { DataTable } from '@/components/organisms/DataTable/dataTable'
import useAllUsers from '@/hooks/queries/useAllUsers'

import { usersColumns } from './column'

export default function HomePage() {
  const { data: users, isLoading } = useAllUsers()

  if (isLoading) {
    return <LoadingComponent />
  }

  return (
    <div className="flex w-full flex-col px-16">
      {/* Users Table */}
      <DataTable
        columns={usersColumns}
        data={users || []}
        tableTitle="Usuários do Sistema"
        tableDescription="Gerencie todos os usuários cadastrados."
        searchColumn="name"
        searchInputPlaceholder="Buscar por nome..."
      />
    </div>
  )
}
