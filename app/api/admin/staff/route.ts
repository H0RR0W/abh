import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const staff = await requireRole(req, "staff.manage");
  if (!staff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rawUsers = await prisma.staffUser.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true, districts: true },
    orderBy: { createdAt: "asc" },
  });

  const users = rawUsers.map((u) => ({
    ...u,
    districts: JSON.parse(u.districts ?? "[]") as string[],
  }));

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const staff = await requireRole(req, "staff.manage");
  if (!staff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, email, role, districts } = body;

  if (!name || !email || !role) {
    return NextResponse.json({ error: "name, email, role are required" }, { status: 400 });
  }

  const validRoles = ["admin", "inspector", "operator", "analyst", "management"];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const existing = await prisma.staffUser.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const tempPassword = "Demo1234!";
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const newUser = await prisma.staffUser.create({
    data: { name, email, role, password: passwordHash, districts: JSON.stringify(districts ?? []) },
    select: { id: true, name: true, email: true, role: true, createdAt: true, districts: true },
  });

  return NextResponse.json({
    user: { ...newUser, districts: JSON.parse(newUser.districts ?? "[]") as string[] },
    tempPassword,
  }, { status: 201 });
}
