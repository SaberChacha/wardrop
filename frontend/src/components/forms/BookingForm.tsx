import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingsAPI, clientsAPI, dressesAPI } from "../../services/api";
import ImageSlideshow from "../ui/ImageSlideshow";
import Autocomplete from "../ui/Autocomplete";

interface BookingFormProps {
  booking?: any;
  onSuccess: () => void;
}

export default function BookingForm({ booking, onSuccess }: BookingFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    client_id: booking?.client_id || "",
    dress_id: booking?.dress_id || "",
    start_date: booking?.start_date || "",
    end_date: booking?.end_date || "",
    rental_price: booking?.rental_price || "",
    deposit_amount: booking?.deposit_amount || "",
    deposit_status: booking?.deposit_status || "pending",
    booking_status: booking?.booking_status || "confirmed",
    notes: booking?.notes || "",
  });

  const { data: clients } = useQuery({
    queryKey: ["clients-list"],
    queryFn: () => clientsAPI.getAll({ limit: 100 }),
  });

  const { data: dresses } = useQuery({
    queryKey: ["dresses-available"],
    queryFn: () => dressesAPI.getAll({ limit: 100 }),
  });

  // Auto-fill prices when dress is selected
  useEffect(() => {
    if (formData.dress_id && !booking) {
      const selectedDress = dresses?.dresses?.find(
        (d: any) => d.id === parseInt(formData.dress_id.toString())
      );
      if (selectedDress) {
        setFormData((prev) => ({
          ...prev,
          rental_price: selectedDress.rental_price,
          deposit_amount: selectedDress.deposit_amount,
        }));
      }
    }
  }, [formData.dress_id, dresses, booking]);

  const mutation = useMutation({
    mutationFn: (data: any) =>
      booking ? bookingsAPI.update(booking.id, data) : bookingsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["dresses"] });
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      client_id: parseInt(formData.client_id.toString()),
      dress_id: parseInt(formData.dress_id.toString()),
      rental_price: parseFloat(formData.rental_price.toString()),
      deposit_amount: parseFloat(formData.deposit_amount.toString()),
    };
    mutation.mutate(submitData);
  };

  const selectedDress = dresses?.dresses?.find(
    (d: any) => d.id === parseInt(formData.dress_id.toString())
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            {t("bookings.client")} *
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
            {t("bookings.dress")} *
          </label>
          <Autocomplete
            options={dresses?.dresses || []}
            value={formData.dress_id ? parseInt(formData.dress_id.toString()) : null}
            onChange={(value) =>
              setFormData({ ...formData, dress_id: value || "" })
            }
            displayField="name"
            placeholder={t("common.typeToSearch", { defaultValue: "Type to search..." })}
            renderOption={(dress) => (
              <div className="flex items-center justify-between w-full">
                <span className="font-medium">{dress.name}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    dress.status === "available"
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"
                  }`}
                >
                  {dress.status === "available"
                    ? t("dresses.available")
                    : t("dresses.rented")}
                </span>
              </div>
            )}
            required
          />
        </div>
      </div>

      {/* Dress Image Slideshow */}
      {selectedDress && (
        <div className="w-full max-w-xs mx-auto rounded-lg overflow-hidden">
          <ImageSlideshow
            images={selectedDress.images || []}
            alt={selectedDress.name || ""}
            aspectRatio="3/4"
            fallbackEmoji="👗"
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
  );
}
