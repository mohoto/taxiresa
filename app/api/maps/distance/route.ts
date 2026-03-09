import { NextRequest, NextResponse } from "next/server";

interface DistanceResult {
  distance: string;
  duration: string;
  distanceMeters: number;
  durationSeconds: number;
}

interface GoogleDistanceMatrixResponse {
  status: string;
  rows: {
    elements: {
      status: string;
      distance: { text: string; value: number };
      duration: { text: string; value: number };
      duration_in_traffic?: { text: string; value: number };
    }[];
  }[];
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");
  const departureTime = searchParams.get("departure_time"); // timestamp Unix en secondes, ou "now"

  if (!origin || !destination) {
    return NextResponse.json({ error: "origin et destination requis" }, { status: 400 });
  }

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "Clé API manquante" }, { status: 500 });
  }

  const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
  url.searchParams.set("origins", origin);
  url.searchParams.set("destinations", destination);
  url.searchParams.set("language", "fr");
  url.searchParams.set("departure_time", departureTime ?? "now");
  url.searchParams.set("traffic_model", "best_guess");
  url.searchParams.set("key", key);

  try {
    const res = await fetch(url.toString());
    const data = (await res.json()) as GoogleDistanceMatrixResponse;

    const element = data.rows?.[0]?.elements?.[0];
    if (!element || element.status !== "OK") {
      return NextResponse.json({ error: "Impossible de calculer l'itinéraire" }, { status: 422 });
    }

    const durationWithTraffic = element.duration_in_traffic ?? element.duration;
    const rawKm = element.distance.value / 1000;
    const roundedKm = Math.round(rawKm * 2) / 2; // arrondi à 0,5
    const distanceText = roundedKm.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " km";
    const result: DistanceResult = {
      distance: distanceText,
      duration: durationWithTraffic.text,
      distanceMeters: element.distance.value,
      durationSeconds: durationWithTraffic.value,
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
