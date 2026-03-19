import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  const { ban } = (await request.json()) as { ban: boolean };

  try {
    const driver = await prisma.driver.findUnique({ where: { id } });
    if (!driver) {
      return NextResponse.json({ error: "Chauffeur introuvable" }, { status: 404 });
    }

    const isVan = driver.vehicleType === "VAN";
    const token = isVan
      ? (process.env.TELEGRAM_BOT_TOKEN_VAN ?? process.env.TELEGRAM_BOT_TOKEN)
      : process.env.TELEGRAM_BOT_TOKEN;
    const chatId = isVan
      ? (process.env.TELEGRAM_CHAT_ID_VAN ?? process.env.TELEGRAM_CHAT_ID)
      : process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID manquant" }, { status: 500 });
    }

    const endpoint = ban ? "banChatMember" : "unbanChatMember";
    const body: Record<string, unknown> = {
      chat_id: chatId,
      user_id: driver.telegramId,
    };
    if (!ban) {
      body.only_if_banned = true;
    }

    const res = await fetch(`https://api.telegram.org/bot${token}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const result = (await res.json()) as { ok: boolean; description?: string };
    if (!result.ok) {
      return NextResponse.json({ error: result.description ?? "Erreur Telegram" }, { status: 502 });
    }

    await prisma.driver.update({
      where: { id },
      data: { isBanned: ban },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
