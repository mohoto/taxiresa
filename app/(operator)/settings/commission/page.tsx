import { prisma } from "@/lib/prisma";
import { CommissionSettingsForm } from "@/components/operator/settings/commission-settings-form";

async function getOrCreateSettings() {
  const existing = await prisma.fareSettings.findFirst();
  if (existing) return existing;
  return prisma.fareSettings.create({ data: {} });
}

export default async function CommissionPage() {
  const settings = await getOrCreateSettings();

  return (
    <>
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 mb-6">
        Commission
      </h2>
      <CommissionSettingsForm initialCommissionPct={settings.commissionPct} />
    </>
  );
}
