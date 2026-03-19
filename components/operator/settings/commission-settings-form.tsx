"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toastManager } from "@/components/ui/toast";

const PERIOD_OPTIONS = [
  { value: 1, label: "1 jour" },
  { value: 2, label: "2 jours" },
  { value: 3, label: "3 jours" },
  { value: 4, label: "4 jours" },
  { value: 5, label: "5 jours" },
  { value: 6, label: "6 jours" },
  { value: 7, label: "1 semaine" },
];

interface CommissionSettingsFormProps {
  initialCommissionPct: number;
  initialCommissionPeriodDays: number;
}

export function CommissionSettingsForm({ initialCommissionPct, initialCommissionPeriodDays }: CommissionSettingsFormProps) {
  const router = useRouter();
  const [raw, setRaw] = useState(String(initialCommissionPct));
  const [periodDays, setPeriodDays] = useState(initialCommissionPeriodDays);
  const [saving, setSaving] = useState(false);
  const commissionPct = parseFloat(raw) || 0;

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/fare", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionPct, commissionPeriodDays: periodDays }),
      });
      if (!res.ok) throw new Error();
      toastManager.add({ title: "Commission enregistrée" });
      router.refresh();
    } catch {
      toastManager.add({ title: "Erreur lors de l'enregistrement" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 max-w-sm">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Taux de commission (%)
        </label>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Pourcentage prélevé sur chaque course. Utilisé pour calculer la part opérateur.
        </p>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            className="w-32"
          />
          <span className="text-sm text-zinc-500 dark:text-zinc-400">%</span>
        </div>
        {commissionPct > 0 && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
            Exemple : sur une course de 20,00€ → commission de{" "}
            <span className="font-medium text-zinc-600 dark:text-zinc-300">
              {((20 * commissionPct) / 100).toFixed(2)}€
            </span>
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2 max-w-sm">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Période du calendrier "À récupérer"
        </label>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Durée affichée par défaut sur la page des commissions à récupérer.
        </p>
        <div className="flex flex-wrap gap-2">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPeriodDays(opt.value)}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                periodDays === opt.value
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex border-t border-zinc-200 dark:border-zinc-700 pt-6">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </div>
  );
}
