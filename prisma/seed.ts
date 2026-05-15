import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import migrants from "../data/migrants.json";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import * as dotenv from "dotenv";
dotenv.config();

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const adminHash = await bcrypt.hash("admin123", 10);
  const inspHash = await bcrypt.hash("inspector123", 10);

  await prisma.staffUser.upsert({
    where: { email: "admin@migration.gov" },
    update: {},
    create: {
      email: "admin@migration.gov",
      password: adminHash,
      name: "Администратор",
      role: "admin",
    },
  });

  await prisma.staffUser.upsert({
    where: { email: "inspector@migration.gov" },
    update: {},
    create: {
      email: "inspector@migration.gov",
      password: inspHash,
      name: "Амра Пилия",
      role: "inspector",
    },
  });

  for (const m of migrants as any[]) {
    await prisma.migrant.upsert({
      where: { id: m.id },
      update: {},
      create: {
        id: m.id,
        firstName: m.firstName,
        lastName: m.lastName,
        middleName: m.middleName ?? "",
        citizenship: m.citizenship,
        passportNumber: m.passportNumber,
        phone: m.phone,
        birthDate: m.birthDate,
        status: m.status,
        registrationDate: m.registrationDate,
        registrationExpiry: m.registrationExpiry,
        patentNumber: m.patentNumber ?? null,
        patentExpiry: m.patentExpiry ?? null,
        employer: m.employer ?? null,
        address: m.address,
        violations: m.violations,
        lat: m.lat,
        lng: m.lng,
        lastSeen: new Date(m.lastSeen),
        documents: {
          create: m.documents.map((d: any) => ({
            type: d.type,
            name: d.name,
            status: d.status,
            uploadedAt: new Date(d.uploadedAt),
          })),
        },
        payments: {
          create: m.payments.map((p: any) => ({
            id: p.id,
            type: p.type,
            amount: p.amount,
            currency: p.currency,
            date: p.date,
            status: p.status,
            description: p.description,
          })),
        },
        locationHistory: {
          create: m.locationHistory.map((l: any) => ({
            lat: l.lat,
            lng: l.lng,
            timestamp: new Date(l.timestamp),
            address: l.address,
          })),
        },
      },
    });
  }

  console.log("✓ Seeded", migrants.length, "migrants + 2 staff users");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
