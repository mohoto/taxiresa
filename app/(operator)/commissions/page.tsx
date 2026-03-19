import { prisma } from "@/lib/prisma";
import { CommissionsView } from "@/components/operator/commissions-view";

export interface CompletedBooking {
  id: string;
  clientName: string;
  pickupAddress: string;
  dropAddress: string;
  estimatedPrice: number;
  commission: number;
  completedAt: string;
  driverName: string;
  driverPhone: string;
  driverTelegramId: string;
  commissionCollectedAt: string | null;
}

// Formate une date locale en yyyy-mm-dd sans conversion UTC
export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getWeekStart(week?: string): Date {
  let weekStart: Date;
  if (week) {
    const [y, m, d] = week.split("-").map(Number);
    weekStart = new Date(y, m - 1, d);
  } else {
    const today = new Date();
    // getDay() : 0=dim, 1=lun … 6=sam → ramener au lundi précédent
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    weekStart = new Date(today);
    weekStart.setDate(today.getDate() + diff);
  }
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

export async function getWeeklyBookings(weekStart: Date, commissionPct: number): Promise<CompletedBooking[]> {
  // weekStart est en heure locale (ex: lundi 00:00 Paris = dimanche 23:00 UTC).
  // On filtre en JS après récupération pour être sûr de comparer en heure locale.
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  // Élargir légèrement la fenêtre Prisma (±1 jour) pour capturer les fuseaux
  const fetchFrom = new Date(weekStart);
  fetchFrom.setDate(fetchFrom.getDate() - 1);
  const fetchTo = new Date(weekEnd);
  fetchTo.setDate(fetchTo.getDate() + 1);

  const bookings = await prisma.booking.findMany({
    where: {
      status: "COMPLETED",
      updatedAt: { gte: fetchFrom, lt: fetchTo },
    },
    include: {
      acceptance: { include: { driver: true } },
    },
    orderBy: { updatedAt: "asc" },
  });

  type BookingRow = typeof bookings[number];
  return bookings
    .filter((b: BookingRow) => b.estimatedPrice != null && b.updatedAt >= weekStart && b.updatedAt < weekEnd)
    .map((b: BookingRow) => ({
      id: b.id,
      clientName: b.clientName,
      pickupAddress: b.pickupAddress,
      dropAddress: b.dropAddress,
      estimatedPrice: Math.round(b.estimatedPrice!),
      commission: Math.round((b.estimatedPrice! * commissionPct) / 100),
      completedAt: b.updatedAt.toISOString(),
      driverName: b.acceptance?.driver.name ?? "—",
      driverPhone: b.acceptance?.driver.phone ?? "",
      driverTelegramId: b.acceptance?.driver.telegramId ?? "",
      commissionCollectedAt: b.commissionCollectedAt?.toISOString() ?? null,
    }));
}

export function getDayStart(day?: string): Date {
  let date: Date;
  if (day) {
    const [y, m, d] = day.split("-").map(Number);
    date = new Date(y, m - 1, d);
  } else {
    date = new Date();
  }
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function getDailyBookings(dayStart: Date, commissionPct: number): Promise<CompletedBooking[]> {
  return getPeriodBookings(dayStart, 1, commissionPct);
}

export async function getPeriodBookings(periodStart: Date, periodDays: number, commissionPct: number): Promise<CompletedBooking[]> {
  const periodEnd = new Date(periodStart);
  periodEnd.setDate(periodStart.getDate() + periodDays);

  const fetchFrom = new Date(periodStart);
  fetchFrom.setDate(fetchFrom.getDate() - 1);
  const fetchTo = new Date(periodEnd);
  fetchTo.setDate(fetchTo.getDate() + 1);

  const bookings = await prisma.booking.findMany({
    where: {
      status: "COMPLETED",
      updatedAt: { gte: fetchFrom, lt: fetchTo },
    },
    include: {
      acceptance: { include: { driver: true } },
    },
    orderBy: { updatedAt: "asc" },
  });

  type BookingRow = typeof bookings[number];
  return bookings
    .filter((b: BookingRow) => b.estimatedPrice != null && b.updatedAt >= periodStart && b.updatedAt < periodEnd)
    .map((b: BookingRow) => ({
      id: b.id,
      clientName: b.clientName,
      pickupAddress: b.pickupAddress,
      dropAddress: b.dropAddress,
      estimatedPrice: Math.round(b.estimatedPrice!),
      commission: Math.round((b.estimatedPrice! * commissionPct) / 100),
      completedAt: b.updatedAt.toISOString(),
      driverName: b.acceptance?.driver.name ?? "—",
      driverPhone: b.acceptance?.driver.phone ?? "",
      driverTelegramId: b.acceptance?.driver.telegramId ?? "",
      commissionCollectedAt: b.commissionCollectedAt?.toISOString() ?? null,
    }));
}

interface PageProps {
  searchParams: Promise<{ week?: string }>;
}

export default async function CommissionsPage({ searchParams }: PageProps) {
  const { week } = await searchParams;
  const weekStart = getWeekStart(week);

  const settings = await prisma.fareSettings.findFirst();
  const commissionPct = settings?.commissionPct ?? 0;
  const bookings = await getWeeklyBookings(weekStart, commissionPct);

  return (
    <CommissionsView
      bookings={bookings}
      weekStart={toLocalDateString(weekStart)}
      commissionPct={commissionPct}
    />
  );
}
