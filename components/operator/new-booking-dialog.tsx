"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogTrigger,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogPanel,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookingForm } from "@/components/operator/booking-form";

export function NewBookingDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => setOpen(v)} disablePointerDismissal>
      <DialogTrigger render={<Button />}>Nouvelle réservation</DialogTrigger>
      <DialogPopup showCloseButton>
        <DialogHeader>
          <DialogTitle>Nouvelle réservation</DialogTitle>
        </DialogHeader>
        <DialogPanel>
          <BookingForm onSuccess={handleSuccess} />
        </DialogPanel>
      </DialogPopup>
    </Dialog>
  );
}
