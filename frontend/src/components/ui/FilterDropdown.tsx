import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Filter, X, ChevronDown } from "lucide-react";

interface FilterOption {
  id: string;
  label: string;
  type: "select" | "date" | "dateRange";
  value: string | { start: string; end: string };
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface FilterDropdownProps {
  filters: FilterOption[];
  onFilterChange: (id: string, value: any) => void;
  onClearAll: () => void;
}

export default function FilterDropdown({
  filters,
  onFilterChange,
  onClearAll,
}: FilterDropdownProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Count active filters
  const activeFilterCount = filters.filter((f) => {
    if (f.type === "dateRange") {
      const val = f.value as { start: string; end: string };
      return val.start || val.end;
    }
    return f.value && f.value !== "";
  }).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderFilterInput = (filter: FilterOption) => {
    switch (filter.type) {
      case "select":
        return (
          <select
            value={filter.value as string}
            onChange={(e) => onFilterChange(filter.id, e.target.value)}
            className="select-field w-full text-sm"
          >
            <option value="">{filter.placeholder || t("common.all")}</option>
            {filter.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case "date":
        return (
          <input
            type="date"
            value={filter.value as string}
            onChange={(e) => onFilterChange(filter.id, e.target.value)}
            className="input-field w-full text-sm"
          />
        );

      case "dateRange":
        const rangeValue = filter.value as { start: string; end: string };
        return (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={rangeValue.start}
              onChange={(e) =>
                onFilterChange(filter.id, {
                  ...rangeValue,
                  start: e.target.value,
                })
              }
              className="input-field flex-1 text-sm"
              placeholder={t("common.from")}
            />
            <span className="text-text-muted text-sm">-</span>
            <input
              type="date"
              value={rangeValue.end}
              onChange={(e) =>
                onFilterChange(filter.id, { ...rangeValue, end: e.target.value })
              }
              className="input-field flex-1 text-sm"
              placeholder={t("common.to")}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors
          ${
            isOpen || activeFilterCount > 0
              ? "bg-primary/10 border-primary text-primary"
              : "bg-surface border-border text-text-secondary hover:bg-surface-hover"
          }
        `}
      >
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium hidden sm:inline">
          {t("common.filters", { defaultValue: "Filters" })}
        </span>
        {activeFilterCount > 0 && (
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-xs font-bold">
            {activeFilterCount}
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 z-50 w-72 sm:w-80 bg-surface border border-border rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-hover/50">
            <h3 className="font-medium text-text-primary">
              {t("common.filters", { defaultValue: "Filters" })}
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-surface-hover text-text-muted"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Filter Options */}
          <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
            {filters.map((filter) => (
              <div key={filter.id}>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  {filter.label}
                </label>
                {renderFilterInput(filter)}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface-hover/50">
            <button
              onClick={() => {
                onClearAll();
              }}
              className="text-sm text-text-muted hover:text-error transition-colors"
              disabled={activeFilterCount === 0}
            >
              {t("common.clearAll", { defaultValue: "Clear All" })}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              {t("common.apply", { defaultValue: "Apply" })}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Active Filter Pills Component
interface ActiveFilterPillsProps {
  filters: { id: string; label: string; value: string }[];
  onRemove: (id: string) => void;
}

export function ActiveFilterPills({ filters, onRemove }: ActiveFilterPillsProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <span
          key={filter.id}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-sm"
        >
          <span className="text-text-muted text-xs">{filter.label}:</span>
          <span className="font-medium">{filter.value}</span>
          <button
            onClick={() => onRemove(filter.id)}
            className="p-0.5 rounded-full hover:bg-primary/20 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
    </div>
  );
}

