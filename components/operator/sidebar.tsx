"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  CalendarClock,
  Users,
  Car,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  BadgePercent,
  UserCog,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Role = "ADMIN" | "OPERATOR" | "COURIER";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",    href: "/dashboard",               icon: LayoutDashboard, roles: ["ADMIN"] },
  { label: "Réservations", href: "/reservations",            icon: CalendarClock,   roles: ["ADMIN", "OPERATOR"] },
  { label: "Chauffeurs",   href: "/drivers",                 icon: Car,             roles: ["ADMIN"] },
  { label: "Clients",      href: "/clients",                 icon: Users,           roles: ["ADMIN"] },
  { label: "Commissions",  href: "/commissions",             icon: BadgePercent,    roles: ["ADMIN"] },
  { label: "Utilisateurs", href: "/utilisateurs",            icon: UserCog,         roles: ["ADMIN"] },
  { label: "Paramètres",   href: "/settings",                icon: Settings,        roles: ["ADMIN"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<Role>("OPERATOR");
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const r = data.user?.user_metadata?.role as Role | undefined;
      if (r) setRole(r);
    });
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside
      className={[
        "flex h-screen flex-col border-r border-zinc-200 bg-white transition-all duration-200 dark:border-zinc-800 dark:bg-zinc-900",
        collapsed ? "w-16" : "w-60",
      ].join(" ")}
    >
      {/* Logo + toggle */}
      <div className="flex h-16 items-center border-b border-zinc-200 dark:border-zinc-800 px-3 gap-2">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 transition-colors"
          title={collapsed ? "Afficher la sidebar" : "Réduire la sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
        {!collapsed && (
          <>
            <Car className="h-5 w-5 shrink-0 text-zinc-900 dark:text-zinc-50" />
            <span className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              TaxiOps
            </span>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={[
                "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                collapsed ? "justify-center gap-0" : "gap-3",
                isActive
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
              ].join(" ")}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 p-3 flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 transition-colors"
          title={mounted ? (resolvedTheme === "dark" ? "Mode clair" : "Mode sombre") : "Mode sombre"}
        >
          {mounted && resolvedTheme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>
        {!collapsed && (
          <button
            type="button"
            onClick={handleLogout}
            className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-xs text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
            title="Se déconnecter"
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            Déconnexion
          </button>
        )}
        {collapsed && (
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors mx-auto"
            title="Se déconnecter"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </aside>
  );
}
