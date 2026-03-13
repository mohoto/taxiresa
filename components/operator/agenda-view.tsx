"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fr } from "date-fns/locale";
import { Send, MessageCircle, Receipt, CheckCircle, RefreshCw } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { NewBookingDialog } from "@/components/operator/new-booking-dialog";
import { EditBookingDialog } from "@/components/operator/edit-booking-dialog";
import { InvoiceDialog } from "@/components/operator/invoice-dialog";
import { EtaTimer } from "@/components/operator/eta-timer";
import { createClient } from "@/lib/supabase/client";
import type { BookingWithRelations, BookingStatus } from "@/types/booking";

interface AgendaViewProps {
  bookings: BookingWithRelations[];
  commissionPct?: number;
}

interface StatusConfig {
  label: string;
  variant: "secondary" | "success" | "info" | "default" | "destructive";
  dot: string;
}

const STATUS_CONFIG: Record<BookingStatus, StatusConfig> = {
  PENDING:     { label: "En attente",      variant: "secondary",   dot: "bg-zinc-400" },
  ACCEPTED:    { label: "Acceptée",        variant: "success",     dot: "bg-green-500" },
  IN_PROGRESS: { label: "En cours",        variant: "info",        dot: "bg-blue-500" },
  COMPLETED:   { label: "Terminée",        variant: "default",     dot: "bg-zinc-600" },
  CANCELLED:   { label: "Annulée",         variant: "destructive", dot: "bg-red-500" },
  NO_SHOW:     { label: "Client absent",   variant: "destructive", dot: "bg-orange-500" },
};

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getBookingDate(b: BookingWithRelations): Date {
  return new Date(b.scheduledAt ?? b.createdAt);
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateHeader(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

async function sendToTelegram(booking: BookingWithRelations): Promise<void> {
  // Si pas en attente, on remet en attente d'abord (supprime l'acceptation)
  if (booking.status !== "PENDING") {
    const patchRes = await fetch(`/api/bookings/${booking.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PENDING" }),
    });
    if (!patchRes.ok) {
      toastManager.add({ title: "Erreur lors de la remise en attente" });
      return;
    }
  }

  const res = await fetch(`/api/bookings/${booking.id}/telegram`, { method: "POST" });
  const data = (await res.json()) as { ok?: boolean; error?: string };
  if (res.ok && data.ok) {
    toastManager.add({ title: "Réservation envoyée sur Telegram" });
  } else {
    toastManager.add({
      title: "Erreur Telegram",
      description: data.error ?? "Impossible d'envoyer le message",
    });
  }
}

export function AgendaView({ bookings, commissionPct = 0 }: AgendaViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [notifyingId, setNotifyingId] = useState<string | null>(null);
  const [invoiceBookingId, setInvoiceBookingId] = useState<string | null>(null);
  const [liveBookings, setLiveBookings] = useState<BookingWithRelations[]>(bookings);
  const router = useRouter();

  // Sync liveBookings quand les props changent (navigation, refresh manuel)
  useEffect(() => {
    setLiveBookings(bookings);
  }, [bookings]);

  // Supabase Realtime — écoute les changements sur Booking et Acceptance
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("bookings-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Booking" },
        () => { router.refresh(); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Acceptance" },
        () => { router.refresh(); }
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [router]);

  async function handleSendTelegram(booking: BookingWithRelations): Promise<void> {
    setSendingId(booking.id);
    try {
      await sendToTelegram(booking);
      router.refresh();
    } finally {
      setSendingId(null);
    }
  }

  async function handleNotifyDriver(bookingId: string): Promise<void> {
    setNotifyingId(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/notify-driver`, { method: "POST" });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        toastManager.add({ title: "Message envoyé au chauffeur" });
      } else {
        toastManager.add({
          title: "Erreur",
          description: data.error ?? "Impossible d'envoyer le message",
        });
      }
    } finally {
      setNotifyingId(null);
    }
  }

  // Dates qui ont au moins une réservation (pour les points sur le calendrier)
  const datesWithBookings = liveBookings.map((b) => getBookingDate(b));

  const now = Date.now();
  const dayBookings = liveBookings
    .filter((b) => isSameDay(getBookingDate(b), selectedDate))
    .sort((a, b) => {
      const distA = Math.abs(new Date(a.scheduledAt ?? a.createdAt).getTime() - now);
      const distB = Math.abs(new Date(b.scheduledAt ?? b.createdAt).getTime() - now);
      return distA - distB;
    });

  const isToday = isSameDay(selectedDate, new Date());

  return (
    <div className="flex gap-6">
      {/* Calendrier */}
      <div className="flex-shrink-0">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            locale={fr}
            modifiers={{ hasBooking: datesWithBookings }}
            modifiersClassNames={{
              hasBooking: "after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-zinc-900 dark:after:bg-zinc-50 relative",
            }}
          />
        </div>
      </div>

      {/* Liste des réservations du jour */}
      <div className="flex flex-1 flex-col gap-4">
        {/* En-tête du jour */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold capitalize text-zinc-900 dark:text-zinc-50">
              {isToday ? "Aujourd'hui — " : ""}{formatDateHeader(selectedDate)}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {dayBookings.length === 0
                ? "Aucune réservation"
                : `${dayBookings.length} réservation${dayBookings.length > 1 ? "s" : ""}`}
            </p>
          </div>
          <NewBookingDialog />
        </div>

        {/* Réservations */}
        {dayBookings.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-white py-20 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-400">
              Aucune réservation pour ce jour
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {dayBookings.map((booking) => {
              const status = STATUS_CONFIG[booking.status];
              const time = booking.scheduledAt
                ? formatTime(booking.scheduledAt)
                : formatTime(booking.createdAt);

              return (
                <div
                  key={booking.id}
                  className="flex gap-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  {/* Heure + indicateur de statut */}
                  <div className="flex w-14 flex-col items-center gap-1.5 pt-0.5">
                    <span className="text-sm font-semibold tabular-nums text-zinc-700 dark:text-zinc-300">
                      {time}
                    </span>
                    <span
                      className={`h-2 w-2 rounded-full ${status.dot}`}
                    />
                  </div>

                  {/* Contenu */}
                  <div className="flex flex-1 flex-col gap-2">
                    {/* Badge véhicule en haut */}
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-1 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                        {booking.vehicleType === "VAN" ? "🚐 Van" : "🚗 Voiture"}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                          {booking.clientName}
                        </p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          {booking.clientPhone}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" size="sm">
                          {booking.type === "IMMEDIATE" ? "Immédiate" : "Planifiée"}
                        </Badge>
                        <Badge variant={status.variant} size="sm">
                          {status.label}
                        </Badge>
                        <EditBookingDialog booking={booking} />
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={sendingId === booking.id || booking.status !== "PENDING"}
                          onClick={() => handleSendTelegram(booking)}
                          title={booking.status === "PENDING" ? "Envoyer sur Telegram" : "Disponible uniquement pour les réservations en attente"}
                        >
                          <Send className="h-3.5 w-3.5" />
                          {sendingId === booking.id ? "Envoi…" : "Telegram"}
                        </Button>
                        {booking.status === "COMPLETED" && booking.clientEmail && (
                          booking.invoiceSentAt ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-950 cursor-default"
                                disabled
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                Facture envoyée
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setInvoiceBookingId(booking.id)}
                                title={`Renvoyer la facture à ${booking.clientEmail}`}
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                                Renvoyer
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setInvoiceBookingId(booking.id)}
                              title={`Envoyer la facture à ${booking.clientEmail}`}
                            >
                              <Receipt className="h-3.5 w-3.5" />
                              Facture
                            </Button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Trajet */}
                    <div className="flex flex-col gap-1 rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-800">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                        <span className="text-zinc-700 dark:text-zinc-300 truncate">
                          {booking.pickupAddress}
                        </span>
                      </div>
                      <div className="ml-1 h-3 w-px bg-zinc-300 dark:bg-zinc-600" />
                      <div className="flex items-center gap-2 text-sm">
                        <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                        <span className="text-zinc-700 dark:text-zinc-300 truncate">
                          {booking.dropAddress}
                        </span>
                      </div>
                      {(booking.distanceText ?? booking.durationText ?? booking.estimatedPrice) && (
                        <div className="mt-1 flex items-center gap-3 border-t border-zinc-200 pt-1.5 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                          {booking.distanceText && (
                            <span className="flex items-center gap-1">
                              <span>📍</span>
                              <span className="font-medium text-zinc-700 dark:text-zinc-300">{booking.distanceText}</span>
                            </span>
                          )}
                          {booking.distanceText && booking.durationText && (
                            <span className="text-zinc-300 dark:text-zinc-600">·</span>
                          )}
                          {booking.durationText && (
                            <span className="flex items-center gap-1">
                              <span>⏱</span>
                              <span className="font-medium text-zinc-700 dark:text-zinc-300">{booking.durationText}</span>
                            </span>
                          )}
                          {booking.estimatedPrice != null && (
                            <>
                              {(booking.distanceText ?? booking.durationText) && (
                                <span className="text-zinc-300 dark:text-zinc-600">·</span>
                              )}
                              <span className="flex items-center gap-1">
                                <span>💰</span>
                                <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                                  {Math.round(booking.estimatedPrice)}€
                                </span>
                              </span>
                              {commissionPct > 0 && (
                                <span className="flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 dark:bg-amber-900/20">
                                  <span className="text-amber-600 dark:text-amber-400">
                                    Commission {commissionPct}% →
                                  </span>
                                  <span className="font-semibold text-amber-700 dark:text-amber-300">
                                    {Math.round((booking.estimatedPrice * commissionPct) / 100)}€
                                  </span>
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Chauffeur & notes */}
                    <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                      {booking.acceptance ? (
                        <span className="flex items-center gap-3">
                          <span>
                            Chauffeur :{" "}
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">
                              {booking.acceptance.driver.name}
                            </span>
                          </span>
                          {booking.acceptance.driver.phone && (
                            <a
                              href={`tel:${booking.acceptance.driver.phone}`}
                              className="font-medium text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
                            >
                              {booking.acceptance.driver.phone}
                            </a>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={notifyingId === booking.id || !!booking.acceptance?.notifiedAt}
                            onClick={() => handleNotifyDriver(booking.id)}
                            title={booking.acceptance?.notifiedAt ? "Notification déjà envoyée au chauffeur" : "Envoyer un message privé au chauffeur sur Telegram"}
                            className="h-6 gap-1 px-2 text-xs"
                          >
                            <MessageCircle className="h-3 w-3" />
                            {notifyingId === booking.id ? "Envoi…" : booking.acceptance?.notifiedAt ? "Notifié" : "Notifier"}
                          </Button>
                          {booking.acceptance.etaMinutes != null && booking.acceptance.etaUpdatedAt && (
                            <EtaTimer
                              etaMinutes={booking.acceptance.etaMinutes}
                              etaUpdatedAt={booking.acceptance.etaUpdatedAt}
                              paused={booking.status === "IN_PROGRESS"}
                            />
                          )}
                        </span>
                      ) : (
                        <span className="italic">Pas encore de chauffeur</span>
                      )}
                      {booking.notes && (
                        <span className="truncate">· {booking.notes}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {invoiceBookingId && (() => {
        const b = liveBookings.find((x) => x.id === invoiceBookingId);
        if (!b) return null;
        return (
          <InvoiceDialog
            bookingId={b.id}
            clientName={b.clientName}
            email={b.clientEmail ?? ""}
            open={true}
            onOpenChange={(open) => { if (!open) setInvoiceBookingId(null); }}
          />
        );
      })()}
    </div>
  );
}
