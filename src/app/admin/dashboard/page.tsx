'use client'

import { useState } from 'react'

import LoadingComponent from '@/components/atoms/Loading/loading'
import { DataTable } from '@/components/organisms/DataTable/dataTable'
import { Button } from '@/components/ui/button'
import { useAdminUsersPage } from '@/hooks/queries/useAdminUsersPage'

import { usersColumns } from './column'

export default function HomePage() {
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null])
  const currentCursor = cursorStack[cursorStack.length - 1]
  const { data, isLoading, isFetching } = useAdminUsersPage({
    limit: 10,
    cursor: currentCursor,
  })

  if (isLoading) {
    return <LoadingComponent />
  }

  return (
    <div className="flex w-full flex-col px-16">
      <DataTable
        columns={usersColumns}
        data={data?.users || []}
        tableTitle="Usuários do Sistema"
        tableDescription="Gerencie todos os usuários cadastrados."
        searchColumn="name"
        searchInputPlaceholder="Buscar por nome nesta página..."
        hidePagination
      />

      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-sm text-gray-500">
          Página {cursorStack.length}
          {isFetching ? ' • Atualizando...' : ''}
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() =>
              setCursorStack((previous) =>
                previous.length > 1 ? previous.slice(0, -1) : previous,
              )
            }
            disabled={cursorStack.length === 1 || isFetching}
          >
            Anterior
          </Button>
          <Button
            variant="default"
            onClick={() => {
              if (!data?.nextCursor) return
              setCursorStack((previous) => [...previous, data.nextCursor!])
            }}
            disabled={!data?.hasNextPage || isFetching}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  )
}
