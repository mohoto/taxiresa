import { prisma } from "@/lib/prisma";
import { DriversTable } from "@/components/operator/drivers-table";
import { AddDriverDialog } from "@/components/operator/add-driver-dialog";

export default async function DriversPage() {
  const drivers = await prisma.driver.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { acceptances: true } },
    },
  });

  const serialized = drivers.map((d) => ({
    ...d,
    createdAt: d.createdAt.toISOString(),
  }));

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Chauffeurs
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {drivers.length} chauffeur{drivers.length > 1 ? "s" : ""} enregistré{drivers.length > 1 ? "s" : ""}
          </p>
        </div>
        <AddDriverDialog />
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <DriversTable drivers={serialized} />
      </div>
    </div>
  );
}
