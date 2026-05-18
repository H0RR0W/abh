import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, getMigrantFromReq } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { migrantId: string } }) {
  const staff = await requireRole(req, "messages.view");
  const migrant = await getMigrantFromReq(req);
  if (!staff && !migrant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { migrantId } = params;
  const messages = await prisma.chatMessage.findMany({
    where: { migrantId },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest, { params }: { params: { migrantId: string } }) {
  const staff = await requireRole(req, "messages.send");
  const migrant = await getMigrantFromReq(req);
  if (!staff && !migrant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { migrantId } = params;
  const { text } = await req.json();
  const from = staff ? "service" : "migrant";

  const message = await prisma.chatMessage.create({
    data: { migrantId, from, text },
  });
  return NextResponse.json(message, { status: 201 });
}
