import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getMigrantFromReq } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await getMigrantFromReq(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const migrant = await prisma.migrant.findUnique({
    where: { id: auth.sub },
    include: {
      documents: { orderBy: { uploadedAt: "desc" } },
      payments: { orderBy: { date: "desc" } },
    },
  });

  if (!migrant) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(migrant);
}
