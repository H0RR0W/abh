import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffFromReq } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const staff = await getStaffFromReq(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const migrants = await prisma.migrant.findMany({
    orderBy: { lastName: "asc" },
  });

  const headers = [
    "ID", "Фамилия", "Имя", "Гражданство", "Паспорт", "Телефон",
    "Статус", "Рег. до", "Патент до", "Работодатель", "Нарушения",
  ];

  const rows = migrants.map((m) =>
    [
      m.id, m.lastName, m.firstName, m.citizenship, m.passportNumber,
      m.phone, m.status, m.registrationExpiry, m.patentExpiry ?? "",
      m.employer ?? "", m.violations,
    ].join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");
  const bom = "﻿";

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="migrants-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
