import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== (process.env.CRON_SECRET ?? "demo-secret")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const threshold = Math.max(1, parseInt(req.nextUrl.searchParams.get("threshold") ?? "30"));

  const migrants = await prisma.migrant.findMany({
    where: { status: "active" },
    select: { id: true, firstName: true, lastName: true, registrationExpiry: true },
  });

  let sent = 0;

  for (const m of migrants) {
    const days = daysUntil(m.registrationExpiry);

    if (days < 1 || days > threshold) continue;

    const text =
      days === 1
        ? `⚠️ Завтра истекает срок вашей регистрации! Срочно обратитесь в миграционную службу или подайте заявку на продление через личный кабинет.`
        : `📋 Уведомление: до истечения срока регистрации осталось ${days} дней (до ${m.registrationExpiry}). Не забудьте продлить регистрацию заранее.`;

    await prisma.chatMessage.create({
      data: {
        migrantId: m.id,
        from: "staff",
        text,
      },
    });

    sent++;
  }

  return NextResponse.json({ ok: true, sent, checked: migrants.length, threshold });
}
