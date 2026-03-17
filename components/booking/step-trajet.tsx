"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect, useRef } from "react";
import { Car, Van, Zap, CalendarClock } from "lucide-react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { AddressAutocomplete } from "@/components/operator/address-autocomplete";
import { calculateFare, type FareConstants, type TarifLetter } from "@/lib/fare-calculator";

function detectZone(pickup: string, drop: string): "intramuros" | "suburbaine" {
  const isParisAddress = (addr: string) =>
    /\b75\d{3}\b/.test(addr) || /\bParis\b/i.test(addr);
  return isParisAddress(pickup) && isParisAddress(drop) ? "intramuros" : "suburbaine";
}

function getTarif(date: Date, zone: "intramuros" | "suburbaine"): TarifLetter {
  const h = date.getHours();
  const jour = date.getDay(); // 0 = dimanche, 6 = samedi
  const isNight = h < 7 || h >= 22;
  const isWeekend = jour === 0 || jour === 6;

  if (zone === "suburbaine") {
    if (isNight || isWeekend) return "C";        // Nuit ou week-end → C
    if (h >= 19) return "B";                     // Soir (19h–22h) → B
    return "B";                                  // Journée suburbaine → B
  }

  // Intramuros
  if (jour === 0 || isNight) return "C";         // Dimanche ou nuit → C
  if (h >= 19) return "B";                       // Soir (19h–22h) → B
  return "A";                                    // Journée (7h–19h) lun–sam → A
}
import type { TrajetData } from "@/components/booking/booking-wizard";

interface FullFareSettings extends FareConstants {
  vanPriseEnCharge: number;
  vanMinimumCourse: number;
  vanApprocheImmediat: number;
  vanApprocheAvance: number;
  vanSupPassager: number;
  vanTarifAKm: number;
  vanTarifAHeure: number;
  vanTarifBKm: number;
  vanTarifBHeure: number;
  vanTarifCKm: number;
  vanTarifCHeure: number;
}

function extractVanConstants(s: FullFareSettings): FareConstants {
  return {
    priseEnCharge:    s.vanPriseEnCharge,
    minimumCourse:    s.vanMinimumCourse,
    approcheImmediat: s.vanApprocheImmediat,
    approcheAvance:   s.vanApprocheAvance,
    supPassager:      s.vanSupPassager,
    tarifAKm:         s.vanTarifAKm,
    tarifAHeure:      s.vanTarifAHeure,
    tarifBKm:         s.vanTarifBKm,
    tarifBHeure:      s.vanTarifBHeure,
    tarifCKm:         s.vanTarifCKm,
    tarifCHeure:      s.vanTarifCHeure,
  };
}

const schema = z
  .object({
    pickupAddress: z.string().min(5, "Adresse trop courte"),
    dropAddress: z.string().min(5, "Adresse trop courte"),
    type: z.enum(["IMMEDIATE", "SCHEDULED"]),
    scheduledDate: z.string().optional(),
    scheduledTime: z.string().optional(),
    vehicleType: z.enum(["VOITURE", "VAN"]),
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

type FormValues = z.infer<typeof schema>;

interface StepTrajetProps {
  onNext: (data: TrajetData) => void;
}

export function StepTrajet({ onNext }: StepTrajetProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: "IMMEDIATE", vehicleType: "VOITURE" },
  });

  const watchedValues = watch();
  const type = watchedValues.type;
  const vehicleType = watchedValues.vehicleType;
  const pickupAddress = watchedValues.pickupAddress ?? "";
  const dropAddress = watchedValues.dropAddress ?? "";
  const scheduledDate = watchedValues.scheduledDate;
  const scheduledTime = watchedValues.scheduledTime;

  // Price estimation state
  const [routeData, setRouteData] = useState<{ distanceKm: number; dureeMin: number; zone: "intramuros" | "suburbaine" } | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [fareSettings, setFareSettings] = useState<FullFareSettings | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const routesLib = useMapsLibrary("routes");

  // Fetch fare settings once
  useEffect(() => {
    fetch("/api/settings/fare")
      .then((r) => r.json())
      .then((data: FullFareSettings) => setFareSettings(data))
      .catch(() => null);
  }, []);

  // Fetch distance from Google Maps when addresses change
  useEffect(() => {
    if (!routesLib || pickupAddress.length < 5 || dropAddress.length < 5) {
      setRouteData(null);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPriceLoading(true);
      const service = new routesLib.DistanceMatrixService();
      service.getDistanceMatrix(
        {
          origins: [pickupAddress],
          destinations: [dropAddress],
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (response, status) => {
          setPriceLoading(false);
          if (status !== "OK" || !response) return;
          const element = response.rows[0]?.elements[0];
          if (!element || element.status !== "OK") return;
          setRouteData({
            distanceKm: element.distance.value / 1000,
            dureeMin: element.duration.value / 60,
            zone: detectZone(pickupAddress, dropAddress),
          });
        }
      );
    }, 600);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routesLib, pickupAddress, dropAddress]);

  // Recalculate price whenever route data, vehicle, type or schedule changes
  const priceInfo = (() => {
    if (!routeData) return null;
    const bookingDate =
      type === "SCHEDULED" && scheduledDate && scheduledTime
        ? new Date(`${scheduledDate}T${scheduledTime}`)
        : new Date();
    const tarif = getTarif(bookingDate, routeData.zone);
    const settings = vehicleType === "VAN" && fareSettings
      ? extractVanConstants(fareSettings)
      : fareSettings ?? undefined;
    const fare = calculateFare({
      distanceKm: routeData.distanceKm,
      dureeMin: routeData.dureeMin,
      tarif,
      reservation: type === "SCHEDULED" ? "avance" : "immediat",
      passagers: 1,
      settings,
    });
    return { total: fare.total, zone: routeData.zone, tarif };
  })();

  const estimatedPrice = priceInfo?.total ?? null;

  function onSubmit(values: FormValues) {
    onNext({
      ...values,
      estimatedPrice: priceInfo?.total ?? undefined,
    } as TrajetData);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">

      {/* Adresses */}
      <Field>
        <FieldLabel htmlFor="pickupAddress">Adresse de départ</FieldLabel>
        <AddressAutocomplete
          id="pickupAddress"
          value={pickupAddress}
          onChange={(v) => setValue("pickupAddress", v, { shouldValidate: true })}
          placeholder="10 rue de la Paix, Paris"
          className="py-1.5 text-base"
        />
        {errors.pickupAddress && <FieldError>{errors.pickupAddress.message}</FieldError>}
      </Field>

      <Field>
        <FieldLabel htmlFor="dropAddress">Adresse d&apos;arrivée</FieldLabel>
        <AddressAutocomplete
          id="dropAddress"
          value={dropAddress}
          onChange={(v) => setValue("dropAddress", v, { shouldValidate: true })}
          placeholder="Aéroport CDG, Terminal 2"
          className="py-1.5 text-base"
        />
        {errors.dropAddress && <FieldError>{errors.dropAddress.message}</FieldError>}
      </Field>

      {/* Type de course */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Type de course</span>
        <div className="grid grid-cols-2 gap-3">
          {([
            { value: "IMMEDIATE", icon: <Zap size={15} />, label: "Immédiate", desc: "Dans les plus brefs délais" },
            { value: "SCHEDULED", icon: <CalendarClock size={15} />, label: "Planifiée", desc: "À une date et heure précises" },
          ] as const).map(({ value, icon, label, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => setValue("type", value)}
              className={[
                "rounded-lg border-2 p-3 text-left transition-all",
                type === value
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                  : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600",
              ].join(" ")}
            >
              <div className="font-medium text-sm flex items-center gap-1.5">{icon}{label}</div>
              <div className={["text-xs mt-0.5", type === value ? "opacity-70" : "text-zinc-500 dark:text-zinc-400"].join(" ")}>
                {desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Date/heure si planifiée */}
      {type === "SCHEDULED" && (
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="scheduledDate">Date</FieldLabel>
            <input
              id="scheduledDate"
              type="date"
              min={new Date().toISOString().split("T")[0]}
              {...register("scheduledDate")}
              className="w-full rounded-md border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
            />
            {errors.scheduledDate && <FieldError>{errors.scheduledDate.message}</FieldError>}
          </Field>
          <Field>
            <FieldLabel htmlFor="scheduledTime">Heure</FieldLabel>
            <input
              id="scheduledTime"
              type="time"
              {...register("scheduledTime")}
              className="w-full rounded-md border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
            />
            {errors.scheduledTime && <FieldError>{errors.scheduledTime.message}</FieldError>}
          </Field>
        </div>
      )}

      {/* Véhicule */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Véhicule</span>
        <div className="grid grid-cols-2 gap-3">
          {([
            { value: "VOITURE", icon: <Car size={16} />, label: "Voiture", desc: "Jusqu'à 4 passagers" },
            { value: "VAN", icon: <Van size={16} />, label: "Van", desc: "Jusqu'à 7 passagers" },
          ] as const).map(({ value, icon, label, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => setValue("vehicleType", value)}
              className={[
                "rounded-lg border-2 p-3 text-left transition-all",
                vehicleType === value
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                  : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600",
              ].join(" ")}
            >
              <div className="font-medium text-sm flex items-center gap-1.5">{icon}{label}</div>
              <div className={["text-xs mt-0.5", vehicleType === value ? "opacity-70" : "text-zinc-500 dark:text-zinc-400"].join(" ")}>
                {desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Estimation de prix */}
      {(priceLoading || priceInfo !== null) && (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Prix estimé</span>
            {priceInfo && (
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                {priceInfo.zone === "intramuros" ? "Intra-muros" : "Zone suburbaine"} · Tarif {priceInfo.tarif}
              </span>
            )}
          </div>
          {priceLoading ? (
            <span className="text-sm text-zinc-400 dark:text-zinc-500">Calcul en cours…</span>
          ) : (
            <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {estimatedPrice}€
            </span>
          )}
        </div>
      )}

      <Button type="submit" className="w-full mt-2 py-6 text-base">
        Continuer →
      </Button>
    </form>
  );
}
