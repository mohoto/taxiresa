"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CompletedBooking } from "@/app/(operator)/commissions/page";

interface CommissionsViewProps {
  bookings: CompletedBooking[];
  weekStart: string;
  commissionPct: number;
}

function getDayName(date: Date): string {
  return date.toLocaleDateString("fr-FR", { weekday: "long" }).replace(/^\w/, (c) => c.toUpperCase());
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

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function parseDateLocal(yyyymmdd: string): Date {
  const [y, m, d] = yyyymmdd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function CommissionsView({ bookings, weekStart, commissionPct }: CommissionsViewProps) {
  const router = useRouter();
  const start = parseDateLocal(weekStart);

  // 7 jours de la semaine
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });

  function toLocalKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function navigate(offset: number) {
    const next = new Date(start);
    next.setDate(start.getDate() + offset * 7);
    router.push(`/commissions?week=${toLocalKey(next)}`);
  }

  const weekEnd = days[6];
  const totalPrice = bookings.reduce((s, b) => s + b.estimatedPrice, 0);
  const totalCommission = bookings.reduce((s, b) => s + b.commission, 0);

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

      {/* Totaux */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Courses terminées" value={String(bookings.length)} />
        <StatCard label="Total courses" value={`${totalPrice}€`} />
        {commissionPct > 0 ? (
          <StatCard
            label={`Commission (${commissionPct}%)`}
            value={`${totalCommission}€`}
            highlight
          />
        ) : (
          <StatCard label="Commission" value="—" />
        )}
      </div>

      {/* Calendrier par jour */}
      <div className="flex flex-col gap-3">
        {days.map((day, i) => {
          const dayBookings = bookings.filter((b) =>
            isSameDay(new Date(b.completedAt), day)
          );
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={i}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden"
            >
              {/* En-tête du jour */}
              <div
                className={[
                  "flex items-center justify-between px-4 py-2 border-b border-zinc-100 dark:border-zinc-800",
                  isToday ? "bg-zinc-50 dark:bg-zinc-800/60" : "",
                ].join(" ")}
              >
                <div className="flex items-center gap-2">
                  <span className={["text-sm font-semibold", isToday ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-600 dark:text-zinc-400"].join(" ")}>
                    {getDayName(day)}
                  </span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">{formatDate(day, true)}</span>
                  {isToday && (
                    <span className="text-xs rounded-full bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 px-1.5 py-0.5 font-medium">
                      Aujourd'hui
                    </span>
                  )}
                </div>
                {dayBookings.length > 0 && (
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {dayBookings.length} course{dayBookings.length > 1 ? "s" : ""}
                    {" · "}
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                      {dayBookings.reduce((s, b) => s + b.estimatedPrice, 0)}€
                    </span>
                    {commissionPct > 0 && (
                      <>
                        {" · commission "}
                        <span className="font-medium text-amber-600 dark:text-amber-400">
                          {dayBookings.reduce((s, b) => s + b.commission, 0)}€
                        </span>
                      </>
                    )}
                  </span>
                )}
              </div>

              {/* Réservations du jour */}
              {dayBookings.length === 0 ? (
                <div className="px-4 py-3 text-xs text-zinc-400 dark:text-zinc-600 italic">
                  Aucune course terminée
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {dayBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center gap-4 px-4 py-3 text-sm">
                      {/* Heure */}
                      <span className="w-12 shrink-0 text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                        {formatTime(booking.completedAt)}
                      </span>

                      {/* Chauffeur */}
                      <span className="w-32 shrink-0 font-medium text-zinc-800 dark:text-zinc-200 truncate">
                        {booking.driverName}
                      </span>

                      {/* Trajet */}
                      <span className="flex-1 text-xs text-zinc-500 dark:text-zinc-400 truncate">
                        {booking.pickupAddress} → {booking.dropAddress}
                      </span>

                      {/* Client */}
                      <span className="w-28 shrink-0 text-xs text-zinc-500 dark:text-zinc-400 truncate">
                        {booking.clientName}
                      </span>

                      {/* Prix */}
                      <span className="w-16 shrink-0 text-right font-semibold text-zinc-900 dark:text-zinc-50 tabular-nums">
                        {booking.estimatedPrice}€
                      </span>

                      {/* Commission */}
                      {commissionPct > 0 && (
                        <span className="w-20 shrink-0 text-right tabular-nums">
                          <span className="rounded bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                            {booking.commission}€
                          </span>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-lg border p-4",
        highlight
          ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
      ].join(" ")}
    >
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p
        className={[
          "mt-1 text-xl font-semibold tabular-nums",
          highlight ? "text-amber-700 dark:text-amber-300" : "text-zinc-900 dark:text-zinc-50",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}
