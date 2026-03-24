import { Row, ColumnDef, ColumnFiltersState } from '@tanstack/react-table'

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  actionsColumn?: ColumnDef<TData, TValue>
  tableTitle?: string
  tableDescription?: string
  mainAction?: React.ReactNode
  searchColumn?: string
  searchColumns?: string[] // Busca em múltiplas colunas
  searchInputPlaceholder?: string
  onRowSelectionChange?: (selectedRows: Row<TData>[]) => void
  columnFilters?: ColumnFiltersState
  onColumnFiltersChange?: (
    updater:
      | ColumnFiltersState
      | ((old: ColumnFiltersState) => ColumnFiltersState),
  ) => void
  pageSize?: number
  hidePagination?: boolean
}
