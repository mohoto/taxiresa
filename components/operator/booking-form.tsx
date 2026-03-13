"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { APIProvider } from "@vis.gl/react-google-maps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { RadioGroup, Radio } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toastManager } from "@/components/ui/toast";
import { AddressAutocomplete } from "@/components/operator/address-autocomplete";
import { PriceEstimator } from "@/components/operator/price-estimator";
import type { CreateBookingPayload, VehicleType } from "@/types/booking";

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
    estimatedPrice: z.number().positive().optional(),
    distanceKm: z.number().positive().optional(),
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

interface RouteInfo {
  distance: string;
  duration: string;
}

interface BookingFormProps {
  onSuccess?: (bookingId: string) => void;
}

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export function BookingForm({ onSuccess }: BookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState<number | undefined>();
  const [vehicleType, setVehicleType] = useState<VehicleType>("VOITURE");

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { type: "IMMEDIATE", pickupAddress: "", dropAddress: "" },
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

  // Calcul automatique de la distance quand les deux adresses sont remplies
  useEffect(() => {
    if (!pickupAddress || pickupAddress.length < 5) return;
    if (!dropAddress || dropAddress.length < 5) return;

    const timeout = setTimeout(async () => {
      setLoadingRoute(true);
      try {
        const params = new URLSearchParams({ origin: pickupAddress, destination: dropAddress });
        if (bookingType === "SCHEDULED" && scheduledDate && scheduledTime) {
          const ts = Math.floor(new Date(`${scheduledDate}T${scheduledTime}:00`).getTime() / 1000);
          if (ts > Date.now() / 1000) params.set("departure_time", String(ts));
        }
        const res = await fetch(`/api/maps/distance?${params.toString()}`);
        if (!res.ok) { setRouteInfo(null); return; }
        const data = (await res.json()) as RouteInfo;
        setRouteInfo(data);
      } catch {
        setRouteInfo(null);
      } finally {
        setLoadingRoute(false);
      }
    }, 800);

    return () => clearTimeout(timeout);
  }, [pickupAddress, dropAddress, bookingType, scheduledDate, scheduledTime]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      let scheduledAt: string | undefined;
      if (values.type === "SCHEDULED" && values.scheduledDate && values.scheduledTime) {
        scheduledAt = new Date(`${values.scheduledDate}T${values.scheduledTime}:00`).toISOString();
      }

      const payload: CreateBookingPayload = {
        clientName: values.clientName,
        clientPhone: values.clientPhone,
        clientEmail: values.clientEmail || undefined,
        pickupAddress: values.pickupAddress,
        dropAddress: values.dropAddress,
        type: values.type,
        scheduledAt,
        notes: values.notes || undefined,
        estimatedPrice,
        vehicleType,
      };

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Erreur inconnue");
      }

      const booking = (await response.json()) as { id: string };
      toastManager.add({ title: `Course #${booking.id.slice(-6)} créée` });
      reset();
      setRouteInfo(null);
      setEstimatedPrice(undefined);
      setVehicleType("VOITURE");
      onSuccess?.(booking.id);
    } catch (error) {
      toastManager.add({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <APIProvider apiKey={MAPS_API_KEY} libraries={["places"]}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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

        {/* Infos de trajet */}
        {(loadingRoute || routeInfo) && (
          <div className="flex items-center gap-4 rounded-md bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-800">
            {loadingRoute ? (
              <span className="text-zinc-400">Calcul de l'itinéraire…</span>
            ) : routeInfo ? (
              <>
                <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                  <span className="text-zinc-400">📍</span>
                  <span className="font-medium">{routeInfo.distance}</span>
                </span>
                <span className="text-zinc-300 dark:text-zinc-600">·</span>
                <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                  <span className="text-zinc-400">⏱</span>
                  <span className="font-medium">{routeInfo.duration}</span>
                </span>
              </>
            ) : null}
          </div>
        )}

        {/* Estimation du tarif */}
        <PriceEstimator
          onPriceChange={handlePriceChange}
          onVehicleTypeChange={(v) => setVehicleType(v === "van" ? "VAN" : "VOITURE")}
          bookingType={bookingType}
          scheduledAt={scheduledAtDate}
        />

        {/* Nom du client */}
        <Field>
          <FieldLabel>Nom du client</FieldLabel>
          <Input {...register("clientName")} placeholder="Jean Dupont" autoFocus />
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

        {/* Type de course */}
        <Field>
          <FieldLabel>Type de course</FieldLabel>
          <RadioGroup
            defaultValue="IMMEDIATE"
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

        {/* Date & heure — visible uniquement si SCHEDULED */}
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

        {/* Notes */}
        <Field>
          <FieldLabel>Notes (optionnel)</FieldLabel>
          <Textarea {...register("notes")} placeholder="Informations complémentaires..." size={3} />
        </Field>

        {Object.keys(errors).length > 0 && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 px-3 py-2 text-xs text-red-600 dark:text-red-400">
            {Object.entries(errors).map(([field, err]) => (
              <div key={field}><span className="font-medium">{field}</span> : {err?.message as string}</div>
            ))}
          </div>
        )}
        <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
          {isSubmitting ? "Envoi en cours…" : "Créer la réservation"}
        </Button>
      </form>
    </APIProvider>
  );
}
