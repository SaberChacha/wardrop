import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { bookingsAPI, clientsAPI, productsAPI } from "../../services/api";
import ImageSlideshow from "../ui/ImageSlideshow";
import Autocomplete from "../ui/Autocomplete";
import Modal from "../ui/Modal";
import ClientForm from "./ClientForm";

interface BookingFormProps {
  booking?: any;
  onSuccess: () => void;
}

export default function BookingForm({ booking, onSuccess }: BookingFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    client_id: booking?.client_id || "",
    product_id: booking?.product_id || "",
    start_date: booking?.start_date || "",
    end_date: booking?.end_date || "",
    rental_price: booking?.rental_price || "",
    deposit_amount: booking?.deposit_amount || "",
    deposit_status: booking?.deposit_status || "pending",
    booking_status: booking?.booking_status || "confirmed",
    notes: booking?.notes || "",
  });

  const { data: clients, refetch: refetchClients } = useQuery({
    queryKey: ["clients-list"],
    queryFn: () => clientsAPI.getAll({ limit: 500 }),
  });

  const { data: products } = useQuery({
    queryKey: ["products-rent"],
    queryFn: () => productsAPI.getAll({ type: "rent", limit: 500 }),
  });

  // Auto-fill prices when product is selected
  useEffect(() => {
    if (formData.product_id && !booking) {
      const selectedProduct = products?.products?.find(
        (p: any) => p.id === parseInt(formData.product_id.toString())
      );
      if (selectedProduct) {
        setFormData((prev) => ({
          ...prev,
          rental_price: selectedProduct.rental_price,
          deposit_amount: selectedProduct.deposit_amount,
        }));
      }
    }
  }, [formData.product_id, products, booking]);

  const handleClientCreated = (newClient: any) => {
    refetchClients();
    setFormData({ ...formData, client_id: newClient.id });
    setIsClientModalOpen(false);
  };

  const mutation = useMutation({
    mutationFn: (data: any) =>
      booking ? bookingsAPI.update(booking.id, data) : bookingsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      client_id: parseInt(formData.client_id.toString()),
      product_id: parseInt(formData.product_id.toString()),
      rental_price: parseFloat(formData.rental_price.toString()),
      deposit_amount: parseFloat(formData.deposit_amount.toString()),
    };
    mutation.mutate(submitData);
  };

  const selectedProduct = products?.products?.find(
    (p: any) => p.id === parseInt(formData.product_id.toString())
  );

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            {t("bookings.client")} *
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
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
            <button
              type="button"
              onClick={() => setIsClientModalOpen(true)}
              className="p-2 rounded-lg border border-border bg-surface hover:bg-surface-hover text-primary transition-colors"
              title={t("clients.addClient")}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            {t("bookings.product", { defaultValue: "Product" })} *
          </label>
          <Autocomplete
            options={products?.products || []}
            value={formData.product_id ? parseInt(formData.product_id.toString()) : null}
            onChange={(value) =>
              setFormData({ ...formData, product_id: value || "" })
            }
            displayField="name"
            placeholder={t("common.typeToSearch", { defaultValue: "Type to search..." })}
            renderOption={(product) => (
              <div className="flex items-center justify-between w-full">
                <span className="font-medium">{product.name}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    product.status === "available"
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"
                  }`}
                >
                  {product.status === "available"
                    ? t("products.statuses.available")
                    : t("products.statuses.rented")}
                </span>
              </div>
            )}
            required
          />
        </div>
      </div>

      {/* Product Image Slideshow */}
      {selectedProduct && selectedProduct.primary_image && (
        <div className="w-full max-w-xs mx-auto rounded-lg overflow-hidden">
          <ImageSlideshow
            images={[{ image_path: selectedProduct.primary_image }]}
            alt={selectedProduct.name || ""}
            aspectRatio="3/4"
            fallbackEmoji="📦"
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            {t("bookings.startDate")} *
          </label>
          <input
            type="date"
            value={formData.start_date}
            onChange={(e) =>
              setFormData({ ...formData, start_date: e.target.value })
            }
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            {t("bookings.endDate")} *
          </label>
          <input
            type="date"
            value={formData.end_date}
            onChange={(e) =>
              setFormData({ ...formData, end_date: e.target.value })
            }
            className="input-field"
            min={formData.start_date}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            {t("bookings.rentalPrice")} (DZD) *
          </label>
          <input
            type="number"
            value={formData.rental_price}
            onChange={(e) =>
              setFormData({ ...formData, rental_price: e.target.value })
            }
            className="input-field"
            min="0"
            step="any"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            {t("bookings.depositAmount")} (DZD) *
          </label>
          <input
            type="number"
            value={formData.deposit_amount}
            onChange={(e) =>
              setFormData({ ...formData, deposit_amount: e.target.value })
            }
            className="input-field"
            min="0"
            step="any"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            {t("bookings.depositStatus")}
          </label>
          <select
            value={formData.deposit_status}
            onChange={(e) =>
              setFormData({ ...formData, deposit_status: e.target.value })
            }
            className="select-field"
          >
            <option value="pending">
              {t("bookings.depositStatuses.pending")}
            </option>
            <option value="paid">{t("bookings.depositStatuses.paid")}</option>
            <option value="returned">
              {t("bookings.depositStatuses.returned")}
            </option>
            <option value="forfeited">
              {t("bookings.depositStatuses.forfeited")}
            </option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            {t("bookings.bookingStatus")}
          </label>
          <select
            value={formData.booking_status}
            onChange={(e) =>
              setFormData({ ...formData, booking_status: e.target.value })
            }
            className="select-field"
          >
            <option value="confirmed">
              {t("bookings.bookingStatuses.confirmed")}
            </option>
            <option value="in_progress">
              {t("bookings.bookingStatuses.in_progress")}
            </option>
            <option value="completed">
              {t("bookings.bookingStatuses.completed")}
            </option>
            <option value="cancelled">
              {t("bookings.bookingStatuses.cancelled")}
            </option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          {t("bookings.notes")}
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

    {/* Quick Client Creation Modal */}
    <Modal
      isOpen={isClientModalOpen}
      onClose={() => setIsClientModalOpen(false)}
      title={t("clients.addClient")}
      size="md"
    >
      <ClientForm onSuccess={handleClientCreated} />
    </Modal>
    </>
  );
}
