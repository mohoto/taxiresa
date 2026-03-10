import { prisma } from "@/lib/prisma";
import { getWeekStart, getWeeklyBookings, toLocalDateString } from "@/app/(operator)/commissions/page";
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
  searchParams: Promise<{ week?: string }>;
}

export default async function ARécupérerPage({ searchParams }: PageProps) {
  const { week } = await searchParams;
  const weekStart = getWeekStart(week);

  const weekStartKey = toLocalDateString(weekStart);
  const [settings, notifications] = await Promise.all([
    prisma.fareSettings.findFirst(),
    prisma.commissionNotification.findMany({ where: { weekStart: weekStartKey } }),
  ]);
  const commissionPct = settings?.commissionPct ?? 0;
  const bookings = await getWeeklyBookings(weekStart, commissionPct);
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
      weekStart={weekStartKey}
      commissionPct={commissionPct}
      notifiedTelegramIds={Array.from(notifiedTelegramIds)}
    />
  );
}
