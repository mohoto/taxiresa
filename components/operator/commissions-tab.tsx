"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface CommissionsTabProps {
  href: string;
  label: string;
}

export function CommissionsTab({ href, label }: CommissionsTabProps) {
  const pathname = usePathname();
  // exact match pour éviter que /commissions matche /commissions/a-recuperer
  const isActive = pathname === href || (href !== "/commissions" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={[
        "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
        isActive
          ? "border-zinc-900 text-zinc-900 dark:border-zinc-50 dark:text-zinc-50"
          : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}
