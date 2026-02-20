import { Add, Search } from '@mui/icons-material'

interface ChatListHeaderProps {
  isSearchOpen: boolean
  searchText: string
  onToggleSearch: () => void
  onSearchChange: (value: string) => void
  onClearSearch: () => void
  onOpenAddChat: () => void
}

export function ChatListHeader({
  isSearchOpen,
  searchText,
  onToggleSearch,
  onSearchChange,
  onClearSearch,
  onOpenAddChat,
}: ChatListHeaderProps) {
  return (
    <div className="flex shrink-0 flex-col border-b border-gray-200 bg-white">
      <div className="flex min-w-0 items-center justify-between gap-2 p-3 sm:p-4">
        {!isSearchOpen ? (
          <>
            <h2 className="text-lg font-semibold text-gray-900">Conversas</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAddChat}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 hover:text-purple-600"
                aria-label="Novo chat"
              >
                <Add className="h-5 w-5" />
              </button>
              <button
                onClick={onToggleSearch}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 hover:text-purple-600"
                aria-label="Buscar"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <button
              onClick={onToggleSearch}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 hover:text-purple-600"
              aria-label="Fechar busca"
            >
              <Search className="h-5 w-5" />
            </button>
            <input
              type="text"
              placeholder="Buscar por nome do paciente..."
              value={searchText}
              onChange={(e) => onSearchChange(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 sm:px-4"
              autoFocus
            />
            {searchText && (
              <button
                onClick={onClearSearch}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 hover:text-purple-600"
                aria-label="Limpar busca"
              >
                <span className="text-lg">×</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
