import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  Calendar,
  TrendingDown,
  Receipt,
} from "lucide-react";
import { expensesAPI } from "../services/api";
import { formatCurrency, formatDate } from "../lib/utils";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import ExpenseForm from "../components/forms/ExpenseForm";
import Pagination from "../components/ui/Pagination";
import SortDropdown from "../components/ui/SortDropdown";

const PERIODS = [
  { value: "daily", label: "expenses.periods.daily" },
  { value: "monthly", label: "expenses.periods.monthly" },
  { value: "yearly", label: "expenses.periods.yearly" },
  { value: "custom", label: "expenses.periods.custom" },
];

export default function Expenses() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [deletingExpense, setDeletingExpense] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  // Calculate date range based on selected period
  const getDateRange = () => {
    const today = new Date();
    let start = dateRange.start;
    let end = dateRange.end;

    if (selectedPeriod === "daily") {
      start = today.toISOString().split("T")[0];
      end = today.toISOString().split("T")[0];
    } else if (selectedPeriod === "monthly") {
      start = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      end = today.toISOString().split("T")[0];
    } else if (selectedPeriod === "yearly") {
      start = new Date(today.getFullYear(), 0, 1).toISOString().split("T")[0];
      end = today.toISOString().split("T")[0];
    }
    // For 'custom', use the dateRange state

    return { start, end };
  };

  const effectiveDateRange = getDateRange();

  // Queries
  const { data, isLoading } = useQuery({
    queryKey: [
      "expenses",
      currentPage,
      pageSize,
      sortBy,
      sortOrder,
      effectiveDateRange.start,
      effectiveDateRange.end,
    ],
    queryFn: () =>
      expensesAPI.getAll({
        skip: (currentPage - 1) * pageSize,
        limit: pageSize,
        start_date: effectiveDateRange.start,
        end_date: effectiveDateRange.end,
        sort_by: sortBy,
        sort_order: sortOrder,
      }),
  });

  const { data: summary } = useQuery({
    queryKey: [
      "expenses-summary",
      selectedPeriod,
      effectiveDateRange.start,
      effectiveDateRange.end,
    ],
    queryFn: () =>
      expensesAPI.getSummary({
        start_date: effectiveDateRange.start,
        end_date: effectiveDateRange.end,
        period: selectedPeriod === "custom" ? "monthly" : selectedPeriod,
      }),
  });

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (id: number) => expensesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenses-summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setDeletingExpense(null);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => expensesAPI.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenses-summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setSelectedItems(new Set());
      setIsBulkDeleteOpen(false);
    },
  });

  // Handlers
  const handlePageChange = (page: number) => setCurrentPage(page);
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleSort = (field: string, order: "asc" | "desc") => {
    setSortBy(field);
    setSortOrder(order);
  };

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set<number>(data?.expenses?.map((e: any) => e.id) || []);
      setSelectedItems(allIds);
    } else {
      setSelectedItems(new Set<number>());
    }
  };

  const handleSelectItem = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
  };

  const totalPages = Math.ceil((data?.total || 0) / pageSize);

  const sortOptions = [
    { value: "date", label: t("sort.date") },
    { value: "amount", label: t("expenses.amount") },
    { value: "created_at", label: t("sort.dateAdded") },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-heading font-semibold text-text-primary">
          {t("expenses.title")}
        </h1>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <Plus className="w-5 h-5 mr-2" />
          {t("expenses.addExpense")}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-error/10">
              <TrendingDown className="w-5 h-5 text-error" />
            </div>
            <div>
              <p className="text-sm text-text-muted">
                {t("expenses.totalExpenses")}
              </p>
              <p className="text-xl font-semibold text-text-primary">
                {formatCurrency(summary?.total_expenses || 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Receipt className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-text-muted">
                {t("expenses.expenseCount")}
              </p>
              <p className="text-xl font-semibold text-text-primary">
                {summary?.expense_count || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info/10">
              <DollarSign className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-sm text-text-muted">
                {t("expenses.averageExpense")}
              </p>
              <p className="text-xl font-semibold text-text-primary">
                {formatCurrency(
                  summary?.expense_count
                    ? summary.total_expenses / summary.expense_count
                    : 0
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface rounded-xl p-4 border border-border">
        <div className="flex flex-wrap items-center gap-4">
          {/* Period Buttons */}
          <div className="flex gap-2">
            {PERIODS.map((period) => (
              <button
                key={period.value}
                onClick={() => setSelectedPeriod(period.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period.value
                    ? "bg-primary text-white"
                    : "bg-surface-hover text-text-secondary hover:bg-border"
                }`}
              >
                {t(period.label)}
              </button>
            ))}
          </div>

          {/* Custom Date Range */}
          {selectedPeriod === "custom" && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-text-muted" />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
                className="input-field !w-auto"
              />
              <span className="text-text-muted">-</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
                className="input-field !w-auto"
              />
            </div>
          )}

          <div className="flex-1" />

          {/* Sort */}
          <SortDropdown
            options={sortOptions}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSort}
          />
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
          <span className="text-text-primary">
            {t("common.selected", { count: selectedItems.size })}
          </span>
          <button
            onClick={() => setIsBulkDeleteOpen(true)}
            className="btn-secondary text-error hover:bg-error/10"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {t("common.delete")}
          </button>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      ) : data?.expenses?.length === 0 ? (
        <div className="bg-surface rounded-xl p-12 text-center border border-border">
          <Receipt className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-muted">{t("expenses.noExpenses")}</p>
        </div>
      ) : (
        <>
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface-hover">
                    <th className="px-4 py-3 text-start">
                      <input
                        type="checkbox"
                        checked={
                          selectedItems.size === data?.expenses?.length &&
                          data?.expenses?.length > 0
                        }
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-border"
                      />
                    </th>
                    <th className="px-4 py-3 text-start text-sm font-medium text-text-muted">
                      {t("expenses.date")}
                    </th>
                    <th className="px-4 py-3 text-start text-sm font-medium text-text-muted">
                      {t("expenses.reason")}
                    </th>
                    <th className="px-4 py-3 text-start text-sm font-medium text-text-muted">
                      {t("expenses.amount")}
                    </th>
                    <th className="px-4 py-3 text-start text-sm font-medium text-text-muted">
                      {t("expenses.notes")}
                    </th>
                    <th className="px-4 py-3 text-end text-sm font-medium text-text-muted">
                      {t("common.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data?.expenses?.map((expense: any) => (
                    <tr
                      key={expense.id}
                      className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(expense.id)}
                          onChange={(e) =>
                            handleSelectItem(expense.id, e.target.checked)
                          }
                          className="rounded border-border"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-text-muted" />
                          {formatDate(expense.date, i18n.language)}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-text-primary">
                        {expense.reason}
                      </td>
                      <td className="px-4 py-3 font-semibold text-error">
                        -{formatCurrency(expense.amount)}
                      </td>
                      <td className="px-4 py-3 text-text-muted text-sm max-w-xs truncate">
                        {expense.notes || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(expense)}
                            className="p-2 rounded-lg hover:bg-surface-hover text-text-muted hover:text-primary transition-colors"
                            title={t("common.edit")}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingExpense(expense)}
                            className="p-2 rounded-lg hover:bg-error/10 text-text-muted hover:text-error transition-colors"
                            title={t("common.delete")}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingExpense ? t("expenses.editExpense") : t("expenses.addExpense")}
      >
        <ExpenseForm expense={editingExpense} onSuccess={handleCloseModal} />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingExpense}
        onClose={() => setDeletingExpense(null)}
        onConfirm={() => deletingExpense && deleteMutation.mutate(deletingExpense.id)}
        title={t("common.confirmDelete")}
        message={t("expenses.confirmDelete")}
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
    </div>
  );
}
