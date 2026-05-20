import { prisma } from "@/lib/db";

/**
 * Автоматически переводит мигрантов с истёкшей регистрацией в статус 'expired'.
 * Не трогает заблокированных (blocked).
 */
export async function autoExpireMigrants(): Promise<number> {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const result = await prisma.migrant.updateMany({
    where: {
      status: "active",
      registrationExpiry: { lt: today },
    },
    data: {
      status: "expired",
    },
  });

  return result.count;
}
