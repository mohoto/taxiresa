import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateBookingSchema = z.object({
  clientName: z.string().min(2).optional(),
  clientPhone: z.string().min(8).optional(),
  clientEmail: z.string().email().nullable().optional().or(z.literal("")),
  pickupAddress: z.string().min(5).optional(),
  dropAddress: z.string().min(5).optional(),
  type: z.enum(["IMMEDIATE", "SCHEDULED"]).optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(["PENDING", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
  estimatedPrice: z.number().nullable().optional(),
  distanceText: z.string().nullable().optional(),
  durationText: z.string().nullable().optional(),
});

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  try {
    await prisma.acceptance.deleteMany({ where: { bookingId: id } });
    await prisma.booking.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const body: unknown = await request.json();
    const parsed = updateBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;

    // Si on repasse en PENDING, on supprime l'acceptance existante
    if (data.status === "PENDING") {
      await prisma.acceptance.deleteMany({ where: { bookingId: id } });
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        ...data,
        clientEmail: data.clientEmail === "" ? null : data.clientEmail,
        scheduledAt: data.scheduledAt === null ? null
          : data.scheduledAt ? new Date(data.scheduledAt)
          : undefined,
      },
    });

    return NextResponse.json(booking);
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
