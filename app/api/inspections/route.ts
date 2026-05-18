import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffFromReq } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const staff = await getStaffFromReq(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status");
  const type = req.nextUrl.searchParams.get("type");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {};
  if (status) where.status = status;
  if (type) where.type = type;

  const inspections = await prisma.inspection.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { migrant: { select: { firstName: true, lastName: true, address: true } } },
  });

  return NextResponse.json(inspections);
}

export async function POST(req: NextRequest) {
  const staff = await getStaffFromReq(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { migrantId, type, date, inspector, note } = body;

  if (!migrantId || !type || !date || !inspector) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const inspection = await prisma.inspection.create({
    data: { migrantId, type, date, inspector, note: note ?? "" },
  });

  return NextResponse.json(inspection, { status: 201 });
}
