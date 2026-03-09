import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const fareSettingsSchema = z.object({
  priseEnCharge: z.number().positive().optional(),
  minimumCourse: z.number().positive().optional(),
  approcheImmediat: z.number().positive().optional(),
  approcheAvance: z.number().positive().optional(),
  supPassager: z.number().positive().optional(),
  tarifAKm: z.number().positive().optional(),
  tarifAHeure: z.number().positive().optional(),
  tarifBKm: z.number().positive().optional(),
  tarifBHeure: z.number().positive().optional(),
  tarifCKm: z.number().positive().optional(),
  tarifCHeure: z.number().positive().optional(),
  commissionPct: z.number().min(0).max(100).optional(),
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
