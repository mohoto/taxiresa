"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toastManager } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogPanel,
} from "@/components/ui/dialog";

export function AddDriverDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [telegramId, setTelegramId] = useState("");

  function reset() {
    setName("");
    setPhone("");
    setTelegramId("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, telegramId }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toastManager.add({ title: data.error ?? "Erreur lors de la création" });
        return;
      }
      toastManager.add({ title: "Chauffeur ajouté" });
      setOpen(false);
      reset();
      router.refresh();
    } catch {
      toastManager.add({ title: "Erreur interne" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger render={<Button size="sm" className="gap-2" />}>
        <UserPlus className="h-4 w-4" />
        Ajouter un chauffeur
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau chauffeur</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogPanel>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="driver-name">Nom</Label>
                <Input
                  id="driver-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jean Dupont"
                  autoFocus
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="driver-phone">Téléphone</Label>
                <Input
                  id="driver-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+33 6 00 00 00 00"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="driver-telegram">Telegram ID</Label>
                <Input
                  id="driver-telegram"
                  value={telegramId}
                  onChange={(e) => setTelegramId(e.target.value)}
                  placeholder="123456789"
                  required
                />
                <p className="text-xs text-zinc-500">
                  Le chauffeur peut obtenir son ID en écrivant à @userinfobot sur Telegram.
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Enregistrement…" : "Ajouter"}
                </Button>
              </div>
            </div>
          </DialogPanel>
        </form>
      </DialogContent>
    </Dialog>
  );
}
