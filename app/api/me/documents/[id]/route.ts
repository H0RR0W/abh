import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getMigrantFromReq } from "@/lib/auth";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

// DELETE /api/me/documents/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getMigrantFromReq(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const doc = await prisma.document.findUnique({ where: { id: params.id } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (doc.migrantId !== auth.sub) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Remove file from disk if it exists
  if (doc.filePath) {
    try {
      const filename = doc.filePath.split("/").pop()!;
      const filePath = path.join(process.cwd(), "uploads", auth.sub, filename);
      await unlink(filePath);
    } catch {
      // ignore if file doesn't exist
    }
  }

  await prisma.document.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

// PUT /api/me/documents/[id] — replace file, reset status to pending
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getMigrantFromReq(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const doc = await prisma.document.findUnique({ where: { id: params.id } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (doc.migrantId !== auth.sub) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const name = formData.get("name") as string | null;

  let filePath = doc.filePath;
  if (file) {
    const dir = path.join(process.cwd(), "uploads", auth.sub);
    await mkdir(dir, { recursive: true });
    const filename = `${Date.now()}-${file.name}`;
    await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
    filePath = `/api/uploads/${auth.sub}/${filename}`;
  }

  const updated = await prisma.document.update({
    where: { id: params.id },
    data: {
      filePath,
      name: name ?? doc.name,
      status: "pending", // reset to pending after replacement
    },
  });
  return NextResponse.json(updated);
}
