import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffFromReq } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await getStaffFromReq(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const violations = await prisma.violation.findMany({
    where: { migrantId: params.id },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(violations);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await getStaffFromReq(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { type, description, severity, date, fine } = body;
  if (!type || !date) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const violation = await prisma.violation.create({
    data: {
      migrantId: params.id,
      type,
      description: description ?? "",
      severity: severity ?? "medium",
      date,
      fine: fine ?? 0,
      fineStatus: "unpaid",
    },
  });
  // Increment violations counter on migrant
  await prisma.migrant.update({ where: { id: params.id }, data: { violations: { increment: 1 } } });
  return NextResponse.json(violation, { status: 201 });
}
