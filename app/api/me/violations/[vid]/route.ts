import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getMigrantFromReq } from "@/lib/auth";

// POST /api/me/violations/[vid] — pay a fine (migrant pays their own violation)
export async function POST(req: NextRequest, { params }: { params: { vid: string } }) {
  const auth = await getMigrantFromReq(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify the violation belongs to this migrant
  const violation = await prisma.violation.findUnique({ where: { id: params.vid } });
  if (!violation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (violation.migrantId !== auth.sub) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (violation.fineStatus === "paid") return NextResponse.json({ error: "Already paid" }, { status: 400 });

  const today = new Date().toISOString().split("T")[0];

  // Mark violation as paid
  const updated = await prisma.violation.update({
    where: { id: params.vid },
    data: { fineStatus: "paid" },
  });

  // Create payment record in history
  await prisma.payment.create({
    data: {
      migrantId: auth.sub,
      type: "fine",
      amount: violation.fine,
      currency: "RUB",
      date: today,
      status: "paid",
      description: `Штраф: ${violation.type}`,
    },
  });

  return NextResponse.json(updated);
}
