import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffFromReq } from "@/lib/auth";

// Returns active migrants whose lastSeen is older than THRESHOLD hours
const THRESHOLD_HOURS = 24;

export async function GET(req: NextRequest) {
  const staff = await getStaffFromReq(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const since = new Date(Date.now() - THRESHOLD_HOURS * 60 * 60 * 1000);

  const migrants = await prisma.migrant.findMany({
    where: {
      status: "active",
      lastSeen: { lt: since },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      lastSeen: true,
      address: true,
    },
    orderBy: { lastSeen: "asc" }, // oldest first
  });

  return NextResponse.json({ migrants, thresholdHours: THRESHOLD_HOURS });
}
