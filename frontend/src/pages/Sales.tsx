import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Search, CheckSquare, Square, XCircle } from "lucide-react";
import { salesAPI } from "../services/api";
import { formatCurrency, formatDate } from "../lib/utils";
import Modal from "../components/ui/Modal";
import SaleForm from "../components/forms/SaleForm";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Pagination from "../components/ui/Pagination";
import SortDropdown from "../components/ui/SortDropdown";
import FilterDropdown from "../components/ui/FilterDropdown";

export default function Sales() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<any>(null);
  const [deletingSale, setDeletingSale] = useState<any>(null);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [dateFilters, setDateFilters] = useState({
    startDate: "",
    endDate: "",
  });

  // Bulk selection state
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Sorting state
  const [sortBy, setSortBy] = useState("sale_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const sortOptions = [
    {
      value: "sale_date",
      label: t("sort.saleDate", { defaultValue: "Sale Date" }),
    },
    { value: "total_price", label: t("sort.total", { defaultValue: "Total" }) },
    {
      value: "created_at",
      label: t("sort.dateAdded", { defaultValue: "Date Added" }),
    },
  ];

  const { data, isLoading } = useQuery({
    queryKey: ["sales", dateFilters, currentPage, pageSize, sortBy, sortOrder],
    queryFn: () =>
      salesAPI.getAll({
        skip: (currentPage - 1) * pageSize,
        limit: pageSize,
        start_date: dateFilters.startDate || undefined,
        end_date: dateFilters.endDate || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      }),
  });

  const totalPages = Math.ceil((data?.total || 0) / pageSize);

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };
  const handleSortChange = (
    newSortBy: string,
    newSortOrder: "asc" | "desc"
  ) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setCurrentPage(1);
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) => salesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["clothing"] });
      setDeletingSale(null);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => salesAPI.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["clothing"] });
      setSelectedItems(new Set());
      setIsBulkDeleteOpen(false);
    },
  });

  const toggleSelection = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const toggleSelectAll = () => {
    const visibleSales = data?.sales?.filter((sale: any) => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return (
        sale.client?.full_name?.toLowerCase().includes(searchLower) ||
        sale.clothing?.name?.toLowerCase().includes(searchLower)
      );
    }) || [];
    if (selectedItems.size === visibleSales.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(visibleSales.map((sale: any) => sale.id)));
    }
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSale(null);
  };

  // Mobile double-tap support
  const lastTapRef = useRef<{ id: number; time: number }>({ id: 0, time: 0 });

  const handleSaleTap = useCallback((sale: any, e: React.TouchEvent) => {
    const now = Date.now();
    if (
      lastTapRef.current.id === sale.id &&
      now - lastTapRef.current.time < 300
    ) {
      e.preventDefault();
      setSelectedSale(sale);
      lastTapRef.current = { id: 0, time: 0 };
    } else {
      lastTapRef.current = { id: sale.id, time: now };
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-heading font-semibold text-text-primary">
          {t("sales.title")}
        </h1>
        <div className="flex items-center gap-2">
          {selectedItems.size > 0 && (
            <>
              <span className="text-sm text-text-secondary">
                {t("common.selected", { count: selectedItems.size })}
              </span>
              <button
                onClick={clearSelection}
                className="p-2 rounded-lg hover:bg-surface-hover text-text-secondary"
                title={t("common.cancel")}
              >
                <XCircle className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsBulkDeleteOpen(true)}
                className="btn-primary bg-error hover:bg-error/90 flex items-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                {t("common.delete")} ({selectedItems.size})
              </button>
            </>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t("sales.addSale")}
          </button>
        </div>
      </div>

      {/* Search, Filters and Sort */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted rtl:left-auto rtl:right-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={t("sales.searchPlaceholder", { defaultValue: "Search client or item..." })}
            className="input-field pl-10 rtl:pl-3 rtl:pr-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {data?.sales?.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-surface hover:bg-surface-hover text-text-secondary text-sm transition-colors"
            >
              {selectedItems.size === data?.sales?.length ? (
                <CheckSquare className="w-4 h-4 text-primary" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {t("common.selectAll", { defaultValue: "Select All" })}
            </button>
          )}
          <FilterDropdown
            filters={[
              {
                id: "dateRange",
                label: t("sales.dateRange", { defaultValue: "Date Range" }),
                type: "dateRange",
                value: { start: dateFilters.startDate, end: dateFilters.endDate },
              },
            ]}
            onFilterChange={(id, value) => {
              if (id === "dateRange") {
                setDateFilters({ startDate: value.start, endDate: value.end });
              }
              setCurrentPage(1);
            }}
            onClearAll={() => {
              setDateFilters({ startDate: "", endDate: "" });
              setCurrentPage(1);
            }}
          />

          <SortDropdown
            options={sortOptions}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      ) : data?.sales?.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          {t("sales.noSales")}
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3 w-12">
                    <button
                      onClick={toggleSelectAll}
                      className="p-1 rounded hover:bg-surface-hover"
                    >
                      {selectedItems.size === data?.sales?.length ? (
                        <CheckSquare className="w-5 h-5 text-primary" />
                      ) : (
                        <Square className="w-5 h-5 text-text-muted" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">{t("sales.client")}</th>
                  <th className="px-4 py-3 text-left">{t("sales.item")}</th>
                  <th className="px-4 py-3 text-left">{t("sales.quantity")}</th>
                  <th className="px-4 py-3 text-left">
                    {t("sales.unitPrice")}
                  </th>
                  <th className="px-4 py-3 text-left">
                    {t("sales.totalPrice")}
                  </th>
                  <th className="px-4 py-3 text-left">{t("sales.saleDate")}</th>
                </tr>
              </thead>
              <tbody>
                {data?.sales
                  ?.filter((sale: any) => {
                    if (!search) return true;
                    const searchLower = search.toLowerCase();
                    return (
                      sale.client?.full_name?.toLowerCase().includes(searchLower) ||
                      sale.clothing?.name?.toLowerCase().includes(searchLower)
                    );
                  })
                  .map((sale: any) => (
                  <tr
                    key={sale.id}
                    className={`table-row cursor-pointer hover:bg-primary/5 ${selectedItems.has(sale.id) ? 'bg-primary/10' : ''}`}
                    onDoubleClick={() => setSelectedSale(sale)}
                    onTouchEnd={(e) => handleSaleTap(sale, e)}
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => toggleSelection(sale.id, e)}
                        className="p-1 rounded hover:bg-surface-hover"
                      >
                        {selectedItems.has(sale.id) ? (
                          <CheckSquare className="w-5 h-5 text-primary" />
                        ) : (
                          <Square className="w-5 h-5 text-text-muted" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {sale.client?.full_name}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {sale.clothing?.name}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {sale.quantity}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {formatCurrency(sale.unit_price)}
                    </td>
                    <td className="px-4 py-3 font-medium text-primary">
                      {formatCurrency(sale.total_price)}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {formatDate(sale.sale_date, i18n.language)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={data?.total || 0}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </>
      )}

      {/* Sale Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingSale ? t("sales.editSale") : t("sales.addSale")}
        size="lg"
      >
        <SaleForm sale={editingSale} onSuccess={handleCloseModal} />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingSale}
        onClose={() => setDeletingSale(null)}
        onConfirm={() => deleteMutation.mutate(deletingSale.id)}
        title={t("common.confirmDelete")}
        message={`${deletingSale?.client?.full_name} - ${deletingSale?.clothing?.name}`}
        loading={deleteMutation.isPending}
      />

      {/* Bulk Delete Confirmation */}
      <ConfirmDialog
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onConfirm={() => bulkDeleteMutation.mutate(Array.from(selectedItems))}
        title={t("common.confirmDelete")}
        message={t("common.confirmBulkDelete", { count: selectedItems.size })}
        loading={bulkDeleteMutation.isPending}
      />

      {/* Sale Detail Modal */}
      <Modal
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        title={t("sales.editSale")}
        size="lg"
      >
        <div className="relative">
          <SaleForm
            sale={selectedSale}
            onSuccess={() => setSelectedSale(null)}
          />
          <div className="mt-4 pt-4 border-t border-border flex justify-between">
            <button
              onClick={() => {
                setDeletingSale(selectedSale);
                setSelectedSale(null);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-error text-white hover:bg-error/90 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {t("common.delete")}
            </button>
            <button
              onClick={() => setSelectedSale(null)}
              className="btn-secondary"
            >
              {t("common.close")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
