"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toastManager } from "@/components/ui/toast";

interface Driver {
  id: string;
  name: string;
  phone: string;
  telegramId: string;
  isAvailable: boolean;
  createdAt: string;
  _count: { acceptances: number };
}

interface DriversTableProps {
  drivers: Driver[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function DriversTable({ drivers }: DriversTableProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);

  function startEdit(driver: Driver) {
    setEditingId(driver.id);
    setEditName(driver.name);
    setEditPhone(driver.phone);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/drivers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, phone: editPhone }),
      });
      if (!res.ok) throw new Error();
      toastManager.add({ title: "Chauffeur mis à jour" });
      setEditingId(null);
      router.refresh();
    } catch {
      toastManager.add({ title: "Erreur lors de la mise à jour" });
    } finally {
      setSaving(false);
    }
  }

  async function toggleAvailability(driver: Driver) {
    try {
      const res = await fetch(`/api/drivers/${driver.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !driver.isAvailable }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      toastManager.add({ title: "Erreur lors de la mise à jour" });
    }
  }

  async function deleteDriver(id: string) {
    if (!confirm("Supprimer ce chauffeur ?")) return;
    try {
      const res = await fetch(`/api/drivers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toastManager.add({ title: "Chauffeur supprimé" });
      router.refresh();
    } catch {
      toastManager.add({ title: "Erreur lors de la suppression" });
    }
  }

  if (drivers.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-zinc-400">Aucun chauffeur enregistré</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800">
            <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Nom</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Téléphone</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Telegram ID</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Courses</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Inscription</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Statut</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {drivers.map((driver) => {
            const isEditing = editingId === driver.id;
            return (
              <tr key={driver.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                {/* Nom */}
                <td className="px-4 py-3">
                  {isEditing ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-7 w-40 text-sm"
                    />
                  ) : (
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      {driver.name}
                    </span>
                  )}
                </td>

                {/* Téléphone */}
                <td className="px-4 py-3">
                  {isEditing ? (
                    <Input
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+33 6 00 00 00 00"
                      className="h-7 w-40 text-sm"
                      type="tel"
                    />
                  ) : driver.phone ? (
                    <a
                      href={`tel:${driver.phone}`}
                      className="text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
                    >
                      {driver.phone}
                    </a>
                  ) : (
                    <span className="italic text-zinc-400">—</span>
                  )}
                </td>

                {/* Telegram ID */}
                <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                  {driver.telegramId}
                </td>

                {/* Courses */}
                <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                  {driver._count.acceptances}
                </td>

                {/* Inscription */}
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                  {formatDate(driver.createdAt)}
                </td>

                {/* Statut */}
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleAvailability(driver)}
                    className="cursor-pointer"
                    title="Cliquer pour changer le statut"
                  >
                    <Badge variant={driver.isAvailable ? "success" : "secondary"}>
                      {driver.isAvailable ? "Disponible" : "Indisponible"}
                    </Badge>
                  </button>
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={saving}
                        onClick={() => saveEdit(driver.id)}
                        className="h-7 px-2"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEdit}
                        className="h-7 px-2"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(driver)}
                        className="h-7 px-2"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteDriver(driver.id)}
                        className="h-7 px-2 text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
