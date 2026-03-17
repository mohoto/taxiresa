import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
};

export default function ConfidentialitePage() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/reserver" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 mb-8 inline-block">
          ← Retour
        </Link>

        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-8">Politique de confidentialité</h1>

        <div className="flex flex-col gap-8 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          <section>
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-3">Données collectées</h2>
            <p>
              Dans le cadre de votre réservation, nous collectons les informations suivantes :
            </p>
            <ul className="mt-2 flex flex-col gap-1 list-disc list-inside">
              <li>Nom et prénom</li>
              <li>Numéro de téléphone</li>
              <li>Adresse email</li>
              <li>Adresses de prise en charge et de destination</li>
            </ul>
            <p className="mt-2">
              Ces données sont strictement nécessaires au traitement de votre réservation et à la mise en relation
              avec un chauffeur.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-3">Utilisation des données</h2>
            <p>Vos données personnelles sont utilisées exclusivement pour :</p>
            <ul className="mt-2 flex flex-col gap-1 list-disc list-inside">
              <li>Traiter et confirmer votre réservation</li>
              <li>Vous contacter en cas de besoin lié à votre course</li>
              <li>Envoyer un email de confirmation</li>
            </ul>
            <p className="mt-2">
              Nous ne vendons, n'échangeons et ne transférons jamais vos informations personnelles à des tiers
              sans votre consentement explicite.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-3">Durée de conservation</h2>
            <p>
              Vos données sont conservées le temps nécessaire à la réalisation de la prestation et au respect
              des obligations légales, puis supprimées dans un délai raisonnable.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-3">Cookies</h2>
            <p>
              Ce site peut utiliser des cookies techniques nécessaires à son bon fonctionnement. Aucun cookie
              publicitaire ou de traçage tiers n'est utilisé sans votre consentement.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-3">Vos droits (RGPD)</h2>
            <p>
              Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :
            </p>
            <ul className="mt-2 flex flex-col gap-1 list-disc list-inside">
              <li>Droit d'accès à vos données</li>
              <li>Droit de rectification</li>
              <li>Droit à l'effacement (droit à l'oubli)</li>
              <li>Droit à la portabilité</li>
              <li>Droit d'opposition au traitement</li>
            </ul>
            <p className="mt-2">
              Pour exercer ces droits, contactez-nous à : <span className="font-medium">contact@taxi.fr</span>
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-3">Sécurité</h2>
            <p>
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger
              vos données contre tout accès non autorisé, perte ou divulgation.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
