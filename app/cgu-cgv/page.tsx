import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CGU / CGV",
};

export default function CguCgvPage() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/reserver" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 mb-8 inline-block">
          ← Retour
        </Link>

        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">Conditions Générales</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">Conditions Générales d'Utilisation et de Vente</p>

        <div className="flex flex-col gap-8 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          <section>
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-3">1. Objet</h2>
            <p>
              Les présentes conditions régissent l'utilisation du service de réservation de taxi en ligne.
              En effectuant une réservation, l'utilisateur accepte sans réserve l'intégralité des présentes conditions.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-3">2. Service proposé</h2>
            <p>
              Notre service permet la mise en relation entre des passagers et des chauffeurs de taxi indépendants
              opérant à Paris et en région parisienne. Le transport est assuré par des chauffeurs professionnels
              titulaires des autorisations réglementaires requises.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-3">3. Réservation</h2>
            <p>
              La réservation est considérée comme confirmée dès réception de l'email de confirmation.
              L'utilisateur s'engage à fournir des informations exactes lors de sa réservation (adresses,
              nombre de passagers, bagages). Toute information erronée peut entraîner le refus de la prestation.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-3">4. Tarification et paiement</h2>
            <p>
              Le prix affiché lors de la réservation est le prix réel calculé sur la distance et le tarif
              applicable au moment de la course (tarif A, B ou C selon l'horaire et la zone).
            </p>
            <p className="mt-2">
              Le paiement s'effectue <span className="font-medium">directement à bord du véhicule</span>,
              en espèces ou par carte bancaire selon les moyens acceptés par le chauffeur.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-3">5. Annulation</h2>
            <p>
              Toute annulation doit être notifiée par email ou téléphone dans les meilleurs délais.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-3">6. Obligations du passager</h2>
            <ul className="mt-1 flex flex-col gap-1 list-disc list-inside">
              <li>Porter la ceinture de sécurité en toute circonstance</li>
              <li>Ne pas fumer, manger ou introduire des substances dangereuses dans le véhicule</li>
              <li>Se présenter à l'heure et à l'adresse indiquées</li>
              <li>Ne pas adopter un comportement dangereux ou irrespectueux envers le chauffeur</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-3">7. Responsabilité</h2>
            <p>
              Notre responsabilité est limitée à la mise en relation avec un chauffeur disponible. Une fois
              la course acceptée, le chauffeur est seul responsable de l'exécution du transport.
              Nous ne saurions être tenus responsables des retards liés aux conditions de trafic ou à des
              circonstances extérieures indépendantes de notre volonté.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-3">8. Droit applicable et litiges</h2>
            <p>
              Les présentes conditions sont soumises au droit français. En cas de litige, une solution amiable
              sera recherchée en priorité. À défaut, les tribunaux compétents de Paris seront saisis.
              Toute réclamation doit être adressée dans un délai de 30 jours suivant la course.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
