"use client";

import { useState } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { StepTrajet } from "@/components/booking/step-trajet";
import { StepClient } from "@/components/booking/step-client";
import { BookingConfirmation } from "@/components/booking/booking-confirmation";

export interface TrajetData {
  pickupAddress: string;
  dropAddress: string;
  type: "IMMEDIATE" | "SCHEDULED";
  scheduledDate?: string;
  scheduledTime?: string;
  vehicleType: "VOITURE" | "VAN";
}

export interface ClientData {
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  notes?: string;
}

type Step = "trajet" | "client" | "confirmation";

export function BookingWizard() {
  const [step, setStep] = useState<Step>("trajet");
  const [trajet, setTrajet] = useState<TrajetData | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  function handleTrajetDone(data: TrajetData) {
    setTrajet(data);
    setStep("client");
  }

  function handleClientDone(id: string) {
    setBookingId(id);
    setStep("confirmation");
  }

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}>
      {/* Stepper */}
      <div className="flex items-center gap-3 mb-8">
        <StepIndicator n={1} label="Trajet" active={step === "trajet"} done={step !== "trajet"} />
        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
        <StepIndicator n={2} label="Coordonnées" active={step === "client"} done={step === "confirmation"} />
      </div>

      {step === "trajet" && (
        <StepTrajet onNext={handleTrajetDone} />
      )}
      {step === "client" && trajet && (
        <StepClient trajet={trajet} onBack={() => setStep("trajet")} onDone={handleClientDone} />
      )}
      {step === "confirmation" && (
        <BookingConfirmation bookingId={bookingId} />
      )}
    </APIProvider>
  );
}

function StepIndicator({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={[
        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
        done
          ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
          : active
            ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
            : "bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400",
      ].join(" ")}>
        {done ? "✓" : n}
      </div>
      <span className={[
        "text-sm font-medium",
        active || done ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-400 dark:text-zinc-500",
      ].join(" ")}>
        {label}
      </span>
    </div>
  );
}
