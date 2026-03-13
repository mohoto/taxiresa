"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toastManager } from "@/components/ui/toast";

interface FareSettings {
  id: string;
  priseEnCharge: number;
  minimumCourse: number;
  approcheImmediat: number;
  approcheAvance: number;
  supPassager: number;
  tarifAKm: number;
  tarifAHeure: number;
  tarifBKm: number;
  tarifBHeure: number;
  tarifCKm: number;
  tarifCHeure: number;
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

type VehicleTab = "voiture" | "van";
type SettingsKey = keyof Omit<FareSettings, "id">;

interface FareSettingsFormProps {
  initialSettings: FareSettings;
}

interface FieldConfig {
  key: SettingsKey;
  label: string;
  description: string;
}

const FIELDS: FieldConfig[] = [
  { key: "priseEnCharge",    label: "Prise en charge (€)",       description: "Montant fixe au démarrage du compteur" },
  { key: "minimumCourse",    label: "Minimum de course (€)",     description: "Prix minimum facturé quelle que soit la course" },
  { key: "approcheImmediat", label: "Approche immédiate (€)",    description: "Supplément pour une réservation immédiate" },
  { key: "approcheAvance",   label: "Approche à l'avance (€)",   description: "Supplément pour une réservation planifiée" },
  { key: "supPassager",      label: "Supplément passager (€)",   description: "Supplément par passager au-delà de 4" },
];

const VAN_FIELDS: FieldConfig[] = [
  { key: "vanPriseEnCharge",    label: "Prise en charge (€)",       description: "Montant fixe au démarrage du compteur" },
  { key: "vanMinimumCourse",    label: "Minimum de course (€)",     description: "Prix minimum facturé quelle que soit la course" },
  { key: "vanApprocheImmediat", label: "Approche immédiate (€)",    description: "Supplément pour une réservation immédiate" },
  { key: "vanApprocheAvance",   label: "Approche à l'avance (€)",   description: "Supplément pour une réservation planifiée" },
  { key: "vanSupPassager",      label: "Supplément passager (€)",   description: "Supplément par passager au-delà de 4" },
];

const TARIF_FIELDS: { section: string; fields: FieldConfig[] }[] = [
  {
    section: "Tarif A — Journée semaine",
    fields: [
      { key: "tarifAKm",    label: "Prix au km (€)",     description: "Tarif kilométrique (10h–17h, lun–sam)" },
      { key: "tarifAHeure", label: "Prix à l'heure (€)", description: "Tarif horaire (10h–17h, lun–sam)" },
    ],
  },
  {
    section: "Tarif B — Soir / Zone suburbaine",
    fields: [
      { key: "tarifBKm",    label: "Prix au km (€)",     description: "Tarif kilométrique (soir ou zone suburbaine)" },
      { key: "tarifBHeure", label: "Prix à l'heure (€)", description: "Tarif horaire (soir ou zone suburbaine)" },
    ],
  },
  {
    section: "Tarif C — Nuit / Dimanche",
    fields: [
      { key: "tarifCKm",    label: "Prix au km (€)",     description: "Tarif kilométrique (nuit ou dimanche)" },
      { key: "tarifCHeure", label: "Prix à l'heure (€)", description: "Tarif horaire (nuit ou dimanche)" },
    ],
  },
];

const VAN_TARIF_FIELDS: { section: string; fields: FieldConfig[] }[] = [
  {
    section: "Tarif A — Journée semaine",
    fields: [
      { key: "vanTarifAKm",    label: "Prix au km (€)",     description: "Tarif kilométrique (10h–17h, lun–sam)" },
      { key: "vanTarifAHeure", label: "Prix à l'heure (€)", description: "Tarif horaire (10h–17h, lun–sam)" },
    ],
  },
  {
    section: "Tarif B — Soir / Zone suburbaine",
    fields: [
      { key: "vanTarifBKm",    label: "Prix au km (€)",     description: "Tarif kilométrique (soir ou zone suburbaine)" },
      { key: "vanTarifBHeure", label: "Prix à l'heure (€)", description: "Tarif horaire (soir ou zone suburbaine)" },
    ],
  },
  {
    section: "Tarif C — Nuit / Dimanche",
    fields: [
      { key: "vanTarifCKm",    label: "Prix au km (€)",     description: "Tarif kilométrique (nuit ou dimanche)" },
      { key: "vanTarifCHeure", label: "Prix à l'heure (€)", description: "Tarif horaire (nuit ou dimanche)" },
    ],
  },
];

type RawValues = Record<SettingsKey, string>;

export function FareSettingsForm({ initialSettings }: FareSettingsFormProps) {
  const router = useRouter();
  const [tab, setTab] = useState<VehicleTab>("voiture");
  const [raw, setRaw] = useState<RawValues>({
    priseEnCharge:       String(initialSettings.priseEnCharge),
    minimumCourse:       String(initialSettings.minimumCourse),
    approcheImmediat:    String(initialSettings.approcheImmediat),
    approcheAvance:      String(initialSettings.approcheAvance),
    supPassager:         String(initialSettings.supPassager),
    tarifAKm:            String(initialSettings.tarifAKm),
    tarifAHeure:         String(initialSettings.tarifAHeure),
    tarifBKm:            String(initialSettings.tarifBKm),
    tarifBHeure:         String(initialSettings.tarifBHeure),
    tarifCKm:            String(initialSettings.tarifCKm),
    tarifCHeure:         String(initialSettings.tarifCHeure),
    vanPriseEnCharge:    String(initialSettings.vanPriseEnCharge),
    vanMinimumCourse:    String(initialSettings.vanMinimumCourse),
    vanApprocheImmediat: String(initialSettings.vanApprocheImmediat),
    vanApprocheAvance:   String(initialSettings.vanApprocheAvance),
    vanSupPassager:      String(initialSettings.vanSupPassager),
    vanTarifAKm:         String(initialSettings.vanTarifAKm),
    vanTarifAHeure:      String(initialSettings.vanTarifAHeure),
    vanTarifBKm:         String(initialSettings.vanTarifBKm),
    vanTarifBHeure:      String(initialSettings.vanTarifBHeure),
    vanTarifCKm:         String(initialSettings.vanTarifCKm),
    vanTarifCHeure:      String(initialSettings.vanTarifCHeure),
  });
  const [saving, setSaving] = useState(false);

  function handleChange(key: SettingsKey, value: string) {
    setRaw((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    const parsed = Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k, parseFloat(v) || 0])
    );
    try {
      const res = await fetch("/api/settings/fare", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      if (!res.ok) throw new Error();
      toastManager.add({ title: "Paramètres enregistrés" });
      router.refresh();
    } catch {
      toastManager.add({ title: "Erreur lors de l'enregistrement" });
    } finally {
      setSaving(false);
    }
  }

  const fixedFields = tab === "voiture" ? FIELDS : VAN_FIELDS;
  const tarifFields = tab === "voiture" ? TARIF_FIELDS : VAN_TARIF_FIELDS;

  return (
    <div className="flex flex-col gap-8">
      {/* Onglets véhicule */}
      <div className="flex rounded-md border border-zinc-200 dark:border-zinc-600 overflow-hidden w-fit">
        {(["voiture", "van"] as VehicleTab[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setTab(v)}
            className={[
              "px-5 py-2 text-sm font-medium transition-colors",
              tab === v
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                : "bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800",
            ].join(" ")}
          >
            {v === "voiture" ? "🚗 Voiture" : "🚐 Van"}
          </button>
        ))}
      </div>

      {/* Constantes fixes */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
          Constantes tarifaires
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fixedFields.map(({ key, label, description }) => (
            <SettingField
              key={key}
              label={label}
              description={description}
              value={raw[key]}
              onChange={(v) => handleChange(key, v)}
            />
          ))}
        </div>
      </section>

      {/* Tarifs A / B / C */}
      {tarifFields.map(({ section, fields }) => (
        <section key={section} className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
            {section}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map(({ key, label, description }) => (
              <SettingField
                key={key}
                label={label}
                description={description}
                value={raw[key]}
                onChange={(v) => handleChange(key, v)}
              />
            ))}
          </div>
        </section>
      ))}

      <div className="flex justify-end border-t border-zinc-200 dark:border-zinc-700 pt-6">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer les paramètres"}
        </Button>
      </div>
    </div>
  );
}

function SettingField({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</label>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
      <Input
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-36"
      />
    </div>
  );
}
