"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Check } from "lucide-react";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import type { DriverCommission } from "@/app/(operator)/commissions/a-recuperer/page";

interface CommissionsRecupViewProps {
  drivers: DriverCommission[];
  weekStart: string;
  commissionPct: number;
}

function formatDate(date: Date, showYear = false): string {
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    ...(showYear ? { year: "numeric" } : {}),
  });
}

function formatWeekRange(start: Date, end: Date): string {
  const sameYear = start.getFullYear() === end.getFullYear();
  if (sameYear) {
    return `${formatDate(start)} — ${formatDate(end, true)}`;
  }
  return `${formatDate(start, true)} — ${formatDate(end, true)}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function parseDateLocal(yyyymmdd: string): Date {
  const [y, m, d] = yyyymmdd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function CommissionsRecupView({ drivers, weekStart, commissionPct }: CommissionsRecupViewProps) {
  const router = useRouter();
  const start = parseDateLocal(weekStart);
  const weekEnd = new Date(start);
  weekEnd.setDate(start.getDate() + 6);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  // bookingId → collected state (optimistic)
  const [collected, setCollected] = useState<Map<string, boolean>>(() => {
    const m = new Map<string, boolean>();
    for (const d of drivers) {
      for (const b of d.bookings) {
        m.set(b.bookingId, b.commissionCollectedAt !== null);
      }
    }
    return m;
  });

  function toggle(name: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  const handleCollect = useCallback(async (bookingId: string) => {
    const current = collected.get(bookingId) ?? false;
    // Optimistic update
    setCollected((prev) => new Map(prev).set(bookingId, !current));
    try {
      await fetch("/api/bookings/collect-commission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, collected: !current }),
      });
    } catch {
      // Revert on error
      setCollected((prev) => new Map(prev).set(bookingId, current));
    }
  }, [collected]);

  function toLocalKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function navigate(offset: number) {
    const next = new Date(start);
    next.setDate(start.getDate() + offset * 7);
    router.push(`/commissions/a-recuperer?week=${toLocalKey(next)}`);
  }

  const grandTotal = drivers.reduce((s, d) => s + d.totalCommission, 0);
  const totalCollected = drivers.reduce(
    (s, d) => s + d.bookings.reduce((bs, b) => bs + (collected.get(b.bookingId) ? b.commission : 0), 0),
    0
  );
  const totalPending = grandTotal - totalCollected;

  return (
    <div className="flex flex-col gap-6">
      {/* Navigation semaine */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 min-w-52 text-center">
          {formatWeekRange(start, weekEnd)}
        </span>
        <Button variant="outline" size="sm" onClick={() => navigate(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Résumé global */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Chauffeurs actifs" value={String(drivers.length)} />
        <StatCard label="Total commissions" value={grandTotal > 0 ? `${grandTotal}€` : "—"} />
        <StatCard
          label={`Récupéré${commissionPct > 0 ? ` (${commissionPct}%)` : ""}`}
          value={totalCollected > 0 ? `${totalCollected}€` : "—"}
          variant="green"
        />
        <StatCard
          label="Restant à récupérer"
          value={totalPending > 0 ? `${totalPending}€` : "—"}
          variant={totalPending > 0 ? "amber" : "default"}
        />
      </div>

      {/* Par chauffeur */}
      {drivers.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 py-16 text-center text-sm text-zinc-400">
          Aucune course terminée cette semaine
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {drivers.map((driver) => {
            const isExpanded = expanded.has(driver.driverName);
            return (
              <div
                key={driver.driverName}
                className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden"
              >
                {/* En-tête chauffeur */}
                <button
                  type="button"
                  onClick={() => toggle(driver.driverName)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                      {driver.driverName}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {driver.bookingCount} course{driver.bookingCount > 1 ? "s" : ""}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      Total : <span className="font-medium text-zinc-700 dark:text-zinc-300">{driver.totalPrice}€</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-md bg-amber-50 dark:bg-amber-900/20 px-3 py-1 text-sm font-bold text-amber-700 dark:text-amber-300 tabular-nums">
                      {driver.totalCommission}€ à récupérer
                    </span>
                    {isExpanded
                      ? <ChevronUp className="h-4 w-4 text-zinc-400" />
                      : <ChevronDown className="h-4 w-4 text-zinc-400" />
                    }
                  </div>
                </button>

                {/* Détail des courses */}
                {isExpanded && (
                  <div className="border-t border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
                    {driver.bookings.map((b, i) => {
                      const isCollected = collected.get(b.bookingId) ?? false;
                      return (
                        <div key={i} className="flex items-center gap-4 px-4 py-2.5 text-sm">
                          <span className="w-12 shrink-0 text-xs tabular-nums text-zinc-400">
                            {formatTime(b.completedAt)}
                          </span>
                          <span className="flex-1 text-zinc-600 dark:text-zinc-400 truncate">
                            {b.clientName}
                          </span>
                          <span className="tabular-nums text-zinc-700 dark:text-zinc-300 font-medium">
                            {b.estimatedPrice}€
                          </span>
                          <span className="tabular-nums">
                            <span className="rounded bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                              {b.commission}€
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCollect(b.bookingId)}
                            className={[
                              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium border transition-colors",
                              isCollected
                                ? "bg-green-500 border-green-500 text-white dark:bg-green-600 dark:border-green-600"
                                : "bg-white border-zinc-300 text-zinc-600 hover:border-zinc-400 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-300 dark:hover:border-zinc-500",
                            ].join(" ")}
                          >
                            {isCollected && <Check className="h-3 w-3" />}
                            {isCollected ? "Récupéré" : "Récupérer"}
                          </button>
                        </div>
                      );
                    })}
                    {/* Sous-total */}
                    <div className="flex items-center justify-end gap-4 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/40">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">Sous-total</span>
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 tabular-nums">
                        {driver.totalPrice}€
                      </span>
                      <span className="text-sm font-bold text-amber-700 dark:text-amber-300 tabular-nums">
                        {driver.totalCommission}€
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const VARIANT_CLASSES = {
  default: { card: "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900", text: "text-zinc-900 dark:text-zinc-50" },
  amber:   { card: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-300" },
  green:   { card: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20", text: "text-green-700 dark:text-green-300" },
};

function StatCard({ label, value, variant = "default" }: { label: string; value: string; variant?: keyof typeof VARIANT_CLASSES }) {
  const cls = VARIANT_CLASSES[variant];
  return (
    <div className={`rounded-lg border p-4 ${cls.card}`}>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${cls.text}`}>
        {value}
      </p>
    </div>
  );
}
