import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { phone } = await req.json();
  if (!phone) return NextResponse.json({ error: "Укажите телефон" }, { status: 400 });

  const migrant = await prisma.migrant.findFirst({ where: { phone } });
  if (!migrant) {
    return NextResponse.json({ error: "Номер не зарегистрирован в системе" }, { status: 404 });
  }

  const code = Math.floor(1000 + Math.random() * 9000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.smsCode.create({ data: { phone, code, expiresAt } });

  console.log(`[SMS DEMO] Код для ${phone}: ${code}`);

  return NextResponse.json({ ok: true, hint: `Демо-код: ${code}` });
}
