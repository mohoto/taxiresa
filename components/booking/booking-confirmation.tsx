"use client";

interface BookingConfirmationProps {
  bookingId: string | null;
}

export function BookingConfirmation({ bookingId }: BookingConfirmationProps) {
  return (
    <div className="flex flex-col items-center text-center gap-6 py-8">
      <div className="w-16 h-16 rounded-full bg-zinc-900 dark:bg-zinc-50 flex items-center justify-center text-3xl">
        ✅
      </div>
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          Réservation confirmée !
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-sm">
          Votre demande a bien été reçue. Un chauffeur va prendre en charge votre course dans les plus brefs délais.
        </p>
      </div>
      {bookingId && (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 px-5 py-3 text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">Référence : </span>
          <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-50">
            #{bookingId.slice(-8).toUpperCase()}
          </span>
        </div>
      )}
      <a
        href="/reserver"
        className="text-sm text-zinc-500 dark:text-zinc-400 underline underline-offset-4 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
      >
        Faire une nouvelle réservation
      </a>
    </div>
  );
}
