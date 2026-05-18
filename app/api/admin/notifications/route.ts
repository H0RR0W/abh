import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffFromReq } from "@/lib/auth";

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins} мин назад`;
  if (hours < 24) return `${hours} ч назад`;
  return `${days} д назад`;
}

function fullName(m: { firstName: string; lastName: string }) {
  return `${m.lastName} ${m.firstName[0]}.`;
}

export async function GET(req: NextRequest) {
  const staff = await getStaffFromReq(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000); // last 7 days

  const [blocked, expired, payments, violations] = await Promise.all([
    // Recently blocked migrants
    prisma.migrant.findMany({
      where: { status: "blocked", updatedAt: { gte: since } },
      select: { id: true, firstName: true, lastName: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    // Recently expired migrants
    prisma.migrant.findMany({
      where: { status: "expired", updatedAt: { gte: since } },
      select: { id: true, firstName: true, lastName: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    // Recent paid payments (sort by cuid = creation order)
    prisma.payment.findMany({
      where: { status: "paid" },
      select: { id: true, migrantId: true, amount: true, type: true, date: true, migrant: { select: { firstName: true, lastName: true } } },
      orderBy: { id: "desc" },
      take: 5,
    }),
    // Recent violations added
    prisma.violation.findMany({
      where: { createdAt: { gte: since } },
      select: { id: true, type: true, fine: true, createdAt: true, migrant: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  type NotifType = "blocked" | "expired" | "payment" | "violation";

  const items: { type: NotifType; text: string; href: string; timestamp: string }[] = [];

  for (const m of blocked) {
    items.push({
      type: "blocked",
      text: `${fullName(m)} заблокирован`,
      href: `/admin/migrants/${m.id}`,
      timestamp: m.updatedAt.toISOString(),
    });
  }

  for (const m of expired) {
    items.push({
      type: "expired",
      text: `${fullName(m)}: срок регистрации истёк`,
      href: `/admin/migrants/${m.id}`,
      timestamp: m.updatedAt.toISOString(),
    });
  }

  for (const p of payments) {
    const typeLabel = p.type === "fine" ? "Штраф оплачен" : p.type === "patent" ? "Оплата патента" : "Платёж";
    const amount = p.amount.toLocaleString("ru-RU");
    items.push({
      type: "payment",
      text: `${typeLabel}: ${fullName(p.migrant)} — ${amount} ₽`,
      href: `/admin/migrants/${p.migrantId}?tab=payments`,
      timestamp: new Date(p.date + "T12:00:00").toISOString(),
    });
  }

  for (const v of violations) {
    items.push({
      type: "violation",
      text: `Нарушение: ${fullName(v.migrant)} — ${v.type}`,
      href: `/admin/migrants/${v.migrant.id}?tab=violations`,
      timestamp: v.createdAt.toISOString(),
    });
  }

  // Sort by timestamp desc, take top 10
  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const top = items.slice(0, 10);

  const result = top.map((n) => ({
    ...n,
    time: timeAgo(new Date(n.timestamp)),
  }));

  return NextResponse.json({ notifications: result });
}
