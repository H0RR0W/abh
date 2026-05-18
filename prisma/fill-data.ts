/**
 * fill-data.ts — comprehensive demo data filler
 * Run: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/fill-data.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import * as dotenv from "dotenv";
dotenv.config();

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Filling demo data...");

  // ─── 1. Clean up test migrants ─────────────────────────────────────────────
  const fakeIds = ["MIG-1778853716179", "MIG-1779085998169", "MIG-1779105424059"];
  for (const id of fakeIds) {
    await prisma.migrant.deleteMany({ where: { id } });
  }
  console.log("✓ Removed fake migrants");

  // ─── 2. New migrants for missing districts ─────────────────────────────────
  const newMigrants = [
    {
      id: "MIG-016",
      firstName: "Назим", lastName: "Гусейнов", middleName: "Рашидович",
      citizenship: "Азербайджан", passportSeries: "AA", passportNumber: "2341789",
      passportIssuedBy: "МВД Азербайджана", passportIssueDate: "2019-03-12", passportExpiry: "2029-03-12",
      phone: "+7 940 111-22-33", birthDate: "1990-06-14",
      status: "active", registrationDate: "2025-01-10", registrationExpiry: "2025-10-10",
      employed: true, employer: "ООО «АбхазСтрой»",
      address: "г. Гудаута, ул. Абазинская, 5", district: "Гудаутский",
      violations: 0, lat: 43.1012, lng: 40.6123,
      lastSeen: new Date("2026-05-17T09:00:00Z"),
      identityStatus: "verified",
    },
    {
      id: "MIG-017",
      firstName: "Маринэ", lastName: "Начкебия", middleName: "Зурабовна",
      citizenship: "Грузия", passportSeries: "GE", passportNumber: "9871234",
      passportIssuedBy: "МВД Грузии", passportIssueDate: "2020-07-05", passportExpiry: "2030-07-05",
      phone: "+7 940 222-33-44", birthDate: "1987-11-22",
      status: "active", registrationDate: "2024-11-20", registrationExpiry: "2025-11-20",
      employed: false, employer: null,
      address: "г. Ткуарчал, ул. Лакоба, 12", district: "Ткуарчалский",
      violations: 1, lat: 42.8511, lng: 41.6611,
      lastSeen: new Date("2026-05-16T15:30:00Z"),
      identityStatus: "pending",
    },
    {
      id: "MIG-018",
      firstName: "Эльдар", lastName: "Мамедов", middleName: "Вугарович",
      citizenship: "Азербайджан", passportSeries: "AZ", passportNumber: "3345678",
      passportIssuedBy: "МВД Азербайджана", passportIssueDate: "2021-04-18", passportExpiry: "2031-04-18",
      phone: "+7 940 333-44-55", birthDate: "1993-08-30",
      status: "expired", registrationDate: "2024-06-01", registrationExpiry: "2025-03-01",
      employed: true, employer: "ИП Чачба Р.Г.",
      address: "с. Джгерда, ул. Центральная, 3", district: "Очамчырский",
      violations: 2, lat: 42.7021, lng: 41.4834,
      lastSeen: new Date("2026-04-10T11:00:00Z"),
      identityStatus: "unverified",
    },
    {
      id: "MIG-019",
      firstName: "Хатуна", lastName: "Арджеванидзе", middleName: "Михайловна",
      citizenship: "Грузия", passportSeries: "GE", passportNumber: "5512347",
      passportIssuedBy: "МВД Грузии", passportIssueDate: "2018-09-25", passportExpiry: "2028-09-25",
      phone: "+7 940 444-55-66", birthDate: "1985-02-14",
      status: "active", registrationDate: "2025-02-14", registrationExpiry: "2026-02-14",
      employed: false, employer: null,
      address: "г. Гал, ул. Шамба, 7", district: "Галский",
      violations: 0, lat: 42.3751, lng: 41.9902,
      lastSeen: new Date("2026-05-18T08:00:00Z"),
      identityStatus: "verified",
    },
    {
      id: "MIG-020",
      firstName: "Тигран", lastName: "Акопян", middleName: "Сергеевич",
      citizenship: "Армения", passportSeries: "AM", passportNumber: "7734512",
      passportIssuedBy: "ПВД Армении", passportIssueDate: "2022-01-10", passportExpiry: "2032-01-10",
      phone: "+7 940 555-66-77", birthDate: "1995-12-01",
      status: "blocked", registrationDate: "2024-08-15", registrationExpiry: "2025-08-15",
      employed: true, employer: "Рынок «Сухум-базар»",
      address: "г. Гудаута, пр. Советский, 18", district: "Гудаутский",
      violations: 3, lat: 43.0987, lng: 40.6234,
      lastSeen: new Date("2026-03-20T14:00:00Z"),
      identityStatus: "unverified",
    },
    {
      id: "MIG-021",
      firstName: "Нурлан", lastName: "Бекзатов", middleName: "Алмазович",
      citizenship: "Кыргызстан", passportSeries: "KG", passportNumber: "4421089",
      passportIssuedBy: "МВД Кыргызстана", passportIssueDate: "2021-06-30", passportExpiry: "2031-06-30",
      phone: "+7 940 666-77-88", birthDate: "1988-04-17",
      status: "active", registrationDate: "2025-03-01", registrationExpiry: "2026-03-01",
      employed: true, employer: "АО «АбхазЭнерго»",
      address: "г. Ткуарчал, пр. Дбара, 4", district: "Ткуарчалский",
      violations: 0, lat: 42.8634, lng: 41.6789,
      lastSeen: new Date("2026-05-17T16:45:00Z"),
      identityStatus: "verified",
    },
    {
      id: "MIG-022",
      firstName: "Фарида", lastName: "Исмайлова", middleName: "Турал кызы",
      citizenship: "Азербайджан", passportSeries: "AA", passportNumber: "9987654",
      passportIssuedBy: "МВД Азербайджана", passportIssueDate: "2023-02-14", passportExpiry: "2033-02-14",
      phone: "+7 940 777-88-99", birthDate: "1999-07-07",
      status: "active", registrationDate: "2025-04-10", registrationExpiry: "2026-04-10",
      employed: false, employer: null,
      address: "г. Гал, ул. Кодорская, 22", district: "Галский",
      violations: 1, lat: 42.3812, lng: 41.9967,
      lastSeen: new Date("2026-05-15T10:30:00Z"),
      identityStatus: "pending",
    },
    {
      id: "MIG-023",
      firstName: "Вахтанг", lastName: "Кварацхелия", middleName: "Зурабович",
      citizenship: "Грузия", passportSeries: "GE", passportNumber: "2267890",
      passportIssuedBy: "МВД Грузии", passportIssueDate: "2020-11-01", passportExpiry: "2030-11-01",
      phone: "+7 940 888-99-00", birthDate: "1982-03-28",
      status: "active", registrationDate: "2024-12-01", registrationExpiry: "2025-12-01",
      employed: true, employer: "ООО «Абхазтур»",
      address: "г. Гагра, ул. Абазинская, 45", district: "Гагрский",
      violations: 0, lat: 43.3012, lng: 40.2456,
      lastSeen: new Date("2026-05-18T07:30:00Z"),
      identityStatus: "verified",
    },
    {
      id: "MIG-024",
      firstName: "Давид", lastName: "Ованнисян", middleName: "Арамович",
      citizenship: "Армения", passportSeries: "AM", passportNumber: "6612345",
      passportIssuedBy: "ПВД Армении", passportIssueDate: "2019-08-20", passportExpiry: "2029-08-20",
      phone: "+7 940 100-200-30", birthDate: "1991-05-15",
      status: "expired", registrationDate: "2024-05-15", registrationExpiry: "2025-02-15",
      employed: false, employer: null,
      address: "с. Агудзера, ул. Речная, 9", district: "Гулрыпшский",
      violations: 1, lat: 42.9123, lng: 41.1234,
      lastSeen: new Date("2026-04-25T12:00:00Z"),
      identityStatus: "unverified",
    },
    {
      id: "MIG-025",
      firstName: "Зара", lastName: "Топчян", middleName: "Ашотовна",
      citizenship: "Армения", passportSeries: "AM", passportNumber: "5523456",
      passportIssuedBy: "ПВД Армении", passportIssueDate: "2022-05-10", passportExpiry: "2032-05-10",
      phone: "+7 940 200-300-40", birthDate: "1997-09-09",
      status: "active", registrationDate: "2025-05-01", registrationExpiry: "2026-05-01",
      employed: true, employer: "Кафе «Нарт»",
      address: "г. Сухум, ул. Аиааира, 33", district: "Сухумский",
      violations: 0, lat: 43.0034, lng: 41.0278,
      lastSeen: new Date("2026-05-18T11:00:00Z"),
      identityStatus: "verified",
    },
  ];

  for (const m of newMigrants) {
    const { identityStatus, ...rest } = m;
    await prisma.migrant.upsert({
      where: { id: m.id },
      update: { identityStatus },
      create: { ...rest, identityStatus },
    });
  }
  console.log(`✓ Added ${newMigrants.length} new migrants`);

  // ─── 3. Update existing migrants with full passport data & identityStatus ──
  const existingUpdates = [
    { id: "MIG-001", passportSeries: "AZ", passportIssuedBy: "МВД Азербайджана", passportIssueDate: "2020-04-15", passportExpiry: "2030-04-15", identityStatus: "verified", employed: true, employer: "ООО «АбхазСтрой»" },
    { id: "MIG-002", passportSeries: "AM", passportIssuedBy: "ПВД Армении", passportIssueDate: "2019-07-20", passportExpiry: "2029-07-20", identityStatus: "verified", employed: true, employer: "СТО «АвтоСухум»" },
    { id: "MIG-003", passportSeries: "TR", passportIssuedBy: "МВД Турции", passportIssueDate: "2018-03-01", passportExpiry: "2028-03-01", identityStatus: "unverified", employed: false, employer: null },
    { id: "MIG-004", passportSeries: "GE", passportIssuedBy: "МВД Грузии", passportIssueDate: "2021-09-10", passportExpiry: "2031-09-10", identityStatus: "verified", employed: false, employer: null },
    { id: "MIG-005", passportSeries: "UA", passportIssuedBy: "МВД Украины", passportIssueDate: "2017-06-15", passportExpiry: "2027-06-15", identityStatus: "unverified", employed: true, employer: "Рынок «Сухумский»" },
    { id: "MIG-006", passportSeries: "GE", passportIssuedBy: "МВД Грузии", passportIssueDate: "2022-01-25", passportExpiry: "2032-01-25", identityStatus: "pending", employed: true, employer: "ООО «АбхазТрейд»" },
    { id: "MIG-007", passportSeries: "AZ", passportIssuedBy: "МВД Азербайджана", passportIssueDate: "2020-08-12", passportExpiry: "2030-08-12", identityStatus: "verified", employed: false, employer: null },
    { id: "MIG-008", passportSeries: "GE", passportIssuedBy: "МВД Грузии", passportIssueDate: "2023-02-18", passportExpiry: "2033-02-18", identityStatus: "verified", employed: true, employer: "Гостиница «Абхазия»" },
    { id: "MIG-009", passportSeries: "UZ", passportIssuedBy: "МВД Узбекистана", passportIssueDate: "2019-11-05", passportExpiry: "2029-11-05", identityStatus: "unverified", employed: true, employer: "Стройбригада Мкртчяна" },
    { id: "MIG-010", passportSeries: "TR", passportIssuedBy: "МВД Турции", passportIssueDate: "2021-03-22", passportExpiry: "2031-03-22", identityStatus: "pending", employed: true, employer: "Ресторан «Диоскурия»" },
    { id: "MIG-011", passportSeries: "AM", passportIssuedBy: "ПВД Армении", passportIssueDate: "2022-07-14", passportExpiry: "2032-07-14", identityStatus: "verified", employed: false, employer: null },
    { id: "MIG-012", passportSeries: "GE", passportIssuedBy: "МВД Грузии", passportIssueDate: "2020-12-30", passportExpiry: "2030-12-30", identityStatus: "verified", employed: true, employer: "МЧС Абхазии" },
    { id: "MIG-013", passportSeries: "UZ", passportIssuedBy: "МВД Узбекистана", passportIssueDate: "2021-05-05", passportExpiry: "2031-05-05", identityStatus: "pending", employed: true, employer: "АО «АбхазТабак»" },
    { id: "MIG-014", passportSeries: "GE", passportIssuedBy: "МВД Грузии", passportIssueDate: "2023-04-01", passportExpiry: "2033-04-01", identityStatus: "verified", employed: false, employer: null },
    { id: "MIG-015", passportSeries: "AZ", passportIssuedBy: "МВД Азербайджана", passportIssueDate: "2022-10-10", passportExpiry: "2032-10-10", identityStatus: "unverified", employed: true, employer: "Магазин «Алиев и Ко»" },
  ];

  for (const u of existingUpdates) {
    const { id, ...data } = u;
    await prisma.migrant.update({ where: { id }, data });
  }
  console.log("✓ Updated existing migrants with passport details");

  // ─── 4. Delete old auto-generated data to re-seed cleanly ─────────────────
  await prisma.payment.deleteMany({ where: { migrantId: { in: [...newMigrants.map(m => m.id), ...existingUpdates.map(u => u.id)] } } });
  await prisma.violation.deleteMany({ where: {} });
  await prisma.inspection.deleteMany({ where: {} });
  await prisma.chatMessage.deleteMany({ where: {} });
  await prisma.locationHistory.deleteMany({ where: {} });
  await prisma.document.deleteMany({ where: {} });
  console.log("✓ Cleared old generated data");

  // ─── 5. Documents ──────────────────────────────────────────────────────────
  const docData: { migrantId: string; type: string; name: string; status: string; uploadedAt: Date }[] = [
    // MIG-001
    { migrantId: "MIG-001", type: "passport", name: "Паспорт AZ4144432", status: "verified", uploadedAt: new Date("2025-01-12") },
    { migrantId: "MIG-001", type: "patent", name: "Трудовой патент 2025", status: "verified", uploadedAt: new Date("2025-01-15") },
    { migrantId: "MIG-001", type: "registration", name: "Свидетельство о регистрации", status: "verified", uploadedAt: new Date("2025-01-15") },
    // MIG-002
    { migrantId: "MIG-002", type: "passport", name: "Паспорт AM7123456", status: "verified", uploadedAt: new Date("2024-11-05") },
    { migrantId: "MIG-002", type: "patent", name: "Трудовой патент 2025", status: "verified", uploadedAt: new Date("2024-11-08") },
    { migrantId: "MIG-002", type: "photo", name: "Фото 3×4", status: "verified", uploadedAt: new Date("2024-11-05") },
    // MIG-003
    { migrantId: "MIG-003", type: "passport", name: "Паспорт TR5561234", status: "pending", uploadedAt: new Date("2024-05-10") },
    { migrantId: "MIG-003", type: "registration", name: "Свидетельство (просрочено)", status: "rejected", uploadedAt: new Date("2024-05-10") },
    // MIG-004
    { migrantId: "MIG-004", type: "passport", name: "Паспорт GE8834512", status: "verified", uploadedAt: new Date("2025-02-20") },
    { migrantId: "MIG-004", type: "photo", name: "Фото 3×4", status: "verified", uploadedAt: new Date("2025-02-20") },
    // MIG-005
    { migrantId: "MIG-005", type: "passport", name: "Паспорт UA2231567", status: "pending", uploadedAt: new Date("2024-08-01") },
    { migrantId: "MIG-005", type: "violations_act", name: "Акт о нарушении №15/2025", status: "verified", uploadedAt: new Date("2025-02-10") },
    // MIG-006
    { migrantId: "MIG-006", type: "passport", name: "Паспорт GE6612890", status: "pending", uploadedAt: new Date("2025-01-08") },
    { migrantId: "MIG-006", type: "patent", name: "Трудовой патент 2025", status: "verified", uploadedAt: new Date("2025-01-10") },
    // MIG-007
    { migrantId: "MIG-007", type: "passport", name: "Паспорт AZ1198765", status: "verified", uploadedAt: new Date("2025-03-12") },
    { migrantId: "MIG-007", type: "registration", name: "Свидетельство о регистрации", status: "verified", uploadedAt: new Date("2025-03-14") },
    // MIG-008
    { migrantId: "MIG-008", type: "passport", name: "Паспорт GE3345678", status: "verified", uploadedAt: new Date("2025-01-25") },
    { migrantId: "MIG-008", type: "patent", name: "Трудовой патент 2025", status: "verified", uploadedAt: new Date("2025-01-28") },
    { migrantId: "MIG-008", type: "photo", name: "Фото 3×4", status: "verified", uploadedAt: new Date("2025-01-25") },
    // MIG-009
    { migrantId: "MIG-009", type: "passport", name: "Паспорт UZ9934512", status: "pending", uploadedAt: new Date("2024-07-15") },
    { migrantId: "MIG-009", type: "registration", name: "Свидетельство (просрочено)", status: "rejected", uploadedAt: new Date("2024-07-15") },
    // MIG-010
    { migrantId: "MIG-010", type: "passport", name: "Паспорт TR7712345", status: "pending", uploadedAt: new Date("2025-01-05") },
    { migrantId: "MIG-010", type: "patent", name: "Трудовой патент 2025", status: "verified", uploadedAt: new Date("2025-01-07") },
    // MIG-011
    { migrantId: "MIG-011", type: "passport", name: "Паспорт AM4456789", status: "verified", uploadedAt: new Date("2024-12-10") },
    { migrantId: "MIG-011", type: "registration", name: "Свидетельство о регистрации", status: "verified", uploadedAt: new Date("2024-12-12") },
    // MIG-012
    { migrantId: "MIG-012", type: "passport", name: "Паспорт GE1123456", status: "verified", uploadedAt: new Date("2024-10-05") },
    { migrantId: "MIG-012", type: "patent", name: "Трудовой патент 2025", status: "verified", uploadedAt: new Date("2024-10-08") },
    { migrantId: "MIG-012", type: "photo", name: "Фото 3×4", status: "verified", uploadedAt: new Date("2024-10-05") },
    // MIG-013
    { migrantId: "MIG-013", type: "passport", name: "Паспорт UZ5567890", status: "pending", uploadedAt: new Date("2025-02-01") },
    { migrantId: "MIG-013", type: "patent", name: "Трудовой патент 2025", status: "verified", uploadedAt: new Date("2025-02-05") },
    // MIG-014
    { migrantId: "MIG-014", type: "passport", name: "Паспорт GE7789012", status: "verified", uploadedAt: new Date("2025-03-20") },
    { migrantId: "MIG-014", type: "photo", name: "Фото 3×4", status: "verified", uploadedAt: new Date("2025-03-20") },
    // MIG-015
    { migrantId: "MIG-015", type: "passport", name: "Паспорт AZ8812345", status: "pending", uploadedAt: new Date("2025-01-20") },
    { migrantId: "MIG-015", type: "patent", name: "Трудовой патент 2025", status: "pending", uploadedAt: new Date("2025-01-22") },
    // New migrants
    { migrantId: "MIG-016", type: "passport", name: "Паспорт AA2341789", status: "verified", uploadedAt: new Date("2025-01-11") },
    { migrantId: "MIG-016", type: "patent", name: "Трудовой патент 2025", status: "verified", uploadedAt: new Date("2025-01-12") },
    { migrantId: "MIG-017", type: "passport", name: "Паспорт GE9871234", status: "pending", uploadedAt: new Date("2024-11-21") },
    { migrantId: "MIG-018", type: "passport", name: "Паспорт AZ3345678", status: "pending", uploadedAt: new Date("2024-06-02") },
    { migrantId: "MIG-018", type: "registration", name: "Свидетельство (просрочено)", status: "rejected", uploadedAt: new Date("2024-06-02") },
    { migrantId: "MIG-019", type: "passport", name: "Паспорт GE5512347", status: "verified", uploadedAt: new Date("2025-02-15") },
    { migrantId: "MIG-019", type: "registration", name: "Свидетельство о регистрации", status: "verified", uploadedAt: new Date("2025-02-16") },
    { migrantId: "MIG-020", type: "passport", name: "Паспорт AM7734512", status: "pending", uploadedAt: new Date("2024-08-16") },
    { migrantId: "MIG-021", type: "passport", name: "Паспорт KG4421089", status: "verified", uploadedAt: new Date("2025-03-02") },
    { migrantId: "MIG-021", type: "patent", name: "Трудовой патент 2025", status: "verified", uploadedAt: new Date("2025-03-05") },
    { migrantId: "MIG-022", type: "passport", name: "Паспорт AA9987654", status: "pending", uploadedAt: new Date("2025-04-11") },
    { migrantId: "MIG-023", type: "passport", name: "Паспорт GE2267890", status: "verified", uploadedAt: new Date("2024-12-02") },
    { migrantId: "MIG-023", type: "patent", name: "Трудовой патент 2025", status: "verified", uploadedAt: new Date("2024-12-05") },
    { migrantId: "MIG-024", type: "passport", name: "Паспорт AM6612345", status: "pending", uploadedAt: new Date("2024-05-16") },
    { migrantId: "MIG-025", type: "passport", name: "Паспорт AM5523456", status: "verified", uploadedAt: new Date("2025-05-02") },
    { migrantId: "MIG-025", type: "patent", name: "Трудовой патент 2025", status: "verified", uploadedAt: new Date("2025-05-05") },
  ];

  await prisma.document.createMany({ data: docData });
  console.log(`✓ Created ${docData.length} documents`);

  // ─── 6. Payments ───────────────────────────────────────────────────────────
  const paymentsData = [
    // MIG-001 Мамедов
    { migrantId: "MIG-001", type: "patent", amount: 2500, currency: "RUB", date: "2025-01-15", status: "paid", description: "Оплата трудового патента — январь 2025" },
    { migrantId: "MIG-001", type: "patent", amount: 2500, currency: "RUB", date: "2025-02-15", status: "paid", description: "Оплата трудового патента — февраль 2025" },
    { migrantId: "MIG-001", type: "patent", amount: 2500, currency: "RUB", date: "2025-03-15", status: "paid", description: "Оплата трудового патента — март 2025" },
    { migrantId: "MIG-001", type: "patent", amount: 2500, currency: "RUB", date: "2025-04-15", status: "paid", description: "Оплата трудового патента — апрель 2025" },
    { migrantId: "MIG-001", type: "fee", amount: 800, currency: "RUB", date: "2025-01-10", status: "paid", description: "Госпошлина за регистрацию" },
    // MIG-002 Саргсян
    { migrantId: "MIG-002", type: "patent", amount: 2500, currency: "RUB", date: "2024-11-10", status: "paid", description: "Оплата трудового патента — ноябрь 2024" },
    { migrantId: "MIG-002", type: "patent", amount: 2500, currency: "RUB", date: "2024-12-10", status: "paid", description: "Оплата трудового патента — декабрь 2024" },
    { migrantId: "MIG-002", type: "patent", amount: 2500, currency: "RUB", date: "2025-01-10", status: "paid", description: "Оплата трудового патента — январь 2025" },
    { migrantId: "MIG-002", type: "patent", amount: 2500, currency: "RUB", date: "2025-02-10", status: "paid", description: "Оплата трудового патента — февраль 2025" },
    { migrantId: "MIG-002", type: "fee", amount: 800, currency: "RUB", date: "2024-11-05", status: "paid", description: "Госпошлина за регистрацию" },
    // MIG-003 Демир (expired)
    { migrantId: "MIG-003", type: "patent", amount: 2500, currency: "RUB", date: "2024-05-10", status: "paid", description: "Оплата трудового патента — май 2024" },
    { migrantId: "MIG-003", type: "patent", amount: 2500, currency: "RUB", date: "2024-06-10", status: "paid", description: "Оплата трудового патента — июнь 2024" },
    { migrantId: "MIG-003", type: "fine", amount: 5000, currency: "RUB", date: "2025-01-15", status: "pending", description: "Штраф: просроченная регистрация" },
    { migrantId: "MIG-003", type: "fee", amount: 800, currency: "RUB", date: "2024-05-05", status: "paid", description: "Госпошлина за регистрацию" },
    // MIG-004 Берулава
    { migrantId: "MIG-004", type: "fee", amount: 800, currency: "RUB", date: "2025-02-22", status: "paid", description: "Госпошлина за регистрацию" },
    { migrantId: "MIG-004", type: "fee", amount: 400, currency: "RUB", date: "2025-02-22", status: "paid", description: "Постановка на учёт" },
    // MIG-005 Коваленко (blocked)
    { migrantId: "MIG-005", type: "fine", amount: 10000, currency: "RUB", date: "2025-02-12", status: "pending", description: "Штраф: нелегальная трудовая деятельность" },
    { migrantId: "MIG-005", type: "fine", amount: 3000, currency: "RUB", date: "2025-01-05", status: "paid", description: "Штраф: нарушение режима пребывания" },
    { migrantId: "MIG-005", type: "fee", amount: 800, currency: "RUB", date: "2024-08-03", status: "paid", description: "Госпошлина за регистрацию" },
    // MIG-006 Гелашвили
    { migrantId: "MIG-006", type: "patent", amount: 2500, currency: "RUB", date: "2025-01-12", status: "paid", description: "Оплата трудового патента — январь 2025" },
    { migrantId: "MIG-006", type: "patent", amount: 2500, currency: "RUB", date: "2025-02-12", status: "paid", description: "Оплата трудового патента — февраль 2025" },
    { migrantId: "MIG-006", type: "fee", amount: 800, currency: "RUB", date: "2025-01-08", status: "paid", description: "Госпошлина за регистрацию" },
    // MIG-007 Гасанов
    { migrantId: "MIG-007", type: "fee", amount: 800, currency: "RUB", date: "2025-03-14", status: "paid", description: "Госпошлина за регистрацию" },
    { migrantId: "MIG-007", type: "fee", amount: 400, currency: "RUB", date: "2025-03-14", status: "paid", description: "Постановка на учёт" },
    // MIG-008 Мхеидзе
    { migrantId: "MIG-008", type: "patent", amount: 2500, currency: "RUB", date: "2025-01-28", status: "paid", description: "Оплата трудового патента — январь 2025" },
    { migrantId: "MIG-008", type: "patent", amount: 2500, currency: "RUB", date: "2025-02-28", status: "paid", description: "Оплата трудового патента — февраль 2025" },
    { migrantId: "MIG-008", type: "patent", amount: 2500, currency: "RUB", date: "2025-03-28", status: "paid", description: "Оплата трудового патента — март 2025" },
    { migrantId: "MIG-008", type: "fee", amount: 800, currency: "RUB", date: "2025-01-25", status: "paid", description: "Госпошлина за регистрацию" },
    // MIG-009 Рахимов (expired)
    { migrantId: "MIG-009", type: "patent", amount: 2500, currency: "RUB", date: "2024-07-20", status: "paid", description: "Оплата трудового патента — июль 2024" },
    { migrantId: "MIG-009", type: "fine", amount: 5000, currency: "RUB", date: "2025-02-01", status: "pending", description: "Штраф: просроченная регистрация" },
    { migrantId: "MIG-009", type: "fee", amount: 800, currency: "RUB", date: "2024-07-15", status: "paid", description: "Госпошлина за регистрацию" },
    // MIG-010 Четин
    { migrantId: "MIG-010", type: "patent", amount: 2500, currency: "RUB", date: "2025-01-08", status: "paid", description: "Оплата трудового патента — январь 2025" },
    { migrantId: "MIG-010", type: "patent", amount: 2500, currency: "RUB", date: "2025-02-08", status: "paid", description: "Оплата трудового патента — февраль 2025" },
    { migrantId: "MIG-010", type: "fee", amount: 800, currency: "RUB", date: "2025-01-05", status: "paid", description: "Госпошлина за регистрацию" },
    // MIG-011 Петросян
    { migrantId: "MIG-011", type: "fee", amount: 800, currency: "RUB", date: "2024-12-12", status: "paid", description: "Госпошлина за регистрацию" },
    { migrantId: "MIG-011", type: "fee", amount: 400, currency: "RUB", date: "2024-12-12", status: "paid", description: "Постановка на учёт" },
    // MIG-012 Табатадзе
    { migrantId: "MIG-012", type: "patent", amount: 2500, currency: "RUB", date: "2024-10-10", status: "paid", description: "Оплата трудового патента — октябрь 2024" },
    { migrantId: "MIG-012", type: "patent", amount: 2500, currency: "RUB", date: "2024-11-10", status: "paid", description: "Оплата трудового патента — ноябрь 2024" },
    { migrantId: "MIG-012", type: "patent", amount: 2500, currency: "RUB", date: "2024-12-10", status: "paid", description: "Оплата трудового патента — декабрь 2024" },
    { migrantId: "MIG-012", type: "patent", amount: 2500, currency: "RUB", date: "2025-01-10", status: "paid", description: "Оплата трудового патента — январь 2025" },
    { migrantId: "MIG-012", type: "fee", amount: 800, currency: "RUB", date: "2024-10-05", status: "paid", description: "Госпошлина за регистрацию" },
    // MIG-013 Юсупов
    { migrantId: "MIG-013", type: "patent", amount: 2500, currency: "RUB", date: "2025-02-06", status: "paid", description: "Оплата трудового патента — февраль 2025" },
    { migrantId: "MIG-013", type: "patent", amount: 2500, currency: "RUB", date: "2025-03-06", status: "paid", description: "Оплата трудового патента — март 2025" },
    { migrantId: "MIG-013", type: "fee", amount: 800, currency: "RUB", date: "2025-02-01", status: "paid", description: "Госпошлина за регистрацию" },
    // MIG-014 Кварацхелия
    { migrantId: "MIG-014", type: "fee", amount: 800, currency: "RUB", date: "2025-03-22", status: "paid", description: "Госпошлина за регистрацию" },
    // MIG-015 Алиев
    { migrantId: "MIG-015", type: "patent", amount: 2500, currency: "RUB", date: "2025-01-25", status: "pending", description: "Оплата трудового патента — январь 2025" },
    { migrantId: "MIG-015", type: "fee", amount: 800, currency: "RUB", date: "2025-01-20", status: "paid", description: "Госпошлина за регистрацию" },
    // MIG-016 Гусейнов
    { migrantId: "MIG-016", type: "patent", amount: 2500, currency: "RUB", date: "2025-01-12", status: "paid", description: "Оплата трудового патента — январь 2025" },
    { migrantId: "MIG-016", type: "patent", amount: 2500, currency: "RUB", date: "2025-02-12", status: "paid", description: "Оплата трудового патента — февраль 2025" },
    { migrantId: "MIG-016", type: "fee", amount: 800, currency: "RUB", date: "2025-01-10", status: "paid", description: "Госпошлина за регистрацию" },
    // MIG-017 Начкебия
    { migrantId: "MIG-017", type: "fee", amount: 800, currency: "RUB", date: "2024-11-22", status: "paid", description: "Госпошлина за регистрацию" },
    { migrantId: "MIG-017", type: "fine", amount: 2000, currency: "RUB", date: "2025-03-10", status: "paid", description: "Штраф: нарушение регистрационного учёта" },
    // MIG-018 Мамедов Эльдар (expired)
    { migrantId: "MIG-018", type: "patent", amount: 2500, currency: "RUB", date: "2024-06-05", status: "paid", description: "Оплата трудового патента — июнь 2024" },
    { migrantId: "MIG-018", type: "fine", amount: 5000, currency: "RUB", date: "2025-03-15", status: "pending", description: "Штраф: просроченная регистрация" },
    { migrantId: "MIG-018", type: "fine", amount: 3000, currency: "RUB", date: "2025-04-01", status: "pending", description: "Штраф: работа без патента" },
    // MIG-019 Арджеванидзе
    { migrantId: "MIG-019", type: "fee", amount: 800, currency: "RUB", date: "2025-02-16", status: "paid", description: "Госпошлина за регистрацию" },
    { migrantId: "MIG-019", type: "fee", amount: 400, currency: "RUB", date: "2025-02-16", status: "paid", description: "Постановка на учёт" },
    // MIG-020 Акопян (blocked)
    { migrantId: "MIG-020", type: "patent", amount: 2500, currency: "RUB", date: "2024-08-20", status: "paid", description: "Оплата трудового патента — август 2024" },
    { migrantId: "MIG-020", type: "fine", amount: 8000, currency: "RUB", date: "2025-01-10", status: "pending", description: "Штраф: нарушение режима пребывания" },
    { migrantId: "MIG-020", type: "fine", amount: 5000, currency: "RUB", date: "2025-03-01", status: "pending", description: "Штраф: незаконная торговля без разрешения" },
    // MIG-021 Бекзатов
    { migrantId: "MIG-021", type: "patent", amount: 2500, currency: "RUB", date: "2025-03-05", status: "paid", description: "Оплата трудового патента — март 2025" },
    { migrantId: "MIG-021", type: "patent", amount: 2500, currency: "RUB", date: "2025-04-05", status: "paid", description: "Оплата трудового патента — апрель 2025" },
    { migrantId: "MIG-021", type: "fee", amount: 800, currency: "RUB", date: "2025-03-01", status: "paid", description: "Госпошлина за регистрацию" },
    // MIG-022 Исмайлова
    { migrantId: "MIG-022", type: "fee", amount: 800, currency: "RUB", date: "2025-04-11", status: "paid", description: "Госпошлина за регистрацию" },
    { migrantId: "MIG-022", type: "fine", amount: 1500, currency: "RUB", date: "2025-04-20", status: "pending", description: "Штраф: нарушение правил пребывания" },
    // MIG-023 Кварацхелия Вахтанг
    { migrantId: "MIG-023", type: "patent", amount: 2500, currency: "RUB", date: "2024-12-05", status: "paid", description: "Оплата трудового патента — декабрь 2024" },
    { migrantId: "MIG-023", type: "patent", amount: 2500, currency: "RUB", date: "2025-01-05", status: "paid", description: "Оплата трудового патента — январь 2025" },
    { migrantId: "MIG-023", type: "patent", amount: 2500, currency: "RUB", date: "2025-02-05", status: "paid", description: "Оплата трудового патента — февраль 2025" },
    { migrantId: "MIG-023", type: "fee", amount: 800, currency: "RUB", date: "2024-12-01", status: "paid", description: "Госпошлина за регистрацию" },
    // MIG-024 Ованнисян (expired)
    { migrantId: "MIG-024", type: "fee", amount: 800, currency: "RUB", date: "2024-05-16", status: "paid", description: "Госпошлина за регистрацию" },
    { migrantId: "MIG-024", type: "fine", amount: 5000, currency: "RUB", date: "2025-03-05", status: "pending", description: "Штраф: просроченная регистрация" },
    // MIG-025 Топчян
    { migrantId: "MIG-025", type: "patent", amount: 2500, currency: "RUB", date: "2025-05-05", status: "paid", description: "Оплата трудового патента — май 2025" },
    { migrantId: "MIG-025", type: "fee", amount: 800, currency: "RUB", date: "2025-05-01", status: "paid", description: "Госпошлина за регистрацию" },
  ];

  await prisma.payment.createMany({ data: paymentsData });
  console.log(`✓ Created ${paymentsData.length} payments`);

  // ─── 7. Violations ─────────────────────────────────────────────────────────
  const violationsData = [
    { migrantId: "MIG-003", type: "Просроченная регистрация", description: "Срок регистрации истёк 01.01.2025, продление не оформлено", severity: "high", date: "2025-01-10", fine: 5000, fineStatus: "unpaid", createdAt: new Date("2025-01-10") },
    { migrantId: "MIG-005", type: "Нелегальная трудовая деятельность", description: "Работал без трудового патента в ООО «РемСтрой»", severity: "critical", date: "2025-02-10", fine: 10000, fineStatus: "unpaid", createdAt: new Date("2025-02-10") },
    { migrantId: "MIG-005", type: "Нарушение режима пребывания", description: "Проживал по адресу, не совпадающему с регистрацией", severity: "medium", date: "2025-01-03", fine: 3000, fineStatus: "paid", createdAt: new Date("2025-01-03") },
    { migrantId: "MIG-009", type: "Просроченная регистрация", description: "Срок регистрации истёк 15.07.2024, мигрант не обратился за продлением", severity: "high", date: "2025-02-01", fine: 5000, fineStatus: "unpaid", createdAt: new Date("2025-02-01") },
    { migrantId: "MIG-015", type: "Непостановка на учёт", description: "Смена адреса проживания без уведомления миграционной службы", severity: "low", date: "2025-02-20", fine: 0, fineStatus: "unpaid", createdAt: new Date("2025-02-20") },
    { migrantId: "MIG-017", type: "Нарушение регистрационного учёта", description: "Несвоевременное уведомление о смене места пребывания", severity: "low", date: "2025-03-08", fine: 2000, fineStatus: "paid", createdAt: new Date("2025-03-08") },
    { migrantId: "MIG-018", type: "Просроченная регистрация", description: "Срок регистрации истёк 01.03.2025", severity: "high", date: "2025-03-14", fine: 5000, fineStatus: "unpaid", createdAt: new Date("2025-03-14") },
    { migrantId: "MIG-018", type: "Работа без патента", description: "Осуществлял трудовую деятельность у ИП Чачба без действующего патента", severity: "critical", date: "2025-04-01", fine: 3000, fineStatus: "unpaid", createdAt: new Date("2025-04-01") },
    { migrantId: "MIG-020", type: "Нарушение режима пребывания", description: "Многократные нарушения регистрационного режима", severity: "high", date: "2025-01-08", fine: 8000, fineStatus: "unpaid", createdAt: new Date("2025-01-08") },
    { migrantId: "MIG-020", type: "Незаконная торговля", description: "Торговля без разрешения на торговую деятельность на рынке", severity: "critical", date: "2025-02-28", fine: 5000, fineStatus: "unpaid", createdAt: new Date("2025-02-28") },
    { migrantId: "MIG-020", type: "Нарушение документального учёта", description: "Отказ предъявить документы при проверке", severity: "medium", date: "2024-11-15", fine: 0, fineStatus: "unpaid", createdAt: new Date("2024-11-15") },
    { migrantId: "MIG-022", type: "Нарушение правил пребывания", description: "Не уведомила о прибытии в течение 7 дней", severity: "low", date: "2025-04-18", fine: 1500, fineStatus: "unpaid", createdAt: new Date("2025-04-18") },
    { migrantId: "MIG-024", type: "Просроченная регистрация", description: "Не продлил регистрацию после истечения срока 15.02.2025", severity: "high", date: "2025-03-05", fine: 5000, fineStatus: "unpaid", createdAt: new Date("2025-03-05") },
  ];

  for (const v of violationsData) {
    await prisma.violation.create({ data: v });
  }
  console.log(`✓ Created ${violationsData.length} violations`);

  // ─── 8. Inspections ────────────────────────────────────────────────────────
  const inspData = [
    { migrantId: "MIG-001", type: "Проверка документов", date: "2025-03-10", inspector: "Амра Пилия", note: "Документы в порядке, патент оплачен. Замечаний нет.", status: "completed", createdAt: new Date("2025-03-10") },
    { migrantId: "MIG-001", type: "Плановая проверка", date: "2025-05-12", inspector: "Амра Пилия", note: "Проверка по месту работы. Работодатель подтвердил трудоустройство.", status: "completed", createdAt: new Date("2025-05-12") },
    { migrantId: "MIG-002", type: "Проверка документов", date: "2025-02-20", inspector: "Амра Пилия", note: "Все документы действительны. Продление регистрации не требуется.", status: "completed", createdAt: new Date("2025-02-20") },
    { migrantId: "MIG-003", type: "Внеплановая проверка", date: "2025-01-12", inspector: "Амра Пилия", note: "Обнаружена просроченная регистрация. Составлен протокол. Выставлен штраф 5000 руб.", status: "completed", createdAt: new Date("2025-01-12") },
    { migrantId: "MIG-005", type: "Внеплановая проверка", date: "2025-02-11", inspector: "Амра Пилия", note: "Выявлена нелегальная трудовая деятельность. Мигрант заблокирован до выяснения обстоятельств.", status: "completed", createdAt: new Date("2025-02-11") },
    { migrantId: "MIG-006", type: "Плановая проверка", date: "2025-04-05", inspector: "Оператор Демо", note: "Проверка по месту пребывания. Замечаний нет.", status: "completed", createdAt: new Date("2025-04-05") },
    { migrantId: "MIG-008", type: "Проверка документов", date: "2025-03-15", inspector: "Амра Пилия", note: "Документы в порядке. Патент оплачен на 3 месяца вперёд.", status: "completed", createdAt: new Date("2025-03-15") },
    { migrantId: "MIG-009", type: "Внеплановая проверка", date: "2025-02-05", inspector: "Амра Пилия", note: "Срок регистрации просрочен на 7 месяцев. Составлен протокол. Выставлен штраф.", status: "completed", createdAt: new Date("2025-02-05") },
    { migrantId: "MIG-010", type: "Плановая проверка", date: "2025-04-10", inspector: "Амра Пилия", note: "Проверка по месту работы. Ресторан «Диоскурия» подтвердил трудоустройство.", status: "completed", createdAt: new Date("2025-04-10") },
    { migrantId: "MIG-012", type: "Проверка документов", date: "2025-02-15", inspector: "Амра Пилия", note: "Все документы действительны.", status: "completed", createdAt: new Date("2025-02-15") },
    { migrantId: "MIG-018", type: "Внеплановая проверка", date: "2025-03-16", inspector: "Оператор Демо", note: "Просроченная регистрация + работа без патента. Составлен протокол на 2 нарушения.", status: "completed", createdAt: new Date("2025-03-16") },
    { migrantId: "MIG-020", type: "Внеплановая проверка", date: "2025-01-09", inspector: "Амра Пилия", note: "Многочисленные нарушения. Мигрант заблокирован, материалы переданы в прокуратуру.", status: "completed", createdAt: new Date("2025-01-09") },
    // Upcoming inspections
    { migrantId: "MIG-013", type: "Плановая проверка", date: "2026-06-01", inspector: "Амра Пилия", note: "", status: "pending", createdAt: new Date("2026-05-18") },
    { migrantId: "MIG-015", type: "Проверка документов", date: "2026-05-25", inspector: "Амра Пилия", note: "", status: "pending", createdAt: new Date("2026-05-18") },
    { migrantId: "MIG-024", type: "Внеплановая проверка", date: "2026-05-22", inspector: "Оператор Демо", note: "", status: "pending", createdAt: new Date("2026-05-18") },
  ];

  for (const insp of inspData) {
    await prisma.inspection.create({ data: insp });
  }
  console.log(`✓ Created ${inspData.length} inspections`);

  // ─── 9. Chat messages ──────────────────────────────────────────────────────
  const chatData: { migrantId: string; from: string; text: string; createdAt: Date }[] = [
    // MIG-001 Мамедов — вопрос о продлении
    { migrantId: "MIG-001", from: "migrant", text: "Здравствуйте! Скажите, когда мне нужно продлить регистрацию?", createdAt: new Date("2026-05-10T09:15:00Z") },
    { migrantId: "MIG-001", from: "staff", text: "Добрый день, Гасан Мамедов! Ваша регистрация действительна до 15.09.2025. За продлением обратитесь не позднее чем за 7 дней до истечения срока.", createdAt: new Date("2026-05-10T10:30:00Z") },
    { migrantId: "MIG-001", from: "migrant", text: "Спасибо! А какие документы нужно принести?", createdAt: new Date("2026-05-10T10:45:00Z") },
    { migrantId: "MIG-001", from: "staff", text: "Для продления потребуются: паспорт, подтверждение оплаты патента, договор аренды жилья или письмо от работодателя.", createdAt: new Date("2026-05-10T11:00:00Z") },
    { migrantId: "MIG-001", from: "migrant", text: "Понял, спасибо большое!", createdAt: new Date("2026-05-10T11:05:00Z") },

    // MIG-003 Демир — просроченная регистрация
    { migrantId: "MIG-003", from: "staff", text: "Мевлют Демир, уведомляем вас, что срок вашей регистрации истёк 01.01.2025. Необходимо срочно явиться в миграционную службу.", createdAt: new Date("2025-01-08T09:00:00Z") },
    { migrantId: "MIG-003", from: "migrant", text: "Да, я знаю. У меня были проблемы со здоровьем. Могу я прийти на следующей неделе?", createdAt: new Date("2025-01-08T14:30:00Z") },
    { migrantId: "MIG-003", from: "staff", text: "Каждый день просрочки увеличивает размер штрафа. Рекомендуем прийти как можно скорее. Если есть уважительные причины — возьмите справку.", createdAt: new Date("2025-01-08T15:00:00Z") },

    // MIG-005 Коваленко — заблокирован
    { migrantId: "MIG-005", from: "staff", text: "Дмитрий Коваленко, ваш аккаунт заблокирован в связи с выявленными нарушениями. Вам необходимо явиться на собеседование 15.02.2025.", createdAt: new Date("2025-02-11T12:00:00Z") },
    { migrantId: "MIG-005", from: "migrant", text: "Я ничего не нарушал! Это ошибка!", createdAt: new Date("2025-02-11T18:00:00Z") },
    { migrantId: "MIG-005", from: "staff", text: "При наличии возражений вы можете подать апелляцию лично. Явка на собеседование обязательна.", createdAt: new Date("2025-02-12T09:00:00Z") },

    // MIG-008 Мхеидзе — продление
    { migrantId: "MIG-008", from: "migrant", text: "Добрый день! Я хочу заранее продлить регистрацию. Что нужно сделать?", createdAt: new Date("2026-05-05T10:00:00Z") },
    { migrantId: "MIG-008", from: "staff", text: "Добрый день, Тамара! Для продления обратитесь в наш офис с паспортом и квитанциями об оплате патента. Ваша регистрация действительна до 20.01.2026.", createdAt: new Date("2026-05-05T11:30:00Z") },
    { migrantId: "MIG-008", from: "migrant", text: "Отлично, приду в конце декабря. Спасибо!", createdAt: new Date("2026-05-05T11:45:00Z") },

    // MIG-009 Рахимов — просрочен
    { migrantId: "MIG-009", from: "staff", text: "Бехруз Рахимов, ваша регистрация истекла. На вас наложен штраф 5000 руб. Просим явиться в службу для урегулирования ситуации.", createdAt: new Date("2025-02-03T10:00:00Z") },
    { migrantId: "MIG-009", from: "migrant", text: "Я уже готовлю документы. Могу ли я оплатить штраф онлайн?", createdAt: new Date("2025-02-04T08:30:00Z") },
    { migrantId: "MIG-009", from: "staff", text: "Оплата через систему доступна. После оплаты пришлите скриншот в этот чат.", createdAt: new Date("2025-02-04T10:00:00Z") },

    // MIG-012 Табатадзе — общий вопрос
    { migrantId: "MIG-012", from: "migrant", text: "Здравствуйте! Могу ли я устроиться на вторую работу? Нужен ли дополнительный патент?", createdAt: new Date("2026-04-20T14:00:00Z") },
    { migrantId: "MIG-012", from: "staff", text: "Добрый день, Резо! Действующий патент позволяет работать только у одного работодателя. При смене или добавлении второго работодателя требуется переоформление.", createdAt: new Date("2026-04-21T09:00:00Z") },
    { migrantId: "MIG-012", from: "migrant", text: "Понял. А какова стоимость переоформления?", createdAt: new Date("2026-04-21T09:30:00Z") },
    { migrantId: "MIG-012", from: "staff", text: "Государственная пошлина составляет 800 рублей. Приём документов — по предварительной записи.", createdAt: new Date("2026-04-21T10:00:00Z") },

    // MIG-020 Акопян — заблокирован
    { migrantId: "MIG-020", from: "staff", text: "Тигран Акопян, ваш статус изменён на «Заблокирован». Причина: многочисленные нарушения. Явка в миграционную службу обязательна не позднее 15.01.2025.", createdAt: new Date("2025-01-09T13:00:00Z") },
    { migrantId: "MIG-020", from: "migrant", text: "Когда можно записаться на приём?", createdAt: new Date("2025-01-10T09:00:00Z") },
    { migrantId: "MIG-020", from: "staff", text: "Запись на приём: пн-пт с 9:00 до 17:00 по тел. +7 840 226-55-00 или лично по адресу ул. Аиааира, 12, г. Сухум.", createdAt: new Date("2025-01-10T11:00:00Z") },

    // MIG-025 Топчян — новый мигрант
    { migrantId: "MIG-025", from: "migrant", text: "Здравствуйте! Я только зарегистрировалась. Как получить QR-код для проверки?", createdAt: new Date("2026-05-16T15:00:00Z") },
    { migrantId: "MIG-025", from: "staff", text: "Добрый день, Зара! QR-код доступен в вашем личном кабинете в разделе «Мой QR-код». Покажите его при любой проверке сотрудником службы.", createdAt: new Date("2026-05-17T09:00:00Z") },
    { migrantId: "MIG-025", from: "migrant", text: "Нашла, спасибо! А как оплатить следующий патент?", createdAt: new Date("2026-05-17T09:30:00Z") },
    { migrantId: "MIG-025", from: "staff", text: "Оплата доступна в разделе «Платежи» в личном кабинете. Следующий платёж — 5 июня 2025.", createdAt: new Date("2026-05-17T10:00:00Z") },
    { migrantId: "MIG-025", from: "migrant", text: "Отлично, всё понятно!", createdAt: new Date("2026-05-17T10:05:00Z") },
  ];

  for (const msg of chatData) {
    await prisma.chatMessage.create({ data: msg });
  }
  console.log(`✓ Created ${chatData.length} chat messages`);

  // ─── 10. Location History ──────────────────────────────────────────────────
  const locData: { migrantId: string; lat: number; lng: number; timestamp: Date; address: string }[] = [
    // MIG-001 — движение по Сухуму
    { migrantId: "MIG-001", lat: 43.0016, lng: 41.0234, timestamp: new Date("2026-05-18T08:00:00Z"), address: "г. Сухум" },
    { migrantId: "MIG-001", lat: 43.0034, lng: 41.0267, timestamp: new Date("2026-05-18T09:30:00Z"), address: "г. Сухум, ул. Аиааира" },
    { migrantId: "MIG-001", lat: 43.0045, lng: 41.0312, timestamp: new Date("2026-05-18T12:00:00Z"), address: "г. Сухум, пр. Мира" },
    { migrantId: "MIG-001", lat: 43.0023, lng: 41.0289, timestamp: new Date("2026-05-17T16:00:00Z"), address: "г. Сухум, ул. Абазинская" },
    { migrantId: "MIG-001", lat: 43.0056, lng: 41.0198, timestamp: new Date("2026-05-16T10:00:00Z"), address: "г. Сухум, набережная" },
    { migrantId: "MIG-001", lat: 42.9989, lng: 41.0156, timestamp: new Date("2026-05-15T14:00:00Z"), address: "г. Сухум, ул. Лакоба" },
    // MIG-002 — Гагрский район
    { migrantId: "MIG-002", lat: 43.3012, lng: 40.2456, timestamp: new Date("2026-05-18T08:30:00Z"), address: "г. Гагра" },
    { migrantId: "MIG-002", lat: 43.2978, lng: 40.2312, timestamp: new Date("2026-05-17T17:00:00Z"), address: "г. Гагра, центр" },
    { migrantId: "MIG-002", lat: 43.3045, lng: 40.2567, timestamp: new Date("2026-05-16T11:00:00Z"), address: "г. Гагра, пляжная зона" },
    { migrantId: "MIG-002", lat: 43.3123, lng: 40.2389, timestamp: new Date("2026-05-15T09:00:00Z"), address: "г. Гагра, ул. Советская" },
    // MIG-004 — Сухум
    { migrantId: "MIG-004", lat: 43.0089, lng: 41.0312, timestamp: new Date("2026-05-18T09:00:00Z"), address: "г. Сухум, ул. Лакоба" },
    { migrantId: "MIG-004", lat: 43.0056, lng: 41.0278, timestamp: new Date("2026-05-17T15:30:00Z"), address: "г. Сухум" },
    { migrantId: "MIG-004", lat: 43.0123, lng: 41.0345, timestamp: new Date("2026-05-16T10:00:00Z"), address: "г. Сухум, пр. Мира" },
    // MIG-006 — Очамчырский район
    { migrantId: "MIG-006", lat: 42.7023, lng: 41.4712, timestamp: new Date("2026-05-18T10:00:00Z"), address: "г. Очамчыра" },
    { migrantId: "MIG-006", lat: 42.6989, lng: 41.4678, timestamp: new Date("2026-05-17T14:00:00Z"), address: "г. Очамчыра, порт" },
    { migrantId: "MIG-006", lat: 42.7056, lng: 41.4789, timestamp: new Date("2026-05-16T09:00:00Z"), address: "г. Очамчыра, центр" },
    { migrantId: "MIG-006", lat: 42.7112, lng: 41.4823, timestamp: new Date("2026-05-15T16:00:00Z"), address: "г. Очамчыра, ул. Руставели" },
    // MIG-007 — Гулрыпшский район
    { migrantId: "MIG-007", lat: 42.9145, lng: 41.1134, timestamp: new Date("2026-05-18T07:30:00Z"), address: "с. Агудзера" },
    { migrantId: "MIG-007", lat: 42.9123, lng: 41.1198, timestamp: new Date("2026-05-17T18:00:00Z"), address: "с. Агудзера, центр" },
    { migrantId: "MIG-007", lat: 42.9167, lng: 41.1067, timestamp: new Date("2026-05-16T12:00:00Z"), address: "с. Агудзера" },
    // MIG-008 — Гагра
    { migrantId: "MIG-008", lat: 43.3078, lng: 40.2534, timestamp: new Date("2026-05-18T08:00:00Z"), address: "г. Гагра" },
    { migrantId: "MIG-008", lat: 43.3034, lng: 40.2478, timestamp: new Date("2026-05-17T19:00:00Z"), address: "г. Гагра, гостиница" },
    { migrantId: "MIG-008", lat: 43.2956, lng: 40.2412, timestamp: new Date("2026-05-16T13:00:00Z"), address: "г. Гагра, набережная" },
    { migrantId: "MIG-008", lat: 43.3089, lng: 40.2601, timestamp: new Date("2026-05-15T10:00:00Z"), address: "г. Гагра, центр" },
    // MIG-010 — Сухум
    { migrantId: "MIG-010", lat: 43.0067, lng: 41.0201, timestamp: new Date("2026-05-18T11:00:00Z"), address: "г. Сухум" },
    { migrantId: "MIG-010", lat: 43.0034, lng: 41.0245, timestamp: new Date("2026-05-17T20:00:00Z"), address: "г. Сухум, ресторан «Диоскурия»" },
    { migrantId: "MIG-010", lat: 43.0089, lng: 41.0178, timestamp: new Date("2026-05-16T11:00:00Z"), address: "г. Сухум" },
    // MIG-016 — Гудаута
    { migrantId: "MIG-016", lat: 43.1012, lng: 40.6123, timestamp: new Date("2026-05-17T09:00:00Z"), address: "г. Гудаута" },
    { migrantId: "MIG-016", lat: 43.0978, lng: 40.6078, timestamp: new Date("2026-05-16T17:00:00Z"), address: "г. Гудаута, стройплощадка" },
    { migrantId: "MIG-016", lat: 43.1045, lng: 40.6189, timestamp: new Date("2026-05-15T08:30:00Z"), address: "г. Гудаута, центр" },
    // MIG-019 — Галский район
    { migrantId: "MIG-019", lat: 42.3751, lng: 41.9902, timestamp: new Date("2026-05-18T08:00:00Z"), address: "г. Гал" },
    { migrantId: "MIG-019", lat: 42.3789, lng: 41.9934, timestamp: new Date("2026-05-17T16:00:00Z"), address: "г. Гал, рынок" },
    { migrantId: "MIG-019", lat: 42.3712, lng: 41.9867, timestamp: new Date("2026-05-16T09:00:00Z"), address: "г. Гал, центр" },
    // MIG-021 — Ткуарчал
    { migrantId: "MIG-021", lat: 42.8634, lng: 41.6789, timestamp: new Date("2026-05-17T16:45:00Z"), address: "г. Ткуарчал" },
    { migrantId: "MIG-021", lat: 42.8601, lng: 41.6712, timestamp: new Date("2026-05-16T08:00:00Z"), address: "г. Ткуарчал, АбхазЭнерго" },
    { migrantId: "MIG-021", lat: 42.8667, lng: 41.6834, timestamp: new Date("2026-05-15T17:00:00Z"), address: "г. Ткуарчал, центр" },
    // MIG-023 — Гагра
    { migrantId: "MIG-023", lat: 43.3012, lng: 40.2456, timestamp: new Date("2026-05-18T07:30:00Z"), address: "г. Гагра" },
    { migrantId: "MIG-023", lat: 43.2989, lng: 40.2401, timestamp: new Date("2026-05-17T18:30:00Z"), address: "г. Гагра, офис АбхазТур" },
    { migrantId: "MIG-023", lat: 43.3056, lng: 40.2512, timestamp: new Date("2026-05-16T12:30:00Z"), address: "г. Гагра" },
    // MIG-025 — Сухум
    { migrantId: "MIG-025", lat: 43.0034, lng: 41.0278, timestamp: new Date("2026-05-18T11:00:00Z"), address: "г. Сухум" },
    { migrantId: "MIG-025", lat: 43.0056, lng: 41.0312, timestamp: new Date("2026-05-17T14:00:00Z"), address: "г. Сухум, кафе «Нарт»" },
    { migrantId: "MIG-025", lat: 43.0023, lng: 41.0245, timestamp: new Date("2026-05-16T09:30:00Z"), address: "г. Сухум, центр" },
  ];

  await prisma.locationHistory.createMany({ data: locData });
  console.log(`✓ Created ${locData.length} location history records`);

  // ─── 11. Update violation counts on migrants ───────────────────────────────
  const violCounts: Record<string, number> = {};
  for (const v of violationsData) {
    violCounts[v.migrantId] = (violCounts[v.migrantId] ?? 0) + 1;
  }
  for (const [id, count] of Object.entries(violCounts)) {
    await prisma.migrant.update({ where: { id }, data: { violations: count } });
  }
  console.log("✓ Updated violation counts");

  console.log("\n✅ Demo data fill complete!");
  console.log(`   Migrants: ${15 + newMigrants.length} total (${newMigrants.length} new)`);
  console.log(`   Documents: ${docData.length}`);
  console.log(`   Payments: ${paymentsData.length}`);
  console.log(`   Violations: ${violationsData.length}`);
  console.log(`   Inspections: ${inspData.length}`);
  console.log(`   Chat messages: ${chatData.length}`);
  console.log(`   Location points: ${locData.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
