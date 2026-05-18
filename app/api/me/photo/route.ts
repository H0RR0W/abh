import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getMigrantFromReq } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const auth = await getMigrantFromReq(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("photo") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const allowed = ["jpg", "jpeg", "png", "webp", "heic"];
  if (!allowed.includes(ext)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  const dir = path.join(process.cwd(), "uploads", "photos");
  await mkdir(dir, { recursive: true });
  const filename = `${auth.sub}.${ext}`;
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
  const photoPath = `/api/uploads/photos/${filename}`;

  await prisma.migrant.update({
    where: { id: auth.sub },
    data: { photo: photoPath },
  });

  return NextResponse.json({ photo: photoPath });
}
