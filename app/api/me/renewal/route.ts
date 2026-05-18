import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getMigrantFromReq } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const migrant = await getMigrantFromReq(req);
  if (!migrant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const m = await prisma.migrant.findUnique({
    where: { id: migrant.sub },
    select: { firstName: true, lastName: true, registrationExpiry: true },
  });

  if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const inspection = await prisma.inspection.create({
    data: {
      migrantId: migrant.sub,
      type: "renewal",
      date: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
      inspector: "Не назначен",
      note: `Онлайн-заявка на продление регистрации. Текущий срок: ${m.registrationExpiry}`,
      status: "pending",
    },
  });

  await prisma.chatMessage.create({
    data: {
      migrantId: migrant.sub,
      from: "staff",
      text: `✅ Ваша заявка на продление регистрации принята. Инспектор свяжется с вами в течение 1–3 рабочих дней. Номер заявки: ${inspection.id.slice(0, 8).toUpperCase()}`,
    },
  });

  return NextResponse.json({ ok: true, inspectionId: inspection.id });
}
