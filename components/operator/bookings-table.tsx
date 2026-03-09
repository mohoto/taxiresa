"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { BookingWithRelations, BookingStatus } from "@/types/booking";

interface BookingsTableProps {
  bookings: BookingWithRelations[];
}

interface StatusConfig {
  label: string;
  variant: "secondary" | "success" | "info" | "default" | "destructive";
}

const STATUS_CONFIG: Record<BookingStatus, StatusConfig> = {
  PENDING: { label: "En attente", variant: "secondary" },
  ACCEPTED: { label: "Acceptée", variant: "success" },
  IN_PROGRESS: { label: "En cours", variant: "info" },
  COMPLETED: { label: "Terminée", variant: "default" },
  CANCELLED: { label: "Annulée", variant: "destructive" },
  NO_SHOW: { label: "No show", variant: "destructive" },
};

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BookingsTable({ bookings }: BookingsTableProps) {
  if (bookings.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Aucune réservation aujourd'hui
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Heure</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Téléphone</TableHead>
          <TableHead>Départ</TableHead>
          <TableHead>Arrivée</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Prix estimé</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Chauffeur</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((booking) => {
          const statusConfig = STATUS_CONFIG[booking.status];
          return (
            <TableRow key={booking.id}>
              <TableCell className="tabular-nums">
                {formatTime(booking.createdAt)}
              </TableCell>
              <TableCell className="font-medium">{booking.clientName}</TableCell>
              <TableCell>{booking.clientPhone}</TableCell>
              <TableCell className="max-w-[160px] truncate">
                {booking.pickupAddress}
              </TableCell>
              <TableCell className="max-w-[160px] truncate">
                {booking.dropAddress}
              </TableCell>
              <TableCell>
                {booking.type === "IMMEDIATE" ? "Immédiate" : "Planifiée"}
              </TableCell>
              <TableCell className="tabular-nums">
                {booking.estimatedPrice != null
                  ? `${Math.round(booking.estimatedPrice)}€`
                  : <span className="text-zinc-400">—</span>}
              </TableCell>
              <TableCell>
                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
              </TableCell>
              <TableCell>
                {booking.acceptance ? (
                  <span className="text-sm">
                    {booking.acceptance.driver.name}
                  </span>
                ) : (
                  <span className="text-sm text-zinc-400">—</span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
