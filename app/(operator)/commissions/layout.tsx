import { CommissionsTab } from "@/components/operator/commissions-tab";

const NAV_ITEMS = [
  { href: "/commissions", label: "Détail par course" },
  { href: "/commissions/a-recuperer", label: "À récupérer par chauffeur" },
];

export default function CommissionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-8 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Commissions</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Suivi des commissions par semaine.
        </p>
      </div>

      <nav className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
        {NAV_ITEMS.map((item) => (
          <CommissionsTab key={item.href} href={item.href} label={item.label} />
        ))}
      </nav>

      {children}
    </div>
  );
}
