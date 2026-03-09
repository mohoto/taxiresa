import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  bookingId: z.string(),
  collected: z.boolean(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const { bookingId, collected } = parsed.data;
    await prisma.booking.update({
      where: { id: bookingId },
      data: { commissionCollectedAt: collected ? new Date() : null },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[POST collect-commission]", e);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
