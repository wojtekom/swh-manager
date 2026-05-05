import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// TYMCZASOWY ENDPOINT — USUNĄĆ PO UŻYCIU
// GET /api/seed-run?key=swh2026seed
export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("key") !== "swh2026seed") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results: string[] = [];

    // ======= SEED SKILLS (87 umiejętności Grutha) =======
    const skills = [
      { code: "R1", name: "Prawidlowa postawa", category: "ROLKI", sortOrder: 100, expectedU8: "T", expectedU10: "D", expectedU12: "O" },
      { code: "R2", name: "Jazda przodem - slizgi na dwoch nogach", category: "ROLKI", sortOrder: 101, expectedU8: "T", expectedU10: "D", expectedU12: "O" },
      { code: "R3", name: "Jazda przodem - balwanek (pompowanie)", category: "ROLKI", sortOrder: 102, expectedU8: "T", expectedU10: "D", expectedU12: "O" },
      { code: "R4", name: "Jazda przodem - krzyzowanie (crossover)", category: "ROLKI", sortOrder: 103, expectedU8: "W", expectedU10: "T", expectedU12: "D", expectedU14: "O" },
      { code: "R5", name: "Jazda tylem - slizgi na dwoch nogach", category: "ROLKI", sortOrder: 104, expectedU8: "W", expectedU10: "T", expectedU12: "D" },
      { code: "R6", name: "Jazda tylem - balwanek", category: "ROLKI", sortOrder: 105, expectedU8: "W", expectedU10: "T", expectedU12: "D" },
      { code: "R7", name: "Jazda tylem - krzyzowanie", category: "ROLKI", sortOrder: 106, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
      { code: "R8", name: "Hamowanie - plugiem", category: "ROLKI", sortOrder: 107, expectedU8: "T", expectedU10: "D", expectedU12: "O" },
      { code: "R9", name: "Hamowanie - T-stop", category: "ROLKI", sortOrder: 108, expectedU8: "W", expectedU10: "T", expectedU12: "D" },
      { code: "R10", name: "Hamowanie - hockey stop", category: "ROLKI", sortOrder: 109, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
      { code: "R11", name: "Zwroty - pivot przod-tyl", category: "ROLKI", sortOrder: 110, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
      { code: "R12", name: "Zwroty - pivot tyl-przod", category: "ROLKI", sortOrder: 111, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
      { code: "L1", name: "Prawidlowa postawa na lodzie", category: "LYZWY", sortOrder: 200, expectedU8: "T", expectedU10: "D", expectedU12: "O" },
      { code: "L2", name: "Jazda przodem - slizgi na dwoch nogach", category: "LYZWY", sortOrder: 201, expectedU8: "T", expectedU10: "D", expectedU12: "O" },
      { code: "L3", name: "Jazda przodem - odpychanie (stride)", category: "LYZWY", sortOrder: 202, expectedU8: "T", expectedU10: "D", expectedU12: "O" },
      { code: "L4", name: "Jazda przodem - crossover", category: "LYZWY", sortOrder: 203, expectedU8: "W", expectedU10: "T", expectedU12: "D", expectedU14: "O" },
      { code: "L5", name: "Jazda tylem - slizgi na dwoch nogach", category: "LYZWY", sortOrder: 204, expectedU8: "W", expectedU10: "T", expectedU12: "D" },
      { code: "L6", name: "Jazda tylem - C-cut", category: "LYZWY", sortOrder: 205, expectedU8: "W", expectedU10: "T", expectedU12: "D" },
      { code: "L7", name: "Jazda tylem - crossover", category: "LYZWY", sortOrder: 206, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
      { code: "L8", name: "Hamowanie - plugiem", category: "LYZWY", sortOrder: 207, expectedU8: "T", expectedU10: "D", expectedU12: "O" },
      { code: "L9", name: "Hamowanie - hockey stop (obie strony)", category: "LYZWY", sortOrder: 208, expectedU8: "W", expectedU10: "T", expectedU12: "D", expectedU14: "O" },
      { code: "L10", name: "Starty - przod, tyl, boczne", category: "LYZWY", sortOrder: 209, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
      { code: "L11", name: "Pivoty - przod-tyl", category: "LYZWY", sortOrder: 210, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
      { code: "L12", name: "Pivoty - tyl-przod", category: "LYZWY", sortOrder: 211, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
      { code: "K1", name: "Trzymanie kija - chwyt podstawowy", category: "KRAZEK", sortOrder: 300, expectedU8: "T", expectedU10: "D", expectedU12: "O" },
      { code: "K2", name: "Prowadzenie przodem - forehand", category: "KRAZEK", sortOrder: 301, expectedU8: "T", expectedU10: "D", expectedU12: "O" },
      { code: "K3", name: "Prowadzenie przodem - backhand", category: "KRAZEK", sortOrder: 302, expectedU8: "W", expectedU10: "T", expectedU12: "D" },
      { code: "K4", name: "Prowadzenie z przelozeniem (toe drag)", category: "KRAZEK", sortOrder: 303, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
      { code: "K5", name: "Prowadzenie z glowa w gorze", category: "KRAZEK", sortOrder: 304, expectedU8: "W", expectedU10: "T", expectedU12: "D", expectedU14: "O" },
      { code: "K6", name: "Ochrona krazka cialem", category: "KRAZEK", sortOrder: 305, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
      { code: "K7", name: "Zwody (deking) 1-na-1", category: "KRAZEK", sortOrder: 306, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
      { code: "K8", name: "Przyjecie krazka na kij (cushioning)", category: "KRAZEK", sortOrder: 307, expectedU8: "W", expectedU10: "T", expectedU12: "D" },
      { code: "K9", name: "Podnoszenie krazka lyzka", category: "KRAZEK", sortOrder: 308, expectedU12: "W", expectedU14: "T" },
      { code: "K10", name: "Prowadzenie w slalomie z predkoscia", category: "KRAZEK", sortOrder: 309, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
      { code: "P1", name: "Podanie forehand - po lodzie", category: "PODANIA", sortOrder: 400, expectedU8: "T", expectedU10: "D", expectedU12: "O" },
      { code: "P2", name: "Podanie backhand - po lodzie", category: "PODANIA", sortOrder: 401, expectedU8: "W", expectedU10: "T", expectedU12: "D" },
      { code: "P3", name: "Przyjecie podania - forehand", category: "PODANIA", sortOrder: 402, expectedU8: "T", expectedU10: "D", expectedU12: "O" },
      { code: "P4", name: "Przyjecie podania - backhand", category: "PODANIA", sortOrder: 403, expectedU8: "W", expectedU10: "T", expectedU12: "D" },
      { code: "P5", name: "Podanie w ruchu (przodem)", category: "PODANIA", sortOrder: 404, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
      { code: "P6", name: "Podanie w ruchu (tylem)", category: "PODANIA", sortOrder: 405, expectedU12: "W", expectedU14: "T" },
      { code: "P7", name: "Podanie saucer pass", category: "PODANIA", sortOrder: 406, expectedU12: "W", expectedU14: "T" },
      { code: "P8", name: "Podanie o bande", category: "PODANIA", sortOrder: 407, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
      { code: "P9", name: "Podanie na wolne (do pustego miejsca)", category: "PODANIA", sortOrder: 408, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
      { code: "P10", name: "Podanie bez patrzenia (no-look)", category: "PODANIA", sortOrder: 409, expectedU14: "W" },
      { code: "P11", name: "Przyjecie jednym dotykiem + podanie", category: "PODANIA", sortOrder: 410, expectedU12: "W", expectedU14: "T" },
      { code: "P12", name: "Podanie pod presja (obronca na plecach)", category: "PODANIA", sortOrder: 411, expectedU12: "W", expectedU14: "T" },
      { code: "S1", name: "Strzal nadgarstkowy (wrist shot) - stojac", category: "STRZALY", sortOrder: 500, expectedU8: "W", expectedU10: "T", expectedU12: "D", expectedU14: "O" },
      { code: "S2", name: "Strzal nadgarstkowy - w ruchu", category: "STRZALY", sortOrder: 501, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
      { code: "S3", name: "Strzal z backhandu", category: "STRZALY", sortOrder: 502, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
      { code: "S4", name: "Strzal slap shot (z zamachu)", category: "STRZALY", sortOrder: 503, expectedU12: "W", expectedU14: "T" },
      { code: "S5", name: "Strzal snap shot", category: "STRZALY", sortOrder: 504, expectedU12: "W", expectedU14: "T" },
      { code: "S6", name: "Dobijanie (rebound)", category: "STRZALY", sortOrder: 505, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
      { code: "S7", name: "Strzal z jednego dotyku (one-timer)", category: "STRZALY", sortOrder: 506, expectedU12: "W", expectedU14: "T" },
      { code: "S8", name: "Celowanie - dol bramki", category: "STRZALY", sortOrder: 507, expectedU8: "W", expectedU10: "T", expectedU12: "D" },
      { code: "S9", name: "Celowanie - gora bramki", category: "STRZALY", sortOrder: 508, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
      { code: "S10", name: "Strzal z krecenia sie (spin-o-rama)", category: "STRZALY", sortOrder: 509, expectedU14: "W" },
      { code: "S11", name: "Strzal po zwodzie", category: "STRZALY", sortOrder: 510, expectedU12: "W", expectedU14: "T" },
      { code: "S12", name: "Strzal pod presja obroncy", category: "STRZALY", sortOrder: 511, expectedU12: "W", expectedU14: "T" },
      { code: "O1", name: "Pozycja obronna - gap control", category: "OBRONA", sortOrder: 600, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
      { code: "O2", name: "Jazda tylem 1-na-1", category: "OBRONA", sortOrder: 601, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
      { code: "O3", name: "Kij aktywny (stick on puck)", category: "OBRONA", sortOrder: 602, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
      { code: "O4", name: "Poke check", category: "OBRONA", sortOrder: 603, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
      { code: "O5", name: "Blokowanie linii podania", category: "OBRONA", sortOrder: 604, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
      { code: "O6", name: "Blokowanie strzalu (shot block)", category: "OBRONA", sortOrder: 605, expectedU12: "W", expectedU14: "T" },
      { code: "O7", name: "Czyszczenie strefy (clearing)", category: "OBRONA", sortOrder: 606, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
      { code: "O8", name: "Odbior krazka przy bandzie", category: "OBRONA", sortOrder: 607, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
      { code: "O9", name: "Pokrycie gracza bez krazka", category: "OBRONA", sortOrder: 608, expectedU12: "W", expectedU14: "T" },
      { code: "O10", name: "Komunikacja obronna (calling)", category: "OBRONA", sortOrder: 609, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
      { code: "O11", name: "Pierwszy na krazku (compete level)", category: "OBRONA", sortOrder: 610, expectedU8: "W", expectedU10: "T", expectedU12: "D" },
      { code: "A1", name: "Jazda na wolne lody (finding open ice)", category: "ATAK", sortOrder: 700, expectedU8: "W", expectedU10: "T", expectedU12: "D" },
      { code: "A2", name: "Podanie i rusz (give-and-go)", category: "ATAK", sortOrder: 701, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
      { code: "A3", name: "Trojkat ataku (triangle offense)", category: "ATAK", sortOrder: 702, expectedU12: "W", expectedU14: "T" },
      { code: "A4", name: "Wejscie do strefy - carry-in", category: "ATAK", sortOrder: 703, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
      { code: "A5", name: "Wejscie do strefy - dump-and-chase", category: "ATAK", sortOrder: 704, expectedU12: "W", expectedU14: "T" },
      { code: "A6", name: "Gra na skrzydle - wejscie po bandzie", category: "ATAK", sortOrder: 705, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
      { code: "A7", name: "Zmiana tempa gry", category: "ATAK", sortOrder: 706, expectedU12: "W", expectedU14: "T" },
      { code: "A8", name: "Podkrecenie do bramki (driving the net)", category: "ATAK", sortOrder: 707, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
      { code: "A9", name: "Gra przed bramka (net-front)", category: "ATAK", sortOrder: 708, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
      { code: "A10", name: "Kreowanie sytuacji 2-na-1", category: "ATAK", sortOrder: 709, expectedU12: "W", expectedU14: "T" },
      { code: "A11", name: "Gra w przewadze (power play)", category: "ATAK", sortOrder: 710, expectedU12: "W", expectedU14: "T" },
      { code: "A12", name: "Forecheck - F1 / F2", category: "ATAK", sortOrder: 711, expectedU12: "W", expectedU14: "T" },
      { code: "A13", name: "Breakout - wyjscie ze strefy obronnej", category: "ATAK", sortOrder: 712, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
      { code: "C1", name: "Rownowaga dynamiczna (single-leg)", category: "CIALO", sortOrder: 800, expectedU8: "W", expectedU10: "T", expectedU12: "D" },
      { code: "C2", name: "Koordynacja reka-oko-kij", category: "CIALO", sortOrder: 801, expectedU8: "W", expectedU10: "T", expectedU12: "D" },
      { code: "C3", name: "Zwinnosc (agility) - zmiana kierunku", category: "CIALO", sortOrder: 802, expectedU8: "W", expectedU10: "T", expectedU12: "D", expectedU14: "O" },
      { code: "C4", name: "Wytrzymalosc - zdolnosc powtarzania sprintow", category: "CIALO", sortOrder: 803, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
      { code: "C5", name: "Sila rdzenia (core stability)", category: "CIALO", sortOrder: 804, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
    ];

    let created = 0;
    let updated = 0;
    for (const skill of skills) {
      const existing = await prisma.skillDefinition.findUnique({ where: { code: skill.code } });
      if (existing) {
        await prisma.skillDefinition.update({ where: { code: skill.code }, data: skill });
        updated++;
      } else {
        await prisma.skillDefinition.create({ data: skill });
        created++;
      }
    }
    results.push(`Skills: ${created} created, ${updated} updated (total ${skills.length})`);

    // ======= SEED TRAINING PLANS =======
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!admin) {
      results.push("WARNING: No ADMIN user found, skipping training plans");
      return NextResponse.json({ ok: true, results });
    }

    // Check if plans already exist
    const existingPlans = await prisma.trainingPlan.count();
    if (existingPlans > 5) {
      results.push(`Training plans: already ${existingPlans} plans in DB, skipping`);
      return NextResponse.json({ ok: true, results });
    }

    // Create sample training plan
    const plan = await prisma.trainingPlan.create({
      data: {
        name: "Program Roczny Mikrus (U8)",
        description: "14 jednostek rolkowych (kwiecien-czerwiec). Koncepcja Grutha: zabawa, bezpieczenstwo, pierwsze umiejetnosci.",
        category: "U8",
        planType: "YEARLY",
        season: "2025/2026",
        createdById: admin.id,
        totalSessions: 3,
      },
    });

    // Create a few sample sessions with dates
    const sampleSessions = [
      { title: "Oswojenie z rolkami - pierwsza jazda", duration: 60, order: 1, date: new Date("2026-04-13T19:00:00"),
        objectives: "Prawidlowa postawa (R1). Jazda przodem (R2). Hamowanie plugiem (R8).",
        notes: "ROZGRZEWKA (15 min):\nMarsz w rolkach na dywaniku\nGra: Zamrozony tag\n\nCZESC GLOWNA (25 min):\nPozycja hokejowa - kolana ugiete\nJazda przodem - balwanki\nHamowanie plugiem\nTor przeszkod prosty\n\nGRA (15 min):\nZbieraj monety\nSwobodna jazda z muzyka\n\nZAMKNIECIE (5 min):\nKrag - kazde dziecko mowi co mu sie podobalo" },
      { title: "Postawa i rownowaga", duration: 60, order: 2, date: new Date("2026-04-16T19:00:00"),
        objectives: "Utrwalenie pozycji hokejowej (R1). Slizgi na jednej nodze (R2). Rownowaga (C1).",
        notes: "ROZGRZEWKA (15 min):\nJazda swobodna z muzyka\nSamoloty - jazda z rozlozonymi rekami\nKaczuszki - jazda za trenerem\n\nCZESC GLOWNA (25 min):\nSlizgi na dwoch nogach\nFlaming (5 sek na kazdej nodze)\nWstawanie po upadku (x5)\nSlalom miedzy pacholkami\n\nGRA (15 min):\nCzerwone/zielone swiatlo\nWyscig zolwi (kto najwolniej)\n\nZAMKNIECIE (5 min):\nPokaz ulubionego elementu" },
      { title: "Balwanki i pierwsze crossovers", duration: 60, order: 3, date: new Date("2026-04-20T19:00:00"),
        objectives: "Jazda balwankiem (R3). Crossovery w miejscu (R4). Jazda z kijem (K1).",
        notes: "ROZGRZEWKA (15 min):\nJazda swobodna + statki kosmiczne\nLustro - dwojki, jeden jedzie, drugi nasladuje\nRozciaganie z kijem\n\nCZESC GLOWNA (25 min):\nBalwanki - nogi razem/rozstaw\nCrossover w miejscu\nCrossover w krazeniu wokol pacholka\nJazda z kijem - prowadzenie pilki tenisowej\n\nGRA (15 min):\nPasterz i owieczki\nMini mecz 3v3 pilka tenisowa\n\nZAMKNIECIE (5 min):\nDzis nauczylem sie..." },
    ];

    for (const s of sampleSessions) {
      await prisma.trainingSession.create({
        data: { planId: plan.id, ...s },
      });
    }
    results.push(`Training plan created: ${plan.name} with ${sampleSessions.length} sessions`);

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    console.error("Seed error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
