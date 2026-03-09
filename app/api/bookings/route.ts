import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createBookingSchema = z.object({
  clientName: z.string().min(2),
  clientPhone: z.string().min(8),
  clientEmail: z.string().email().optional().or(z.literal("")),
  pickupAddress: z.string().min(5),
  dropAddress: z.string().min(5),
  type: z.enum(["IMMEDIATE", "SCHEDULED"]),
  scheduledAt: z.string().datetime().optional(),
  notes: z.string().optional(),
  estimatedPrice: z.number().positive().optional(),
  distanceKm: z.number().positive().optional(),
});

interface DistanceResult {
  distance: string;
  duration: string;
}

async function fetchDistance(origin: string, destination: string, departureTime?: string): Promise<DistanceResult | null> {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  try {
    const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
    url.searchParams.set("origins", origin);
    url.searchParams.set("destinations", destination);
    url.searchParams.set("language", "fr");
    url.searchParams.set("departure_time", departureTime ?? "now");
    url.searchParams.set("traffic_model", "best_guess");
    url.searchParams.set("key", key);
    const res = await fetch(url.toString());
    const data = (await res.json()) as {
      rows: { elements: { status: string; distance: { text: string }; duration: { text: string }; duration_in_traffic?: { text: string } }[] }[];
    };
    const element = data.rows?.[0]?.elements?.[0];
    if (!element || element.status !== "OK") return null;
    const duration = element.duration_in_traffic ?? element.duration;
    return { distance: element.distance.text, duration: duration.text };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const parsed = createBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Opérateur par défaut — à remplacer par l'auth réelle
    const operator = await prisma.operator.findFirst();
    if (!operator) {
      return NextResponse.json(
        { error: "Aucun opérateur configuré" },
        { status: 500 }
      );
    }

    const departureTime = data.type === "SCHEDULED" && data.scheduledAt
      ? String(Math.floor(new Date(data.scheduledAt).getTime() / 1000))
      : undefined;
    const route = await fetchDistance(data.pickupAddress, data.dropAddress, departureTime);

    const booking = await prisma.booking.create({
      data: {
        operatorId: operator.id,
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        clientEmail: data.clientEmail || null,
        pickupAddress: data.pickupAddress,
        dropAddress: data.dropAddress,
        type: data.type,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        notes: data.notes ?? null,
        distanceText: route?.distance ?? null,
        durationText: route?.duration ?? null,
        estimatedPrice: data.estimatedPrice ?? null,
        distanceKm: data.distanceKm ?? null,
      },
      include: {
        operator: true,
        acceptance: {
          include: { driver: true },
        },
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (err) {
    console.error("[POST /api/bookings]", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const bookings = await prisma.booking.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        operator: true,
        acceptance: {
          include: { driver: true },
        },
      },
    });

    return NextResponse.json(bookings);
  } catch {
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
