import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  data: string;
  message?: { message_id: number; chat: { id: number } };
}

interface TelegramUpdate {
  update_id: number;
  callback_query?: TelegramCallbackQuery;
}

async function answerCallbackQuery(
  token: string,
  callbackQueryId: string,
  text: string
): Promise<void> {
  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}

async function editMessageReplyMarkup(
  token: string,
  chatId: string | number,
  messageId: number,
  keyboard: { text: string; callback_data: string }[][] = []
): Promise<void> {
  await fetch(`https://api.telegram.org/bot${token}/editMessageReplyMarkup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: keyboard },
    }),
  });
}


export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  try {
    const body = (await request.json()) as TelegramUpdate;

    if (!body.callback_query) {
      return NextResponse.json({ ok: true });
    }

    const { id: callbackQueryId, data, from, message } = body.callback_query;

    // Gestion ETA chauffeur
    if (data.startsWith("eta_")) {
      const parts = data.split("_"); // ["eta", "10", "bookingId"]
      const minutes = parseInt(parts[1], 10);
      const bookingId = parts.slice(2).join("_");

      // Sauvegarder l'ETA sur l'acceptance en DB
      await prisma.acceptance.updateMany({
        where: { bookingId },
        data: { etaMinutes: minutes, etaUpdatedAt: new Date() },
      });

      await answerCallbackQuery(
        token,
        callbackQueryId,
        `✅ Réponse enregistrée : ${minutes} min`
      );

      // Remplacer les boutons ETA par les actions restantes
      if (message?.message_id) {
        await editMessageReplyMarkup(token, message.chat.id, message.message_id, [
          [{ text: "🚫 Client absent", callback_data: `noshow_driver_${bookingId}` }],
          [{ text: "🚗 Prise en charge", callback_data: `start_driver_${bookingId}` }],
          [{ text: "✅ Course terminée", callback_data: `complete_driver_${bookingId}` }],
          [{ text: "❌ Annuler la course", callback_data: `cancel_driver_${bookingId}` }],
        ]);
      }

      return NextResponse.json({ ok: true });
    }

    // Client absent
    if (data.startsWith("noshow_driver_")) {
      const bookingId = data.replace("noshow_driver_", "");

      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

      if (!booking) {
        await answerCallbackQuery(token, callbackQueryId, "❌ Réservation introuvable.");
        return NextResponse.json({ ok: true });
      }

      if (booking.status !== "PENDING" && booking.status !== "ACCEPTED" && booking.status !== "IN_PROGRESS") {
        await answerCallbackQuery(token, callbackQueryId, "ℹ️ Action non disponible pour ce statut.");
        if (message?.message_id) {
          await editMessageReplyMarkup(token, message.chat.id, message.message_id);
        }
        return NextResponse.json({ ok: true });
      }

      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "NO_SHOW" },
      });

      await answerCallbackQuery(token, callbackQueryId, "🚫 Client absent enregistré.");

      if (message?.message_id) {
        await editMessageReplyMarkup(token, message.chat.id, message.message_id);
      }

      return NextResponse.json({ ok: true });
    }

    // Prise en charge par le chauffeur
    if (data.startsWith("start_driver_")) {
      const bookingId = data.replace("start_driver_", "");

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        await answerCallbackQuery(token, callbackQueryId, "❌ Réservation introuvable.");
        return NextResponse.json({ ok: true });
      }

      if (booking.status === "IN_PROGRESS") {
        await answerCallbackQuery(token, callbackQueryId, "ℹ️ Course déjà en cours.");
        if (message?.message_id) {
          await editMessageReplyMarkup(token, message.chat.id, message.message_id, [
            [{ text: "✅ Course terminée", callback_data: `complete_driver_${bookingId}` }],
          ]);
        }
        return NextResponse.json({ ok: true });
      }

      if (booking.status !== "ACCEPTED" && booking.status !== "PENDING") {
        await answerCallbackQuery(token, callbackQueryId, "ℹ️ Action non disponible pour ce statut.");
        if (message?.message_id) {
          await editMessageReplyMarkup(token, message.chat.id, message.message_id);
        }
        return NextResponse.json({ ok: true });
      }

      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "IN_PROGRESS" },
      });

      await answerCallbackQuery(token, callbackQueryId, "🚗 Course démarrée ! Bonne route.");

      if (message?.message_id) {
        await editMessageReplyMarkup(token, message.chat.id, message.message_id, [
          [{ text: "✅ Course terminée", callback_data: `complete_driver_${bookingId}` }],
        ]);
      }

      return NextResponse.json({ ok: true });
    }

    // Course terminée par le chauffeur
    if (data.startsWith("complete_driver_")) {
      const bookingId = data.replace("complete_driver_", "");

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        await answerCallbackQuery(token, callbackQueryId, "❌ Réservation introuvable.");
        return NextResponse.json({ ok: true });
      }

      if (booking.status === "COMPLETED") {
        await answerCallbackQuery(token, callbackQueryId, "ℹ️ Course déjà terminée.");
        if (message?.message_id) {
          await editMessageReplyMarkup(token, message.chat.id, message.message_id);
        }
        return NextResponse.json({ ok: true });
      }

      if (booking.status !== "IN_PROGRESS" && booking.status !== "ACCEPTED" && booking.status !== "PENDING") {
        await answerCallbackQuery(token, callbackQueryId, "ℹ️ Action non disponible pour ce statut.");
        if (message?.message_id) {
          await editMessageReplyMarkup(token, message.chat.id, message.message_id);
        }
        return NextResponse.json({ ok: true });
      }

      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "COMPLETED" },
      });

      await answerCallbackQuery(token, callbackQueryId, "✅ Course terminée. Merci !");

      if (message?.message_id) {
        await editMessageReplyMarkup(token, message.chat.id, message.message_id);
      }

      return NextResponse.json({ ok: true });
    }

    // Annulation par le chauffeur
    if (data.startsWith("cancel_driver_")) {
      const bookingId = data.replace("cancel_driver_", "");

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { acceptance: { include: { driver: true } } },
      });

      if (!booking) {
        await answerCallbackQuery(token, callbackQueryId, "❌ Réservation introuvable.");
        return NextResponse.json({ ok: true });
      }

      // Supprimer l'acceptance et remettre en PENDING
      await prisma.$transaction([
        prisma.acceptance.deleteMany({ where: { bookingId } }),
        prisma.booking.update({
          where: { id: bookingId },
          data: { status: "PENDING" },
        }),
      ]);

      await answerCallbackQuery(token, callbackQueryId, "Course annulée. Elle repassera en attente.");

      if (message?.message_id) {
        await editMessageReplyMarkup(token, message.chat.id, message.message_id);
      }

      return NextResponse.json({ ok: true });
    }

    if (!data.startsWith("accept_")) {
      return NextResponse.json({ ok: true });
    }

    const bookingId = data.replace("accept_", "");
    const telegramId = String(from.id);
    const driverName = [from.first_name, from.last_name].filter(Boolean).join(" ");

    // Vérifier que la réservation existe et est encore en attente
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { acceptance: true },
    });

    if (!booking) {
      await answerCallbackQuery(token, callbackQueryId, "❌ Réservation introuvable.");
      return NextResponse.json({ ok: true });
    }

    if (booking.status !== "PENDING") {
      await answerCallbackQuery(token, callbackQueryId, "⚠️ Cette course a déjà été prise en charge.");
      if (message?.message_id) {
        await editMessageReplyMarkup(token, message.chat?.id ?? chatId, message.message_id);
      }
      return NextResponse.json({ ok: true });
    }

    // Trouver ou créer le chauffeur par son telegramId
    const driver = await prisma.driver.upsert({
      where: { telegramId },
      update: { name: driverName },
      create: {
        telegramId,
        name: driverName,
        phone: "",
      },
    });

    // Créer l'acceptation et mettre à jour le statut en transaction
    await prisma.$transaction([
      prisma.acceptance.create({
        data: { bookingId, driverId: driver.id },
      }),
      prisma.booking.update({
        where: { id: bookingId },
        data: { status: "ACCEPTED" },
      }),
    ]);

    // Confirmer au chauffeur
    await answerCallbackQuery(
      token,
      callbackQueryId,
      "✅ Course acceptée ! Bonne route."
    );

    // Supprimer le bouton du message pour éviter les doubles acceptations
    if (message?.message_id) {
      await editMessageReplyMarkup(token, message.chat?.id ?? chatId, message.message_id);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhook]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
