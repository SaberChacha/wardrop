import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Calendar, Search, CheckSquare, Square, XCircle } from "lucide-react";
import { bookingsAPI } from "../services/api";
import { formatCurrency, formatDate, getStatusColor } from "../lib/utils";
import Modal from "../components/ui/Modal";
import BookingForm from "../components/forms/BookingForm";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Pagination from "../components/ui/Pagination";
import SortDropdown from "../components/ui/SortDropdown";
import FilterDropdown from "../components/ui/FilterDropdown";

const BOOKING_STATUSES = ["confirmed", "in_progress", "completed", "cancelled"];
const DEPOSIT_STATUSES = ["pending", "paid", "returned", "forfeited"];

export default function Bookings() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ status: "", deposit_status: "" });
  const [dateFilters, setDateFilters] = useState({
    startDate: "",
    endDate: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<any>(null);
  const [deletingBooking, setDeletingBooking] = useState<any>(null);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  // Bulk selection state
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Sorting state
  const [sortBy, setSortBy] = useState("start_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const sortOptions = [
    {
      value: "start_date",
      label: t("sort.startDate", { defaultValue: "Start Date" }),
    },
    {
      value: "rental_price",
      label: t("sort.price", { defaultValue: "Price" }),
    },
    {
      value: "created_at",
      label: t("sort.dateAdded", { defaultValue: "Date Added" }),
    },
  ];

  const { data, isLoading } = useQuery({
    queryKey: [
      "bookings",
      filters,
      dateFilters,
      currentPage,
      pageSize,
      sortBy,
      sortOrder,
    ],
    queryFn: () =>
      bookingsAPI.getAll({
        skip: (currentPage - 1) * pageSize,
        limit: pageSize,
        status: filters.status || undefined,
        deposit_status: filters.deposit_status || undefined,
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
    mutationFn: (id: number) => bookingsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setDeletingBooking(null);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => bookingsAPI.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
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
    const visibleBookings = data?.bookings?.filter((booking: any) => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return (
        booking.client?.full_name?.toLowerCase().includes(searchLower) ||
        booking.dress?.name?.toLowerCase().includes(searchLower)
      );
    }) || [];
    if (selectedItems.size === visibleBookings.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(visibleBookings.map((booking: any) => booking.id)));
    }
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBooking(null);
  };

  // Mobile double-tap support
  const lastTapRef = useRef<{ id: number; time: number }>({ id: 0, time: 0 });

  const handleBookingTap = useCallback((booking: any, e: React.TouchEvent) => {
    const now = Date.now();
    if (
      lastTapRef.current.id === booking.id &&
      now - lastTapRef.current.time < 300
    ) {
      e.preventDefault();
      setSelectedBooking(booking);
      lastTapRef.current = { id: 0, time: 0 };
    } else {
      lastTapRef.current = { id: booking.id, time: now };
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-heading font-semibold text-text-primary">
          {t("bookings.title")}
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
            {t("bookings.addBooking")}
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
            placeholder={t("bookings.searchPlaceholder", { defaultValue: "Search client or dress..." })}
            className="input-field pl-10 rtl:pl-3 rtl:pr-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {data?.bookings?.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-surface hover:bg-surface-hover text-text-secondary text-sm transition-colors"
            >
              {selectedItems.size === data?.bookings?.length ? (
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
                id: "status",
                label: t("bookings.bookingStatus"),
                type: "select",
                value: filters.status,
                options: BOOKING_STATUSES.map((status) => ({
                  value: status,
                  label: t(`bookings.bookingStatuses.${status}`),
                })),
                placeholder: t("common.all"),
              },
              {
                id: "deposit_status",
                label: t("bookings.depositStatus"),
                type: "select",
                value: filters.deposit_status,
                options: DEPOSIT_STATUSES.map((status) => ({
                  value: status,
                  label: t(`bookings.depositStatuses.${status}`),
                })),
                placeholder: t("common.all"),
              },
              {
                id: "dateRange",
                label: t("bookings.dateRange", { defaultValue: "Date Range" }),
                type: "dateRange",
                value: { start: dateFilters.startDate, end: dateFilters.endDate },
              },
            ]}
            onFilterChange={(id, value) => {
              if (id === "dateRange") {
                setDateFilters({ startDate: value.start, endDate: value.end });
              } else {
                setFilters({ ...filters, [id]: value });
              }
              setCurrentPage(1);
            }}
            onClearAll={() => {
              setFilters({ status: "", deposit_status: "" });
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
      ) : data?.bookings?.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          {t("bookings.noBookings")}
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
                      {selectedItems.size === data?.bookings?.length ? (
                        <CheckSquare className="w-5 h-5 text-primary" />
                      ) : (
                        <Square className="w-5 h-5 text-text-muted" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    {t("bookings.client")}
                  </th>
                  <th className="px-4 py-3 text-left">{t("bookings.dress")}</th>
                  <th className="px-4 py-3 text-left">
                    {t("bookings.startDate")}
                  </th>
                  <th className="px-4 py-3 text-left">
                    {t("bookings.endDate")}
                  </th>
                  <th className="px-4 py-3 text-left">
                    {t("bookings.rentalPrice")}
                  </th>
                  <th className="px-4 py-3 text-left">
                    {t("bookings.depositStatus")}
                  </th>
                  <th className="px-4 py-3 text-left">
                    {t("bookings.bookingStatus")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.bookings
                  ?.filter((booking: any) => {
                    if (!search) return true;
                    const searchLower = search.toLowerCase();
                    return (
                      booking.client?.full_name?.toLowerCase().includes(searchLower) ||
                      booking.dress?.name?.toLowerCase().includes(searchLower)
                    );
                  })
                  .map((booking: any) => (
                  <tr
                    key={booking.id}
                    className={`table-row cursor-pointer hover:bg-primary/5 ${selectedItems.has(booking.id) ? 'bg-primary/10' : ''}`}
                    onDoubleClick={() => setSelectedBooking(booking)}
                    onTouchEnd={(e) => handleBookingTap(booking, e)}
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => toggleSelection(booking.id, e)}
                        className="p-1 rounded hover:bg-surface-hover"
                      >
                        {selectedItems.has(booking.id) ? (
                          <CheckSquare className="w-5 h-5 text-primary" />
                        ) : (
                          <Square className="w-5 h-5 text-text-muted" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {booking.client?.full_name}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {booking.dress?.name}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(booking.start_date, i18n.language)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {formatDate(booking.end_date, i18n.language)}
                    </td>
                    <td className="px-4 py-3 font-medium text-primary">
                      {formatCurrency(booking.rental_price)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${getStatusColor(
                          booking.deposit_status
                        )}`}
                      >
                        {t(
                          `bookings.depositStatuses.${booking.deposit_status}`
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${getStatusColor(
                          booking.booking_status
                        )}`}
                      >
                        {t(
                          `bookings.bookingStatuses.${booking.booking_status}`
                        )}
                      </span>
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

      {/* Booking Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={
          editingBooking ? t("bookings.editBooking") : t("bookings.addBooking")
        }
        size="lg"
      >
        <BookingForm booking={editingBooking} onSuccess={handleCloseModal} />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingBooking}
        onClose={() => setDeletingBooking(null)}
        onConfirm={() => deleteMutation.mutate(deletingBooking.id)}
        title={t("common.confirmDelete")}
        message={`${deletingBooking?.client?.full_name} - ${deletingBooking?.dress?.name}`}
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

      {/* Booking Detail Modal */}
      <Modal
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        title={t("bookings.editBooking")}
        size="lg"
      >
        <div className="relative">
          <BookingForm
            booking={selectedBooking}
            onSuccess={() => setSelectedBooking(null)}
          />
          <div className="mt-4 pt-4 border-t border-border flex justify-between">
            <button
              onClick={() => {
                setDeletingBooking(selectedBooking);
                setSelectedBooking(null);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-error text-white hover:bg-error/90 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {t("common.delete")}
            </button>
            <button
              onClick={() => setSelectedBooking(null)}
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
