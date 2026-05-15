import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffFromReq } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await getStaffFromReq(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const payments = await prisma.payment.findMany({
    where: { migrantId: id },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(payments);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await getStaffFromReq(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const body = await req.json();
  const payment = await prisma.payment.create({
    data: {
      migrantId: id,
      type: body.type,
      amount: body.amount,
      currency: body.currency ?? "RUB",
      date: body.date ?? new Date().toISOString().split("T")[0],
      status: body.status ?? "paid",
      description: body.description,
    },
  });

  return NextResponse.json(payment, { status: 201 });
}
