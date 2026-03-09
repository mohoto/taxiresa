import { SettingsNavLink } from "@/components/operator/settings/settings-nav-link";

const NAV_ITEMS = [
  { href: "/settings/tarification", label: "Tarification" },
  { href: "/settings/commission", label: "Commission" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Paramètres</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Configurez les paramètres de l'application.
        </p>
      </div>

      <div className="flex gap-8">
        <nav className="w-48 shrink-0">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <SettingsNavLink href={item.href} label={item.label} />
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
