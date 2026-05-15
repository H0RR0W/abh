import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signMigrantToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { phone, code } = await req.json();

  const smsCode = await prisma.smsCode.findFirst({
    where: {
      phone,
      code,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { expiresAt: "desc" },
  });

  if (!smsCode) {
    return NextResponse.json({ error: "Неверный или истёкший код" }, { status: 401 });
  }

  await prisma.smsCode.update({ where: { id: smsCode.id }, data: { used: true } });

  const migrant = await prisma.migrant.findFirst({ where: { phone } });
  if (!migrant) return NextResponse.json({ error: "Мигрант не найден" }, { status: 404 });

  const token = await signMigrantToken({ sub: migrant.id, phone: migrant.phone });

  const res = NextResponse.json({ ok: true });
  res.cookies.set("migrant_token", token, {
    httpOnly: true,
    path: "/",
    maxAge: 24 * 3600,
    sameSite: "lax",
  });
  return res;
}
