import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const secret = () =>
  new TextEncoder().encode(
    process.env.JWT_SECRET ?? "migration-demo-secret-2026-abkhazia"
  );

export type StaffPayload = {
  sub: string;
  email: string;
  name: string;
  role: string;
  type: "staff";
};

export type MigrantPayload = {
  sub: string;
  phone: string;
  type: "migrant";
};

export async function signStaffToken(data: Omit<StaffPayload, "type">) {
  return new SignJWT({ ...data, type: "staff" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("8h")
    .sign(secret());
}

export async function signMigrantToken(data: Omit<MigrantPayload, "type">) {
  return new SignJWT({ ...data, type: "migrant" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(secret());
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload;
  } catch {
    return null;
  }
}

export async function getStaff(): Promise<StaffPayload | null> {
  const token = (await cookies()).get("staff_token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || payload.type !== "staff") return null;
  return payload as unknown as StaffPayload;
}

export async function getMigrant(): Promise<MigrantPayload | null> {
  const token = (await cookies()).get("migrant_token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || payload.type !== "migrant") return null;
  return payload as unknown as MigrantPayload;
}

export async function getStaffFromReq(req: NextRequest): Promise<StaffPayload | null> {
  const token = req.cookies.get("staff_token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || payload.type !== "staff") return null;
  return payload as unknown as StaffPayload;
}

export async function getMigrantFromReq(req: NextRequest): Promise<MigrantPayload | null> {
  const token = req.cookies.get("migrant_token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || payload.type !== "migrant") return null;
  return payload as unknown as MigrantPayload;
}
