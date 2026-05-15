import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("staff_token");
  res.cookies.delete("migrant_token");
  return res;
}
