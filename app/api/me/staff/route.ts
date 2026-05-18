import { NextRequest, NextResponse } from "next/server";
import { getStaffFromReq } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/roles";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const staff = await getStaffFromReq(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const staffUser = await prisma.staffUser.findUnique({
    where: { id: staff.sub },
    select: { districts: true, name: true },
  });
  const districts = JSON.parse(staffUser?.districts ?? "[]") as string[];

  return NextResponse.json({
    id: staff.sub,
    name: staffUser?.name ?? staff.name,
    email: staff.email,
    role: staff.role,
    roleLabel: ROLE_LABELS[staff.role] ?? staff.role,
    districts,
  });
}
