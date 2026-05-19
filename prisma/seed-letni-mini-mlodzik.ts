/**
 * Seed: Plan Letni 2026 — Mini Hokej + Młodzik
 *
 * Tworzy 2 podplany letnie (06.05–30.06.2026) dopięte do istniejących
 * "Program roczny Mini Hokej 2025/26" i "Program roczny Młodzik 2025/26".
 *
 * Źródło danych: SWH_Plan_Letni_2026.xlsx (arkusz Wszystkie_Sesje, sesje #2–#17).
 * Sesja #1 (04.05.2026) pomijana — była przed okresem startu.
 *
 * Logika:
 *  - 16 sesji × 2 grupy = 32 TrainingSession łącznie
 *  - Mini Hokej: godzina 18:30, kategoria U10
 *  - Młodzik:    godzina 19:30, kategoria U14
 *  - Każda sesja: data + tytuł + duration + objectives (faza+typ+poziom) + notes (opis ćwiczeń)
 *  - Bezpiecznie: usuwa TYLKO sesje z 2 nowych podplanów (po nazwie) — nic innego nie tyka
 *
 * Uruchom:
 *   npx tsx prisma/seed-letni-mini-mlodzik.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ==================== DANE Z XLSX (Wszystkie_Sesje) ====================

type SessionPlan = {
  num: number;
  date: string;       // ISO yyyy-mm-dd
  day: "Pon" | "Czw"; // kontrola spójności
  type: string;
  title: string;
  min: number;
  phase: string;      // I, I→II, II, II→III, III
  levelMini: string;
  levelMlodzik: string;
  desc: string;
};

const SESSIONS: SessionPlan[] = [
  { num: 2,  date: "2026-05-08", day: "Czw", type: "★PRE-T1",  title: "Forma turniejowa + polishing",                       min: 90, phase: "I",     levelMini: "Forma",   levelMlodzik: "Forma",   desc: "Rozgrzewka 10', powtórka kluczowych umiejętności 30', mini-mecze symulujące turniej 40', stretching 10'" },
  { num: 3,  date: "2026-05-11", day: "Pon", type: "POST-T1",  title: "Debrief T1 + korekta defensywy",                     min: 90, phase: "I→II",  levelMini: "Korekta", levelMlodzik: "Korekta", desc: "Omówienie turnieju 15', ćwiczenia korekty błędów z T1 30', defensywa 1v1 i 2v2 30', gra swobodna 15'" },
  { num: 4,  date: "2026-05-15", day: "Czw", type: "B",        title: "Koniec Fazy I + aerob 25 min",                       min: 90, phase: "I→II",  levelMini: "Trenowanie", levelMlodzik: "Doskonalenie", desc: "Rozgrzewka 10', ćwiczenia techniczne 30', BLOK AEROBOWY 25 min (test mowy), cooldown 25'" },
  { num: 5,  date: "2026-05-18", day: "Pon", type: "A",        title: "Wyprowadzenie z tercji — schematy 3-osobowe",        min: 90, phase: "II",    levelMini: "Trenowanie", levelMlodzik: "Doskonalenie", desc: "Rozgrzewka 10', schematy 3-osobowe (trójkąt, ściana) 35', zastosowanie w grze 30', cooldown 15'" },
  { num: 6,  date: "2026-05-22", day: "Czw", type: "B",        title: "Przewaga 4v3 + aerob 25 min",                        min: 90, phase: "II",    levelMini: "Trenowanie", levelMlodzik: "Doskonalenie", desc: "Rozgrzewka 10', ćwiczenia taktyczne 4v3 30', BLOK AEROBOWY 25 min (test mowy), cooldown 25'" },
  { num: 7,  date: "2026-05-25", day: "Pon", type: "★PRE-T2",  title: "Kombinacje 2v1 + forma turniejowa",                  min: 90, phase: "II",    levelMini: "Forma",   levelMlodzik: "Forma",   desc: "Rozgrzewka 10', kombinacje 2v1 25', mini-mecze formowe 45', briefing przedturniejowy 10'" },
  { num: 8,  date: "2026-05-29", day: "Czw", type: "C",        title: "POST-T2 + 1. sesja mleczanowa",                      min: 90, phase: "II",    levelMini: "Doskonalenie", levelMlodzik: "Opanowanie", desc: "Debrief T2 10', praca mleczanowa interwałowa 40', elementy taktyczne 25', cooldown 15'" },
  { num: 9,  date: "2026-06-01", day: "Pon", type: "A",        title: "Sytuacje stałe — faceoff, rzut karny",               min: 90, phase: "II",    levelMini: "Doskonalenie", levelMlodzik: "Opanowanie", desc: "Rozgrzewka 10', faceoff technika i taktyka 25', rzut karny 20', sytuacje specjalne 20', gra 15'" },
  { num: 10, date: "2026-06-05", day: "Czw", type: "★PRE-T3",  title: "Screen + forma (Boże Ciało 04.06)",                  min: 90, phase: "II",    levelMini: "Forma",   levelMlodzik: "Forma",   desc: "Rozgrzewka 10', screen i zasłony 25', mini-mecze formowe 45', stretching 10'" },
  { num: 11, date: "2026-06-08", day: "Pon", type: "B",        title: "POST-T3 + rotacja napastników + aerob 30 min",       min: 90, phase: "II→III",levelMini: "Doskonalenie", levelMlodzik: "Opanowanie", desc: "Debrief T3 10', rotacja linii napastników 25', BLOK AEROBOWY 30 min (test mowy), cooldown 25'" },
  { num: 12, date: "2026-06-12", day: "Czw", type: "B",        title: "Testy postępu T1-T6 (vs 13.04.2026)",                min: 90, phase: "II→III",levelMini: "Pomiar",  levelMlodzik: "Pomiar",  desc: "TESTY SPRAWNOŚCIOWE T1-T6: T1-Czas jazdy, T2-Crossovers, T3-Strzały, T4-Slalom, T5-Reakcja, T6-Wytrzymałość. Porównanie z 13.04.2026" },
  { num: 13, date: "2026-06-15", day: "Pon", type: "C",        title: "Start Fazy III — szybkość + eksplozywność",          min: 90, phase: "III",   levelMini: "Doskonalenie", levelMlodzik: "Opanowanie", desc: "Rozgrzewka 15', sprinty i eksplozywność 30', praca mleczanowa interwałowa 30', cooldown 15'" },
  { num: 14, date: "2026-06-19", day: "Czw", type: "C",        title: "Max intensywność — szczyt sezonu",                   min: 90, phase: "III",   levelMini: "Doskonalenie", levelMlodzik: "Opanowanie", desc: "Rozgrzewka 15', max intensywność — interwały krótkie 40', gra w wysokim tempie 25', cooldown 10'" },
  { num: 15, date: "2026-06-22", day: "Pon", type: "★PRE-T4",  title: "Symulacja dnia HLH — 3 mecze",                       min: 90, phase: "III",   levelMini: "Forma",   levelMlodzik: "Forma",   desc: "Symulacja całego dnia turniejowego: 3 mecze 20' z przerwami 15', odprawy między meczami, briefing końcowy" },
  { num: 16, date: "2026-06-26", day: "Czw", type: "A",        title: "Ostatni trening + wręczenie dyplomów",               min: 60, phase: "III",   levelMini: "Zakończenie", levelMlodzik: "Zakończenie", desc: "Rozgrzewka 10', gra swobodna 20', ceremonia wręczenia dyplomów i podziękowań 30'" },
  { num: 17, date: "2026-06-29", day: "Pon", type: "A",        title: "Gra swobodna + zadania domowe na lipiec",            min: 60, phase: "III",   levelMini: "Zakończenie", levelMlodzik: "Zakończenie", desc: "Gra swobodna 30', podsumowanie sezonu 10', wydanie kart zadań domowych na lipiec 20'" },
];

// ==================== KONFIGURACJA GRUP ====================

const GROUPS = [
  {
    label:        "Mini Hokej",
    childPlanName:"Mini Hokej — Plan Letni 2026 (06.05–30.06)",
    childPlanDesc:"Plan letni rolkowy maj–czerwiec 2026. 16 sesji wg metodologii SWH (Pn+Cz, 18:30–20:00). Faza I→II→III, 4 turnieje HLH (T1–T4). Źródło: SWH_Plan_Letni_2026.",
    parentNameLike: "Program roczny Mini Hokej",
    category:     "U10",
    hour:         18,
    minute:       30,
    levelKey:     "levelMini" as const,
  },
  {
    label:        "Młodzik",
    childPlanName:"Młodzik — Plan Letni 2026 (06.05–30.06)",
    childPlanDesc:"Plan letni rolkowy maj–czerwiec 2026. 16 sesji wg metodologii SWH (Pn+Cz, 19:30–21:00). Faza I→II→III, 4 turnieje HLH (T1–T4). Building the Engine.",
    parentNameLike: "Program roczny Młodzik",
    category:     "U14",
    hour:         19,
    minute:       30,
    levelKey:     "levelMlodzik" as const,
  },
];

// ==================== SEED ====================

function buildDate(isoDate: string, hour: number, minute: number): Date {
  // Zakładamy strefę polską — używamy lokalnego czasu, nie UTC.
  // Format: YYYY-MM-DDTHH:MM:00
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return new Date(`${isoDate}T${hh}:${mm}:00`);
}

async function main() {
  console.log("🌱 Seed: Plan Letni 2026 — Mini Hokej + Młodzik");
  console.log(`   Okres: ${SESSIONS[0].date} → ${SESSIONS[SESSIONS.length - 1].date}`);
  console.log(`   Sesji: ${SESSIONS.length} × 2 grupy = ${SESSIONS.length * 2}`);
  console.log("");

  // Znajdź pierwszego admina (dla pola createdById)
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) {
    throw new Error("Brak użytkownika ADMIN w bazie — nie można ustawić createdById planu.");
  }

  for (const group of GROUPS) {
    console.log(`▶ ${group.label}`);

    // 1. Znajdź plan roczny (parent)
    const parentPlan = await prisma.trainingPlan.findFirst({
      where: { name: { contains: group.parentNameLike } },
    });

    if (!parentPlan) {
      console.warn(`   ⚠️  Nie znaleziono planu rocznego "${group.parentNameLike}" — pomijam grupę.`);
      console.warn(`       Utwórz najpierw plan roczny w UI lub uruchom seed głównego planu rocznego.`);
      continue;
    }

    console.log(`   Plan roczny (parent): ${parentPlan.name} [id=${parentPlan.id}]`);

    // 2. Czy podplan letni już istnieje? Jeśli tak — usuń wraz z sesjami (cascade)
    const existingChild = await prisma.trainingPlan.findFirst({
      where: { name: group.childPlanName },
    });

    if (existingChild) {
      console.log(`   ⤳ Istniejący podplan "${existingChild.name}" — usuwam (cascade usunie sesje).`);
      // Usuwamy najpierw sesje (w razie braku cascade), potem sam plan
      await prisma.trainingSession.deleteMany({ where: { planId: existingChild.id } });
      await prisma.trainingPlan.delete({ where: { id: existingChild.id } });
    }

    // 3. Utwórz nowy podplan letni
    const childPlan = await prisma.trainingPlan.create({
      data: {
        name:         group.childPlanName,
        description:  group.childPlanDesc,
        category:     group.category as any,
        planType:     "WEEKLY" as any,
        parentPlanId: parentPlan.id,
        season:       "2025/2026",
        periodStart:  new Date("2026-05-06"),
        periodEnd:    new Date("2026-06-30"),
        totalSessions: SESSIONS.length,
        totalDuration: SESSIONS.reduce((sum, s) => sum + s.min, 0),
        createdById:  admin.id,
      },
    });

    console.log(`   ✓ Utworzono podplan: ${childPlan.name} [id=${childPlan.id}]`);

    // 4. Utwórz 16 sesji
    let order = 1;
    for (const s of SESSIONS) {
      const date = buildDate(s.date, group.hour, group.minute);
      const level = s[group.levelKey];
      const title = `Sesja ${s.num} — ${s.title}`;
      const objectives = `Faza ${s.phase} · Typ ${s.type} · ${group.label}: ${level}`;

      await prisma.trainingSession.create({
        data: {
          planId:     childPlan.id,
          title:      title,
          date:       date,
          duration:   s.min,
          objectives: objectives,
          notes:      s.desc,
          order:      order,
        },
      });
      order++;
    }

    console.log(`   ✓ Wstawiono ${SESSIONS.length} sesji (${SESSIONS.reduce((sum, s) => sum + s.min, 0)} minut łącznie)`);
    console.log("");
  }

  console.log("✅ Seed zakończony pomyślnie.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
