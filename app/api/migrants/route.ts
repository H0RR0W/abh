import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffFromReq } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const staff = await getStaffFromReq(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const citizenship = searchParams.get("citizenship") ?? "";

  const migrants = await prisma.migrant.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { passportNumber: { contains: search } },
                { id: { contains: search } },
                { phone: { contains: search } },
              ],
            }
          : {},
        status ? { status } : {},
        citizenship ? { citizenship } : {},
      ],
    },
    include: { documents: true, payments: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(migrants);
}

export async function POST(req: NextRequest) {
  const staff = await getStaffFromReq(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const id = `MIG-${Date.now()}`;

  const migrant = await prisma.migrant.create({
    data: {
      id,
      firstName: body.firstName,
      lastName: body.lastName,
      middleName: body.middleName ?? "",
      citizenship: body.citizenship,
      passportNumber: body.passportNumber,
      phone: body.phone,
      birthDate: body.birthDate,
      status: "active",
      registrationDate: body.registrationDate,
      registrationExpiry: body.registrationExpiry,
      patentNumber: body.patentNumber ?? null,
      patentExpiry: body.patentExpiry ?? null,
      employer: body.employer ?? null,
      address: body.address,
      lat: body.lat ?? 43.0016,
      lng: body.lng ?? 41.0234,
    },
  });

  return NextResponse.json(migrant, { status: 201 });
}
