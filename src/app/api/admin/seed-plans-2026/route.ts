import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, PlanType, SwhCategory } from "@prisma/client";

const prisma = new PrismaClient();

// ====================================================================
// SEED PLANS 2026 — buduje pelna hierarchie planow szkoleniowych SWH
// Lokalizacja: src/app/api/admin/seed-plans-2026/route.ts
//
// Co robi:
// 1. Aktualizuje Schedule grup (Mikrus+MiniHokej 18:30, Mlodzik 19:30, pon+czw)
// 2. Tworzy 3 plany roczne (YEARLY, ramy bez sesji)
// 3. Pod kazdym 1 plan sezonowy letni 2026 (SEASONAL, parentPlan=roczny)
// 4. Pod kazdym sezonowym 23 plany tygodniowe (WEEKLY, parentPlan=sezonowy)
// 5. Pod kazdym tygodniowym 2 sesje (pon + czw) z curriculum + godzina
//
// Razem: 3 + 3 + 69 + 138 = 213 obiektow.
//
// Uzycie:
//   GET  /api/admin/seed-plans-2026?key=seed-2026-05-13   → dry run (plan)
//   POST /api/admin/seed-plans-2026?key=seed-2026-05-13   → zaszywa do bazy
//
// WYMAGANIE: baza pusta (0 planow). Najpierw uruchom cleanup-plans.
// Wygasa 31.05.2026. Po sukcesie usunac plik z repo.
// ====================================================================

const SECRET_KEY = "seed-2026-05-13";
const EXPIRES_AT = new Date("2026-05-31T23:59:59Z");

// ====================================================================
// KONFIG — TYGODNIE, MEZOCYKLE
// ====================================================================

interface WeekDef {
  week: number;       // 1..23
  mezo: string;       // M0..M5
  mon: string;        // YYYY-MM-DD pon
  thu: string;        // YYYY-MM-DD czw
}

const TYGODNIE: WeekDef[] = [
  // M0 Wprowadzenie (kwiecien)
  { week: 1,  mezo: "M0", mon: "2026-04-06", thu: "2026-04-09" },
  { week: 2,  mezo: "M0", mon: "2026-04-13", thu: "2026-04-16" },
  { week: 3,  mezo: "M0", mon: "2026-04-20", thu: "2026-04-23" },
  { week: 4,  mezo: "M0", mon: "2026-04-27", thu: "2026-04-30" },
  // M1 Adaptacja (maj)
  { week: 5,  mezo: "M1", mon: "2026-05-04", thu: "2026-05-07" },
  { week: 6,  mezo: "M1", mon: "2026-05-11", thu: "2026-05-14" },
  { week: 7,  mezo: "M1", mon: "2026-05-18", thu: "2026-05-21" },
  { week: 8,  mezo: "M1", mon: "2026-05-25", thu: "2026-05-28" },
  // M2 Podstawy (czerwiec)
  { week: 9,  mezo: "M2", mon: "2026-06-01", thu: "2026-06-04" },
  { week: 10, mezo: "M2", mon: "2026-06-08", thu: "2026-06-11" },
  { week: 11, mezo: "M2", mon: "2026-06-15", thu: "2026-06-18" },
  { week: 12, mezo: "M2", mon: "2026-06-22", thu: "2026-06-25" },
  // PRZERWA 01.07–15.08
  // M3 Powrot (sierpien-wrzesien)
  { week: 13, mezo: "M3", mon: "2026-08-17", thu: "2026-08-20" },
  { week: 14, mezo: "M3", mon: "2026-08-24", thu: "2026-08-27" },
  { week: 15, mezo: "M3", mon: "2026-08-31", thu: "2026-09-03" },
  { week: 16, mezo: "M3", mon: "2026-09-07", thu: "2026-09-10" },
  // M4 Rozwoj (wrzesien-pazdziernik)
  { week: 17, mezo: "M4", mon: "2026-09-14", thu: "2026-09-17" },
  { week: 18, mezo: "M4", mon: "2026-09-21", thu: "2026-09-24" },
  { week: 19, mezo: "M4", mon: "2026-09-28", thu: "2026-10-01" },
  { week: 20, mezo: "M4", mon: "2026-10-05", thu: "2026-10-08" },
  // M5 Konsolidacja (pazdziernik)
  { week: 21, mezo: "M5", mon: "2026-10-12", thu: "2026-10-15" },
  { week: 22, mezo: "M5", mon: "2026-10-19", thu: "2026-10-22" },
  { week: 23, mezo: "M5", mon: "2026-10-26", thu: "2026-10-29" },
];

const MEZO_NAZWY: Record<string, string> = {
  M0: "Wprowadzenie",
  M1: "Adaptacja",
  M2: "Podstawy",
  M3: "Powrot po przerwie",
  M4: "Rozwoj",
  M5: "Konsolidacja",
};

// ====================================================================
// CURRICULUM — 46 tematow per grupa (23 tyg x 2 dni: pon, czw)
// ====================================================================

type Topics = [string, string][]; // [mon, thu] x 23 tygodnie

const CURRICULUM_MIKRUS: Topics = [
  ["Postawa hokejowa - statyczna",        "Rownowaga - stanie na 2 nogach"],
  ["Postawa w ruchu - pierwsze pchniecia","Postawa - przemiennie L/P"],
  ["Pchniecie boczne - dlugie slizgi",    "Krok dwojka - przedluzone slizgi"],
  ["Slalom miedzy pacholkami",            "Test motoryczny + zabawa"],
  ["Jazda przodem - dluga linia",         "Krawedz wewnetrzna - luk wasi"],
  ["Krawedz zewnetrzna - luk szeroki",    "Slalom z pacholkami - 5 zwrotow"],
  ["Zwolnienie zabawowe (bez T-stop)",    "Kij - chwyt podstawowy"],
  ["Kij - prowadzenie krazka po linii",   "Berek z kijem"],
  ["Zwrot 180° - na statyce",             "Zwrot 180° - w wolnym ruchu"],
  ["Prowadzenie krazka po slalomie",      "Kij - manipulacja w miejscu"],
  ["Pchniecie krazka - podanie do mety",  "Pierwsze odbiory krazka"],
  ["Forma turniejowa - zabawa hokejowa",  "Mini-turniej zabawowy"],
  ["Powrot po przerwie - postawa",        "Krawedzie - powtorka"],
  ["Kij - powrot do prowadzenia",         "Zabawy z krazkiem"],
  ["Slalom - przypomnienie",              "Jazda + kij = laczenie"],
  ["Pierwsze prowadzenie ciagle",         "Berek z krazkiem"],
  ["Odbior krazka - z ruchu",             "Podanie do partnera - statyka"],
  ["Podanie do partnera - wolny ruch",    "Power skating elementarny"],
  ["Krawedzie - zaokraglone luki",        "Kij - prowadzenie obok ciala"],
  ["Strzal-pchniecie krazka po linii",    "Zabawowa gra zespolowa"],
  ["Mini-gra hokejowa - z zabawa",        "Mini-gra - laczenie elementow"],
  ["Konkurencje - kto najszybciej slalom","Wewnetrzny mini-turniej"],
  ["Test motoryczny koncowy",             "Podsumowanie sezonu rolkowego"],
];

const CURRICULUM_MINI_HOKEJ: Topics = [
  ["Postawa hokejowa - korekta indywidualna","Krawedzie wewnetrzne - statyka"],
  ["Krawedzie zewnetrzne - statyka",         "Pchniecie boczne - dlugie slizgi"],
  ["Power skating bazowy - dlugosc kroku",   "Jazda 1-nozna - balans"],
  ["Krawedzie - na luku wasim",              "Test motoryczny + scrimmage bazowy"],
  ["Krawedzie agresywne (rolki)",            "Jazda 1-nozna - dluzsze slidy"],
  ["Slalom z kijem",                          "Slalom z kijem + krazek"],
  ["Power skating - eksplozywne pchniecie",  "Chwyt kija + jazda przodem"],
  ["Prowadzenie krazka - przed soba",        "Prowadzenie po slalomie"],
  ["Jazda tylem - statyka + slizg",          "Jazda tylem - dluzsza linia"],
  ["Podanie w miejscu - obie rece",          "Podanie w ruchu - powoli"],
  ["Kontrola krazka w ruchu",                "Strzal wrist - z miejsca"],
  ["Pierwsze 1v1 - tylko atakujacy",         "Scrimmage - forma turniejowa"],
  ["Postawa i jazda - powrot",               "Krawedzie - przypomnienie"],
  ["Drybling przemienny F/B",                "Drybling w wolnym ruchu"],
  ["Podanie w ruchu - srednie tempo",        "Jazda tylem z krazkiem"],
  ["Strzal wrist z ruchu",                   "Mini scrimmage"],
  ["Strzal wrist + odbior",                  "Strzal snap - z miejsca"],
  ["Jazda tylem + podanie",                  "Koordynacja noga-kij"],
  ["1v1 - decyzja atakujacego",              "1v1 - decyzja obroncy"],
  ["Drybling pod presja",                    "Mini-gra 3v3 - bez taktyki"],
  ["Gra 3v3 - poznajemy taktyke",            "Gra 3v3 - taktyka 1v1"],
  ["Gra 3v3 - taktyka decyzji",              "Mini-turniej wewnetrzny"],
  ["Test motoryczny",                        "Podsumowanie sezonu"],
];

const CURRICULUM_MLODZIK: Topics = [
  ["Krawedzie agresywne - statyka",          "Start eksplozywny - z miejsca"],
  ["Jazda 360° - statyka",                   "Long slide - na 1 nodze"],
  ["Power skating - kombinacja",             "Krawedzie glebokie - luk wasi"],
  ["Pchniecie boczne maks",                  "Test motoryczny + scrimmage"],
  ["Krawedzie agresywne (rolki)",            "Jazda po skosie - cross"],
  ["Start eksplozywny z prowadzeniem",       "Slalom z kijem szybki"],
  ["Power skating dynamiczny",               "Jazda po luku z krazkiem"],
  ["Drybling pod presja statyczna",          "Sprint hokejowy"],
  ["Gra z krazkiem w ruchu",                 "Prowadzenie pod presja"],
  ["Jazda tylem z krazkiem",                 "Podanie z ruchu - z predkoscia"],
  ["Strzal z miejsca - precyzja",            "1v1 - decyzje atak/obronca"],
  ["Gra 2v1 - przewaga liczebna",            "Scrimmage taktyczny"],
  ["Power skating - powrot",                 "Krawedzie - po przerwie"],
  ["Drybling + podanie w ruchu",             "Jazda tylem z krazkiem - dluzsze"],
  ["Strzal z ruchu - wrist",                 "Strzal z ruchu - snap"],
  ["Mini 2v1 - decyzje",                     "Gra 3v3 - taktyka 2v2"],
  ["Strzal z predkosci - z ruchu",           "Gra 2v1 - decyzje obroncy"],
  ["Gra 2v2 - taktyka zespolowa",            "Decyzje w pressing"],
  ["Power skating dynamiczny - z krazkiem",  "Podanie z predkosci - precyzja"],
  ["Pressing strefowy",                      "Mini 4v4 - struktury gry"],
  ["Gra 4v4 - systemy ataku",                "Gra 4v4 - systemy obrony"],
  ["Pressing pozycyjny",                     "Mini-turniej z systemami"],
  ["Test motoryczny + decyzje",              "Podsumowanie sezonu"],
];

const CURRICULUM: Record<SwhCategory, Topics> = {
  MIKRUS: CURRICULUM_MIKRUS,
  MINI_HOKEJ: CURRICULUM_MINI_HOKEJ,
  MLODZIK: CURRICULUM_MLODZIK,
  JUNIOR: [], // nie uzywany w 2026
};

// Cele Grutha per mezocykl - jako tekst dla `objectives`
const MEZO_CELE: Record<string, string> = {
  M0: "Postawa hokejowa (R1-R3), Krawedzie bazowe (R4-R5), Rownowaga",
  M1: "Krawedzie zaawansowane (R6-R8), Power skating, Kij - chwyt (K1)",
  M2: "Krazek (K2-K4), Podania bazowe (P1), Jazda tylem (R9)",
  M3: "Drybling (K5-K7), Podania w ruchu (P2-P3), Koordynacja",
  M4: "Strzal (S1-S3), Decyzje 1v1 (A1), Power skating dynamiczny",
  M5: "Gra zespolowa (A2-A4, O1-O3), Systemy (zaleznie od grupy)",
};

// ====================================================================
// SCHEDULE - cele dla cyklicznych treningow
// ====================================================================

interface ScheduleTarget {
  swh: SwhCategory;
  day: number;      // 1=pon, 4=czw
  start: string;    // HH:MM
  end: string;
  location: string;
}

const SCHEDULE_TARGETS: ScheduleTarget[] = [
  { swh: "MIKRUS",     day: 1, start: "18:30", end: "20:00", location: "ARMS / Rolkowisko" },
  { swh: "MIKRUS",     day: 4, start: "18:30", end: "20:00", location: "ARMS / Rolkowisko" },
  { swh: "MINI_HOKEJ", day: 1, start: "18:30", end: "20:00", location: "ARMS / Rolkowisko" },
  { swh: "MINI_HOKEJ", day: 4, start: "18:30", end: "20:00", location: "ARMS / Rolkowisko" },
  { swh: "MLODZIK",    day: 1, start: "19:30", end: "21:00", location: "ARMS / Rolkowisko" },
  { swh: "MLODZIK",    day: 4, start: "19:30", end: "21:00", location: "ARMS / Rolkowisko" },
];

// Godziny sesji konspektowych per grupa
const GROUP_HOURS: Record<SwhCategory, { hour: number; minute: number }> = {
  MIKRUS:     { hour: 18, minute: 30 },
  MINI_HOKEJ: { hour: 18, minute: 30 },
  MLODZIK:    { hour: 19, minute: 30 },
  JUNIOR:     { hour: 19, minute: 30 },
};

const GROUP_AGE: Record<SwhCategory, "U8" | "U10" | "U12" | "U14" | "U16"> = {
  MIKRUS:     "U8",
  MINI_HOKEJ: "U10",
  MLODZIK:    "U14",
  JUNIOR:     "U16",
};

const GROUP_LABEL: Record<SwhCategory, string> = {
  MIKRUS: "Mikrus",
  MINI_HOKEJ: "Mini Hokej",
  MLODZIK: "Mlodzik",
  JUNIOR: "Junior",
};

// ====================================================================
// HELPERS
// ====================================================================

function checkKey(req: NextRequest): NextResponse | null {
  const key = new URL(req.url).searchParams.get("key");
  if (key !== SECRET_KEY) {
    return NextResponse.json({ error: "Invalid or missing key" }, { status: 401 });
  }
  if (new Date() > EXPIRES_AT) {
    return NextResponse.json({ error: "Endpoint expired" }, { status: 410 });
  }
  return null;
}

// Polska strefa: CEST UTC+2 dla 29.03-25.10.2026, CET UTC+1 poza tym
function plToUtc(dateStr: string, hour: number, minute: number): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  let offsetHours = 1; // CET default
  if (year === 2026) {
    if (
      (month === 3 && day >= 29) ||
      (month > 3 && month < 10) ||
      (month === 10 && day <= 25)
    ) {
      offsetHours = 2; // CEST
    }
  }
  return new Date(Date.UTC(year, month - 1, day, hour - offsetHours, minute, 0));
}

// ====================================================================
// GET — dry run (pokazuje plan, nie zapisuje)
// ====================================================================

export async function GET(req: NextRequest) {
  const err = checkKey(req);
  if (err) return err;

  const existing = await prisma.trainingPlan.count();

  const groups = await prisma.trainingGroup.findMany({
    where: { swhCategory: { in: ["MIKRUS", "MINI_HOKEJ", "MLODZIK"] } },
    select: { id: true, name: true, swhCategory: true, category: true },
  });

  return NextResponse.json({
    mode: "DRY RUN - nic nie zostalo zapisane",
    existingPlans: existing,
    canSeed: existing === 0,
    targetGroups: groups,
    plan: {
      yearly: 3,
      seasonal: 3,
      weekly: 69,
      sessions: 138,
      totalObjects: 213,
    },
    structure: {
      mezocykle: Object.entries(MEZO_NAZWY).map(([k, v]) => `${k}: ${v}`),
      tygodnie: TYGODNIE.length,
      sessionsPerWeekPerGroup: 2,
      groups: ["MIKRUS", "MINI_HOKEJ", "MLODZIK"],
    },
    schedule: SCHEDULE_TARGETS,
    note: existing > 0
      ? "Baza nie jest pusta. Najpierw uruchom cleanup-plans."
      : "OK do seedingu. POST aby zaszyc.",
  });
}

// ====================================================================
// POST — realne zaszywanie
// ====================================================================

export async function POST(req: NextRequest) {
  const err = checkKey(req);
  if (err) return err;

  const existing = await prisma.trainingPlan.count();
  if (existing > 0) {
    return NextResponse.json(
      {
        error: `Baza ma ${existing} planow. Najpierw uruchom cleanup-plans.`,
      },
      { status: 409 }
    );
  }

  // Znajdz creator (admin) dla pol createdById
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) {
    return NextResponse.json({ error: "Brak konta ADMIN w bazie" }, { status: 500 });
  }

  // Znajdz grupy
  const groups = await prisma.trainingGroup.findMany({
    where: { swhCategory: { in: ["MIKRUS", "MINI_HOKEJ", "MLODZIK"] } },
  });
  const groupBySwh = new Map<SwhCategory, typeof groups[0]>();
  for (const g of groups) {
    if (g.swhCategory) groupBySwh.set(g.swhCategory, g);
  }
  const missing = (["MIKRUS", "MINI_HOKEJ", "MLODZIK"] as SwhCategory[]).filter(
    (s) => !groupBySwh.has(s)
  );
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Brak grup w bazie: ${missing.join(", ")}` },
      { status: 500 }
    );
  }

  const report: Record<string, unknown> = {
    schedule: { updated: 0, created: 0 },
    yearly: 0,
    seasonal: 0,
    weekly: 0,
    sessions: 0,
  };

  // ===== 1. SCHEDULE — update/create =====
  for (const target of SCHEDULE_TARGETS) {
    const group = groupBySwh.get(target.swh)!;
    const existingSch = await prisma.schedule.findFirst({
      where: { groupId: group.id, dayOfWeek: target.day, active: true },
    });
    if (existingSch) {
      await prisma.schedule.update({
        where: { id: existingSch.id },
        data: {
          startTime: target.start,
          endTime: target.end,
          location: target.location,
        },
      });
      (report.schedule as { updated: number }).updated++;
    } else {
      await prisma.schedule.create({
        data: {
          groupId: group.id,
          dayOfWeek: target.day,
          startTime: target.start,
          endTime: target.end,
          location: target.location,
          recurring: true,
          active: true,
        },
      });
      (report.schedule as { created: number }).created++;
    }
  }

  // ===== 2-5. PLANY i SESJE per grupa =====
  for (const swh of ["MIKRUS", "MINI_HOKEJ", "MLODZIK"] as SwhCategory[]) {
    const group = groupBySwh.get(swh)!;
    const label = GROUP_LABEL[swh];
    const age = GROUP_AGE[swh];
    const { hour, minute } = GROUP_HOURS[swh];
    const topics = CURRICULUM[swh];

    // 2. PLAN ROCZNY
    const yearly = await prisma.trainingPlan.create({
      data: {
        name: `Plan Roczny ${label} 2026/2027`,
        description:
          `Rama szkoleniowa na sezon 2026/2027 dla grupy ${label}. ` +
          `Cele: rozwoj zgodny z LTPD Hockey Canada, ` +
          `testy kontrolne 2x rok (HC LTAD/CSLH), ` +
          `przygotowanie do HLH (rolki + lod).`,
        category: age,
        swhCategory: swh,
        planType: PlanType.YEARLY,
        season: "2026/2027",
        groupId: group.id,
        createdById: admin.id,
      },
    });
    report.yearly = (report.yearly as number) + 1;

    // 3. PLAN SEZONOWY LETNI
    const seasonal = await prisma.trainingPlan.create({
      data: {
        name: `Plan Sezonowy Letni ${label} 2026 (04-10)`,
        description:
          `Sezon rolkowy 06.04-30.10.2026 (przerwa 01.07-15.08). ` +
          `6 mezocykli: M0 Wprowadzenie, M1 Adaptacja, M2 Podstawy, ` +
          `M3 Powrot, M4 Rozwoj, M5 Konsolidacja. ` +
          `Filozofia rolkowa: 0 hamowan i start-stop, ` +
          `dominanty: jazda, postawa, kij, power skating.`,
        category: age,
        swhCategory: swh,
        planType: PlanType.SEASONAL,
        season: "roller-2026",
        periodStart: plToUtc("2026-04-06", hour, minute),
        periodEnd: plToUtc("2026-10-30", hour, minute),
        groupId: group.id,
        createdById: admin.id,
        parentPlanId: yearly.id,
      },
    });
    report.seasonal = (report.seasonal as number) + 1;

    // 4-5. PLANY TYGODNIOWE + SESJE
    for (const w of TYGODNIE) {
      const idx = w.week - 1; // 0..22
      const [topicMon, topicThu] = topics[idx];
      const mezo = MEZO_NAZWY[w.mezo];

      const weekly = await prisma.trainingPlan.create({
        data: {
          name: `Tydzien ${w.week} (${w.mezo} ${mezo}) — ${label}`,
          description:
            `Tydzien ${w.week} sezonu letniego 2026. ` +
            `Mezocykl: ${w.mezo} ${mezo}. ` +
            `Pon ${w.mon}, Czw ${w.thu}. ` +
            `Cele Grutha: ${MEZO_CELE[w.mezo]}`,
          category: age,
          swhCategory: swh,
          planType: PlanType.WEEKLY,
          season: "roller-2026",
          periodStart: plToUtc(w.mon, hour, minute),
          periodEnd: plToUtc(w.thu, hour, minute),
          groupId: group.id,
          createdById: admin.id,
          parentPlanId: seasonal.id,
        },
      });
      report.weekly = (report.weekly as number) + 1;

      // Sesja PON
      await prisma.trainingSession.create({
        data: {
          planId: weekly.id,
          title: `Sesja Pn — ${topicMon}`,
          topic: topicMon,
          date: plToUtc(w.mon, hour, minute),
          duration: 90,
          objectives: `${w.mezo} ${mezo}. Cele Grutha: ${MEZO_CELE[w.mezo]}`,
          order: (w.week - 1) * 2 + 1,
        },
      });
      report.sessions = (report.sessions as number) + 1;

      // Sesja CZW
      await prisma.trainingSession.create({
        data: {
          planId: weekly.id,
          title: `Sesja Cz — ${topicThu}`,
          topic: topicThu,
          date: plToUtc(w.thu, hour, minute),
          duration: 90,
          objectives: `${w.mezo} ${mezo}. Cele Grutha: ${MEZO_CELE[w.mezo]}`,
          order: (w.week - 1) * 2 + 2,
        },
      });
      report.sessions = (report.sessions as number) + 1;
    }
  }

  // Finalne liczniki z bazy
  const [finalPlans, finalSessions] = await Promise.all([
    prisma.trainingPlan.count(),
    prisma.trainingSession.count(),
  ]);

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    report,
    final: {
      plans: finalPlans,
      sessions: finalSessions,
    },
    nextStep:
      "Sprawdz kalendarz. Po weryfikacji usun pliki: cleanup-plans/route.ts i seed-plans-2026/route.ts.",
  });
}
