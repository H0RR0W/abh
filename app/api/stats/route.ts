import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffFromReq } from "@/lib/auth";
import { autoExpireMigrants } from "@/lib/autoExpire";

export async function GET(req: NextRequest) {
  const staff = await getStaffFromReq(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await autoExpireMigrants();

  // Status counts
  const [total, active, expired, blocked] = await Promise.all([
    prisma.migrant.count(),
    prisma.migrant.count({ where: { status: "active" } }),
    prisma.migrant.count({ where: { status: "expired" } }),
    prisma.migrant.count({ where: { status: "blocked" } }),
  ]);

  // Monthly data — last 6 months
  const now = new Date();
  const MONTH_NAMES = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];

  // All migrants (registrationDate as string "YYYY-MM-DD")
  const allMigrants = await prisma.migrant.findMany({ select: { registrationDate: true } });

  // All paid payments
  const allPayments = await prisma.payment.findMany({
    where: { status: "paid" },
    select: { date: true, amount: true },
  });

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();

    const registrations = allMigrants.filter((m) => {
      const rd = new Date(m.registrationDate);
      return rd.getFullYear() === year && rd.getMonth() === month;
    }).length;

    const payments = allPayments
      .filter((p) => {
        const pd = new Date(p.date);
        return pd.getFullYear() === year && pd.getMonth() === month;
      })
      .reduce((sum, p) => sum + p.amount, 0);

    return { month: MONTH_NAMES[month], registrations, payments };
  });

  // Citizenship breakdown
  const all = await prisma.migrant.findMany({ select: { citizenship: true } });
  const citizenshipStats = all.reduce((acc, m) => {
    acc[m.citizenship] = (acc[m.citizenship] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const citizenshipData = Object.entries(citizenshipStats)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  // Total paid revenue
  const paidPayments = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { status: "paid" },
  });

  return NextResponse.json({
    total,
    active,
    expired,
    blocked,
    monthlyData,
    citizenshipData,
    totalRevenue: paidPayments._sum.amount ?? 0,
  });
}
