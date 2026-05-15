import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    const token = req.cookies.get("staff_token")?.value;
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    const payload = await verifyToken(token);
    if (!payload || payload.type !== "staff")
      return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/migrant/cabinet")) {
    const token = req.cookies.get("migrant_token")?.value;
    if (!token) return NextResponse.redirect(new URL("/migrant/login", req.url));
    const payload = await verifyToken(token);
    if (!payload || payload.type !== "migrant")
      return NextResponse.redirect(new URL("/migrant/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/migrant/cabinet/:path*"],
};
