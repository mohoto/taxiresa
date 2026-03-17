"use client";

import { useState } from "react";
import { Car, Van } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import type { TrajetData } from "@/components/booking/booking-wizard";

const schema = z.object({
  clientName: z.string().min(2, "Minimum 2 caractères"),
  clientPhone: z.string().min(8, "Numéro invalide"),
  clientEmail: z.string().email("Email invalide"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface StepClientProps {
  trajet: TrajetData;
  onBack: () => void;
  onDone: (bookingId: string) => void;
}

export function StepClient({ trajet, onBack, onDone }: StepClientProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    setError(null);

    try {
      let scheduledAt: string | undefined;
      if (trajet.type === "SCHEDULED" && trajet.scheduledDate && trajet.scheduledTime) {
        scheduledAt = new Date(`${trajet.scheduledDate}T${trajet.scheduledTime}`).toISOString();
      }

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: values.clientName,
          clientPhone: values.clientPhone,
          clientEmail: values.clientEmail || undefined,
          notes: values.notes ? `[Réservation site web] ${values.notes}` : "Réservation site web",
          pickupAddress: trajet.pickupAddress,
          dropAddress: trajet.dropAddress,
          type: trajet.type,
          scheduledAt,
          vehicleType: trajet.vehicleType,
          estimatedPrice: trajet.estimatedPrice,
        }),
      });

      const data = (await res.json()) as { id?: string; error?: string };

      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue");
        return;
      }

      if (data.id) {
        // Send confirmation email (best effort)
        void fetch(`/api/bookings/${data.id}/confirm-email`, { method: "POST" });
        onDone(data.id);
      }
    } catch {
      setError("Une erreur est survenue, veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Récapitulatif trajet */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 flex flex-col gap-2">
        <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
          Récapitulatif
        </div>
        <div className="flex items-start gap-2 text-sm">
          <span className="text-zinc-400 mt-0.5">📍</span>
          <span className="text-zinc-700 dark:text-zinc-300">{trajet.pickupAddress}</span>
        </div>
        <div className="flex items-start gap-2 text-sm">
          <span className="text-zinc-400 mt-0.5">🏁</span>
          <span className="text-zinc-700 dark:text-zinc-300">{trajet.dropAddress}</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex-wrap">
          <span>{trajet.type === "IMMEDIATE" ? "🚕 Immédiate" : `📅 ${trajet.scheduledDate} à ${trajet.scheduledTime}`}</span>
          <span className="flex items-center gap-1">{trajet.vehicleType === "VAN" ? <><Van size={13} /> Van</> : <><Car size={13} /> Voiture</>}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field>
          <FieldLabel htmlFor="clientName">Nom complet</FieldLabel>
          <Input id="clientName" placeholder="Jean Dupont" {...register("clientName")} />
          {errors.clientName && <FieldError>{errors.clientName.message}</FieldError>}
        </Field>

        <Field>
          <FieldLabel htmlFor="clientPhone">Téléphone</FieldLabel>
          <Input id="clientPhone" type="tel" placeholder="0612678758" {...register("clientPhone")} />
          {errors.clientPhone && <FieldError>{errors.clientPhone.message}</FieldError>}
        </Field>

        <Field>
          <FieldLabel htmlFor="clientEmail">Email</FieldLabel>
          <Input id="clientEmail" type="email" placeholder="jean@exemple.fr" {...register("clientEmail")} />
          {errors.clientEmail && <FieldError>{errors.clientEmail.message}</FieldError>}
        </Field>

        <Field>
          <FieldLabel htmlFor="notes">
            Notes <span className="text-zinc-400 font-normal">(optionnel)</span>
          </FieldLabel>
          <Textarea
            id="notes"
            placeholder="Bagages, instructions particulières…"
            rows={3}
            {...register("notes")}
          />
        </Field>

        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="rounded-md bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 flex flex-col gap-1">
          <span>Paiement à bord du véhicule</span>
          <span>📧 Un email de confirmation vous sera envoyé</span>
        </div>

        <div className="flex gap-3 mt-2">
          <Button type="button" variant="outline" onClick={onBack} disabled={loading} className="flex-1 py-6 text-base">
            ← Retour
          </Button>
          <Button type="submit" disabled={loading} className="flex-1 py-6 text-base">
            {loading ? "Envoi en cours…" : "Confirmer la réservation"}
          </Button>
        </div>
      </form>
    </div>
  );
}
