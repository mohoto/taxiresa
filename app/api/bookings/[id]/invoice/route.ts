import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import PDFDocument from "pdfkit";

const resend = new Resend(process.env.RESEND_API_KEY);

function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function generateInvoicePdf(booking: {
  id: string;
  clientName: string;
  clientPhone: string;
  pickupAddress: string;
  dropAddress: string;
  estimatedPrice: number | null;
  distanceText: string | null;
  durationText: string | null;
  createdAt: Date;
  acceptance: { driver: { name: string } } | null;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const invoiceNumber = booking.id.slice(-8).toUpperCase();
    const price = booking.estimatedPrice ?? 0;
    const dateStr = formatDate(booking.createdAt);
    const timeStr = formatTime(booking.createdAt);

    // ── En-tête ──────────────────────────────────────────────────
    doc.fontSize(22).font("Helvetica-Bold").text("TaxiRapide", 50, 50);
    doc.fontSize(10).font("Helvetica").fillColor("#71717a").text("Service de taxi", 50, 78);

    doc.fontSize(18).font("Helvetica-Bold").fillColor("#18181b")
      .text(`Facture #${invoiceNumber}`, 350, 50, { align: "right" });
    doc.fontSize(10).font("Helvetica").fillColor("#71717a")
      .text(dateStr, 350, 78, { align: "right" });

    doc.moveTo(50, 100).lineTo(545, 100).strokeColor("#e4e4e7").stroke();

    // ── Client ───────────────────────────────────────────────────
    doc.moveDown(1.5);
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#71717a")
      .text("CLIENT", 50, doc.y);
    doc.fontSize(13).font("Helvetica-Bold").fillColor("#18181b")
      .text(booking.clientName, 50, doc.y + 4);
    doc.fontSize(10).font("Helvetica").fillColor("#71717a")
      .text(booking.clientPhone, 50, doc.y + 2);

    // ── Détails de la course ─────────────────────────────────────
    const sectionY = doc.y + 20;
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#71717a")
      .text("DÉTAILS DE LA COURSE", 50, sectionY);

    const rowY = sectionY + 16;
    doc.moveTo(50, rowY).lineTo(545, rowY).strokeColor("#e4e4e7").stroke();

    doc.fontSize(10).font("Helvetica").fillColor("#18181b");
    doc.text("Date", 50, rowY + 8).text(dateStr, 200, rowY + 8);
    doc.text("Heure", 50, rowY + 24).text(timeStr, 200, rowY + 24);
    doc.text("Départ", 50, rowY + 40).text(booking.pickupAddress, 200, rowY + 40, { width: 345 });

    const dropY = rowY + 40 + (booking.pickupAddress.length > 60 ? 28 : 16);
    doc.text("Arrivée", 50, dropY).text(booking.dropAddress, 200, dropY, { width: 345 });

    let currentY = dropY + (booking.dropAddress.length > 60 ? 28 : 16);

    if (booking.acceptance?.driver) {
      doc.text("Chauffeur", 50, currentY).text(booking.acceptance.driver.name, 200, currentY);
      currentY += 16;
    }

    // ── Tarif ────────────────────────────────────────────────────
    const TVA_RATE = 0.10;
    const priceHT = price / (1 + TVA_RATE);
    const priceTVA = price - priceHT;

    currentY += 20;
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#71717a")
      .text("TARIF", 50, currentY);

    const tableY = currentY + 16;
    doc.moveTo(50, tableY).lineTo(545, tableY).strokeColor("#e4e4e7").stroke();

    doc.fontSize(10).font("Helvetica").fillColor("#18181b")
      .text("Course taxi (HT)", 50, tableY + 8)
      .text(`${priceHT.toFixed(2)} €`, 50, tableY + 8, { align: "right", width: 495 });

    doc.fontSize(10).font("Helvetica").fillColor("#71717a")
      .text("TVA (10%)", 50, tableY + 24)
      .text(`${priceTVA.toFixed(2)} €`, 50, tableY + 24, { align: "right", width: 495 });

    doc.moveTo(50, tableY + 44).lineTo(545, tableY + 44).strokeColor("#e4e4e7").stroke();

    doc.fontSize(12).font("Helvetica-Bold").fillColor("#18181b")
      .text("Total TTC", 50, tableY + 52)
      .text(`${price.toFixed(2)} €`, 50, tableY + 52, { align: "right", width: 495 });

    // ── Footer ───────────────────────────────────────────────────
    doc.fontSize(9).font("Helvetica").fillColor("#a1a1aa")
      .text("Merci de votre confiance · TaxiRapide", 50, 760, { align: "center", width: 495 });

    doc.end();
  });
}

function generateIntroHtml(booking: {
  clientName: string;
  pickupAddress: string;
  dropAddress: string;
  createdAt: Date;
  estimatedPrice: number | null;
}, invoiceNumber: string): string {
  const price = booking.estimatedPrice ?? 0;
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; color: #18181b; background: #fff; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; padding: 32px; }
    .brand { font-size: 20px; font-weight: 700; margin-bottom: 24px; }
    p { font-size: 15px; line-height: 1.6; color: #3f3f46; margin: 0 0 16px; }
    .highlight { background: #f4f4f5; border-radius: 8px; padding: 16px 20px; margin: 24px 0; }
    .highlight p { margin: 4px 0; font-size: 14px; }
    .footer { margin-top: 40px; font-size: 12px; color: #a1a1aa; }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand">🚖 TaxiRapide</div>
    <p>Bonjour <strong>${booking.clientName}</strong>,</p>
    <p>
      Nous vous remercions d'avoir fait confiance à TaxiRapide pour votre trajet
      du <strong>${formatDate(booking.createdAt)}</strong>.
    </p>
    <p>
      Veuillez trouver ci-joint votre facture <strong>#${invoiceNumber}</strong>
      correspondant à votre course :
    </p>
    <div class="highlight">
      <p>📍 <strong>Départ :</strong> ${booking.pickupAddress}</p>
      <p>🏁 <strong>Arrivée :</strong> ${booking.dropAddress}</p>
      <p>💰 <strong>Montant :</strong> ${price.toFixed(2)} €</p>
    </div>
    <p>
      Pour toute question concernant cette facture, n'hésitez pas à nous contacter.
    </p>
    <p>Cordialement,<br /><strong>L'équipe TaxiRapide</strong></p>
    <div class="footer">Ce message a été envoyé automatiquement, merci de ne pas y répondre directement.</div>
  </div>
</body>
</html>`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let email: string;
  try {
    const body = await request.json() as { email?: string };
    if (!body.email || typeof body.email !== "string") {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }
    email = body.email;
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { acceptance: { include: { driver: true } } },
  });

  if (!booking) {
    return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
  }

  if (booking.status !== "COMPLETED") {
    return NextResponse.json({ error: "La réservation n'est pas terminée" }, { status: 400 });
  }

  const invoiceNumber = id.slice(-8).toUpperCase();

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await generateInvoicePdf(booking);
  } catch {
    return NextResponse.json({ error: "Erreur lors de la génération du PDF" }, { status: 500 });
  }

  const html = generateIntroHtml(booking, invoiceNumber);

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "factures@taxiops.fr",
    to: email,
    subject: `Votre facture TaxiRapide #${invoiceNumber}`,
    html,
    attachments: [
      {
        filename: `facture-taxiops-${invoiceNumber}.pdf`,
        content: pdfBuffer,
      },
    ],
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await prisma.booking.update({
    where: { id },
    data: { clientEmail: email, invoiceSentAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
