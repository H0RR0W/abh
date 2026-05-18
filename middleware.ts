import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { hasPermission, Permission } from "@/lib/roles";

// Map of protected page routes to required permission
const ROUTE_PERMISSIONS: { prefix: string; permission: Permission }[] = [
  { prefix: "/admin/map", permission: "map.view" },
  { prefix: "/admin/reports", permission: "reports.view" },
  { prefix: "/admin/alerts", permission: "alerts.view" },
  { prefix: "/admin/messages", permission: "messages.view" },
  { prefix: "/admin/staff", permission: "staff.manage" },
  { prefix: "/admin/tasks", permission: "tasks.view" },
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    const token = req.cookies.get("staff_token")?.value;
    if (!token) return NextResponse.redirect(new URL("/login", req.url));

    const payload = await verifyToken(token);
    if (!payload || payload.type !== "staff")
      return NextResponse.redirect(new URL("/login", req.url));

    // Skip role checks for API routes — they handle their own auth
    if (!pathname.startsWith("/admin/api")) {
      const role = (payload as { role?: string }).role ?? "";
      for (const { prefix, permission } of ROUTE_PERMISSIONS) {
        if (pathname.startsWith(prefix)) {
          if (!hasPermission(role, permission)) {
            return NextResponse.redirect(
              new URL("/admin/dashboard?error=forbidden", req.url)
            );
          }
          break;
        }
      }
    }
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
