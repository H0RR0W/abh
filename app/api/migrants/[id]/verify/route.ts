import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffFromReq } from "@/lib/auth";

// PATCH — инспектор вручную подтверждает или отклоняет верификацию
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await getStaffFromReq(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { status } = await req.json();
  if (!["verified", "rejected", "unverified"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const migrant = await prisma.migrant.update({
    where: { id: params.id },
    data: { identityStatus: status },
  });

  // Если подтверждено — пишем уведомление в чат
  if (status === "verified") {
    await prisma.chatMessage.create({
      data: {
        migrantId: params.id,
        from: "staff",
        text: "✅ Ваша личность успешно подтверждена. Верификация пройдена.",
      },
    });
  } else if (status === "rejected") {
    await prisma.chatMessage.create({
      data: {
        migrantId: params.id,
        from: "staff",
        text: "❌ Верификация отклонена. Пожалуйста, сделайте новое selfie и убедитесь, что лицо чётко видно и совпадает с документом.",
      },
    });
  }

  return NextResponse.json({ identityStatus: migrant.identityStatus });
}
