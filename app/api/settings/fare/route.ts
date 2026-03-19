import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const fareSettingsSchema = z.object({
  priseEnCharge: z.number().min(0).optional(),
  minimumCourse: z.number().min(0).optional(),
  approcheImmediat: z.number().min(0).optional(),
  approcheAvance: z.number().min(0).optional(),
  supPassager: z.number().min(0).optional(),
  tarifAKm: z.number().min(0).optional(),
  tarifAHeure: z.number().min(0).optional(),
  tarifBKm: z.number().min(0).optional(),
  tarifBHeure: z.number().min(0).optional(),
  tarifCKm: z.number().min(0).optional(),
  tarifCHeure: z.number().min(0).optional(),
  vanPriseEnCharge: z.number().min(0).optional(),
  vanMinimumCourse: z.number().min(0).optional(),
  vanApprocheImmediat: z.number().min(0).optional(),
  vanApprocheAvance: z.number().min(0).optional(),
  vanSupPassager: z.number().min(0).optional(),
  vanTarifAKm: z.number().min(0).optional(),
  vanTarifAHeure: z.number().min(0).optional(),
  vanTarifBKm: z.number().min(0).optional(),
  vanTarifBHeure: z.number().min(0).optional(),
  vanTarifCKm: z.number().min(0).optional(),
  vanTarifCHeure: z.number().min(0).optional(),
  commissionPct: z.number().min(0).max(100).optional(),
  commissionPeriodDays: z.number().int().min(1).max(7).optional(),
});

async function getOrCreateSettings() {
  const existing = await prisma.fareSettings.findFirst();
  if (existing) return existing;
  return prisma.fareSettings.create({ data: {} });
}

export async function GET(): Promise<NextResponse> {
  try {
    const settings = await getOrCreateSettings();
    return NextResponse.json(settings);
  } catch (e) {
    console.error("[GET /api/settings/fare]", e);
    return NextResponse.json({ error: "Erreur interne", detail: String(e) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const parsed = fareSettingsSchema.safeParse(body);
    if (!parsed.success) {
      console.error("[PUT /api/settings/fare] Validation error", parsed.error.flatten());
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.fareSettings.findFirst();
    let settings;
    if (existing) {
      settings = await prisma.fareSettings.update({
        where: { id: existing.id },
        data: parsed.data,
      });
    } else {
      settings = await prisma.fareSettings.create({ data: parsed.data });
    }

    return NextResponse.json(settings);
  } catch (e) {
    console.error("[PUT /api/settings/fare]", e);
    return NextResponse.json({ error: "Erreur interne", detail: String(e) }, { status: 500 });
  }
}
