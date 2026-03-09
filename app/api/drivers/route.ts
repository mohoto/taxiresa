import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createDriverSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(8),
  telegramId: z.string().min(1),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const parsed = createDriverSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }
    const driver = await prisma.driver.create({ data: parsed.data });
    return NextResponse.json(driver, { status: 201 });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "Ce Telegram ID est déjà utilisé" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const drivers = await prisma.driver.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { acceptances: true } },
      },
    });
    return NextResponse.json(drivers);
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
