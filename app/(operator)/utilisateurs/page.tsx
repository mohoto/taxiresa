import { createAdminClient } from "@/lib/supabase/admin";
import { UsersTable } from "@/components/operator/users-table";
import { AddUserDialog } from "@/components/operator/add-user-dialog";

export const dynamic = "force-dynamic";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "OPERATOR" | "COURIER";
  isActive: boolean;
  createdAt: string;
}

export default async function UtilisateursPage() {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers();

  type UserRow = typeof data.users[number];
  const users: AppUser[] = error ? [] : data.users.map((u: UserRow) => ({
    id: u.id,
    email: u.email ?? "",
    name: (u.user_metadata?.name as string) ?? "",
    role: ((u.user_metadata?.role as string) ?? "OPERATOR") as AppUser["role"],
    isActive: !u.banned_until,
    createdAt: u.created_at,
  }));

  const sorted = [...users].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Utilisateurs
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {sorted.length} utilisateur{sorted.length > 1 ? "s" : ""} enregistré{sorted.length > 1 ? "s" : ""}
          </p>
        </div>
        <AddUserDialog />
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <UsersTable users={sorted} />
      </div>
    </div>
  );
}
