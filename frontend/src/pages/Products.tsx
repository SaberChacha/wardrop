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
  Package,
  Loader2,
} from "lucide-react";
import { productsAPI } from "../services/api";
import { formatCurrency, getStatusColor, cn } from "../lib/utils";
import Modal from "../components/ui/Modal";
import ProductForm from "../components/forms/ProductForm";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import ImageSlideshow from "../components/ui/ImageSlideshow";
import Pagination from "../components/ui/Pagination";
import SortDropdown from "../components/ui/SortDropdown";

// Statuses differ based on product type
const RENT_STATUSES = ["available", "rented", "maintenance"];
const SALE_STATUSES = ["available", "low_stock", "sold_out"];

export default function Products() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | "rent" | "sale">("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deletingProduct, setDeletingProduct] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [loadingProductId, setLoadingProductId] = useState<number | null>(null);
  const [newProductType, setNewProductType] = useState<"rent" | "sale">("rent");

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
    { value: "created_at", label: t("sort.dateAdded", { defaultValue: "Date Added" }) },
    { value: "name", label: t("sort.name", { defaultValue: "Name" }) },
  ];

  const { data, isLoading } = useQuery({
    queryKey: ["products", search, typeFilter, statusFilter, currentPage, pageSize, sortBy, sortOrder],
    queryFn: () =>
      productsAPI.getAll({
        skip: (currentPage - 1) * pageSize,
        limit: pageSize,
        search: search || undefined,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
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

  const handleSortChange = (newSortBy: string, newSortOrder: "asc" | "desc") => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setCurrentPage(1);
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDeletingProduct(null);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map((id) => productsAPI.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setSelectedItems(new Set());
      setIsBulkDeleteOpen(false);
    },
  });

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleAddProduct = (type: "rent" | "sale") => {
    setNewProductType(type);
    setEditingProduct(null);
    setIsModalOpen(true);
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
    if (selectedItems.size === data?.products?.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(data?.products?.map((p: any) => p.id) || []));
    }
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  // Fetch full product details (including images) before opening edit modal
  const openProductDetails = useCallback(async (productId: number) => {
    setLoadingProductId(productId);
    try {
      const fullProduct = await productsAPI.getById(productId);
      setSelectedProduct(fullProduct);
    } catch (error) {
      console.error("Failed to fetch product details:", error);
    } finally {
      setLoadingProductId(null);
    }
  }, []);

  // Mobile double-tap support
  const lastTapRef = useRef<{ id: number; time: number }>({ id: 0, time: 0 });

  const handleProductTap = useCallback((product: any, e: React.TouchEvent) => {
    const now = Date.now();
    if (lastTapRef.current.id === product.id && now - lastTapRef.current.time < 300) {
      e.preventDefault();
      openProductDetails(product.id);
      lastTapRef.current = { id: 0, time: 0 };
    } else {
      lastTapRef.current = { id: product.id, time: now };
    }
  }, [openProductDetails]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-heading font-semibold text-text-primary">
          {t("products.title")}
        </h1>
        <div className="flex items-center gap-2">
          {selectedItems.size > 0 && (
            <>
              <span className="text-sm text-text-secondary">
                {selectedItems.size} {t("common.selected", { defaultValue: "selected" })}
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
          <div className="flex gap-2">
            <button
              onClick={() => handleAddProduct("rent")}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t("products.forRent")}
            </button>
            <button
              onClick={() => handleAddProduct("sale")}
              className="btn-secondary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t("products.forSale")}
            </button>
          </div>
        </div>
      </div>

      {/* Type Filter Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => { setTypeFilter(""); setCurrentPage(1); }}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            typeFilter === ""
              ? "border-primary text-primary"
              : "border-transparent text-text-secondary hover:text-text-primary"
          )}
        >
          {t("products.allTypes")}
        </button>
        <button
          onClick={() => { setTypeFilter("rent"); setCurrentPage(1); }}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            typeFilter === "rent"
              ? "border-primary text-primary"
              : "border-transparent text-text-secondary hover:text-text-primary"
          )}
        >
          {t("products.forRent")}
        </button>
        <button
          onClick={() => { setTypeFilter("sale"); setCurrentPage(1); }}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            typeFilter === "sale"
              ? "border-primary text-primary"
              : "border-transparent text-text-secondary hover:text-text-primary"
          )}
        >
          {t("products.forSale")}
        </button>
      </div>

      {/* Search, Filters and Sort */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted rtl:left-auto rtl:right-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={t("common.search")}
            className="input-field pl-10 rtl:pl-3 rtl:pr-10"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="select-field !w-auto text-sm"
        >
          <option value="">{t("common.all")} - {t("products.status")}</option>
          {(typeFilter === "rent" ? RENT_STATUSES : typeFilter === "sale" ? SALE_STATUSES : [...RENT_STATUSES, ...SALE_STATUSES.filter(s => !RENT_STATUSES.includes(s))]).map((status) => (
            <option key={status} value={status}>
              {t(`products.statuses.${status}`)}
            </option>
          ))}
        </select>

        {/* Sort Dropdown */}
        <SortDropdown
          options={sortOptions}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
        />

        {/* Select All Button */}
        {data?.products?.length > 0 && (
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-surface hover:bg-surface-hover text-text-secondary text-sm transition-colors"
          >
            {selectedItems.size === data?.products?.length ? (
              <CheckSquare className="w-4 h-4 text-primary" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            {t("common.selectAll")}
          </button>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      ) : data?.products?.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
          {t("products.noProducts")}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data?.products?.map((product: any) => (
              <div
                key={product.id}
                onDoubleClick={() => openProductDetails(product.id)}
                onTouchEnd={(e) => handleProductTap(product, e)}
                className={cn(
                  "bg-surface rounded-xl border overflow-hidden card-hover group relative cursor-pointer",
                  selectedItems.has(product.id)
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border"
                )}
              >
                {/* Loading overlay when fetching product details */}
                {loadingProductId === product.id && (
                  <div className="absolute inset-0 z-50 bg-white/80 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                )}

                {/* Selection Checkbox */}
                <button
                  onClick={(e) => toggleSelection(product.id, e)}
                  className="absolute top-3 left-3 z-40 p-1 rounded bg-white/90 shadow-sm hover:bg-white transition-colors"
                >
                  {selectedItems.has(product.id) ? (
                    <CheckSquare className="w-5 h-5 text-primary" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {/* Image Slideshow */}
                <div className="relative">
                  <ImageSlideshow
                    images={product.primary_image ? [{ image_path: product.primary_image }] : []}
                    alt={product.name}
                    aspectRatio="3/4"
                    fallbackEmoji="📦"
                  />

                  {/* Status badge - top right */}
                  <div className="absolute top-3 right-3 z-10">
                    <span className={`badge ${getStatusColor(product.status)}`}>
                      {t(`products.statuses.${product.status}`)}
                    </span>
                  </div>

                  {/* Type Badge - bottom left */}
                  <div className="absolute bottom-3 left-3 z-10 rtl:left-auto rtl:right-3">
                    <span className={cn(
                      "badge",
                      product.type === "rent" ? "bg-info/10 text-info" : "bg-success/10 text-success"
                    )}>
                      {product.type === "rent" ? t("products.typeRent") : t("products.typeSale")}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-text-primary truncate">
                    {product.name}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {product.category?.name || "-"} • {product.size?.name || "-"} • {product.color || "-"}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    {product.type === "rent" ? (
                      <>
                        <span className="text-lg font-semibold text-primary">
                          {formatCurrency(product.rental_price)}
                        </span>
                        <span className="text-sm text-text-muted">
                          {t("products.depositAmount")}: {formatCurrency(product.deposit_amount)}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-lg font-semibold text-primary">
                          {formatCurrency(product.sale_price)}
                        </span>
                        <span className="text-sm text-text-muted">
                          {t("products.stockQuantity")}: {product.stock_quantity || 0}
                        </span>
                      </>
                    )}
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

      {/* Product Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingProduct ? t("products.editProduct") : t("products.addProduct")}
        size="lg"
      >
        <ProductForm
          product={editingProduct}
          defaultType={newProductType}
          onSuccess={handleCloseModal}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={() => deleteMutation.mutate(deletingProduct.id)}
        title={t("common.confirmDelete")}
        message={`${deletingProduct?.name}`}
        loading={deleteMutation.isPending}
      />

      {/* Bulk Delete Confirmation */}
      <ConfirmDialog
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onConfirm={() => bulkDeleteMutation.mutate(Array.from(selectedItems))}
        title={t("common.confirmDelete")}
        message={`${selectedItems.size} ${t("products.title")}`}
        loading={bulkDeleteMutation.isPending}
      />

      {/* Product Detail Modal */}
      <Modal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title={t("products.editProduct")}
        size="lg"
      >
        <div className="relative">
          <ProductForm
            product={selectedProduct}
            defaultType={selectedProduct?.type || "rent"}
            onSuccess={() => setSelectedProduct(null)}
          />
          <div className="mt-4 pt-4 border-t border-border flex justify-between">
            <button
              onClick={() => {
                setDeletingProduct(selectedProduct);
                setSelectedProduct(null);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-error text-white hover:bg-error/90 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {t("common.delete")}
            </button>
            <button
              onClick={() => setSelectedProduct(null)}
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

