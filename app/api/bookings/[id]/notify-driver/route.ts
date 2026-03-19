import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function formatPrivateMessage(booking: {
  clientName: string;
  clientPhone: string;
  pickupAddress: string;
  dropAddress: string;
  type: string;
  scheduledAt: Date | null;
  notes: string | null;
  distanceText: string | null;
  durationText: string | null;
  estimatedPrice: number | null;
}, commissionPct: number): string {
  const type = booking.type === "IMMEDIATE" ? "🚕 Immédiate" : "📅 Planifiée";
  const scheduled = booking.scheduledAt
    ? `\n🕐 *Heure prévue :* ${new Date(booking.scheduledAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}`
    : "";
  const route = booking.distanceText && booking.durationText
    ? `\n📏 *Distance :* ${booking.distanceText} · ⏱ *Durée estimée :* ${booking.durationText}`
    : "";
  const price = booking.estimatedPrice != null
    ? `\n💰 *Tarif de la course :* ${booking.estimatedPrice.toFixed(2)}€`
    : "";
  const commission = booking.estimatedPrice != null && commissionPct > 0
    ? `\n🏷 *Commission :* ${Math.round((booking.estimatedPrice * commissionPct) / 100)}€`
    : "";
  const notes = booking.notes ? `\n📝 *Notes :* ${booking.notes}` : "";

  return [
    `🚖 *Taxi Rapide* — Rappel de course`,
    ``,
    `${type}${scheduled}`,
    ``,
    `📍 *Départ :* ${booking.pickupAddress}`,
    `🏁 *Arrivée :* ${booking.dropAddress}`,
    route,
    ``,
    `👤 *Client :* ${booking.clientName}`,
    `📞 *Tél :* ${booking.clientPhone}`,
    price,
    commission,
    notes,
  ]
    .filter((l) => l !== undefined)
    .join("\n");
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN manquant" }, { status: 500 });
  }

  try {
    const [booking, fareSettings] = await Promise.all([
      prisma.booking.findUnique({
        where: { id },
        include: {
          acceptance: { include: { driver: true } },
        },
      }),
      prisma.fareSettings.findFirst(),
    ]);

    if (!booking) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }

    if (!booking.acceptance?.driver) {
      return NextResponse.json({ error: "Aucun chauffeur assigné" }, { status: 400 });
    }

    const driver = booking.acceptance.driver;
    const commissionPct = fareSettings?.commissionPct ?? 0;
    const text = formatPrivateMessage(booking, commissionPct);
    const isImmediate = booking.type === "IMMEDIATE";

    const inline_keyboard = [
      ...(isImmediate ? [
        [
          { text: "5 min", callback_data: `eta_5_${id}` },
          { text: "10 min", callback_data: `eta_10_${id}` },
          { text: "15 min", callback_data: `eta_15_${id}` },
          { text: "20 min", callback_data: `eta_20_${id}` },
        ],
      ] : []),
      [{ text: "🚫 Client absent", callback_data: `noshow_driver_${id}` }],
      [{ text: "🚗 Prise en charge", callback_data: `start_driver_${id}` }],
      [{ text: "✅ Course terminée", callback_data: `complete_driver_${id}` }],
      [{ text: "❌ Annuler la course", callback_data: `cancel_driver_${id}` }],
    ];

    const fullText = isImmediate
      ? text + "\n\n⏱ *Dans combien de minutes arrivez-vous ?*"
      : text;

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: driver.telegramId,
        text: fullText,
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard },
      }),
    });

    if (!res.ok) {
      const err = (await res.json()) as { description?: string };
      return NextResponse.json(
        { error: err.description ?? "Erreur Telegram" },
        { status: 502 }
      );
    }

    await prisma.acceptance.update({
      where: { bookingId: id },
      data: { notifiedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[notify-driver]", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
