import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function formatBookingMessage(booking: {
  id: string;
  clientName: string;
  clientPhone: string;
  pickupAddress: string;
  dropAddress: string;
  type: string;
  vehicleType: string;
  scheduledAt: Date | null;
  notes: string | null;
  distanceText: string | null;
  durationText: string | null;
  estimatedPrice: number | null;
}, commissionPct: number): string {
  const type = booking.type === "IMMEDIATE" ? "🚕 Immédiate" : "📅 Planifiée";
  const vehicle = booking.vehicleType === "VAN" ? "🚐 *Van*" : "🚗 *Voiture*";
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
  const rawNotes = booking.notes
    ? booking.notes.replace(/\[Réservation site web\]\s*/g, "").replace(/^Réservation site web\s*/g, "").trim()
    : "";
  const notes = rawNotes ? `\n📝 *Notes :* ${rawNotes}` : "";

  return [
    `🚖 *Taxi Rapide* — Nouvelle réservation`,
    ``,
    `${type} · ${vehicle}${scheduled}`,
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
    ``,
    `🆔 \`${booking.id.slice(-8)}\``,
  ]
    .filter((l) => l !== undefined)
    .join("\n");
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  try {
    const [booking, fareSettings] = await Promise.all([
      prisma.booking.findUnique({ where: { id } }),
      prisma.fareSettings.findFirst(),
    ]);
    if (!booking) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }

    const isVan = booking.vehicleType === "VAN";
    const token = isVan
      ? (process.env.TELEGRAM_BOT_TOKEN_VAN ?? process.env.TELEGRAM_BOT_TOKEN)
      : process.env.TELEGRAM_BOT_TOKEN;
    const chatId = isVan
      ? (process.env.TELEGRAM_CHAT_ID_VAN ?? process.env.TELEGRAM_CHAT_ID)
      : process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return NextResponse.json(
        { error: "TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID manquant dans .env" },
        { status: 500 }
      );
    }

    const commissionPct = fareSettings?.commissionPct ?? 0;
    const text = formatBookingMessage(booking, commissionPct);

    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "✅ Accepter la course",
                  callback_data: `accept_${id}`,
                },
              ],
            ],
          },
        }),
      }
    );

    if (!res.ok) {
      const err = (await res.json()) as { description?: string };
      return NextResponse.json(
        { error: err.description ?? "Erreur Telegram" },
        { status: 502 }
      );
    }

    const result = (await res.json()) as { result: { message_id: number } };

    await prisma.booking.update({
      where: { id },
      data: { telegramMsgId: String(result.result.message_id) },
    });

    return NextResponse.json({ ok: true, messageId: result.result.message_id });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
