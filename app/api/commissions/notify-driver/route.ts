import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bookingSchema = z.object({
  bookingId: z.string(),
  completedAt: z.string(),
  estimatedPrice: z.number(),
  commission: z.number(),
  clientName: z.string(),
  pickupAddress: z.string(),
  dropAddress: z.string(),
});

const schema = z.object({
  driverTelegramId: z.string(),
  driverName: z.string(),
  weekStart: z.string(),
  weekEnd: z.string(),
  bookings: z.array(bookingSchema),
  totalPrice: z.number(),
  totalCommission: z.number(),
});

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatWeekRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} au ${e.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`;
}

function buildMessage(data: z.infer<typeof schema>): string {
  const weekRange = formatWeekRange(data.weekStart, data.weekEnd);

  const lines: string[] = [
    `📊 *Récapitulatif des courses — ${data.driverName}*`,
    `🗓 Semaine du ${weekRange}`,
    ``,
  ];

  for (const b of data.bookings) {
    lines.push(
      `📅 *${formatDate(b.completedAt)}* à ${formatTime(b.completedAt)}`,
      `📍 ${b.pickupAddress}`,
      `🏁 ${b.dropAddress}`,
      `💶 Course : ${b.estimatedPrice}€  |  Commission : ${b.commission}€`,
      ``
    );
  }

  lines.push(
    `━━━━━━━━━━━━━━━━━━`,
    `✅ Total courses : *${data.totalPrice}€*`,
    `💰 Total commission : *${data.totalCommission}€*`
  );

  return lines.join("\n");
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const data = parsed.data;
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "Bot token manquant" }, { status: 500 });
    }

    const message = buildMessage(data);

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: data.driverTelegramId,
        text: message,
        parse_mode: "Markdown",
      }),
    });

    const result = (await res.json()) as { ok: boolean; description?: string };
    if (!result.ok) {
      return NextResponse.json({ error: result.description ?? "Erreur Telegram" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/commissions/notify-driver]", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
