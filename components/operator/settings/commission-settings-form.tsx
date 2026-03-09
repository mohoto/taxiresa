"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toastManager } from "@/components/ui/toast";

interface CommissionSettingsFormProps {
  initialCommissionPct: number;
}

export function CommissionSettingsForm({ initialCommissionPct }: CommissionSettingsFormProps) {
  const router = useRouter();
  const [raw, setRaw] = useState(String(initialCommissionPct));
  const [saving, setSaving] = useState(false);
  const commissionPct = parseFloat(raw) || 0;

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/fare", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionPct }),
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

      <div className="flex border-t border-zinc-200 dark:border-zinc-700 pt-6">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </div>
  );
}
