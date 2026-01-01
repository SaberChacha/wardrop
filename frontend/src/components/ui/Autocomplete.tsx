import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Search, ChevronDown, X, Check } from "lucide-react";
import { cn } from "../../lib/utils";

interface AutocompleteOption {
  id: number | string;
  [key: string]: any;
}

interface AutocompleteProps {
  options: AutocompleteOption[];
  value: number | string | null;
  onChange: (value: number | string | null) => void;
  displayField: string;
  placeholder?: string;
  renderOption?: (option: AutocompleteOption) => React.ReactNode;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export default function Autocomplete({
  options,
  value,
  onChange,
  displayField,
  placeholder,
  renderOption,
  disabled = false,
  required = false,
  className,
}: AutocompleteProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Get the selected option
  const selectedOption = options.find((opt) => opt.id === value);

  // Filter options based on search
  const filteredOptions = options.filter((option) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    const displayValue = option[displayField]?.toString().toLowerCase() || "";
    return displayValue.includes(searchLower);
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset highlight when filtered options change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOptions.length]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const highlightedElement = listRef.current.children[
        highlightedIndex
      ] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = useCallback(
    (option: AutocompleteOption) => {
      onChange(option.id);
      setIsOpen(false);
      setSearch("");
    },
    [onChange]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(null);
      setSearch("");
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ") {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "Enter":
          e.preventDefault();
          if (filteredOptions[highlightedIndex]) {
            handleSelect(filteredOptions[highlightedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setSearch("");
          break;
      }
    },
    [isOpen, filteredOptions, highlightedIndex, handleSelect]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger Button */}
      <div
        onClick={handleToggle}
        className={cn(
          "flex items-center gap-2 w-full px-3 py-2.5 rounded-lg border transition-colors cursor-pointer",
          "bg-surface border-border",
          isOpen && "border-primary ring-2 ring-primary/20",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && !isOpen && "hover:border-primary/50"
        )}
      >
        {selectedOption ? (
          <>
            <span className="flex-1 text-text-primary truncate">
              {renderOption
                ? renderOption(selectedOption)
                : selectedOption[displayField]}
            </span>
            {!disabled && !required && (
              <button
                type="button"
                onClick={handleClear}
                className="p-0.5 rounded hover:bg-surface-hover text-text-muted"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </>
        ) : (
          <span className="flex-1 text-text-muted">
            {placeholder || t("common.typeToSearch", { defaultValue: "Type to search..." })}
          </span>
        )}
        <ChevronDown
          className={cn(
            "w-4 h-4 text-text-muted transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-surface border border-border rounded-lg shadow-lg overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={t("common.typeToSearch", { defaultValue: "Type to search..." })}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-surface-hover/50 focus:outline-none focus:border-primary"
                autoFocus
              />
            </div>
          </div>

          {/* Options List */}
          <ul
            ref={listRef}
            className="max-h-48 overflow-y-auto"
            role="listbox"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-6 text-center text-text-muted text-sm">
                {t("common.noResults", { defaultValue: "No results found" })}
              </li>
            ) : (
              filteredOptions.map((option, index) => (
                <li
                  key={option.id}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    "px-3 py-2.5 cursor-pointer flex items-center gap-2 transition-colors",
                    index === highlightedIndex && "bg-primary/10",
                    option.id === value && "bg-primary/5"
                  )}
                  role="option"
                  aria-selected={option.id === value}
                >
                  <span className="flex-1 truncate">
                    {renderOption ? renderOption(option) : option[displayField]}
                  </span>
                  {option.id === value && (
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {/* Hidden input for form validation */}
      {required && (
        <input
          type="hidden"
          value={value || ""}
          required
        />
      )}
    </div>
  );
}

