"use client";

import { useState, useEffect, useCallback } from "react";
import {
  detectTarif,
  calculateFare,
  type TarifLetter,
  type TarifZone,
  type FareBreakdown,
  type FareConstants,
} from "@/lib/fare-calculator";

interface PriceEstimatorProps {
  onPriceChange: (price: number | undefined) => void;
  bookingType: "IMMEDIATE" | "SCHEDULED";
  scheduledAt?: Date;
  initialDistanceKm?: number;
  initialDureeMin?: number;
}

const ZONE_LABELS: Record<TarifZone, string> = {
  intramuros: "Intra-muros (Paris)",
  suburbaine: "Zone suburbaine",
};

const TARIF_LABELS: Record<TarifLetter, string> = {
  A: "Tarif A — Journée semaine",
  B: "Tarif B — Soir / Zone suburbaine",
  C: "Tarif C — Nuit / Dimanche",
};

export function PriceEstimator({
  onPriceChange,
  bookingType,
  scheduledAt,
  initialDistanceKm = 0,
  initialDureeMin = 0,
}: PriceEstimatorProps) {
  const [distanceKm, setDistanceKm] = useState(initialDistanceKm);
  const [dureeMin, setDureeMin] = useState(initialDureeMin);
  const [zone, setZone] = useState<TarifZone>("intramuros");
  const [passagers, setPassagers] = useState(1);
  const [peage, setPeage] = useState(0);
  const [overrideTarif, setOverrideTarif] = useState<TarifLetter | null>("A");
  const [autoTarif, setAutoTarif] = useState<TarifLetter>("A");
  const [fare, setFare] = useState<FareBreakdown | null>(null);
  const [fareConstants, setFareConstants] = useState<FareConstants | undefined>(undefined);

  // Fetch dynamic fare settings once on mount
  useEffect(() => {
    fetch("/api/settings/fare")
      .then((r) => r.json())
      .then((data: FareConstants) => setFareConstants(data))
      .catch(() => { /* use defaults */ });
  }, []);

  // Detect tarif based on booking type and time
  useEffect(() => {
    const date =
      bookingType === "SCHEDULED" && scheduledAt
        ? scheduledAt
        : new Date();
    const detected = detectTarif(
      date.getHours(),
      date.getMinutes(),
      date.getDay(),
      zone
    );
    setAutoTarif(detected);
  }, [bookingType, scheduledAt, zone]);

  const activeTarif = overrideTarif ?? autoTarif;

  // Recalculate fare whenever inputs change
  useEffect(() => {
    if (distanceKm === 0 && dureeMin === 0) {
      setFare(null);
      return;
    }
    const result = calculateFare({
      distanceKm,
      dureeMin,
      tarif: activeTarif,
      reservation: bookingType === "SCHEDULED" ? "avance" : "immediat",
      passagers,
      peage,
      settings: fareConstants,
    });
    setFare(result);
  }, [distanceKm, dureeMin, activeTarif, bookingType, passagers, peage, fareConstants]);

  // Notify parent of price changes
  useEffect(() => {
    onPriceChange(fare?.total);
  }, [fare, onPriceChange]);

  const handleOverrideTarif = useCallback((t: TarifLetter) => {
    setOverrideTarif((prev) => (prev === t ? null : t));
  }, []);

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Estimation du tarif
        </span>
        {fare && (
          <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {fare.total}€
          </span>
        )}
      </div>

      {/* Tarif auto-detected */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">Tarif :</span>
        {(["A", "B", "C"] as TarifLetter[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => handleOverrideTarif(t)}
            className={[
              "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium border transition-colors",
              activeTarif === t
                ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-50 dark:text-zinc-900 dark:border-zinc-50"
                : "bg-white text-zinc-600 border-zinc-300 hover:border-zinc-400 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-600",
            ].join(" ")}
          >
            {t}
            {autoTarif === t && overrideTarif === null && (
              <span className="text-[10px] opacity-70">AUTO</span>
            )}
          </button>
        ))}
        <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-1">
          {TARIF_LABELS[activeTarif]}
        </span>
      </div>

      {/* Zone */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-zinc-500 dark:text-zinc-400">Zone</label>
        <select
          title="Zone tarifaire"
          value={zone}
          onChange={(e) => {
            setZone(e.target.value as TarifZone);
            setOverrideTarif(null);
          }}
          className="rounded-md border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
        >
          {(Object.entries(ZONE_LABELS) as [TarifZone, string][]).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Distance */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="text-xs text-zinc-500 dark:text-zinc-400">Distance</label>
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            {distanceKm} km
          </span>
        </div>
        <input
          type="range"
          title="Distance en km"
          min={0}
          max={100}
          step={0.5}
          value={distanceKm}
          onChange={(e) => setDistanceKm(Number(e.target.value))}
          className="w-full accent-zinc-900 dark:accent-zinc-100"
        />
      </div>

      {/* Durée */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="text-xs text-zinc-500 dark:text-zinc-400">Durée estimée</label>
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            {dureeMin} min
          </span>
        </div>
        <input
          type="range"
          title="Durée estimée en minutes"
          min={0}
          max={180}
          step={1}
          value={dureeMin}
          onChange={(e) => setDureeMin(Number(e.target.value))}
          className="w-full accent-zinc-900 dark:accent-zinc-100"
        />
      </div>

      {/* Passagers */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="text-xs text-zinc-500 dark:text-zinc-400">Passagers</label>
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            {passagers}
          </span>
        </div>
        <input
          type="range"
          title="Nombre de passagers"
          min={1}
          max={8}
          step={1}
          value={passagers}
          onChange={(e) => setPassagers(Number(e.target.value))}
          className="w-full accent-zinc-900 dark:accent-zinc-100"
        />
      </div>

      {/* Péage */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-zinc-500 dark:text-zinc-400">Péage (€)</label>
        <input
          type="number"
          min={0}
          step={0.5}
          value={peage === 0 ? "" : peage}
          onChange={(e) => setPeage(e.target.value === "" ? 0 : Number(e.target.value))}
          placeholder="0.00"
          className="rounded-md border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500 w-32"
        />
      </div>

      {/* Breakdown */}
      {fare && (
        <div className="border-t border-zinc-200 dark:border-zinc-700 pt-3 flex flex-col gap-1">
          <FareRow label="Prise en charge" value={fare.prise_en_charge} />
          <FareRow label="Approche" value={fare.approche} />
          <FareRow label="Compteur" value={fare.compteur} />
          {fare.supPassagers > 0 && (
            <FareRow label="Supplément passagers" value={fare.supPassagers} />
          )}
          {fare.peage > 0 && <FareRow label="Péage" value={fare.peage} />}
          <div className="mt-1 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-700 pt-1">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Total</span>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {fare.total}€
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function FareRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="text-xs text-zinc-700 dark:text-zinc-300">{value.toFixed(2)}€</span>
    </div>
  );
}
