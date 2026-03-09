"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { RadioGroup, Radio } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toastManager } from "@/components/ui/toast";
import { AddressAutocomplete } from "@/components/operator/address-autocomplete";
import { PriceEstimator } from "@/components/operator/price-estimator";
import type { BookingWithRelations, BookingStatus } from "@/types/booking";

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

const STATUS_OPTIONS: { value: BookingStatus; label: string }[] = [
  { value: "PENDING", label: "En attente" },
  { value: "ACCEPTED", label: "Acceptée" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "COMPLETED", label: "Terminée" },
  { value: "CANCELLED", label: "Annulée" },
  { value: "NO_SHOW", label: "Client absent" },
];

const formSchema = z
  .object({
    clientName: z.string().min(2, "Minimum 2 caractères"),
    clientPhone: z.string().min(8, "Numéro invalide"),
    clientEmail: z.string().email("Email invalide").optional().or(z.literal("")),
    pickupAddress: z.string().min(5, "Adresse trop courte"),
    dropAddress: z.string().min(5, "Adresse trop courte"),
    type: z.enum(["IMMEDIATE", "SCHEDULED"]),
    scheduledDate: z.string().optional(),
    scheduledTime: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(["PENDING", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"]),
    estimatedPrice: z.number().positive().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "SCHEDULED") {
      if (!data.scheduledDate) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Date requise", path: ["scheduledDate"] });
      }
      if (!data.scheduledTime) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Heure requise", path: ["scheduledTime"] });
      }
    }
  });

type FormValues = z.infer<typeof formSchema>;

interface EditBookingDialogProps {
  booking: BookingWithRelations;
}

function getDefaultDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getDefaultTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function parseDistanceKm(text: string | null): number {
  if (!text) return 0;
  const match = text.replace(",", ".").match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

function parseDurationMin(text: string | null): number {
  if (!text) return 0;
  const hMatch = text.match(/(\d+)\s*h/);
  const mMatch = text.match(/(\d+)\s*min/);
  const hours = hMatch ? parseInt(hMatch[1]) : 0;
  const mins = mMatch ? parseInt(mMatch[1]) : 0;
  if (hours === 0 && mins === 0) {
    const fallback = text.match(/(\d+)/);
    return fallback ? parseInt(fallback[1]) : 0;
  }
  return hours * 60 + mins;
}

export function EditBookingDialog({ booking }: EditBookingDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState<number | undefined>(
    booking.estimatedPrice ?? undefined
  );

  const initialDistanceKm = parseDistanceKm(booking.distanceText);
  const initialDureeMin = parseDurationMin(booking.durationText);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: booking.clientName,
      clientPhone: booking.clientPhone,
      clientEmail: booking.clientEmail ?? "",
      pickupAddress: booking.pickupAddress,
      dropAddress: booking.dropAddress,
      type: booking.type,
      scheduledDate: getDefaultDate(booking.scheduledAt),
      scheduledTime: getDefaultTime(booking.scheduledAt),
      notes: booking.notes ?? "",
      status: booking.status,
      estimatedPrice: booking.estimatedPrice ?? undefined,
    },
  });

  const bookingType = watch("type");
  const pickupAddress = watch("pickupAddress");
  const dropAddress = watch("dropAddress");
  const scheduledDate = watch("scheduledDate");
  const scheduledTime = watch("scheduledTime");

  const scheduledAtDate =
    bookingType === "SCHEDULED" && scheduledDate && scheduledTime
      ? new Date(`${scheduledDate}T${scheduledTime}:00`)
      : undefined;

  const handlePriceChange = useCallback(
    (price: number | undefined) => {
      setEstimatedPrice(price);
      setValue("estimatedPrice", price);
    },
    [setValue]
  );

  function handleOpen() {
    reset({
      clientName: booking.clientName,
      clientPhone: booking.clientPhone,
      clientEmail: booking.clientEmail ?? "",
      pickupAddress: booking.pickupAddress,
      dropAddress: booking.dropAddress,
      type: booking.type,
      scheduledDate: getDefaultDate(booking.scheduledAt),
      scheduledTime: getDefaultTime(booking.scheduledAt),
      notes: booking.notes ?? "",
      status: booking.status,
      estimatedPrice: booking.estimatedPrice ?? undefined,
    });
    setEstimatedPrice(booking.estimatedPrice ?? undefined);
    setConfirmDelete(false);
    setOpen(true);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toastManager.add({ title: "Réservation supprimée" });
      setOpen(false);
      router.refresh();
    } catch {
      toastManager.add({ title: "Erreur lors de la suppression" });
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  const onSubmit = async (values: FormValues) => {
    let scheduledAt: string | null = null;
    if (values.type === "SCHEDULED" && values.scheduledDate && values.scheduledTime) {
      scheduledAt = new Date(`${values.scheduledDate}T${values.scheduledTime}:00`).toISOString();
    }

    const res = await fetch(`/api/bookings/${booking.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName: values.clientName,
        clientPhone: values.clientPhone,
        clientEmail: values.clientEmail || null,
        pickupAddress: values.pickupAddress,
        dropAddress: values.dropAddress,
        type: values.type,
        scheduledAt,
        notes: values.notes || null,
        status: values.status,
        estimatedPrice: estimatedPrice ?? null,
        distanceText: booking.distanceText,
        durationText: booking.durationText,
      }),
    });

    if (!res.ok) {
      toastManager.add({ title: "Erreur lors de la mise à jour" });
      return;
    }

    toastManager.add({ title: "Réservation mise à jour" });
    setOpen(false);
    router.refresh();
  };

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={handleOpen} className="h-7 w-7 p-0">
        <Pencil className="h-3.5 w-3.5" />
      </Button>
    );
  }

  return (
    <APIProvider apiKey={MAPS_API_KEY} libraries={["places"]}>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setOpen(false)} />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-5 text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Modifier la réservation
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {/* Statut */}
            <Field>
              <FieldLabel>Statut</FieldLabel>
              <select
                {...register("status")}
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {watch("status") === "PENDING" && booking.status !== "PENDING" && (
                <p className="text-xs text-amber-600">
                  Repasser en "En attente" supprimera l'acceptation du chauffeur.
                </p>
              )}
            </Field>

            {/* Adresse de départ */}
            <Field>
              <FieldLabel>Adresse de départ</FieldLabel>
              <input type="hidden" {...register("pickupAddress")} />
              <AddressAutocomplete
                value={pickupAddress ?? ""}
                onChange={(v) => setValue("pickupAddress", v, { shouldValidate: true })}
                placeholder="10 rue de la Paix, Paris"
              />
              {errors.pickupAddress && <FieldError>{errors.pickupAddress.message}</FieldError>}
            </Field>

            {/* Adresse d'arrivée */}
            <Field>
              <FieldLabel>Adresse d'arrivée</FieldLabel>
              <input type="hidden" {...register("dropAddress")} />
              <AddressAutocomplete
                value={dropAddress ?? ""}
                onChange={(v) => setValue("dropAddress", v, { shouldValidate: true })}
                placeholder="Aéroport CDG, Terminal 2"
              />
              {errors.dropAddress && <FieldError>{errors.dropAddress.message}</FieldError>}
            </Field>

            {/* Type de course */}
            <Field>
              <FieldLabel>Type de course</FieldLabel>
              <RadioGroup
                value={bookingType}
                className="flex flex-row gap-6"
                onValueChange={(value) => setValue("type", value as "IMMEDIATE" | "SCHEDULED")}
              >
                <Label className="flex items-center gap-2 cursor-pointer">
                  <Radio value="IMMEDIATE" />
                  Immédiate
                </Label>
                <Label className="flex items-center gap-2 cursor-pointer">
                  <Radio value="SCHEDULED" />
                  Planifiée
                </Label>
              </RadioGroup>
            </Field>

            {/* Date & heure */}
            {bookingType === "SCHEDULED" && (
              <div className="flex gap-3">
                <Field className="flex-1">
                  <FieldLabel>Date</FieldLabel>
                  <Input {...register("scheduledDate")} type="date" />
                  {errors.scheduledDate && <FieldError>{errors.scheduledDate.message}</FieldError>}
                </Field>
                <Field className="flex-1">
                  <FieldLabel>Heure</FieldLabel>
                  <Input {...register("scheduledTime")} type="time" />
                  {errors.scheduledTime && <FieldError>{errors.scheduledTime.message}</FieldError>}
                </Field>
              </div>
            )}

            {/* Estimation du tarif */}
            <PriceEstimator
              onPriceChange={handlePriceChange}
              bookingType={bookingType}
              scheduledAt={scheduledAtDate}
              initialDistanceKm={initialDistanceKm}
              initialDureeMin={initialDureeMin}
            />

            {/* Nom du client */}
            <Field>
              <FieldLabel>Nom du client</FieldLabel>
              <Input {...register("clientName")} placeholder="Jean Dupont" />
              {errors.clientName && <FieldError>{errors.clientName.message}</FieldError>}
            </Field>

            {/* Téléphone */}
            <Field>
              <FieldLabel>Téléphone</FieldLabel>
              <Input {...register("clientPhone")} type="tel" placeholder="+33 6 00 00 00 00" />
              {errors.clientPhone && <FieldError>{errors.clientPhone.message}</FieldError>}
            </Field>

            {/* Email */}
            <Field>
              <FieldLabel>Email (optionnel)</FieldLabel>
              <Input {...register("clientEmail")} type="email" placeholder="client@exemple.fr" />
              {errors.clientEmail && <FieldError>{errors.clientEmail.message}</FieldError>}
            </Field>

            {/* Notes */}
            <Field>
              <FieldLabel>Notes (optionnel)</FieldLabel>
              <Textarea {...register("notes")} placeholder="Informations complémentaires..." size={3} />
            </Field>

            {/* Footer */}
            <div className="mt-2 flex items-center justify-between gap-2">
              <div>
                {confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-red-600 dark:text-red-400">Confirmer ?</span>
                    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting} type="button">
                      {deleting ? "Suppression…" : "Oui, supprimer"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)} disabled={deleting} type="button">
                      Non
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmDelete(true)}
                    className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300 border-red-200 dark:border-red-800"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Supprimer
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting || deleting}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting || deleting}>
                  {isSubmitting ? "Enregistrement…" : "Enregistrer"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </APIProvider>
  );
}
