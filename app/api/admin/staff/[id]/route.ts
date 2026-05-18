import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireRole(req, "staff.manage");
  if (!staff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = params;
  const body = await req.json();
  const { role, districts } = body;

  const updateData: Record<string, unknown> = {};

  if (role !== undefined) {
    const validRoles = ["admin", "inspector", "operator", "analyst", "management"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    updateData.role = role;
  }

  if (districts !== undefined && Array.isArray(districts)) {
    updateData.districts = JSON.stringify(districts);
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const updated = await prisma.staffUser.update({
    where: { id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, createdAt: true, districts: true },
  });

  return NextResponse.json({
    user: { ...updated, districts: JSON.parse(updated.districts ?? "[]") as string[] },
  });
}
