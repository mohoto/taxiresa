import type { Metadata } from "next";
import { Car, Van, Phone } from "lucide-react";
import { BookingWizard } from "@/components/booking/booking-wizard";

export const metadata: Metadata = {
  title: "Réserver un taxi",
  description: "Réservez votre course en quelques secondes",
};

export default function ReserverPage() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <img src="/images/logo-taxi-rapide.jpg" alt="TaxiRapide" className="h-12 w-auto" />
            <span className="text-xl font-black leading-none">
              <span className="text-[#00B800]">TAXI</span><span className="text-zinc-900">RAPIDE.FR</span>
            </span>
          </div>
          <a
            href="tel:0123456543"
            className="flex items-center gap-2 bg-[#00B800] hover:bg-[#009900] text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
          >
            <Phone size={15} /> 01 23 45 65 43
          </a>
        </div>
      </header>

      {/* Hero + Form sur fond parisien */}
      <section className="relative min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-start py-12 px-4 bg-[url('https://images.unsplash.com/photo-1520939817895-060bdaf4fe1b?w=1600&q=80')] bg-cover bg-center">
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Contenu */}
        <div className="relative z-10 w-full max-w-xl flex flex-col gap-14">
          {/* Titre */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-1">
              Réservez votre taxi
            </h1>
            <p className="text-white/90 text-lg font-medium mb-2">
              À partir de Paris ou de banlieue parisienne
            </p>
          </div>

          {/* Formulaire sur fond blanc */}
          <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl pt-14 px-6 pb-6 md:px-8 md:pb-8">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
              <img
                src="/images/plaque-taxi-parisien-vert.png"
                alt="Taxi Parisien"
                className="h-16 w-auto drop-shadow-lg"
              />
              <p className="text-white/70 text-xs whitespace-nowrap">
                Disponible 24h/24 — Voiture &amp; Van — Confirmation immédiate
              </p>
            </div>
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
      <section className="relative min-h-[500px] flex flex-col justify-end pt-24 pb-8 md:py-16 px-4 bg-[url('/images/Chauffeur-taxi-parisien-2.webp')] bg-cover [background-position:20%_center] md:bg-center">
        <div className="absolute inset-0 bg-black/50" />
        <h2 className="absolute top-16 inset-x-0 text-2xl font-bold text-white text-center z-10 md:hidden">
          Pourquoi nous choisir ?
        </h2>
        <div className="relative z-10 max-w-3xl mx-auto w-full">
          <h2 className="hidden md:block text-2xl font-bold text-white text-center mb-10">
            Pourquoi nous choisir ?
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: "🕐", label: "Disponible 24h/24" },
              { icon: "📱", label: "Réservation en ligne" },
              { icon: "⚡", label: "Prise en charge rapide" },
            ].map(({ icon, label }) => (
              <div key={label} className="flex flex-col items-center text-center gap-2 p-4 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm">
                <span className="text-2xl">{icon}</span>
                <span className="text-sm font-medium text-white">{label}</span>
              </div>
            ))}
            <div className="flex flex-col items-center text-center gap-2 p-4 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm">
              <span className="flex items-center gap-1 text-white"><Car size={22} /><Van size={22} /></span>
              <span className="text-sm font-medium text-white">Voiture &amp; Van</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900 dark:bg-zinc-950 py-8 px-4 text-center">
        <p className="text-zinc-400 text-sm mb-3">© {new Date().getFullYear()} Taxi — Tous droits réservés</p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <a href="/mentions-legales" className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors">Mentions légales</a>
          <span className="text-zinc-700 text-xs">·</span>
          <a href="/confidentialite" className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors">Politique de confidentialité</a>
          <span className="text-zinc-700 text-xs">·</span>
          <a href="/cgu-cgv" className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors">CGU / CGV</a>
        </div>
      </footer>
    </main>
  );
}
