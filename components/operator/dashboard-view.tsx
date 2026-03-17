"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, UserX, Euro, TrendingUp, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PeriodStats, DayStats } from "@/app/(operator)/dashboard/page";

interface DashboardViewProps {
  stats: PeriodStats;
  periodStart: string;
  view: "week" | "month";
  week?: string;
  month?: string;
  commissionPct?: number;
}

const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTH_LABELS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

function formatWeekLabel(start: Date): string {
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  return `${fmt(start)} — ${fmt(end)}`;
}

function formatMonthLabel(start: Date): string {
  return `${MONTH_LABELS[start.getMonth()]} ${start.getFullYear()}`;
}

function parseDateLocal(yyyymmdd: string): Date {
  const [y, m, d] = yyyymmdd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toLocalKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function DashboardView({ stats, periodStart, view, week, month, commissionPct = 0 }: DashboardViewProps) {
  const router = useRouter();
  const start = parseDateLocal(periodStart);

  function navigate(offset: number) {
    if (view === "week") {
      const next = new Date(start);
      next.setDate(start.getDate() + offset * 7);
      router.push(`/dashboard?view=week&week=${toLocalKey(next)}`);
    } else {
      const next = new Date(start.getFullYear(), start.getMonth() + offset, 1);
      const key = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
      router.push(`/dashboard?view=month&month=${key}`);
    }
  }

  function switchView(v: "week" | "month") {
    if (v === "week") {
      router.push(week ? `/dashboard?view=week&week=${week}` : "/dashboard?view=week");
    } else {
      router.push(month ? `/dashboard?view=month&month=${month}` : "/dashboard?view=month");
    }
  }

  const dayStatsMap = new Map<string, DayStats>(stats.days.map((d) => [d.date, d]));

  return (
    <div className="flex flex-col gap-6 p-8">
      {/* View toggle */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Dashboard</h1>
        <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <button
            type="button"
            onClick={() => switchView("week")}
            className={[
              "px-4 py-2 text-sm font-medium transition-colors",
              view === "week"
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                : "bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800",
            ].join(" ")}
          >
            Semaine
          </button>
          <button
            type="button"
            onClick={() => switchView("month")}
            className={[
              "px-4 py-2 text-sm font-medium transition-colors border-l border-zinc-200 dark:border-zinc-800",
              view === "month"
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                : "bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800",
            ].join(" ")}
          >
            Mois
          </button>
        </div>
      </div>

      {/* Period navigation */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 min-w-64 text-center">
          {view === "week" ? formatWeekLabel(start) : formatMonthLabel(start)}
        </span>
        <Button variant="outline" size="sm" onClick={() => navigate(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* StatCards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Courses terminées"
          value={stats.completed}
          icon={<CheckCircle className="h-5 w-5 text-green-500" />}
          variant="green"
        />
        <StatCard
          label="Courses annulées"
          value={stats.cancelled}
          icon={<XCircle className="h-5 w-5 text-red-500" />}
          variant="red"
        />
        <StatCard
          label="Client absent"
          value={stats.noShow}
          icon={<UserX className="h-5 w-5 text-amber-500" />}
          variant="amber"
        />
        <StatCard
          label="Réservations site web"
          value={stats.webBookings}
          icon={<Globe className="h-5 w-5 text-sky-500" />}
          variant="blue"
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Chiffre d'affaires"
          value={stats.totalRevenue}
          suffix="€"
          icon={<Euro className="h-5 w-5 text-blue-500" />}
          variant="blue"
        />
        <StatCard
          label="CA site web"
          value={stats.webRevenue}
          suffix="€"
          icon={<Globe className="h-5 w-5 text-sky-500" />}
          variant="blue"
        />
        {commissionPct > 0 && (
          <StatCard
            label={`Commissions (${commissionPct}%)`}
            value={stats.totalCommission}
            suffix="€"
            icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
            variant="purple"
          />
        )}
      </div>

      {/* Calendar grid */}
      {view === "week" ? (
        <WeekGrid start={start} dayStatsMap={dayStatsMap} />
      ) : (
        <MonthGrid start={start} dayStatsMap={dayStatsMap} />
      )}
    </div>
  );
}

// ── Week grid ──────────────────────────────────────────────────────────────

function WeekGrid({ start, dayStatsMap }: { start: Date; dayStatsMap: Map<string, DayStats> }) {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }

  return (
    <div className="grid grid-cols-7 gap-2">
      {DAY_LABELS.map((label) => (
        <div key={label} className="text-center text-xs font-medium text-zinc-400 pb-1">
          {label}
        </div>
      ))}
      {days.map((day) => {
        const key = toLocalKey(day);
        const s = dayStatsMap.get(key);
        const isToday = toLocalKey(new Date()) === key;
        return (
          <DayCell key={key} day={day} stats={s} isToday={isToday} />
        );
      })}
    </div>
  );
}

// ── Month grid ─────────────────────────────────────────────────────────────

function MonthGrid({ start, dayStatsMap }: { start: Date; dayStatsMap: Map<string, DayStats> }) {
  const year = start.getFullYear();
  const month = start.getMonth();
  const firstDay = new Date(year, month, 1);
  // Monday-first: 0=Mon…6=Sun
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = startOffset + daysInMonth;
  const rows = Math.ceil(totalCells / 7);

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length < rows * 7) cells.push(null);

  return (
    <div className="grid grid-cols-7 gap-2">
      {DAY_LABELS.map((label) => (
        <div key={label} className="text-center text-xs font-medium text-zinc-400 pb-1">
          {label}
        </div>
      ))}
      {cells.map((day, i) => {
        if (!day) return <div key={`empty-${i}`} />;
        const key = toLocalKey(day);
        const s = dayStatsMap.get(key);
        const isToday = toLocalKey(new Date()) === key;
        return <DayCell key={key} day={day} stats={s} isToday={isToday} />;
      })}
    </div>
  );
}

// ── Day cell ───────────────────────────────────────────────────────────────

function DayCell({ day, stats, isToday }: { day: Date; stats?: DayStats; isToday: boolean }) {
  const hasActivity = stats && (stats.completed + stats.cancelled + stats.noShow) > 0;
  return (
    <div
      className={[
        "rounded-lg border p-2 min-h-20 flex flex-col gap-1",
        isToday
          ? "border-zinc-900 dark:border-zinc-50 bg-zinc-50 dark:bg-zinc-800/60"
          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900",
      ].join(" ")}
    >
      <span
        className={[
          "text-xs font-semibold",
          isToday ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-500 dark:text-zinc-400",
        ].join(" ")}
      >
        {day.getDate()}
      </span>
      {hasActivity && (
        <div className="flex flex-col gap-0.5 mt-auto">
          {stats!.completed > 0 && (
            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium tabular-nums">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
              {stats!.completed}
            </span>
          )}
          {stats!.cancelled > 0 && (
            <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium tabular-nums">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
              {stats!.cancelled}
            </span>
          )}
          {stats!.noShow > 0 && (
            <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium tabular-nums">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
              {stats!.noShow}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── StatCard ───────────────────────────────────────────────────────────────

const STAT_VARIANTS = {
  green:  { card: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20",   text: "text-green-700 dark:text-green-300"   },
  red:    { card: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20",           text: "text-red-700 dark:text-red-300"       },
  amber:  { card: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20",   text: "text-amber-700 dark:text-amber-300"   },
  blue:   { card: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20",       text: "text-blue-700 dark:text-blue-300"     },
  purple: { card: "border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20", text: "text-purple-700 dark:text-purple-300" },
};

function StatCard({
  label,
  value,
  suffix,
  icon,
  variant,
}: {
  label: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
  variant: keyof typeof STAT_VARIANTS;
}) {
  const cls = STAT_VARIANTS[variant];
  return (
    <div className={`rounded-lg border p-4 ${cls.card}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      </div>
      <p className={`text-2xl font-semibold tabular-nums ${cls.text}`}>{value}{suffix}</p>
    </div>
  );
}
