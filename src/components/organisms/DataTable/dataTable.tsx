'use client'

import {
  ColumnFiltersState,
  SortingState,
  flexRender,
  functionalUpdate,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  RowSelectionState,
  useReactTable,
} from '@tanstack/react-table'
import React, { useMemo, useState } from 'react'

import Input from '@/components/atoms/Input/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { DataTablePagination } from './dataTablePagination'
import { DataTableProps } from './types'

export function DataTable<TData, TValue>({
  columns,
  data,
  actionsColumn,
  tableTitle,
  tableDescription,
  mainAction,
  searchColumn,
  searchColumns,
  searchInputPlaceholder,
  onRowSelectionChange,
  columnFilters: externalColumnFilters,
  onColumnFiltersChange: externalOnColumnFiltersChange,
  pageSize = 10,
  hidePagination = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [localColumnFilters, setLocalColumnFilters] =
    useState<ColumnFiltersState>([])
  const columnFilters = externalColumnFilters ?? localColumnFilters
  const setColumnFilters =
    externalOnColumnFiltersChange ?? setLocalColumnFilters
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [globalFilter, setGlobalFilter] = useState('')

  const tableColumns = useMemo(() => {
    return actionsColumn ? [...columns, actionsColumn] : columns
  }, [columns, actionsColumn])

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true,
    globalFilterFn: searchColumns
      ? (row, columnId, filterValue) => {
          const searchValue = filterValue.toLowerCase()
          return searchColumns.some((column) => {
            const value = row.getValue(column)
            return String(value).toLowerCase().includes(searchValue)
          })
        }
      : undefined,
    initialState: {
      pagination: {
        pageSize,
      },
    },
    state: {
      sorting,
      columnFilters,
      rowSelection,
      globalFilter: searchColumns ? globalFilter : undefined,
    },

    onSortingChange: (updater) => {
      const next = functionalUpdate(updater, sorting)
      setSorting(next)
    },

    onColumnFiltersChange: (updater) => {
      const next = functionalUpdate(updater, columnFilters)
      setColumnFilters(next)
    },

    onGlobalFilterChange: searchColumns ? setGlobalFilter : undefined,

    onRowSelectionChange: (updater) => {
      const next = functionalUpdate(updater, rowSelection)
      setRowSelection(next)

      if (onRowSelectionChange) {
        const allRows = table.getRowModel().rows
        const selectedRows = allRows.filter((r) => Boolean(next[r.id]))
        onRowSelectionChange(selectedRows)
      }
    },
  })

  return (
    <div className="w-full">
      {/* Cabeçalho */}

      {(tableTitle ||
        tableDescription ||
        searchColumn ||
        searchColumns ||
        mainAction) && (
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            {tableTitle && (
              <h2 className="text-xl font-bold tracking-tight text-[#530570] sm:text-2xl">
                {tableTitle}
              </h2>
            )}
            {tableDescription && (
              <p className="text-sm text-muted-foreground">
                {tableDescription}
              </p>
            )}
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            {searchColumns ? (
              <Input
                placeholder={searchInputPlaceholder || 'Buscar...'}
                value={globalFilter ?? ''}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="w-full min-w-0 border-[#530570] text-[#530570] placeholder:text-[#530570] sm:min-w-[200px] sm:max-w-md"
              />
            ) : searchColumn ? (
              <Input
                placeholder={searchInputPlaceholder || 'Buscar...'}
                value={
                  (table.getColumn(searchColumn)?.getFilterValue() as string) ??
                  ''
                }
                onChange={(event) =>
                  table
                    .getColumn(searchColumn)
                    ?.setFilterValue(event.target.value)
                }
                className="w-full min-w-0 border-[#530570] text-[#530570] placeholder:text-[#530570] sm:min-w-[200px] sm:max-w-md"
              />
            ) : null}
            {mainAction}
          </div>
        </div>
      )}
      {/* Tabela */}
      <div className="overflow-x-auto overflow-y-hidden rounded-lg border">
        <Table className="min-w-[640px]">
          <TableHeader className="border-none bg-[#F3EDF7] text-black">
            {table.getHeaderGroups().map((headerGroup, headerIndex) => (
              <TableRow key={headerGroup.id} className="border-none">
                {headerGroup.headers.map((header, cellIndex) => {
                  const isFirstRow = headerIndex === 0
                  const isFirstCell = cellIndex === 0
                  const isLastCell =
                    cellIndex === headerGroup.headers.length - 1

                  return (
                    <TableHead
                      key={header.id}
                      className={`${
                        isFirstRow && isFirstCell ? 'rounded-tl-xl' : ''
                      } ${isFirstRow && isLastCell ? 'rounded-tr-xl' : ''}`}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody className="bg-white text-black">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, rowIndex) => {
                const isLastRow =
                  rowIndex === table.getRowModel().rows.length - 1
                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className={isLastRow ? 'border-none' : ''}
                  >
                    {row.getVisibleCells().map((cell, cellIndex) => {
                      const isFirstCell = cellIndex === 0
                      const isLastCell =
                        cellIndex === row.getVisibleCells().length - 1

                      return (
                        <TableCell
                          key={cell.id}
                          className={`${
                            isLastRow && isFirstCell ? 'rounded-bl-xl' : ''
                          } ${isLastRow && isLastCell ? 'rounded-br-xl' : ''}`}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )
              })
            ) : (
              <TableRow className="border-none">
                <TableCell
                  colSpan={tableColumns.length}
                  className="h-24 rounded-b-xl text-center"
                >
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      {!hidePagination && <DataTablePagination table={table} />}
    </div>
  )
}
