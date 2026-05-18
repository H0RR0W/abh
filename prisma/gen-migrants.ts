/**
 * gen-migrants.ts — generates 150 realistic migrants with full data
 * Run: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/gen-migrants.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import * as dotenv from "dotenv";
dotenv.config();

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

// ── helpers ─────────────────────────────────────────────────────────────────
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function rnd(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pad(n: number) { return String(n).padStart(2, "0"); }
function dateStr(y: number, m: number, d: number) { return `${y}-${pad(m)}-${pad(d)}`; }
function addDays(date: Date, days: number) { return new Date(date.getTime() + days * 86_400_000); }
function fmtDate(d: Date) { return dateStr(d.getFullYear(), d.getMonth() + 1, d.getDate()); }

function isoDate(y: number, m: number, d: number) {
  return new Date(`${y}-${pad(m)}-${pad(d)}T12:00:00Z`);
}

// ── reference data ───────────────────────────────────────────────────────────
const DISTRICTS: { name: string; lat: number; lng: number; spread: number; city: string }[] = [
  { name: "Гагрский",      lat: 43.32,  lng: 40.25, spread: 0.08, city: "г. Гагра" },
  { name: "Гудаутский",    lat: 43.10,  lng: 40.61, spread: 0.07, city: "г. Гудаута" },
  { name: "Сухумский",     lat: 43.00,  lng: 41.02, spread: 0.06, city: "г. Сухум" },
  { name: "Гулрыпшский",   lat: 42.92,  lng: 41.13, spread: 0.06, city: "с. Агудзера" },
  { name: "Очамчырский",   lat: 42.70,  lng: 41.47, spread: 0.07, city: "г. Очамчыра" },
  { name: "Ткуарчалский",  lat: 42.86,  lng: 41.67, spread: 0.05, city: "г. Ткуарчал" },
  { name: "Галский",       lat: 42.38,  lng: 41.99, spread: 0.05, city: "г. Гал" },
];

const STREETS: Record<string, string[]> = {
  "г. Гагра":     ["ул. Абазинская", "пр. Нарт", "ул. Советская", "пер. Морской", "ул. Лакоба"],
  "г. Гудаута":   ["пр. Советский", "ул. Абазинская", "ул. Кяхба", "пер. Речной"],
  "г. Сухум":     ["ул. Аиааира", "пр. Мира", "ул. Лакоба", "ул. Абазинская", "ул. Кодорская", "пр. Леона"],
  "с. Агудзера":  ["ул. Центральная", "ул. Речная", "пер. Лесной"],
  "г. Очамчыра":  ["ул. Руставели", "ул. Лакоба", "пр. Советский", "пер. Портовый"],
  "г. Ткуарчал":  ["пр. Дбара", "ул. Лакоба", "ул. Центральная"],
  "г. Гал":       ["ул. Шамба", "ул. Кодорская", "пр. Советский", "ул. Центральная"],
};

type CitizenshipKey = "Азербайджан" | "Армения" | "Грузия" | "Турция" | "Украина" | "Узбекистан" | "Кыргызстан" | "Молдова" | "Таджикистан" | "Беларусь";

const CITIZENSHIPS: { country: CitizenshipKey; weight: number }[] = [
  { country: "Азербайджан", weight: 22 },
  { country: "Армения",     weight: 20 },
  { country: "Грузия",      weight: 25 },
  { country: "Турция",      weight: 10 },
  { country: "Украина",     weight: 8 },
  { country: "Узбекистан",  weight: 6 },
  { country: "Кыргызстан",  weight: 4 },
  { country: "Молдова",     weight: 2 },
  { country: "Таджикистан", weight: 2 },
  { country: "Беларусь",    weight: 1 },
];

const PASSPORT_PREFIX: Record<CitizenshipKey, string> = {
  "Азербайджан": "AZ", "Армения": "AM", "Грузия": "GE",
  "Турция": "TR", "Украина": "UA", "Узбекистан": "UZ",
  "Кыргызстан": "KG", "Молдова": "MD", "Таджикистан": "TJ", "Беларусь": "BY",
};

const ISSUER: Record<CitizenshipKey, string> = {
  "Азербайджан": "МВД Азербайджана",   "Армения":    "ПВД Армении",
  "Грузия":      "МВД Грузии",          "Турция":     "МВД Турции",
  "Украина":     "ГМС Украины",         "Узбекистан": "МВД Узбекистана",
  "Кыргызстан":  "МВД Кыргызстана",    "Молдова":    "МВД Молдовы",
  "Таджикистан": "МВД Таджикистана",   "Беларусь":   "МВД Беларуси",
};

// Male names by citizenship
const FIRST_MALE: Record<CitizenshipKey, string[]> = {
  "Азербайджан": ["Гасан","Эльдар","Назим","Ниджат","Фарид","Камал","Рашад","Орхан","Вугар","Тарлан","Эмиль","Самир","Рафаэль","Заур"],
  "Армения":     ["Арам","Тигран","Давид","Арман","Карен","Ваге","Ашот","Гагик","Самвел","Артур","Нарек","Левон","Акоп"],
  "Грузия":      ["Резо","Вахтанг","Нугзар","Гиорги","Ладо","Зураб","Леван","Давит","Лаша","Гога","Ника","Иракли","Шота"],
  "Турция":      ["Мевлют","Мустафа","Мехмет","Юсуф","Хасан","Омер","Эрдаль","Кемаль","Буркай","Хакан"],
  "Украина":     ["Дмитрий","Андрей","Олег","Сергей","Виктор","Максим","Иван","Тарас","Богдан","Михаил"],
  "Узбекистан":  ["Бехруз","Фуркат","Нодир","Санжар","Жасур","Улугбек","Ойбек","Алишер","Дилшод","Хуршид"],
  "Кыргызстан":  ["Нурлан","Азиз","Бакыт","Тилек","Марат","Эрнис","Канат","Данияр"],
  "Молдова":     ["Ион","Андрей","Виктор","Сергей","Дан","Руслан"],
  "Таджикистан": ["Рустам","Баходур","Фируз","Шерзод","Умар","Комил"],
  "Беларусь":    ["Александр","Дмитрий","Артём","Иван","Павел"],
};

const FIRST_FEMALE: Record<CitizenshipKey, string[]> = {
  "Азербайджан": ["Айгюн","Нилуфар","Фарида","Зейнаб","Гюнель","Нармин","Ламия","Шалала","Севда","Арзу"],
  "Армения":     ["Анаит","Нарине","Мане","Лусине","Тамара","Армине","Ани","Сюзи","Зара","Шушан"],
  "Грузия":      ["Нино","Тамара","Маринэ","Хатуна","Нана","Этери","Лела","Кетеван","Мзия","Гиули","Натия"],
  "Турция":      ["Айше","Фатима","Зейнеп","Мерьем","Севиль","Эсра","Гюзель"],
  "Украина":     ["Ольга","Наталья","Ирина","Татьяна","Светлана","Мария","Галина","Оксана"],
  "Узбекистан":  ["Нилуфар","Дилноза","Мухаббат","Зулайхо","Феруза","Гулнора","Мадина"],
  "Кыргызстан":  ["Айгуль","Жылдыз","Нурай","Гульнара","Айжан","Динара"],
  "Молдова":     ["Мария","Елена","Ана","Виктория","Кристина"],
  "Таджикистан": ["Зарина","Шахло","Манижа","Гулнора","Нилуфар"],
  "Беларусь":    ["Анастасия","Татьяна","Ольга","Юлия","Марина"],
};

const LAST_MALE: Record<CitizenshipKey, string[]> = {
  "Азербайджан": ["Мамедов","Гусейнов","Алиев","Гасанов","Гулиев","Рустамов","Байрамов","Сулейманов","Зейналов","Исмайлов"],
  "Армения":     ["Саргсян","Акопян","Петросян","Карапетян","Мкртчян","Григорян","Аракелян","Овакимян","Ованнисян","Топчян"],
  "Грузия":      ["Берулава","Гелашвили","Мхеидзе","Табатадзе","Кварацхелия","Начкебия","Арджеванидзе","Микеладзе","Гвасалия","Сулаберидзе","Хурцилава"],
  "Турция":      ["Демир","Четин","Йылмаз","Шахин","Доган","Айдын","Кая","Эрдоган"],
  "Украина":     ["Коваленко","Бондаренко","Ткаченко","Шевченко","Мороз","Гончаренко","Кравченко","Лисенко"],
  "Узбекистан":  ["Рахимов","Юсупов","Ахмедов","Хасанов","Кариев","Маматов","Салимов","Турсунов"],
  "Кыргызстан":  ["Бекзатов","Эргешов","Мамытов","Исаков","Джакыпов","Асанов"],
  "Молдова":     ["Попеску","Луpu","Руsu","Стан","Дрэгич"],
  "Таджикистан": ["Назаров","Хасанов","Рахимов","Каримов","Собиров"],
  "Беларусь":    ["Иванов","Петров","Сидоров","Козлов","Новиков"],
};

const LAST_FEMALE: Record<CitizenshipKey, string[]> = {
  "Азербайджан": ["Мамедова","Гусейнова","Алиева","Гасанова","Гулиева","Рустамова","Байрамова","Исмайлова","Зейналова","Сулейманова"],
  "Армения":     ["Саргсян","Акопян","Петросян","Карапетян","Мкртчян","Григорян","Топчян","Аракелян"],
  "Грузия":      ["Берулава","Мхеидзе","Начкебия","Арджеванидзе","Кварацхелия","Табатадзе","Гелашвили","Микеладзе","Хурцилава","Гвасалия"],
  "Турция":      ["Демир","Йылмаз","Четин","Шахин","Доган","Кая"],
  "Украина":     ["Коваленко","Бондаренко","Ткаченко","Шевченко","Гончаренко","Лисенко"],
  "Узбекистан":  ["Рахимова","Юсупова","Ахмедова","Хасанова","Маматова","Салимова"],
  "Кыргызстан":  ["Бекзатова","Эргешова","Мамытова","Исакова","Джакыпова"],
  "Молдова":     ["Попеску","Руsu","Стан","Луpu"],
  "Таджикистан": ["Назарова","Хасанова","Рахимова","Собирова"],
  "Беларусь":    ["Иванова","Петрова","Сидорова","Козлова"],
};

const MIDDLE_MALE: Record<CitizenshipKey, string[]> = {
  "Азербайджан": ["Гасанович","Эльдарович","Орханович","Фаридович","Вугарович","Камалович","Рашадович"],
  "Армения":     ["Арамович","Тигранович","Карпович","Ашотович","Артурович","Левонович","Гагикович"],
  "Грузия":      ["Зурабович","Ладоевич","Гиоргиевич","Нугзарович","Давитович","Лашаевич"],
  "Турция":      ["Мевлютович","Мустафаович","Хасанович","Юсуфович","Омерович"],
  "Украина":     ["Дмитриевич","Андреевич","Сергеевич","Олегович","Михайлович","Иванович"],
  "Узбекистан":  ["Бехрузович","Фурkatович","Жасурович","Санжарович","Улугбекович"],
  "Кыргызстан":  ["Алмазович","Нурлановиch","Азизович","Бакытович"],
  "Молдова":     ["Ионович","Андреевич","Виktorович"],
  "Таджикистан": ["Рустамович","Баходурович","Шерзодович"],
  "Беларусь":    ["Александрович","Дмитриевич","Артёмович","Павлович"],
};

const EMPLOYERS = [
  "ООО «АбхазСтрой»","ООО «АбхазТур»","АО «АбхазЭнерго»","Гостиница «Абхазия»",
  "Ресторан «Диоскурия»","Кафе «Нарт»","Рынок «Сухум-базар»","ООО «АбхазТрейд»",
  "СТО «АвтоСухум»","Магазин «Апра»","ООО «ЧерноморСтрой»","Санаторий «Сухум»",
  "Гостиница «Гагрипш»","Пансионат «Колхида»","ООО «АгроАбхаз»","ИП Джениа Р.А.",
  "ИП Чачба Р.Г.","АО «АбхазТабак»","МЧС Абхазии","Кафе «Эшера»",
  "Магазин «Версаль»","ООО «СухумПрод»","Стройбригада Мкртчяна","Гостиница «Пицунда»",
  "Рыбхоз «Очамчыра»","Фермерское хоз-во Чичба","ООО «ТкуарчалУголь»","Магазин «Алиев и Ко»",
];

const VIOLATION_TYPES = [
  { type: "Просроченная регистрация", severity: "high",     fine: 5000 },
  { type: "Нарушение режима пребывания", severity: "medium", fine: 3000 },
  { type: "Нелегальная трудовая деятельность", severity: "critical", fine: 10000 },
  { type: "Работа без патента", severity: "critical", fine: 8000 },
  { type: "Несвоевременная постановка на учёт", severity: "low", fine: 1500 },
  { type: "Нарушение регистрационного учёта", severity: "low", fine: 2000 },
  { type: "Незаконная торговля", severity: "high", fine: 5000 },
  { type: "Отказ предъявить документы", severity: "medium", fine: 0 },
  { type: "Нарушение сроков выезда", severity: "high", fine: 7000 },
];

function pickCitizenship(): CitizenshipKey {
  const total = CITIZENSHIPS.reduce((s, c) => s + c.weight, 0);
  let r = Math.random() * total;
  for (const c of CITIZENSHIPS) {
    r -= c.weight;
    if (r <= 0) return c.country;
  }
  return "Грузия";
}

function genPassport(prefix: string) {
  return String(rnd(1000000, 9999999));
}

async function main() {
  console.log("Generating 150 migrants...");

  const existing = await prisma.migrant.findMany({ select: { id: true } });
  const existingIds = new Set(existing.map(m => m.id));

  let created = 0;
  const TARGET = 150;
  let index = 26; // start after MIG-025

  while (created < TARGET) {
    const id = `MIG-${String(index).padStart(3, "0")}`;
    if (existingIds.has(id)) { index++; continue; }

    const citizenship = pickCitizenship();
    const isFemale = Math.random() < 0.38;
    const firstName = pick(isFemale ? FIRST_FEMALE[citizenship] : FIRST_MALE[citizenship]);
    const lastName = pick(isFemale ? LAST_FEMALE[citizenship] : LAST_MALE[citizenship]);
    const middleName = isFemale ? "" : pick(MIDDLE_MALE[citizenship] ?? ["ович"]);

    // Birth date: 20-60 years old
    const birthYear = 2026 - rnd(22, 58);
    const birthMonth = rnd(1, 12);
    const birthDay = rnd(1, 28);
    const birthDate = dateStr(birthYear, birthMonth, birthDay);

    // Registration: 3 months to 18 months ago
    const regDaysAgo = rnd(90, 540);
    const regDate = addDays(new Date("2026-05-18"), -regDaysAgo);
    const registrationDate = fmtDate(regDate);

    // Status weights: 65% active, 20% expired, 15% blocked
    const statusRoll = Math.random();
    let status: string;
    let expiryDaysFromReg: number;
    if (statusRoll < 0.65) {
      status = "active";
      expiryDaysFromReg = rnd(180, 365);
    } else if (statusRoll < 0.85) {
      status = "expired";
      expiryDaysFromReg = rnd(60, 300); // expired some time ago
    } else {
      status = "blocked";
      expiryDaysFromReg = rnd(180, 365);
    }

    const expiryDate = addDays(regDate, expiryDaysFromReg);
    const registrationExpiry = fmtDate(expiryDate);

    // Passport dates
    const passIssueYear = rnd(2016, 2023);
    const passIssueDate = dateStr(passIssueYear, rnd(1, 12), rnd(1, 28));
    const passExpiry = dateStr(passIssueYear + 10, rnd(1, 12), rnd(1, 28));

    const passportSeries = PASSPORT_PREFIX[citizenship];
    const passportNumber = genPassport(passportSeries);
    const passportIssuedBy = ISSUER[citizenship];

    // Phone
    const phone = `+7 940 ${rnd(100, 999)}-${rnd(10, 99)}-${rnd(10, 99)}`;

    // District & address
    const districtWeights = [15, 10, 30, 8, 12, 8, 17]; // Гагрский...Галский
    let distIdx = 0;
    let dRoll = Math.random() * 100;
    for (let i = 0; i < districtWeights.length; i++) {
      dRoll -= districtWeights[i];
      if (dRoll <= 0) { distIdx = i; break; }
    }
    const dist = DISTRICTS[distIdx];
    const streets = STREETS[dist.city] ?? ["ул. Центральная"];
    const street = pick(streets);
    const houseNum = rnd(1, 80);
    const address = `${dist.city}, ${street}, ${houseNum}`;

    const lat = dist.lat + (Math.random() - 0.5) * dist.spread;
    const lng = dist.lng + (Math.random() - 0.5) * dist.spread;

    const lastSeenDaysAgo = status === "blocked" ? rnd(30, 180) : (status === "expired" ? rnd(10, 90) : rnd(0, 7));
    const lastSeen = addDays(new Date("2026-05-18"), -lastSeenDaysAgo);

    const employed = status !== "blocked" && Math.random() < 0.6;
    const employer = employed ? pick(EMPLOYERS) : null;

    // Identity status
    const idRoll = Math.random();
    const identityStatus = idRoll < 0.55 ? "verified" : idRoll < 0.80 ? "unverified" : "pending";

    // Create migrant
    await prisma.migrant.create({
      data: {
        id, firstName, lastName, middleName, citizenship,
        passportSeries, passportNumber, passportIssuedBy, passportIssueDate: passIssueDate, passportExpiry: passExpiry,
        phone, birthDate, status, registrationDate, registrationExpiry,
        employed, employer, address, district: dist.name,
        violations: 0, lat, lng, lastSeen, identityStatus,
      },
    });

    // ── Documents ──────────────────────────────────────────────────────────
    const docs: { migrantId: string; type: string; name: string; status: string; uploadedAt: Date }[] = [];
    const docStatus = identityStatus === "verified" ? "verified" : (identityStatus === "pending" ? "pending" : "pending");
    docs.push({ migrantId: id, type: "passport", name: `Паспорт ${passportSeries}${passportNumber}`, status: docStatus, uploadedAt: regDate });
    docs.push({ migrantId: id, type: "photo", name: "Фото 3×4", status: docStatus, uploadedAt: regDate });
    if (employed) {
      docs.push({ migrantId: id, type: "patent", name: "Трудовой патент", status: Math.random() < 0.8 ? "verified" : "pending", uploadedAt: addDays(regDate, 3) });
    }
    if (Math.random() < 0.7) {
      docs.push({ migrantId: id, type: "registration", name: "Свидетельство о регистрации", status: status === "expired" ? "rejected" : "verified", uploadedAt: addDays(regDate, 1) });
    }
    await prisma.document.createMany({ data: docs });

    // ── Payments ───────────────────────────────────────────────────────────
    const payments: any[] = [];
    // Registration fee always
    payments.push({ migrantId: id, type: "fee", amount: 800, currency: "RUB", date: fmtDate(addDays(regDate, 1)), status: "paid", description: "Госпошлина за регистрацию" });

    // Patent payments monthly if employed
    if (employed) {
      const monthsPaid = rnd(1, Math.min(6, Math.floor(regDaysAgo / 30)));
      for (let m = 0; m < monthsPaid; m++) {
        const payDate = addDays(regDate, 5 + m * 30);
        payments.push({ migrantId: id, type: "patent", amount: 2500, currency: "RUB", date: fmtDate(payDate), status: "paid", description: `Оплата трудового патента` });
      }
      // Maybe one pending
      if (Math.random() < 0.3) {
        payments.push({ migrantId: id, type: "patent", amount: 2500, currency: "RUB", date: fmtDate(new Date("2026-05-01")), status: "pending", description: "Оплата трудового патента — май 2026" });
      }
    }

    // Fines for expired/blocked
    if (status === "expired" || status === "blocked") {
      payments.push({ migrantId: id, type: "fine", amount: pick([3000, 5000, 8000, 10000]), currency: "RUB", date: fmtDate(addDays(new Date("2026-05-18"), -rnd(10, 120))), status: Math.random() < 0.4 ? "paid" : "pending", description: "Штраф: нарушение миграционного законодательства" });
    }
    await prisma.payment.createMany({ data: payments });

    // ── Violations ─────────────────────────────────────────────────────────
    let violCount = 0;
    if (status === "expired") {
      const vt = pick([VIOLATION_TYPES[0], VIOLATION_TYPES[1]]);
      const vDate = addDays(new Date("2026-05-18"), -rnd(10, 120));
      await prisma.violation.create({ data: {
        migrantId: id, type: vt.type, description: `Выявлено при плановой проверке. Составлен протокол.`,
        severity: vt.severity, date: fmtDate(vDate), fine: vt.fine, fineStatus: Math.random() < 0.4 ? "paid" : "unpaid", createdAt: vDate,
      }});
      violCount = 1;
    }
    if (status === "blocked") {
      const numV = rnd(2, 4);
      for (let v = 0; v < numV; v++) {
        const vt = pick(VIOLATION_TYPES);
        const vDate = addDays(new Date("2026-05-18"), -rnd(20, 200));
        await prisma.violation.create({ data: {
          migrantId: id, type: vt.type, description: `Нарушение выявлено инспектором при проверке.`,
          severity: vt.severity, date: fmtDate(vDate), fine: vt.fine, fineStatus: "unpaid", createdAt: vDate,
        }});
        violCount++;
      }
    }
    // Small chance of violation even for active
    if (status === "active" && Math.random() < 0.12) {
      const vt = pick([VIOLATION_TYPES[4], VIOLATION_TYPES[5], VIOLATION_TYPES[7]]);
      const vDate = addDays(new Date("2026-05-18"), -rnd(30, 180));
      await prisma.violation.create({ data: {
        migrantId: id, type: vt.type, description: "Нарушение выявлено при проверке документов.",
        severity: vt.severity, date: fmtDate(vDate), fine: vt.fine, fineStatus: Math.random() < 0.7 ? "paid" : "unpaid", createdAt: vDate,
      }});
      violCount++;
    }

    if (violCount > 0) {
      await prisma.migrant.update({ where: { id }, data: { violations: violCount } });
    }

    // ── Location history ───────────────────────────────────────────────────
    const numPoints = rnd(2, 6);
    const locs: any[] = [];
    for (let p = 0; p < numPoints; p++) {
      const daysAgo = rnd(0, 30);
      locs.push({
        migrantId: id,
        lat: lat + (Math.random() - 0.5) * 0.02,
        lng: lng + (Math.random() - 0.5) * 0.02,
        timestamp: addDays(new Date("2026-05-18"), -daysAgo),
        address: `${dist.city}, ${street}`,
      });
    }
    await prisma.locationHistory.createMany({ data: locs });

    // ── Random chat (25% chance) ───────────────────────────────────────────
    if (Math.random() < 0.25) {
      const msgs = [
        { from: "migrant", text: "Здравствуйте! Когда нужно продлевать регистрацию?", createdAt: addDays(new Date("2026-05-18"), -rnd(1, 20)) },
        { from: "staff",   text: `Добрый день, ${firstName}! Ваша регистрация действительна до ${registrationExpiry}. Обратитесь за 7 дней до истечения.`, createdAt: addDays(new Date("2026-05-18"), -rnd(0, 19)) },
      ];
      await prisma.chatMessage.createMany({ data: msgs.map(m => ({ ...m, migrantId: id })) });
    }

    created++;
    index++;
    if (created % 25 === 0) console.log(`  ... ${created}/${TARGET} created`);
  }

  const total = await prisma.migrant.count();
  console.log(`\n✅ Done! Total migrants in DB: ${total}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
