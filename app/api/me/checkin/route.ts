import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getMigrantFromReq } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const migrant = await getMigrantFromReq(req);
  if (!migrant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const history = await prisma.locationHistory.findMany({
    where: { migrantId: migrant.sub },
    orderBy: { timestamp: "desc" },
    take: 50,
  });
  return NextResponse.json(history);
}

export async function POST(req: NextRequest) {
  const migrant = await getMigrantFromReq(req);
  if (!migrant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { lat, lng, address } = body;

  if (!lat || !lng) {
    return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.locationHistory.create({
      data: {
        migrantId: migrant.sub,
        lat,
        lng,
        address: address ?? "Местоположение подтверждено",
        timestamp: new Date(),
      },
    }),
    prisma.migrant.update({
      where: { id: migrant.sub },
      data: { lastSeen: new Date(), lat, lng },
    }),
  ]);

  return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
}
