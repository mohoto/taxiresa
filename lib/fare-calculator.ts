export type TarifLetter = "A" | "B" | "C";
export type TarifZone = "intramuros" | "suburbaine";

export interface FareParams {
  distanceKm: number;
  dureeMin: number;
  tarif: TarifLetter;
  reservation: "immediat" | "avance";
  passagers: number;
  peage?: number;
  settings?: FareConstants;
}

export interface FareBreakdown {
  prise_en_charge: number;
  approche: number;
  compteur: number;
  supPassagers: number;
  peage: number;
  total: number;
}

export interface FareConstants {
  priseEnCharge: number;
  minimumCourse: number;
  approcheImmediat: number;
  approcheAvance: number;
  supPassager: number;
  tarifAKm: number;
  tarifAHeure: number;
  tarifBKm: number;
  tarifBHeure: number;
  tarifCKm: number;
  tarifCHeure: number;
}

const DEFAULT_CONSTANTS: FareConstants = {
  priseEnCharge:    3.0,
  minimumCourse:    8.0,
  approcheImmediat: 4.0,
  approcheAvance:   7.0,
  supPassager:      5.5,
  tarifAKm:         1.30,
  tarifAHeure:      39.55,
  tarifBKm:         1.66,
  tarifBHeure:      52.56,
  tarifCKm:         1.76,
  tarifCHeure:      43.15,
};

export function detectTarif(
  heure: number,
  minutes: number,
  jour: number,
  zone: TarifZone
): TarifLetter {
  const totalMinutes = heure * 60 + minutes;
  const isNight = totalMinutes < 7 * 60 || totalMinutes >= 19 * 60;
  const isWeekend = jour === 0 || jour === 6;

  if (zone === "suburbaine") {
    if (isWeekend || isNight) return "C";
    return "B";
  }

  // Intramuros
  if (jour === 0) return "C"; // Dimanche
  if (isNight) return "B";
  // Journée semaine 10h–17h → A, sinon B
  if (totalMinutes >= 10 * 60 && totalMinutes < 17 * 60) return "A";
  return "B";
}

export function calculateFare(params: FareParams): FareBreakdown {
  const { distanceKm, dureeMin, tarif, reservation, passagers, peage = 0, settings } = params;
  const c = settings ?? DEFAULT_CONSTANTS;

  const rates = {
    A: { km: c.tarifAKm, heure: c.tarifAHeure },
    B: { km: c.tarifBKm, heure: c.tarifBHeure },
    C: { km: c.tarifCKm, heure: c.tarifCHeure },
  }[tarif];

  const compteur = round2(distanceKm * rates.km + (dureeMin / 60) * rates.heure);
  const base = Math.max(c.minimumCourse, c.priseEnCharge + compteur);
  const approche = reservation === "avance" ? c.approcheAvance : c.approcheImmediat;
  const supPassagers = passagers >= 5 ? (passagers - 4) * c.supPassager : 0;
  const total = Math.round(base + approche + supPassagers + peage);

  return {
    prise_en_charge: c.priseEnCharge,
    approche,
    compteur,
    supPassagers,
    peage,
    total,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
