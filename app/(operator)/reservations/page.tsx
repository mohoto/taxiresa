import { prisma } from "@/lib/prisma";
import { AgendaView } from "@/components/operator/agenda-view";
import type { BookingWithRelations } from "@/types/booking";

async function getCommissionPct(): Promise<number> {
  const settings = await prisma.fareSettings.findFirst();
  return settings?.commissionPct ?? 0;
}

async function getAllBookings(): Promise<BookingWithRelations[]> {
  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      operator: true,
      acceptance: {
        include: { driver: true },
      },
    },
  });

  type BookingRow = typeof bookings[number];
  return bookings.map((b: BookingRow) => ({
    ...b,
    scheduledAt: b.scheduledAt?.toISOString() ?? null,
    createdAt: b.createdAt.toISOString(),
    estimatedPrice: b.estimatedPrice ?? null,
    acceptance: b.acceptance
      ? {
          driver: {
            name: b.acceptance.driver.name,
            phone: b.acceptance.driver.phone,
          },
          acceptedAt: b.acceptance.acceptedAt.toISOString(),
          etaMinutes: b.acceptance.etaMinutes,
          etaUpdatedAt: b.acceptance.etaUpdatedAt?.toISOString() ?? null,
          notifiedAt: b.acceptance.notifiedAt?.toISOString() ?? null,
        }
      : null,
    invoiceSentAt: b.invoiceSentAt?.toISOString() ?? null,
  }));
}

export default async function ReservationsPage() {
  const [bookings, commissionPct] = await Promise.all([getAllBookings(), getCommissionPct()]);

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Réservations
        </h1>
      </div>
      <AgendaView bookings={bookings} commissionPct={commissionPct} />
    </div>
  );
}
