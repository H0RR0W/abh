import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffFromReq } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await getStaffFromReq(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const migrant = await prisma.migrant.findUnique({
    where: { id },
    include: {
      documents: { orderBy: { uploadedAt: "desc" } },
      payments: { orderBy: { date: "desc" } },
      locationHistory: { orderBy: { timestamp: "desc" } },
      chatMessages: { orderBy: { createdAt: "asc" }, take: 50 },
    },
  });

  if (!migrant) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(migrant);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await getStaffFromReq(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const body = await req.json();
  const allowed = [
    "status", "firstName", "lastName", "middleName", "citizenship",
    "passportNumber", "phone", "birthDate", "registrationDate",
    "registrationExpiry", "patentNumber", "patentExpiry", "employer",
    "address", "violations", "lat", "lng",
  ];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  const migrant = await prisma.migrant.update({ where: { id }, data });
  return NextResponse.json(migrant);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await getStaffFromReq(req);
  if (!staff || staff.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = params;
  await prisma.migrant.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
