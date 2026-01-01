import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn } from '../../lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  pageSizeOptions?: number[]
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
}: PaginationProps) {
  const { t } = useTranslation()

  // Calculate showing range
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const maxVisible = 5
    
    if (totalPages <= maxVisible + 2) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)
      
      if (currentPage > 3) {
        pages.push('ellipsis')
      }
      
      // Show pages around current
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('ellipsis')
      }
      
      // Always show last page
      pages.push(totalPages)
    }
    
    return pages
  }

  if (totalPages <= 1 && totalItems <= pageSizeOptions[0]) {
    return null
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-border">
      {/* Showing X-Y of Z */}
      <div className="text-sm text-text-secondary">
        {t('pagination.showing', { 
          start: startItem, 
          end: endItem, 
          total: totalItems,
          defaultValue: `Showing ${startItem}-${endItem} of ${totalItems}`
        })}
      </div>

      <div className="flex items-center gap-4">
        {/* Page Size Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary hidden sm:inline">
            {t('pagination.perPage', { defaultValue: 'Per page:' })}
          </span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="select-field w-auto py-1.5 text-sm"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {/* Page Navigation */}
        <div className="flex items-center gap-1">
          {/* First Page */}
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              currentPage === 1
                ? 'text-text-muted cursor-not-allowed'
                : 'text-text-secondary hover:bg-surface-hover hover:text-primary'
            )}
            title={t('pagination.first', { defaultValue: 'First page' })}
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Previous Page */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              currentPage === 1
                ? 'text-text-muted cursor-not-allowed'
                : 'text-text-secondary hover:bg-surface-hover hover:text-primary'
            )}
            title={t('pagination.previous', { defaultValue: 'Previous page' })}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) =>
              page === 'ellipsis' ? (
                <span key={`ellipsis-${index}`} className="px-2 text-text-muted">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={cn(
                    'min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors',
                    page === currentPage
                      ? 'bg-primary text-white'
                      : 'text-text-secondary hover:bg-surface-hover hover:text-primary'
                  )}
                >
                  {page}
                </button>
              )
            )}
          </div>

          {/* Next Page */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              currentPage === totalPages
                ? 'text-text-muted cursor-not-allowed'
                : 'text-text-secondary hover:bg-surface-hover hover:text-primary'
            )}
            title={t('pagination.next', { defaultValue: 'Next page' })}
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Last Page */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              currentPage === totalPages
                ? 'text-text-muted cursor-not-allowed'
                : 'text-text-secondary hover:bg-surface-hover hover:text-primary'
            )}
            title={t('pagination.last', { defaultValue: 'Last page' })}
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}






