import { ChevronLeft as KeyboardArrowLeftIcon } from 'lucide-react'
import { ChevronRight as KeyboardArrowRightIcon } from 'lucide-react'
import { ChevronsLeft as KeyboardDoubleArrowLeftIcon } from 'lucide-react'
import { ChevronsRight as KeyboardDoubleArrowRightIcon } from 'lucide-react'
import { Table } from '@tanstack/react-table'

import { Button } from '@/components/ui/button'

interface DataTablePaginationProps<TData> {
  table: Table<TData>
}

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  const currentPage = table.getState().pagination.pageIndex + 1
  const totalPages = table.getPageCount()

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 px-2 py-4">
      <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
        {/* Primeira página */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-gray-300 bg-white p-0 text-gray-600 hover:bg-gray-50"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          <span className="sr-only">Ir para primeira página</span>
          <KeyboardDoubleArrowLeftIcon className="h-4 w-4" />
        </Button>

        {/* Página anterior */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-gray-300 bg-white p-0 text-gray-600 hover:bg-gray-50"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <span className="sr-only">Página anterior</span>
          <KeyboardArrowLeftIcon className="h-4 w-4" />
        </Button>

        {/* Números de página */}
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
          const isActive = page === currentPage
          return (
            <Button
              key={page}
              variant="outline"
              size="sm"
              className={`h-8 w-8 rounded-full border-none p-0 ${
                isActive
                  ? 'bg-[#792EBD] text-white hover:bg-[#792EBD]/90'
                  : 'bg-transparent text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => table.setPageIndex(page - 1)}
            >
              {page}
            </Button>
          )
        })}

        {/* Próxima página */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-gray-300 bg-white p-0 text-gray-600 hover:bg-gray-50"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <span className="sr-only">Próxima página</span>
          <KeyboardArrowRightIcon className="h-4 w-4" />
        </Button>

        {/* Última página */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-gray-300 bg-white p-0 text-gray-600 hover:bg-gray-50"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          <span className="sr-only">Ir para última página</span>
          <KeyboardDoubleArrowRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
