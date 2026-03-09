import { prisma } from "@/lib/prisma";
import { FareSettingsForm } from "@/components/operator/settings/fare-settings-form";

async function getOrCreateSettings() {
  const existing = await prisma.fareSettings.findFirst();
  if (existing) return existing;
  return prisma.fareSettings.create({ data: {} });
}

export default async function TarificationPage() {
  const settings = await getOrCreateSettings();

  return (
    <>
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 mb-6">
        Tarification
      </h2>
      <FareSettingsForm initialSettings={settings} />
    </>
  );
}
