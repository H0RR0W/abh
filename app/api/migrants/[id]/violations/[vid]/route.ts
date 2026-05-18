import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffFromReq } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string; vid: string } }) {
  const staff = await getStaffFromReq(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const allowed = ["fineStatus", "type", "description", "severity", "date", "fine"];
  const data: Record<string, unknown> = {};
  for (const k of allowed) if (k in body) data[k] = body[k];
  const violation = await prisma.violation.update({ where: { id: params.vid }, data });
  return NextResponse.json(violation);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string; vid: string } }) {
  const staff = await getStaffFromReq(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.violation.delete({ where: { id: params.vid } });
  await prisma.migrant.update({ where: { id: params.id }, data: { violations: { decrement: 1 } } });
  return NextResponse.json({ ok: true });
}
