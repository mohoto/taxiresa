"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { Send } from "lucide-react";

interface InvoiceDialogProps {
  bookingId: string;
  clientName: string;
  email: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceDialog({
  bookingId,
  clientName,
  email,
  open,
  onOpenChange,
}: InvoiceDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json() as { error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? "Erreur lors de l'envoi");
      }

      toastManager.add({ title: `Facture envoyée à ${email}` });
      onOpenChange(false);
    } catch (err) {
      toastManager.add({ title: err instanceof Error ? err.message : "Erreur lors de l'envoi" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Envoyer la facture</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="rounded-md bg-zinc-50 dark:bg-zinc-800 px-4 py-3 text-sm">
            <p className="text-zinc-500 dark:text-zinc-400">Client</p>
            <p className="font-medium text-zinc-900 dark:text-zinc-50">{clientName}</p>
            <p className="mt-1 text-zinc-500 dark:text-zinc-400">Envoi à</p>
            <p className="font-medium text-zinc-900 dark:text-zinc-50">{email}</p>
          </div>
          <Button onClick={handleSend} disabled={loading} className="w-full">
            <Send className="h-4 w-4 mr-2" />
            {loading ? "Envoi en cours…" : "Envoyer la facture"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
