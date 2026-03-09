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
}

interface FareSettingsFormProps {
  initialSettings: FareSettings;
}

interface FieldConfig {
  key: keyof Omit<FareSettings, "id">;
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

const TARIF_FIELDS: { section: string; fields: FieldConfig[] }[] = [
  {
    section: "Tarif A — Journée semaine",
    fields: [
      { key: "tarifAKm",    label: "Prix au km (€)",   description: "Tarif kilométrique (10h–17h, lun–sam)" },
      { key: "tarifAHeure", label: "Prix à l'heure (€)", description: "Tarif horaire (10h–17h, lun–sam)" },
    ],
  },
  {
    section: "Tarif B — Soir / Zone suburbaine",
    fields: [
      { key: "tarifBKm",    label: "Prix au km (€)",   description: "Tarif kilométrique (soir ou zone suburbaine)" },
      { key: "tarifBHeure", label: "Prix à l'heure (€)", description: "Tarif horaire (soir ou zone suburbaine)" },
    ],
  },
  {
    section: "Tarif C — Nuit / Dimanche",
    fields: [
      { key: "tarifCKm",    label: "Prix au km (€)",   description: "Tarif kilométrique (nuit ou dimanche)" },
      { key: "tarifCHeure", label: "Prix à l'heure (€)", description: "Tarif horaire (nuit ou dimanche)" },
    ],
  },
];

type RawValues = Record<keyof Omit<FareSettings, "id">, string>;

export function FareSettingsForm({ initialSettings }: FareSettingsFormProps) {
  const router = useRouter();
  const [raw, setRaw] = useState<RawValues>({
    priseEnCharge:    String(initialSettings.priseEnCharge),
    minimumCourse:    String(initialSettings.minimumCourse),
    approcheImmediat: String(initialSettings.approcheImmediat),
    approcheAvance:   String(initialSettings.approcheAvance),
    supPassager:      String(initialSettings.supPassager),
    tarifAKm:         String(initialSettings.tarifAKm),
    tarifAHeure:      String(initialSettings.tarifAHeure),
    tarifBKm:         String(initialSettings.tarifBKm),
    tarifBHeure:      String(initialSettings.tarifBHeure),
    tarifCKm:         String(initialSettings.tarifCKm),
    tarifCHeure:      String(initialSettings.tarifCHeure),
  });
  const [saving, setSaving] = useState(false);

  function handleChange(key: keyof Omit<FareSettings, "id">, value: string) {
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

  return (
    <div className="flex flex-col gap-8">
      {/* Constantes fixes */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
          Constantes tarifaires
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FIELDS.map(({ key, label, description }) => (
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
      {TARIF_FIELDS.map(({ section, fields }) => (
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
