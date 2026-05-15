import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getMigrantFromReq } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await getMigrantFromReq(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payments = await prisma.payment.findMany({
    where: { migrantId: auth.sub },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(payments);
}

export async function POST(req: NextRequest) {
  const auth = await getMigrantFromReq(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const payment = await prisma.payment.create({
    data: {
      migrantId: auth.sub,
      type: body.type ?? "patent",
      amount: body.amount ?? 3000,
      currency: "RUB",
      date: new Date().toISOString().split("T")[0],
      status: "paid",
      description: body.description ?? `Патент ${new Date().toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}`,
    },
  });
  return NextResponse.json(payment, { status: 201 });
}
