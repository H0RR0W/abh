import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getMigrantFromReq } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET(req: NextRequest) {
  const auth = await getMigrantFromReq(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const docs = await prisma.document.findMany({
    where: { migrantId: auth.sub },
    orderBy: { uploadedAt: "desc" },
  });
  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  const auth = await getMigrantFromReq(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const type = formData.get("type") as string;
  const name = formData.get("name") as string;

  let filePath: string | null = null;
  if (file) {
    const dir = path.join(process.cwd(), "uploads", auth.sub);
    await mkdir(dir, { recursive: true });
    const filename = `${Date.now()}-${file.name}`;
    await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
    filePath = `/api/uploads/${auth.sub}/${filename}`;
  }

  const doc = await prisma.document.create({
    data: {
      migrantId: auth.sub,
      type: type ?? "other",
      name: name ?? file?.name ?? "Документ",
      status: "pending",
      filePath,
    },
  });
  return NextResponse.json(doc, { status: 201 });
}
