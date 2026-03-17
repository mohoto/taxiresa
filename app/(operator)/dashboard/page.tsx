import { prisma } from "@/lib/prisma";
import { DashboardView } from "@/components/operator/dashboard-view";

interface PageProps {
  searchParams: Promise<{ week?: string; month?: string; view?: "week" | "month" }>;
}

function toLocalKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getWeekBounds(week?: string): { start: Date; end: Date } {
  const today = new Date();
  let start: Date;
  if (week) {
    const [y, m, d] = week.split("-").map(Number);
    start = new Date(y, m - 1, d);
  } else {
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start = new Date(today);
    start.setDate(today.getDate() + diff);
  }
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
}

function getMonthBounds(month?: string): { start: Date; end: Date } {
  const today = new Date();
  let start: Date;
  if (month) {
    const [y, m] = month.split("-").map(Number);
    start = new Date(y, m - 1, 1);
  } else {
    start = new Date(today.getFullYear(), today.getMonth(), 1);
  }
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  return { start, end };
}

export interface DayStats {
  date: string; // ISO date yyyy-mm-dd
  completed: number;
  cancelled: number;
  noShow: number;
}

export interface PeriodStats {
  completed: number;
  cancelled: number;
  noShow: number;
  totalRevenue: number;
  totalCommission: number;
  webBookings: number;
  webRevenue: number;
  days: DayStats[];
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const view = params.view ?? "week";

  const { start, end } =
    view === "month"
      ? getMonthBounds(params.month)
      : getWeekBounds(params.week);

  const [bookings, webBookingsData, fareSettings] = await Promise.all([
    prisma.booking.findMany({
      where: {
        status: { in: ["COMPLETED", "CANCELLED", "NO_SHOW"] },
        updatedAt: { gte: start, lt: end },
      },
      select: { status: true, updatedAt: true, estimatedPrice: true },
      orderBy: { updatedAt: "asc" },
    }),
    prisma.booking.findMany({
      where: {
        createdAt: { gte: start, lt: end },
        notes: { contains: "Réservation site web" },
      },
      select: { estimatedPrice: true },
    }),
    prisma.fareSettings.findFirst(),
  ]);

  const commissionPct = fareSettings?.commissionPct ?? 0;

  // Aggregate by day
  const dayMap = new Map<string, DayStats>();
  for (const b of bookings) {
    const key = toLocalKey(b.updatedAt);
    const existing = dayMap.get(key) ?? { date: key, completed: 0, cancelled: 0, noShow: 0 };
    if (b.status === "COMPLETED") existing.completed += 1;
    else if (b.status === "CANCELLED") existing.cancelled += 1;
    else if (b.status === "NO_SHOW") existing.noShow += 1;
    dayMap.set(key, existing);
  }

  const completedBookings = bookings.filter((b: { status: string; estimatedPrice: number | null }) => b.status === "COMPLETED");
  const totalRevenue = completedBookings.reduce((sum: number, b: { estimatedPrice: number | null }) => sum + (b.estimatedPrice ?? 0), 0);
  const totalCommission = Math.round((totalRevenue * commissionPct) / 100);

  const stats: PeriodStats = {
    completed: completedBookings.length,
    cancelled: bookings.filter((b: { status: string }) => b.status === "CANCELLED").length,
    noShow: bookings.filter((b: { status: string }) => b.status === "NO_SHOW").length,
    totalRevenue: Math.round(totalRevenue),
    totalCommission,
    webBookings: webBookingsData.length,
    webRevenue: Math.round(webBookingsData.reduce((sum, b) => sum + (b.estimatedPrice ?? 0), 0)),
    days: Array.from(dayMap.values()),
  };

  return (
    <DashboardView
      stats={stats}
      periodStart={toLocalKey(start)}
      view={view}
      week={params.week}
      month={params.month}
      commissionPct={commissionPct}
    />
  );
}
