# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server on http://localhost:3000
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test suite is configured yet.

## Architecture

This is a fresh Next.js 16 project using the App Router with TypeScript, React 19, and Tailwind CSS v4.

- `app/` — App Router directory. `layout.tsx` is the root layout; `page.tsx` is the home route.
- `app/globals.css` — Global styles (Tailwind entry point).
- `public/` — Static assets served at the root path.
- `@/*` path alias maps to the project root (e.g. `@/app/...`, `@/components/...`).

**Styling:** Tailwind CSS v4 via `@tailwindcss/postcss`. No `tailwind.config` file — configuration is done in CSS using `@theme` if needed.

**Fonts:** Geist Sans and Geist Mono loaded via `next/font/google` in the root layout.

**ESLint:** Uses `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript` with flat config format (`eslint.config.mjs`).

# Contexte du projet

Application de réservation de taxi interne.
Un opérateur reçoit des appels clients et saisit les réservations
depuis cette interface. Les réservations sont ensuite envoyées
automatiquement sur un groupe Telegram pour être acceptées
par les chauffeurs.

# Stack technique

- Next.js 15 (App Router)
- TypeScript strict (aucun `any`, interfaces obligatoires)
- Tailwind CSS v4
- coss.com/ui (shadcn CLI : `pnpm dlx shadcn@latest init coss/style`)
- Prisma ORM + PostgreSQL (Supabase)
- Better Auth

# Configuration Supabase + Prisma

## Variables d'environnement

Dans `.env` :

```env
# Supabase — récupère ces URLs dans ton dashboard Supabase
# Settings > Database > Connection string

# Pour Prisma (Transaction mode — port 6543)
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Pour les migrations Prisma (Session mode — port 5432)
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

## Configuration du schema Prisma

Dans `prisma/schema.prisma`, le bloc `datasource` doit être :

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

`directUrl` est obligatoire avec Supabase pour que les migrations
`prisma migrate dev` passent par une connexion directe
et non par le connection pooler PgBouncer.

## Commandes à exécuter

```bash
npx prisma migrate dev --name init
npx prisma studio
```

## Client Prisma — singleton

Crée `lib/prisma.ts` :

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

Ce pattern singleton évite de créer de nouvelles connexions
à chaque hot-reload en développement, ce qui épuiserait
rapidement le pool de connexions Supabase.

# Tâche : Créer l'interface opérateur

## 1. Schéma Prisma

Crée ou mets à jour `prisma/schema.prisma` avec les modèles suivants :

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model Operator {
  id        String    @id @default(cuid())
  name      String
  email     String    @unique
  bookings  Booking[]
  createdAt DateTime  @default(now())
}

model Booking {
  id            String        @id @default(cuid())
  operatorId    String
  operator      Operator      @relation(fields: [operatorId], references: [id])
  clientName    String
  clientPhone   String
  pickupAddress String
  dropAddress   String
  type          BookingType
  scheduledAt   DateTime?
  status        BookingStatus @default(PENDING)
  notes         String?
  telegramMsgId String?
  acceptance    Acceptance?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}

model Driver {
  id          String       @id @default(cuid())
  name        String
  phone       String
  telegramId  String       @unique
  isAvailable Boolean      @default(true)
  acceptances Acceptance[]
  createdAt   DateTime     @default(now())
}

model Acceptance {
  id          String    @id @default(cuid())
  bookingId   String    @unique
  booking     Booking   @relation(fields: [bookingId], references: [id])
  driverId    String
  driver      Driver    @relation(fields: [driverId], references: [id])
  acceptedAt  DateTime  @default(now())
  completedAt DateTime?
}

enum BookingType {
  IMMEDIATE
  SCHEDULED
}

enum BookingStatus {
  PENDING
  ACCEPTED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

## 2. Types TypeScript

Crée `types/booking.ts` avec les interfaces suivantes :

```typescript
export interface CreateBookingPayload {
  clientName: string;
  clientPhone: string;
  pickupAddress: string;
  dropAddress: string;
  type: "IMMEDIATE" | "SCHEDULED";
  scheduledAt?: string;
  notes?: string;
}

export interface BookingWithRelations {
  id: string;
  clientName: string;
  clientPhone: string;
  pickupAddress: string;
  dropAddress: string;
  type: "IMMEDIATE" | "SCHEDULED";
  scheduledAt: string | null;
  status: "PENDING" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  notes: string | null;
  createdAt: string;
  operator: { name: string };
  acceptance: {
    driver: { name: string; phone: string };
    acceptedAt: string;
  } | null;
}
```

## 3. API Route — Créer une réservation

Crée `app/api/bookings/route.ts` :

- `POST` : valide le body avec Zod, crée la réservation en BDD via Prisma,
  puis appelle la fonction `sendTelegramMessage(booking)` (stub pour l'instant
  qui log la réservation en console), retourne la réservation créée
- `GET` : retourne toutes les réservations du jour (filtre sur `createdAt`
  > = début du jour courant), triées par `createdAt` desc,
  > avec `include: { operator: true, acceptance: { include: { driver: true } } }`

Schéma Zod pour la validation :

```typescript
const createBookingSchema = z.object({
  clientName: z.string().min(2),
  clientPhone: z.string().min(8),
  pickupAddress: z.string().min(5),
  dropAddress: z.string().min(5),
  type: z.enum(["IMMEDIATE", "SCHEDULED"]),
  scheduledAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});
```

## 4. Page principale opérateur

Crée `app/(operator)/dashboard/page.tsx` comme Server Component.
Elle fetch les réservations du jour via Prisma directement
(pas via fetch API, accès direct BDD).

Layout de la page :

- En-tête avec le titre "Dashboard Opérateur" + bouton
  "Nouvelle réservation" qui ouvre un Dialog
- Grille 3 colonnes pour les stats du jour :
  Total courses / En attente / Acceptées
- Liste des réservations du jour sous forme de tableau

## 5. Composant — Formulaire de création

Crée `components/operator/booking-form.tsx` comme Client Component.

Ce composant est le cœur de l'interface opérateur. Il doit être
optimisé pour la saisie rapide au téléphone.

Utilise `react-hook-form` + Zod pour la validation.
Utilise les composants coss/ui : Form, Field, Input, Textarea,
RadioGroup, Button, Select.

Champs du formulaire dans cet ordre :

1. `clientName` — Input, label "Nom du client", autofocus
2. `clientPhone` — Input type tel, label "Téléphone"
3. `pickupAddress` — Input, label "Adresse de départ"
4. `dropAddress` — Input, label "Adresse d'arrivée"
5. `type` — RadioGroup horizontal : "Immédiate" | "Planifiée"
6. `scheduledAt` — DatePicker + TimePicker, visible uniquement
   si type === 'SCHEDULED', required si visible
7. `notes` — Textarea optionnel, label "Notes"

Comportement du submit :

- Désactive le bouton pendant la soumission (loading state)
- En cas de succès : affiche un Toast "✅ Course #[id] envoyée sur Telegram"
  puis reset le formulaire
- En cas d'erreur : affiche un Toast destructif avec le message d'erreur

## 6. Composant — Liste des réservations du jour

Crée `components/operator/bookings-table.tsx`.

Utilise le composant Table de coss/ui.

Colonnes : Heure | Client | Téléphone | Départ | Arrivée | Type | Statut | Chauffeur

Pour la colonne Statut, utilise le composant Badge avec ces variantes :

- PENDING → badge `secondary` + texte "En attente"
- ACCEPTED → badge `success` + texte "Acceptée"
- IN_PROGRESS → badge `info` + texte "En cours"
- COMPLETED → badge `default` + texte "Terminée"
- CANCELLED → badge `destructive` + texte "Annulée"

## 7. Composant — Dialog de nouvelle réservation

Crée `components/operator/new-booking-dialog.tsx`.

Wraps le BookingForm dans un Dialog coss/ui.
Après soumission réussie, ferme le Dialog et appelle
une callback `onSuccess` pour rafraîchir la liste
(utilise `router.refresh()` de Next.js).

# Règles de code obligatoires

- Aucun type `any`
- Toutes les interfaces dans `types/`
- Server Components pour les pages (data fetching direct Prisma)
- Client Components uniquement pour les formulaires et interactions
- Chaque composant dans son propre fichier
- Gestion d'erreur sur tous les appels async (try/catch)
- Importer Prisma toujours depuis `lib/prisma.ts`
- Pas de `console.log` en production (uniquement pour le stub Telegram)
- Consulter https://coss.com/ui/llms.txt pour les composants coss/ui
