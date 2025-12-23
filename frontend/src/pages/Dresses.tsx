import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Trash2,
  CheckSquare,
  Square,
  XCircle,
} from "lucide-react";
import { dressesAPI } from "../services/api";
import { formatCurrency, getStatusColor, cn } from "../lib/utils";
import Modal from "../components/ui/Modal";
import DressForm from "../components/forms/DressForm";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import ImageSlideshow from "../components/ui/ImageSlideshow";
import Pagination from "../components/ui/Pagination";
import SortDropdown from "../components/ui/SortDropdown";

const CATEGORIES = ["wedding", "evening", "engagement", "traditional", "other"];
const STATUSES = ["available", "rented", "maintenance"];

export default function Dresses() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ status: "", category: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDress, setEditingDress] = useState<any>(null);
  const [deletingDress, setDeletingDress] = useState<any>(null);
  const [selectedDress, setSelectedDress] = useState<any>(null);

  // Bulk selection state
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Sorting state
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const sortOptions = [
    {
      value: "created_at",
      label: t("sort.dateAdded", { defaultValue: "Date Added" }),
    },
    { value: "name", label: t("sort.name", { defaultValue: "Name" }) },
    {
      value: "rental_price",
      label: t("sort.price", { defaultValue: "Price" }),
    },
  ];

  const { data, isLoading } = useQuery({
    queryKey: [
      "dresses",
      search,
      filters,
      currentPage,
      pageSize,
      sortBy,
      sortOrder,
    ],
    queryFn: () =>
      dressesAPI.getAll({
        skip: (currentPage - 1) * pageSize,
        limit: pageSize,
        search: search || undefined,
        status: filters.status || undefined,
        category: filters.category || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      }),
  });

  const totalPages = Math.ceil((data?.total || 0) / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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
    mutationFn: (id: number) => dressesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dresses"] });
      setDeletingDress(null);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map((id) => dressesAPI.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dresses"] });
      setSelectedItems(new Set());
      setIsBulkDeleteOpen(false);
    },
  });

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDress(null);
  };

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
    if (selectedItems.size === data?.dresses?.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(
        new Set(data?.dresses?.map((dress: any) => dress.id) || [])
      );
    }
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  // Mobile double-tap support
  const lastTapRef = useRef<{ id: number; time: number }>({ id: 0, time: 0 });

  const handleDressTap = useCallback((dress: any, e: React.TouchEvent) => {
    const now = Date.now();
    if (
      lastTapRef.current.id === dress.id &&
      now - lastTapRef.current.time < 300
    ) {
      e.preventDefault();
      setSelectedDress(dress);
      lastTapRef.current = { id: 0, time: 0 };
    } else {
      lastTapRef.current = { id: dress.id, time: now };
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-heading font-semibold text-text-primary">
          {t("dresses.title")}
        </h1>
        <div className="flex items-center gap-2">
          {selectedItems.size > 0 && (
            <>
              <span className="text-sm text-text-secondary">
                {selectedItems.size}{" "}
                {t("common.selected", { defaultValue: "selected" })}
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
            {t("dresses.addDress")}
          </button>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={t("common.search")}
            className="input-field pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {data?.dresses?.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-hover text-text-secondary text-sm"
            >
              {selectedItems.size === data?.dresses?.length ? (
                <CheckSquare className="w-4 h-4 text-primary" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {t("common.all", { defaultValue: "All" })}
            </button>
          )}

          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value });
              setCurrentPage(1);
            }}
            className="select-field w-auto"
          >
            <option value="">{t("dresses.status")}</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(`dresses.${status}`)}
              </option>
            ))}
          </select>

          <select
            value={filters.category}
            onChange={(e) => {
              setFilters({ ...filters, category: e.target.value });
              setCurrentPage(1);
            }}
            className="select-field w-auto"
          >
            <option value="">{t("dresses.category")}</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {t(`dresses.categories.${cat}`)}
              </option>
            ))}
          </select>

          <SortDropdown
            options={sortOptions}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
          />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      ) : data?.dresses?.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          {t("dresses.noDresses")}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data?.dresses?.map((dress: any) => (
              <div
                key={dress.id}
                onDoubleClick={() => setSelectedDress(dress)}
                onTouchEnd={(e) => handleDressTap(dress, e)}
                className={cn(
                  "bg-surface rounded-xl border overflow-hidden card-hover group relative cursor-pointer",
                  selectedItems.has(dress.id)
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border"
                )}
              >
                {/* Selection Checkbox */}
                <button
                  onClick={(e) => toggleSelection(dress.id, e)}
                  className="absolute top-3 left-3 z-40 p-1 rounded bg-white/90 shadow-sm hover:bg-white transition-colors"
                >
                  {selectedItems.has(dress.id) ? (
                    <CheckSquare className="w-5 h-5 text-primary" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {/* Image Slideshow */}
                <div className="relative">
                  <ImageSlideshow
                    images={dress.images || []}
                    alt={dress.name}
                    aspectRatio="3/4"
                    fallbackEmoji="👗"
                  />

                  {/* Status badge */}
                  <div className="absolute top-3 right-3 z-10">
                    <span className={`badge ${getStatusColor(dress.status)}`}>
                      {t(`dresses.${dress.status}`)}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-text-primary truncate">
                    {dress.name}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {t(`dresses.categories.${dress.category}`, {
                      defaultValue: dress.category,
                    })}{" "}
                    • {dress.size} • {dress.color}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-semibold text-primary">
                      {formatCurrency(dress.rental_price)}
                    </span>
                    <span className="text-sm text-text-muted">
                      {t("dresses.depositAmount")}:{" "}
                      {formatCurrency(dress.deposit_amount)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
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

      {/* Dress Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingDress ? t("dresses.editDress") : t("dresses.addDress")}
        size="lg"
      >
        <DressForm dress={editingDress} onSuccess={handleCloseModal} />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingDress}
        onClose={() => setDeletingDress(null)}
        onConfirm={() => deleteMutation.mutate(deletingDress.id)}
        title={t("common.confirmDelete")}
        message={`${deletingDress?.name}`}
        loading={deleteMutation.isPending}
      />

      {/* Bulk Delete Confirmation */}
      <ConfirmDialog
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onConfirm={() => bulkDeleteMutation.mutate(Array.from(selectedItems))}
        title={t("common.confirmDelete")}
        message={`${selectedItems.size} ${t("dresses.title", {
          defaultValue: "dresses",
        })}`}
        loading={bulkDeleteMutation.isPending}
      />

      {/* Dress Detail Modal */}
      <Modal
        isOpen={!!selectedDress}
        onClose={() => setSelectedDress(null)}
        title={t("dresses.editDress")}
        size="lg"
      >
        <div className="relative">
          <DressForm
            dress={selectedDress}
            onSuccess={() => setSelectedDress(null)}
          />
          <div className="mt-4 pt-4 border-t border-border flex justify-between">
            <button
              onClick={() => {
                setDeletingDress(selectedDress);
                setSelectedDress(null);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-error text-white hover:bg-error/90 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {t("common.delete")}
            </button>
            <button
              onClick={() => setSelectedDress(null)}
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
