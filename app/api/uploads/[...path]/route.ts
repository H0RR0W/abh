import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { getStaffFromReq, getMigrantFromReq } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const staff = await getStaffFromReq(req);
  const migrant = await getMigrantFromReq(req);
  if (!staff && !migrant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { path: pathSegments } = params;
  const filePath = path.join(process.cwd(), "uploads", ...pathSegments);
  try {
    const file = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType =
      ext === ".pdf" ? "application/pdf" :
      ext === ".png" ? "image/png" :
      ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" :
      "application/octet-stream";
    return new NextResponse(file, { headers: { "Content-Type": contentType } });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
