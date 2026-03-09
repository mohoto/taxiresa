"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, User, Bike, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import type { AppUser } from "@/app/(operator)/utilisateurs/page";
import { EditUserDialog } from "./edit-user-dialog";

interface UsersTableProps {
  users: AppUser[];
}

const ROLE_CONFIG: Record<AppUser["role"], { label: string; icon: React.ComponentType<{ className?: string }>; classes: string }> = {
  ADMIN:    { label: "Admin",     icon: Shield,  classes: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800" },
  OPERATOR: { label: "Opérateur", icon: User,    classes: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800" },
  COURIER:  { label: "Coursier",  icon: Bike,    classes: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800" },
};

export function UsersTable({ users }: UsersTableProps) {
  const router = useRouter();
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function toggleActive(user: AppUser) {
    setLoadingId(user.id);
    try {
      await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  async function deleteUser(user: AppUser) {
    if (!confirm(`Supprimer l'utilisateur "${user.name}" ?`)) return;
    setLoadingId(user.id);
    try {
      await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  if (users.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-zinc-400">
        Aucun utilisateur — créez-en un avec le bouton ci-dessus.
      </div>
    );
  }

  return (
    <>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800">
            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">Nom</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">Email</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">Rôle</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">Statut</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">Créé le</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {users.map((user) => {
            const role = ROLE_CONFIG[user.role];
            const Icon = role.icon;
            const isLoading = loadingId === user.id;
            return (
              <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                  {user.name}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {user.email}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${role.classes}`}>
                    <Icon className="h-3 w-3" />
                    {role.label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {user.isActive ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Actif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                      Inactif
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                  {new Date(user.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingUser(user)}
                      disabled={isLoading}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors disabled:opacity-50"
                      title="Modifier"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleActive(user)}
                      disabled={isLoading}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors disabled:opacity-50"
                      title={user.isActive ? "Désactiver" : "Activer"}
                    >
                      {user.isActive ? <ToggleRight className="h-4 w-4 text-green-500" /> : <ToggleLeft className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteUser(user)}
                      disabled={isLoading}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                      title="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {editingUser && (
        <EditUserDialog
          user={editingUser}
          onClose={() => setEditingUser(null)}
        />
      )}
    </>
  );
}
