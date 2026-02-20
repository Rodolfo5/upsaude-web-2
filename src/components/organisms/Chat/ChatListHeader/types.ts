export interface ChatListHeaderProps {
  isSearchOpen: boolean
  searchText: string
  onToggleSearch: () => void
  onSearchChange: (value: string) => void
  onClearSearch: () => void
  onOpenAddChat: () => void
}
