import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { salesAPI, clientsAPI, clothingAPI } from "../../services/api";
import ImageSlideshow from "../ui/ImageSlideshow";
import Autocomplete from "../ui/Autocomplete";

interface SaleFormProps {
  sale?: any;
  onSuccess: () => void;
}

export default function SaleForm({ sale, onSuccess }: SaleFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    client_id: sale?.client_id || "",
    clothing_id: sale?.clothing_id || "",
    quantity: sale?.quantity || 1,
    unit_price: sale?.unit_price || "",
    sale_date: sale?.sale_date || new Date().toISOString().split("T")[0],
    notes: sale?.notes || "",
  });

  const { data: clients } = useQuery({
    queryKey: ["clients-list"],
    queryFn: () => clientsAPI.getAll({ limit: 100 }),
  });

  const { data: clothing } = useQuery({
    queryKey: ["clothing-in-stock"],
    queryFn: () => clothingAPI.getAll({ limit: 100, in_stock: true }),
  });

  // Auto-fill price when item is selected
  useEffect(() => {
    if (formData.clothing_id && !sale) {
      const selectedItem = clothing?.items?.find(
        (c: any) => c.id === parseInt(formData.clothing_id.toString())
      );
      if (selectedItem) {
        setFormData((prev) => ({
          ...prev,
          unit_price: selectedItem.sale_price,
        }));
      }
    }
  }, [formData.clothing_id, clothing, sale]);

  const mutation = useMutation({
    mutationFn: (data: any) =>
      sale ? salesAPI.update(sale.id, data) : salesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["clothing"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      client_id: parseInt(formData.client_id.toString()),
      clothing_id: parseInt(formData.clothing_id.toString()),
      quantity: parseInt(formData.quantity.toString()),
      unit_price: parseFloat(formData.unit_price.toString()),
    };
    mutation.mutate(submitData);
  };

  const selectedItem = clothing?.items?.find(
    (c: any) => c.id === parseInt(formData.clothing_id.toString())
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            {t("sales.client")} *
          </label>
          <Autocomplete
            options={clients?.clients || []}
            value={formData.client_id ? parseInt(formData.client_id.toString()) : null}
            onChange={(value) =>
              setFormData({ ...formData, client_id: value || "" })
            }
            displayField="full_name"
            placeholder={t("common.typeToSearch", { defaultValue: "Type to search..." })}
            renderOption={(client) => (
              <div>
                <span className="font-medium">{client.full_name}</span>
                {client.phone && (
                  <span className="text-text-muted text-sm ml-2">
                    {client.phone}
                  </span>
                )}
              </div>
            )}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            {t("sales.item")} *
          </label>
          <Autocomplete
            options={clothing?.items || []}
            value={formData.clothing_id ? parseInt(formData.clothing_id.toString()) : null}
            onChange={(value) =>
              setFormData({ ...formData, clothing_id: value || "" })
            }
            displayField="name"
            placeholder={t("common.typeToSearch", { defaultValue: "Type to search..." })}
            renderOption={(item) => (
              <div className="flex items-center justify-between w-full">
                <span className="font-medium">{item.name}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    item.stock_quantity > 0
                      ? "bg-success/10 text-success"
                      : "bg-error/10 text-error"
                  }`}
                >
                  Stock: {item.stock_quantity}
                </span>
              </div>
            )}
            required
          />
        </div>
      </div>

      {/* Product Image Slideshow */}
      {selectedItem && (
        <div className="w-full max-w-xs mx-auto rounded-lg overflow-hidden">
          <ImageSlideshow
            images={selectedItem.images || []}
            alt={selectedItem.name || ""}
            aspectRatio="square"
            fallbackEmoji="👔"
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            {t("sales.quantity")} *
          </label>
          <input
            type="number"
            value={formData.quantity}
            onChange={(e) =>
              setFormData({ ...formData, quantity: e.target.value })
            }
            className="input-field"
            min="1"
            max={selectedItem?.stock_quantity || 999}
            required
          />
          {selectedItem && (
            <p className="text-xs text-text-muted mt-1">
              Stock disponible: {selectedItem.stock_quantity}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            {t("sales.unitPrice")} (DZD) *
          </label>
          <input
            type="number"
            value={formData.unit_price}
            onChange={(e) =>
              setFormData({ ...formData, unit_price: e.target.value })
            }
            className="input-field"
            min="0"
            step="any"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            {t("sales.saleDate")} *
          </label>
          <input
            type="date"
            value={formData.sale_date}
            onChange={(e) =>
              setFormData({ ...formData, sale_date: e.target.value })
            }
            className="input-field"
            required
          />
        </div>
      </div>

      {/* Total calculation */}
      {formData.unit_price && formData.quantity && (
        <div className="p-4 rounded-lg bg-secondary/30">
          <p className="text-sm text-text-secondary">
            {t("sales.totalPrice")}:
          </p>
          <p className="text-2xl font-heading font-bold text-primary">
            {(
              parseFloat(formData.unit_price.toString()) *
              parseInt(formData.quantity.toString())
            ).toLocaleString()}{" "}
            DZD
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          {t("sales.notes")}
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="input-field min-h-[80px] resize-none"
          rows={2}
        />
      </div>

      {mutation.isError && (
        <p className="text-error text-sm">
          {(mutation.error as any)?.response?.data?.detail ||
            "Une erreur est survenue"}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="btn-primary"
        >
          {mutation.isPending ? t("common.loading") : t("common.save")}
        </button>
      </div>
    </form>
  );
}
