import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import migrants from "../data/migrants.json";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import * as dotenv from "dotenv";
import { addressToDistrict } from "../lib/districts";
dotenv.config();

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const demoHash = await bcrypt.hash("Demo1234!", 10);

  const staffAccounts = [
    { email: "admin@migration.gov", name: "Администратор", role: "admin", districts: "[]" },
    { email: "inspector@migration.gov", name: "Амра Пилия", role: "inspector", districts: JSON.stringify(["Сухумский","Гагрский"]) },
    { email: "operator@migration.gov", name: "Оператор Демо", role: "operator", districts: JSON.stringify(["Очамчырский","Гулрыпшский"]) },
    { email: "analyst@migration.gov", name: "Аналитик Демо", role: "analyst", districts: "[]" },
    { email: "management@migration.gov", name: "Руководитель Демо", role: "management", districts: "[]" },
  ];

  for (const account of staffAccounts) {
    await prisma.staffUser.upsert({
      where: { email: account.email },
      update: { role: account.role, password: demoHash, name: account.name, districts: account.districts },
      create: {
        email: account.email,
        password: demoHash,
        name: account.name,
        role: account.role,
        districts: account.districts,
      },
    });
  }

  for (const m of migrants as any[]) {
    await prisma.migrant.upsert({
      where: { id: m.id },
      update: { district: m.district ?? addressToDistrict(m.address) },
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
        employed: m.employed ?? false,
        employer: m.employer ?? null,
        address: m.address,
        district: m.district ?? addressToDistrict(m.address),
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

  console.log("✓ Seeded", migrants.length, "migrants + 5 staff users");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
