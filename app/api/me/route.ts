import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getMigrantFromReq } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await getMigrantFromReq(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Авто-просрочка при входе в кабинет
  const today = new Date().toISOString().split("T")[0];
  await prisma.migrant.updateMany({
    where: { id: auth.sub, status: "active", registrationExpiry: { lt: today } },
    data: { status: "expired" },
  });

  const migrant = await prisma.migrant.findUnique({
    where: { id: auth.sub },
    include: {
      documents: { orderBy: { uploadedAt: "desc" } },
      payments: { orderBy: { date: "desc" } },
      violations2: { orderBy: { date: "desc" } },
    },
  });

  if (!migrant) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(migrant);
}

export async function PATCH(req: NextRequest) {
  const auth = await getMigrantFromReq(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const allowed = ["passportNumber", "passportSeries", "passportIssuedBy", "passportIssueDate", "passportExpiry"];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  const migrant = await prisma.migrant.update({
    where: { id: auth.sub },
    data,
  });
  return NextResponse.json(migrant);
}
