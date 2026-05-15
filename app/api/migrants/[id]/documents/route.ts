import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffFromReq } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await getStaffFromReq(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const docs = await prisma.document.findMany({
    where: { migrantId: id },
    orderBy: { uploadedAt: "desc" },
  });
  return NextResponse.json(docs);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await getStaffFromReq(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const type = formData.get("type") as string;
  const name = formData.get("name") as string;

  let filePath: string | null = null;
  if (file) {
    const dir = path.join(process.cwd(), "uploads", id);
    await mkdir(dir, { recursive: true });
    const filename = `${Date.now()}-${file.name}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, filename), buffer);
    filePath = `/api/uploads/${id}/${filename}`;
  }

  const doc = await prisma.document.create({
    data: {
      migrantId: id,
      type: type ?? "other",
      name: name ?? file?.name ?? "Документ",
      status: "pending",
      filePath,
    },
  });

  return NextResponse.json(doc, { status: 201 });
}
