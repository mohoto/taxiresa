import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN manquant" }, { status: 500 });
  }

  const { url: webhookUrl } = (await request.json()) as { url?: string };
  if (!webhookUrl) {
    return NextResponse.json({ error: "url requis" }, { status: 400 });
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: webhookUrl }),
  });

  const data = (await res.json()) as { ok: boolean; description?: string };
  return NextResponse.json(data);
}

export async function GET(): Promise<NextResponse> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN manquant" }, { status: 500 });
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
  const data = (await res.json()) as unknown;
  return NextResponse.json(data);
}
