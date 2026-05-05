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

    // Usuń stare plany seedowane (żeby nie duplikować)
    await prisma.trainingSession.deleteMany({ where: { plan: { createdById: admin.id, season: { in: ["2025/2026", "summer-2026"] } } } });
    await prisma.trainingPlan.deleteMany({ where: { createdById: admin.id, season: { in: ["2025/2026", "summer-2026"] } } });

    // Znajdź grupy
    const groups = await prisma.trainingGroup.findMany();
    const mikrusGroup = groups.find(g => g.category === "U8") || groups[0];
    const miniGroup = groups.find(g => g.category === "U10") || groups[0];

    // === PLAN MIKRUS — 14 jednostek ===
    const mikrusPlan = await prisma.trainingPlan.create({
      data: {
        name: "Program Roczny Mikrus (U8) — 14 jednostek",
        description: "Oswojenie z rolkami + Podstawy techniczne. Koncepcja Grutha 2016.",
        category: "U8", planType: "YEARLY", season: "2025/2026",
        createdById: admin.id, groupId: mikrusGroup?.id || null,
        totalSessions: 14,
      },
    });

    const mikrusSessions = [
      { title: "Oswojenie z rolkami — pierwsza jazda", duration: 60, order: 1, date: new Date("2026-04-13T19:00:00"),
        objectives: "Prawidlowa postawa (R1). Jazda przodem (R2). Hamowanie plugiem (R8).",
        notes: "ROZGRZEWKA (15 min):\n- Marsz w rolkach na dywaniku — poczucie kolek\n- 'Robot' — sztywne nogi, male kroczki\n- Gra: 'Zamrozony tag'\n\nCZESC GLOWNA (25 min):\n- Pozycja hokejowa — kolana ugiete, rece do przodu\n- Jazda przodem — balwanki (pompowanie)\n- Hamowanie plugiem — 'robimy pizze'\n- Tor przeszkod — pacholki co 3m\n\nGRA (15 min):\n- 'Zbieraj monety' — krazki rozrzucone po boisku\n- Swobodna jazda z muzyka\n\nZAMKNIECIE (5 min):\n- Krag — kazde dziecko mowi co mu sie podobalo" },
      { title: "Postawa i rownowaga", duration: 60, order: 2, date: new Date("2026-04-16T19:00:00"),
        objectives: "Pozycja hokejowa (R1). Slizgi na jednej nodze (R2). Rownowaga dynamiczna (C1).",
        notes: "ROZGRZEWKA (15 min):\n- Jazda swobodna z muzyka\n- 'Samoloty' — jazda z rozlozonymi rekami\n- 'Kaczuszki' — za trenerem\n\nCZESC GLOWNA (25 min):\n- Slizgi na dwoch nogach\n- 'Flaming' (5 sek na prawej, 5 na lewej)\n- Wstawanie po upadku (x5)\n- Slalom miedzy pacholkami co 2m\n\nGRA (15 min):\n- 'Czerwone/zielone swiatlo'\n- 'Wyscig zolwi' — kto najwolniej\n\nZAMKNIECIE (5 min):\n- Pokaz ulubionego elementu" },
      { title: "Balwanki i pierwsze crossovers", duration: 60, order: 3, date: new Date("2026-04-20T19:00:00"),
        objectives: "Jazda balwankiem (R3). Crossovery w miejscu (R4). Jazda z kijem (K1).",
        notes: "ROZGRZEWKA (15 min):\n- Jazda swobodna + 'statki kosmiczne'\n- 'Lustro' — dwojki\n- Rozciaganie dynamiczne z kijem\n\nCZESC GLOWNA (25 min):\n- Balwanki — nogi razem/rozstaw\n- Crossover w miejscu — krzyzowanie nog\n- Crossover w krazeniu wokol pacholka\n- Jazda z kijem — prowadzenie pilki tenisowej\n\nGRA (15 min):\n- 'Pasterz i owieczki' — prowadzenie pilki do zagrody\n- Mini mecz 3v3 pilka tenisowa\n\nZAMKNIECIE (5 min):\n- 'Dzis nauczylem sie...'" },
      { title: "Krazek i prowadzenie forehand", duration: 60, order: 4, date: new Date("2026-04-23T19:00:00"),
        objectives: "Trzymanie kija (K1). Prowadzenie krazka forehand (K2). Strzal z miejsca (S1, S8).",
        notes: "ROZGRZEWKA (15 min):\n- Balwanki tam i z powrotem (4x20m)\n- 'Zlodziej krazkow' — pilnuj swojego, kradnij innym\n- Rozgrzewka z kijem — przeskoki\n\nCZESC GLOWNA (25 min):\n- Chwyt kija — reka gorna kieruje, dolna sila\n- Prowadzenie forehand — krazek przy lyzce\n- Prowadzenie w slalomie — pacholki co 2m\n- Strzal z miejsca — forehand, cel bramka 3m\n\nGRA (15 min):\n- 'Gol dnia' — kazdy ma 3 strzaly\n- Mecz 3v3 krazek rolkowy\n\nZAMKNIECIE (5 min):\n- Strzaly konkursowe — kto trafi w pacholek" },
      { title: "Hamowanie i zmiany kierunku", duration: 60, order: 5, date: new Date("2026-04-27T19:00:00"),
        objectives: "Hamowanie T-stop (R9). Szybkie starty. Zmiana kierunku z krazkiem (K5).",
        notes: "ROZGRZEWKA (15 min):\n- Swobodna jazda z krazkiem\n- 'Bomba' — gwizdek, wszyscy hamuja w 3 sek\n- Przysiady na rolkach, pajacyki\n\nCZESC GLOWNA (25 min):\n- T-stop — tylna noga prostopadla, jazda 10m + stop\n- Szybki start — pozycja niska, 3 odpychania, sprint 10m (x4)\n- Zmiana kierunku — jazda do pacholka, okrazenie, powrot z krazkiem\n- Slalom z krazkiem + strzal na koncu\n\nGRA (15 min):\n- 'Wyscig z przeszkodami' — slalom + tunel + strzal\n- Mecz 3v3 regula: gol po min. 1 podaniu\n\nZAMKNIECIE (5 min):\n- Rozciaganie. Zapowiedz: nastepnym razem TEST ROLKARZA" },
      { title: "TEST ROLKARZA — pomiar wstepny (T1-T6)", duration: 60, order: 6, date: new Date("2026-04-30T19:00:00"),
        objectives: "Pomiar bazowy 6 parametrow: sprint 20m, slalom, jazda tylem 15m, podanie celne x5, prowadzenie krazka, wytrzymalosc.",
        notes: "ROZGRZEWKA (12 min):\n- Marsz + trucht + boczne przeskoki\n- Swobodna jazda 3 min\n- Trener pokazuje tory testowe — dzieci proba wolno\n- KOMUNIKAT: 'To NIE konkurs. Za 2 miesiace zobaczycie roznice.'\n\nTESTY (36 min — 6 min na test):\n- T1 Sprint 20m — 2 proby, lepszy wynik\n- T2 Slalom 6 pacholkow co 1.5m — tam i z powrotem\n- T3 Jazda tylem 15m — 2 proby\n- T4 Podanie celne — 5 prob do bramki z 4m\n- T5 Prowadzenie krazka slalom — 2 proby\n- T6 Kursowanie 4x60m (240m) — jeden czas\n\nGRA (7 min):\n- Swobodna gra 3v3 — nagroda po testach\n\nZAMKNIECIE (5 min):\n- 'Wyniki sa wasze — za 2 miesiace zobaczycie postep'" },
      { title: "Jazda tylem — wprowadzenie", duration: 60, order: 7, date: new Date("2026-05-04T19:00:00"),
        objectives: "Jazda tylem na dwoch nogach (R5). Balwanki tylem (R6). Cofanie z krazkiem (K3).",
        notes: "ROZGRZEWKA (15 min):\n- Balwanki przodem (rozgrzewka nog)\n- 'Cien' — A przodem z krazkiem, B tylem\n- 'Lustro tylem' — trener jedzie tylem, dzieci kopiuja\n\nCZESC GLOWNA (25 min):\n- Jazda tylem — slizgi na dwoch nogach\n- Balwanki tylem — ciezar na pietach\n- C-cut tylem — pchniecie jedna noga\n- Cofanie z krazkiem — backhand wolno\n\nGRA (15 min):\n- 'Obronca' — obronca tylem, napastnik przodem, 1v1\n- Mecz 3v3 — obronca MUSI cofac sie tylem\n\nZAMKNIECIE (5 min):\n- Pokaz: kto pokaze najdluzszy slizg tylem" },
      { title: "Crossovers — jazda w luku", duration: 60, order: 8, date: new Date("2026-05-07T19:00:00"),
        objectives: "Crossover przod (R4). Jazda w luku w obie strony. Prowadzenie z crossoverem (K2, K5).",
        notes: "ROZGRZEWKA (15 min):\n- Jazda swobodna po obwodzie (2 min na strone)\n- 'Osemka' — wokol 2 pacholkow\n- Rozciaganie dynamiczne\n\nCZESC GLOWNA (25 min):\n- Crossover w miejscu — powtorzenie\n- Crossover w luku — wokol kola centralnego (3 okrazenia/strone)\n- Korekta indywidualna — trener 30s/dziecko\n- Crossover z krazkiem — wokol kola forehand\n\nGRA (15 min):\n- 'Tornado' — wszyscy po kole, gwizdek zmiana kierunku\n- Mecz 3v3 bramki przy bandzie\n\nZAMKNIECIE (5 min):\n- Strzaly konkursowe z luku (po crossoverze)" },
      { title: "Podania — forehand po podlozu", duration: 60, order: 9, date: new Date("2026-05-11T19:00:00"),
        objectives: "Podanie forehand (P1). Przyjecie podania cushioning (P3, K8). Podanie w ruchu (P5).",
        notes: "ROZGRZEWKA (15 min):\n- Dwojki: podanie stojac forehand-forehand 2 min\n- Jazda swobodna z podawaniem pilki w parach\n- 'Telefon' — 4 osoby, podanie z konca na koniec\n\nCZESC GLOWNA (25 min):\n- Podanie forehand — waga z nogi tylnej na przednia\n- Przyjecie — miekkie rece: amortyzacja\n- Podanie w dwojkach w miejscu 3m\n- Podanie w ruchu — dwojki obok siebie co 5m\n\nGRA (15 min):\n- 'Goracy kartofel' — kolo, gwizdek = kto ma = 5 balwankow\n- Mecz 3v3 — gol TYLKO po podaniu\n\nZAMKNIECIE (5 min):\n- Konkurs: najdluzsze celne podanie" },
      { title: "Strzal w ruchu + gra zespolowa", duration: 60, order: 10, date: new Date("2026-05-14T19:00:00"),
        objectives: "Strzal nadgarstkowy w ruchu (S2). Dobijanie (S6). Gra zespolowa (A1).",
        notes: "ROZGRZEWKA (15 min):\n- Prowadzenie krazka slalom + strzal (3 razy)\n- 'Policjant' — jeden goni, reszta z krazkami\n\nCZESC GLOWNA (25 min):\n- Strzal z miejsca — waga, pozycja kija, cel\n- Strzal w ruchu — jazda 10m + strzal z 5m\n- Stacja: jazda + podanie do sciany + dobitka\n- Trojki: A prowadzi, podaje do B, B strzela\n\nGRA (15 min):\n- Mecz 3v3 — 3 min okresy, rotacja\n- Regula: gol z podania = 2 pkt\n\nZAMKNIECIE (5 min):\n- 'MVP dnia' — dzieci glosuja" },
      { title: "Cofanie + obrona 1-na-1", duration: 60, order: 11, date: new Date("2026-05-18T19:00:00"),
        objectives: "Crossover tylem (R7). Gap control (O1). Poke check (O4).",
        notes: "ROZGRZEWKA (15 min):\n- Balwanki tylem (4x15m)\n- 'Cien' — A przodem z krazkiem, B tylem\n- Deski 30s x 3\n\nCZESC GLOWNA (25 min):\n- Jazda tylem crossover — wokol kola oba kierunki\n- Gap control — obronca 2-3m od napastnika\n- Poke check — kij do przodu, wybijanie krazka\n- 1v1 z cofaniem — napastnik mija, obronca broni\n\nGRA (15 min):\n- Mecz 3v3 z wyznaczonym obronca (rotacja co 2 min)\n\nZAMKNIECIE (5 min):\n- 'Najlepsza obrona dnia' — trener wskazuje" },
      { title: "Taktyka — give-and-go, wolne lody", duration: 60, order: 12, date: new Date("2026-05-21T19:00:00"),
        objectives: "Give-and-go (A2). Wolna przestrzen (A1). Wejscie do strefy (A4). Podanie na wolne (P9).",
        notes: "ROZGRZEWKA (15 min):\n- Podania w trojkach w ruchu (trojkat)\n- 'Magnes' — gwizdek, zbierz sie w trojke\n\nCZESC GLOWNA (25 min):\n- Give-and-go — A podaje do B, rusza, B oddaje, A strzela\n- 'Wolne lody' — gdzie jest wolna przestrzen? 2v1 w strefie\n- Wejscie do strefy — prowadzenie i podanie na skrzydlo\n- Symulacja turnieju — 2 min okresy, 3v3 formacje kolorowe\n\nGRA (15 min):\n- Mini turniej — 3 druzyny x 2 mecze x 4 min\n\nZAMKNIECIE (5 min):\n- Omowienie: co zadzialo, co nie" },
      { title: "Przygotowanie do turnieju — scrimmage + test", duration: 60, order: 13, date: new Date("2026-05-25T19:00:00"),
        objectives: "Symulacja meczowa. Test Rolkarza powtorzony (T1-T6). Pomiar postepu.",
        notes: "ROZGRZEWKA (10 min):\n- Jazda swobodna z krazkiem\n- Strzaly na bramke — 5 prob\n\nTESTY POWTORKOWE (20 min):\n- T1-T6 identyczne jak na zaj. 6\n- 'Porownajcie ze swoim wynikiem sprzed 2 miesiecy!'\n\nMECZ (25 min):\n- Turniej 3v3 — 3 druzyny x 2 mecze x 5 min\n- Trener zarzadza zmianami per kolor (formacje HLH)\n- Gol z podania = 2 pkt\n\nZAMKNIECIE (5 min):\n- Porownanie wynikow testow — kazde dziecko slyszy postep\n- 'Brawo, urosliscie!'" },
      { title: "Turniej koncowy + zakonczenie sezonu", duration: 60, order: 14, date: new Date("2026-05-28T19:00:00"),
        objectives: "Turniej rywalizacyjny. Gra zespolowa w praktyce. Ceremonia zakonczenia.",
        notes: "ROZGRZEWKA (10 min):\n- Jazda swobodna + 'Zbieraj monety' (jak zaj. 1 — porownanie)\n- Rozgrzewka z muzyka\n\nTURNIEJ (40 min):\n- 3 druzyny kolorowe x round robin (2 mecze kazda)\n- Mecz 3v3, 2x5 min, przerwy 2 min\n- Trener sedziuje, asystent notuje\n- Fair play: dobre zagrania nie tylko gole\n\nZAKONCZENIE (10 min):\n- Krag — 'moj najlepszy moment sezonu'\n- Dyplomy za sezon rolkowy (imienne)\n- Klasyfikacja: podkreslamy POSTEP nie wynik\n- Zdjecie grupowe\n- Info: 'We wrzesniu wracamy na rolki, w grudniu na LOD!'" },
    ];

    for (const s of mikrusSessions) {
      await prisma.trainingSession.create({ data: { planId: mikrusPlan.id, ...s } });
    }
    results.push(`Mikrus: ${mikrusSessions.length} sessions created (${mikrusPlan.name})`);

    // === KONSPEKT LETNI (czerwiec-sierpien) ===
    const letniPlan = await prisma.trainingPlan.create({
      data: {
        name: "Konspekt Letni SWH (czerwiec-sierpien 2026)",
        description: "3 mezocykle: Baza (cze) / Budowa (lip) / Szlif (sie). Ogolnorozwojowy + technika rolkowa + kondycja.",
        category: "U10", planType: "SEASONAL", season: "summer-2026",
        createdById: admin.id, groupId: miniGroup?.id || null,
        totalSessions: 6,
      },
    });

    const letniSessions = [
      { title: "BAZA Tydz.1 Pn: Ogolnorozwojowy + rolki", duration: 90, order: 1, date: new Date("2026-06-01T19:00:00"),
        objectives: "Koordynacja (C2), sila funkcjonalna (C1, C3). Pozycja hokejowa (R1), balwanki (R3), crossovers (R4), prowadzenie (K2).",
        notes: "ROZGRZEWKA (20 min):\n- Trucht 5 min + mobilnosc dynamiczna\n- Drabinka koordynacyjna — 6 wzorcow\n\nBLOK SILOWY (25 min):\n- Obwod: pompki x10, przysiady x15, deski 30s, wykroki x10/noge, superman 30s, burpees x8\n- 3 rundy, przerwa 60s\n\nBLOK ROLKOWY (35 min):\n- Jazda swobodna 5 min\n- Pozycja hokejowa — korekta\n- Balwanki 4x20m + crossovers 4x kolo\n- Prowadzenie krazka FH/BH slalom\n- Gra 3v3 swobodna 10 min\n\nSCHLADZANIE (10 min):\n- Trucht + stretching statyczny" },
      { title: "BAZA Tydz.1 Czw: Wytrzymalosc + technika kija", duration: 90, order: 2, date: new Date("2026-06-04T19:00:00"),
        objectives: "Wytrzymalosc tlenowa fartlek (C4). Podanie forehand (P1), przyjecie (P3). Strzal wrist (S1, S2).",
        notes: "ROZGRZEWKA (15 min):\n- Trucht 5 min + rozciaganie dynamiczne\n- ABC biegowe: skip A, skip C, kolana, piety\n\nWYTRZYMALOSC (25 min):\n- Fartlek 20 min: 3 min trucht, 1 min szybki, 30s sprint\n- Powtorz 4 razy\n- Strefa tetna: 130-160 bpm\n\nTECHNIKA KIJA (20 min):\n- Podania forehand w parach — stojac (3 min), w ruchu (5 min)\n- Przyjecie — cushioning\n- Strzal nadgarstkowy z miejsca x10\n- Strzal w ruchu — 10m + strzal z 5m\n\nGRA (20 min):\n- Mecz 4v4 male boisko\n\nSCHLADZANIE (10 min)" },
      { title: "BUDOWA Tydz.5 Pn: Interwaly + szybkosc", duration: 90, order: 3, date: new Date("2026-07-06T19:00:00"),
        objectives: "Interwaly anaerobowe (C4). Hockey stop (R10). Szybkosc z krazkiem (K10). Zwinnosc (C3).",
        notes: "ROZGRZEWKA (15 min):\n- Trucht 5 min + aktywacja (przysiady z wyskokiem x5)\n\nINTERWALY (25 min):\n- Shuttle run: 5-10-5m x6, przerwa 90s\n- Sprint 20m x4, przerwa 60s\n- 'Hokejowe piatki': 30s max, 2.5 min przerwa x5\n\nROLKI — SZYBKOSC (30 min):\n- Starty eksplozywne — 3 odpychania, sprint 15m x6\n- V-start (na gwizdek) x4/strone\n- Sprint z krazkiem 20m x4\n- Slalom szybki + strzal x5\n\nGRA (15 min):\n- Mecz 3v3 — 90s okresy (symulacja zmian)\n\nSCHLADZANIE (5 min)" },
      { title: "BUDOWA Tydz.5 Czw: Sila + strzaly", duration: 90, order: 4, date: new Date("2026-07-09T19:00:00"),
        objectives: "Sila eksplozywna (C1, C3). Wrist (S1, S2), backhand (S3), snap (S5), one-timer (S7), dobijanie (S6).",
        notes: "ROZGRZEWKA (15 min):\n- Trucht + ABC biegowe + aktywacja nerwowo-miesniowa\n\nSILA EKSPLOZYWNA (25 min):\n- Kettlebell swing x12 x3\n- Box jumps x8 x3\n- Medball slam x10 x3\n- Przysiad z wyskokiem x8 x3\n- Przerwa 90s\n\nSTRZALY (35 min):\n- Wrist shot stojac — 4 rogi bramki x10\n- Snap shot — szybki release x8\n- Strzal w ruchu po luku x6\n- One-timer — partner podaje x8\n- Dobijanie (rebound) x8\n\nGRA (10 min):\n- 'Snajper' — 5 strzalow, trener liczy trafienia\n\nSCHLADZANIE (5 min)" },
      { title: "SZLIF Tydz.9 Pn: Gry male + taktyka", duration: 90, order: 5, date: new Date("2026-08-03T19:00:00"),
        objectives: "2v1/2v2/3v2 (A1, A2, A10). Gap control (O1). Podanie na wolne (P9).",
        notes: "ROZGRZEWKA (15 min):\n- Jazda swobodna z krazkiem 5 min\n- Podania w trojkach w ruchu 5 min\n- Strzaly na rozgrzanie x5\n\nTAKTYKA (35 min):\n- 2v1 — napastnicy wchodza, obronca cofa. Podanie w odpowiednim momencie.\n- 2v2 — obaj obronncy cofaja, carry-in czy dump\n- 3v2 — trojkat ofensywny, wolne lody\n- Po kazdej sytuacji: 30s omowienie\n\nGRY MALE (30 min):\n- 3v3 ciagla gra — 90s zmiany\n- Gol z dobitki = 2 pkt\n- Min. 1 podanie przed strzalem\n\nSCHLADZANIE (10 min)" },
      { title: "SZLIF Tydz.12: Testy sprawnosci koncowe", duration: 90, order: 6, date: new Date("2026-08-24T19:00:00"),
        objectives: "Testy koncowe: sprint (C3), shuttle, Illinois, slalom+strzal (K10), Cooper (C4), strzaly do celu (S1, S8).",
        notes: "ROZGRZEWKA (15 min):\n- Trucht + mobilnosc + oswojenie torow\n\nTESTY (60 min — 10 min na test):\n- Sprint 10m — 2 proby, lepszy wynik\n- Shuttle run 4x9m — 2 proby\n- Illinois agility — 2 proby\n- Slalom z krazkiem + strzal — 3 proby\n- Cooper test 6 min — max dystans\n- Strzaly do celu — 10 prob, 4 cele w rogach bramki\n\nPOROWNANIE (10 min):\n- Karta wynikow Start vs Koniec per zawodnik\n- Trener komentuje indywidualny postep\n\nZAMKNIECIE (5 min):\n- Podsumowanie sezonu letniego\n- Wrzesien = rolki + HLH, listopad = LOD" },
    ];

    for (const s of letniSessions) {
      await prisma.trainingSession.create({ data: { planId: letniPlan.id, ...s } });
    }
    results.push(`Letni: ${letniSessions.length} sessions created (${letniPlan.name})`);

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    console.error("Seed error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
