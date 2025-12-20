import { useTranslation } from 'react-i18next'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface SortOption {
  value: string
  label: string
}

interface SortDropdownProps {
  options: SortOption[]
  sortBy: string
  sortOrder: 'asc' | 'desc'
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void
}

export default function SortDropdown({
  options,
  sortBy,
  sortOrder,
  onSortChange,
}: SortDropdownProps) {
  const { t } = useTranslation()

  const handleSortByChange = (newSortBy: string) => {
    if (newSortBy === sortBy) {
      // Toggle order if same field
      onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // Default to descending for new field
      onSortChange(newSortBy, 'desc')
    }
  }

  const toggleOrder = () => {
    onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')
  }

  return (
    <div className="flex items-center gap-2">
      {/* Sort Field Selector */}
      <div className="relative">
        <select
          value={sortBy}
          onChange={(e) => handleSortByChange(e.target.value)}
          className="select-field w-auto py-2 pl-8 pr-4 text-sm appearance-none"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
      </div>

      {/* Sort Order Toggle */}
      <button
        onClick={toggleOrder}
        className={cn(
          'p-2 rounded-lg border border-border transition-colors',
          'hover:bg-surface-hover hover:border-primary'
        )}
        title={sortOrder === 'asc' 
          ? t('sort.ascending', { defaultValue: 'Ascending' })
          : t('sort.descending', { defaultValue: 'Descending' })
        }
      >
        {sortOrder === 'asc' ? (
          <ArrowUp className="w-4 h-4 text-primary" />
        ) : (
          <ArrowDown className="w-4 h-4 text-primary" />
        )}
      </button>
    </div>
  )
}



