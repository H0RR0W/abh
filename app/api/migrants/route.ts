import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { autoExpireMigrants } from "@/lib/autoExpire";

export async function GET(req: NextRequest) {
  const staff = await requireRole(req, "migrants.view");
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Автоматически переводим просроченных в expired
  await autoExpireMigrants();

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const citizenship = searchParams.get("citizenship") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
  const skip = (page - 1) * limit;

  // Build district filter for inspector/operator roles
  let districtFilter: { district?: { in: string[] } } = {};
  if (staff.role === "inspector" || staff.role === "operator") {
    const staffUser = await prisma.staffUser.findUnique({
      where: { id: staff.sub },
      select: { districts: true },
    });
    const assignedDistricts = JSON.parse(staffUser?.districts ?? "[]") as string[];
    districtFilter = { district: { in: assignedDistricts } };
  }

  const where = {
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
      Object.keys(districtFilter).length > 0 ? districtFilter : {},
    ],
  };

  const [migrants, total] = await Promise.all([
    prisma.migrant.findMany({
      where,
      include: { documents: false, payments: false },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.migrant.count({ where }),
  ]);

  return NextResponse.json({
    data: migrants,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const staff = await requireRole(req, "migrants.edit");
  if (!staff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
      employed: body.employed ?? false,
      employer: (body.employed && body.employer) ? body.employer : null,
      address: body.address,
      lat: body.lat ?? 43.0016,
      lng: body.lng ?? 41.0234,
    },
  });
  return NextResponse.json(migrant, { status: 201 });
}
