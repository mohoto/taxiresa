import type { Metadata } from "next";
import { BookingWizard } from "@/components/booking/booking-wizard";

export const metadata: Metadata = {
  title: "Réserver un taxi",
  description: "Réservez votre course en quelques secondes",
};

export default function ReserverPage() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-2">
          <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">🚕 Taxi</span>
        </div>
      </header>

      {/* Hero + Form sur fond parisien */}
      <section className="relative min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-start py-12 px-4 bg-[url('https://images.unsplash.com/photo-1520939817895-060bdaf4fe1b?w=1600&q=80')] bg-cover bg-center">
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Contenu */}
        <div className="relative z-10 w-full max-w-xl flex flex-col gap-8">
          {/* Titre */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-1">
              Réservez votre taxi
            </h1>
            <p className="text-white/90 text-lg font-medium mb-2">
              À partir de Paris ou de banlieue parisienne
            </p>
            <p className="text-white/70 text-sm">
              Disponible 24h/24 — Voiture &amp; Van — Confirmation immédiate
            </p>
          </div>

          {/* Formulaire sur fond blanc */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 md:p-8">
            <BookingWizard />
          </div>
        </div>
      </section>

      {/* Comment réserver */}
      <section className="bg-white dark:bg-zinc-900 py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 text-center mb-10">
            Comment réserver ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                icon: "📍",
                title: "Saisissez votre trajet",
                desc: "Indiquez votre adresse de départ et d'arrivée, choisissez le type de course et le véhicule souhaité.",
                small: false,
              },
              {
                step: "2",
                icon: "👤",
                title: "Vos coordonnées",
                desc: "Renseignez votre nom, votre numéro de téléphone et votre adresse email.",
                small: false,
              },
              {
                step: "3",
                icon: "✅",
                title: "Confirmation immédiate",
                desc: "Confirmation par email et prise en charge immédiate par un chauffeur.",
                small: false,
              },
            ].map(({ step, icon, title, desc, small }) => (
              <div key={step} className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-zinc-900 dark:bg-zinc-50 flex items-center justify-center text-xl">
                  {icon}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                    Étape {step}
                  </span>
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
                <p className={`${small ? "text-xs" : "text-sm"} text-zinc-500 dark:text-zinc-400 leading-relaxed`}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="bg-zinc-50 dark:bg-zinc-950 py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 text-center mb-10">
            Pourquoi nous choisir ?
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: "🕐", label: "Disponible 24h/24" },
              { icon: "🚗", label: "Voiture & Van" },
              { icon: "📱", label: "Réservation en ligne" },
              { icon: "⚡", label: "Prise en charge rapide" },
            ].map(({ icon, label }) => (
              <div key={label} className="flex flex-col items-center text-center gap-2 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <span className="text-2xl">{icon}</span>
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900 dark:bg-zinc-950 py-8 px-4 text-center">
        <p className="text-zinc-400 text-sm">© {new Date().getFullYear()} Taxi — Tous droits réservés</p>
      </footer>
    </main>
  );
}
