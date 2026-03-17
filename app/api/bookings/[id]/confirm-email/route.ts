import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    select: {
      id: true,
      clientName: true,
      clientEmail: true,
      pickupAddress: true,
      dropAddress: true,
      type: true,
      scheduledAt: true,
      vehicleType: true,
      estimatedPrice: true,
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
  }

  if (!booking.clientEmail) {
    return NextResponse.json({ error: "Pas d'email client" }, { status: 400 });
  }

  const ref = `#${id.slice(-8).toUpperCase()}`;
  const vehicleLabel = booking.vehicleType === "VAN" ? "Van (jusqu'à 8 passagers)" : "Voiture (jusqu'à 4 passagers)";
  const typeLabel =
    booking.type === "SCHEDULED" && booking.scheduledAt
      ? `Planifiée — ${new Date(booking.scheduledAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}`
      : "Immédiate";

  const priceLine =
    booking.estimatedPrice != null
      ? `<tr><td style="padding:6px 0;color:#6b7280;">Prix estimé</td><td style="padding:6px 0;font-weight:600;">${booking.estimatedPrice} €</td></tr>`
      : "";

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /><title>Confirmation de réservation</title></head>
<body style="font-family:sans-serif;background:#f9fafb;margin:0;padding:32px 16px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:40px;margin-bottom:8px;">✅</div>
      <h1 style="font-size:20px;font-weight:700;color:#111827;margin:0;">Réservation confirmée</h1>
      <p style="color:#6b7280;font-size:14px;margin-top:8px;">Votre course a bien été enregistrée.</p>
    </div>

    <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:20px;text-align:center;">
      <span style="color:#6b7280;font-size:13px;">Référence</span><br />
      <span style="font-family:monospace;font-size:20px;font-weight:700;color:#111827;">${ref}</span>
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:6px 0;color:#6b7280;">Départ</td><td style="padding:6px 0;font-weight:500;">${booking.pickupAddress}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Arrivée</td><td style="padding:6px 0;font-weight:500;">${booking.dropAddress}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Type</td><td style="padding:6px 0;">${typeLabel}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Véhicule</td><td style="padding:6px 0;">${vehicleLabel}</td></tr>
      ${priceLine}
      <tr><td style="padding:6px 0;color:#6b7280;">Paiement</td><td style="padding:6px 0;font-weight:500;">À bord du véhicule</td></tr>
    </table>

    <p style="margin-top:24px;font-size:13px;color:#6b7280;text-align:center;">
      Un chauffeur prendra en charge votre course dans les plus brefs délais.
    </p>
  </div>
</body>
</html>`;

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "no-reply@example.com",
      to: booking.clientEmail,
      subject: `Confirmation de réservation ${ref}`,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[confirm-email]", err);
    return NextResponse.json({ error: "Erreur envoi email" }, { status: 500 });
  }
}
