import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getMigrantFromReq } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// POST — загрузить selfie и запустить верификацию
export async function POST(req: NextRequest) {
  const auth = await getMigrantFromReq(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("selfie") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const dir = path.join(process.cwd(), "uploads", "selfies");
  await mkdir(dir, { recursive: true });
  const filename = `${auth.sub}-${Date.now()}.jpg`;
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
  const selfiePath = `/api/uploads/selfies/${filename}`;

  // Обновляем selfie и переводим статус в "pending" (на проверке)
  const migrant = await prisma.migrant.update({
    where: { id: auth.sub },
    data: { selfiePhoto: selfiePath, identityStatus: "pending" },
  });

  // Создаём задачу инспектору
  await prisma.inspection.create({
    data: {
      migrantId: auth.sub,
      type: "verification",
      date: new Date().toISOString().split("T")[0],
      inspector: "Не назначен",
      note: "Мигрант отправил selfie для верификации личности. Необходимо сверить с паспортом и подтвердить или отклонить.",
      status: "pending",
    },
  });

  return NextResponse.json({ selfiePhoto: migrant.selfiePhoto, identityStatus: migrant.identityStatus });
}
