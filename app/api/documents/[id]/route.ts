import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffFromReq } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await getStaffFromReq(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { status } = await req.json();
  if (!["pending", "verified", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const doc = await prisma.document.update({
    where: { id: params.id },
    data: { status },
  });
  return NextResponse.json(doc);
}
