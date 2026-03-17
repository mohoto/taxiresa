import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mentions légales",
};

export default function MentionsLegalesPage() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/reserver" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 mb-8 inline-block">
          ← Retour
        </Link>

        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-8">Mentions légales</h1>

        <div className="flex flex-col gap-8 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          <section>
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-3">Éditeur du site</h2>
            <p>Le présent site est édité par :</p>
            <ul className="mt-2 flex flex-col gap-1 list-none">
              <li><span className="text-zinc-500">Raison sociale :</span> Taxi Parisien</li>
              <li><span className="text-zinc-500">Forme juridique :</span> Entreprise individuelle</li>
              <li><span className="text-zinc-500">Siège social :</span> Paris, France</li>
              <li><span className="text-zinc-500">Email :</span> contact@taxi.fr</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-3">Hébergement</h2>
            <p>
              Ce site est hébergé par Vercel Inc., 340 Pine Street, Suite 700, San Francisco, CA 94104, États-Unis.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-3">Propriété intellectuelle</h2>
            <p>
              L'ensemble du contenu de ce site (textes, images, graphismes, logo) est la propriété exclusive de l'éditeur.
              Toute reproduction, représentation ou utilisation, totale ou partielle, sans autorisation écrite préalable est strictement interdite.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-3">Responsabilité</h2>
            <p>
              L'éditeur s'efforce de maintenir les informations de ce site à jour et exactes. Il ne saurait être tenu responsable
              des erreurs, omissions ou indisponibilités techniques du service. L'utilisation de ce site se fait sous l'entière
              responsabilité de l'utilisateur.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-3">Droit applicable</h2>
            <p>
              Les présentes mentions légales sont soumises au droit français. Tout litige relatif à l'utilisation
              de ce site relève de la compétence exclusive des tribunaux compétents du ressort de Paris.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
