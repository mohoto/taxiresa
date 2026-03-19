import { prisma } from "@/lib/prisma";
import { getDayStart, getPeriodBookings, toLocalDateString } from "@/app/(operator)/commissions/page";
import { CommissionsRecupView } from "@/components/operator/commissions-recup-view";

export interface DriverCommission {
  driverName: string;
  driverPhone: string;
  driverTelegramId: string;
  bookingCount: number;
  totalPrice: number;
  totalCommission: number;
  bookings: {
    bookingId: string;
    completedAt: string;
    estimatedPrice: number;
    commission: number;
    clientName: string;
    pickupAddress: string;
    dropAddress: string;
    commissionCollectedAt: string | null;
  }[];
}

interface PageProps {
  searchParams: Promise<{ day?: string }>;
}

export default async function ARécupérerPage({ searchParams }: PageProps) {
  const { day } = await searchParams;
  const dayStart = getDayStart(day);

  const dayStartKey = toLocalDateString(dayStart);
  const [settings, notifications] = await Promise.all([
    prisma.fareSettings.findFirst(),
    prisma.commissionNotification.findMany({ where: { weekStart: dayStartKey } }),
  ]);
  const commissionPct = settings?.commissionPct ?? 0;
  const periodDays = settings?.commissionPeriodDays ?? 1;
  const bookings = await getPeriodBookings(dayStart, periodDays, commissionPct);
  const notifiedTelegramIds = new Set(notifications.map((n) => n.driverTelegramId));

  // Regrouper par chauffeur
  const byDriver = new Map<string, DriverCommission>();
  for (const b of bookings) {
    const existing = byDriver.get(b.driverName);
    const entry = {
      bookingId: b.id,
      completedAt: b.completedAt,
      estimatedPrice: b.estimatedPrice,
      commission: b.commission,
      clientName: b.clientName,
      pickupAddress: b.pickupAddress,
      dropAddress: b.dropAddress,
      commissionCollectedAt: b.commissionCollectedAt,
    };
    if (existing) {
      existing.bookingCount += 1;
      existing.totalPrice += b.estimatedPrice;
      existing.totalCommission += b.commission;
      existing.bookings.push(entry);
    } else {
      byDriver.set(b.driverName, {
        driverName: b.driverName,
        driverPhone: b.driverPhone,
        driverTelegramId: b.driverTelegramId,
        bookingCount: 1,
        totalPrice: b.estimatedPrice,
        totalCommission: b.commission,
        bookings: [entry],
      });
    }
  }

  const drivers = Array.from(byDriver.values()).sort(
    (a, b) => b.totalCommission - a.totalCommission
  );

  return (
    <CommissionsRecupView
      drivers={drivers}
      dayStart={dayStartKey}
      periodDays={periodDays}
      commissionPct={commissionPct}
      notifiedTelegramIds={Array.from(notifiedTelegramIds)}
    />
  );
}
