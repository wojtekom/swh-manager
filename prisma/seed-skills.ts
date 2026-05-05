/**
 * Seed: 87 umiejętności wg Koncepcji Szkoleniowej H. Grutha (2016)
 * Model hybrydowy lód + rolki — SWH Siedlce
 *
 * Użycie:
 *   npx ts-node prisma/seed-skills.ts
 *
 * Etapy oceny:
 *   W = Wprowadzony (nauczony technicznie)
 *   T = Trenowany (ćwiczony regularnie)
 *   D = Doskonalony (stosowany w grze)
 *   O = Opanowany (wykonywany automatycznie)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface SkillDef {
  code: string;
  name: string;
  description?: string;
  category: string;
  sortOrder: number;
  expectedU8?: string;
  expectedU10?: string;
  expectedU12?: string;
  expectedU14?: string;
}

const skills: SkillDef[] = [
  // ==================== 🛼 ROLKI (R1–R12) ====================
  { code: "R1",  name: "Prawidłowa postawa", category: "ROLKI", sortOrder: 100, expectedU8: "T", expectedU10: "D", expectedU12: "O" },
  { code: "R2",  name: "Jazda przodem — ślizgi na dwóch nogach", category: "ROLKI", sortOrder: 101, expectedU8: "T", expectedU10: "D", expectedU12: "O" },
  { code: "R3",  name: "Jazda przodem — 'bałwanek' (pompowanie)", category: "ROLKI", sortOrder: 102, expectedU8: "T", expectedU10: "D", expectedU12: "O" },
  { code: "R4",  name: "Jazda przodem — krzyżowanie (crossover)", category: "ROLKI", sortOrder: 103, expectedU8: "W", expectedU10: "T", expectedU12: "D", expectedU14: "O" },
  { code: "R5",  name: "Jazda tyłem — ślizgi na dwóch nogach", category: "ROLKI", sortOrder: 104, expectedU8: "W", expectedU10: "T", expectedU12: "D" },
  { code: "R6",  name: "Jazda tyłem — 'bałwanek'", category: "ROLKI", sortOrder: 105, expectedU8: "W", expectedU10: "T", expectedU12: "D" },
  { code: "R7",  name: "Jazda tyłem — krzyżowanie", category: "ROLKI", sortOrder: 106, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
  { code: "R8",  name: "Hamowanie — pługiem", category: "ROLKI", sortOrder: 107, expectedU8: "T", expectedU10: "D", expectedU12: "O" },
  { code: "R9",  name: "Hamowanie — T-stop", category: "ROLKI", sortOrder: 108, expectedU8: "W", expectedU10: "T", expectedU12: "D" },
  { code: "R10", name: "Hamowanie — hockey stop", category: "ROLKI", sortOrder: 109, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
  { code: "R11", name: "Zwroty — pivot przód-tył", category: "ROLKI", sortOrder: 110, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
  { code: "R12", name: "Zwroty — pivot tył-przód", category: "ROLKI", sortOrder: 111, expectedU10: "W", expectedU12: "T", expectedU14: "D" },

  // ==================== ⛸ ŁYŻWY (Ł1–Ł12) ====================
  { code: "Ł1",  name: "Prawidłowa postawa na lodzie", category: "ŁYŻWY", sortOrder: 200, expectedU8: "T", expectedU10: "D", expectedU12: "O" },
  { code: "Ł2",  name: "Jazda przodem — ślizgi na dwóch nogach", category: "ŁYŻWY", sortOrder: 201, expectedU8: "T", expectedU10: "D", expectedU12: "O" },
  { code: "Ł3",  name: "Jazda przodem — odpychanie (stride)", category: "ŁYŻWY", sortOrder: 202, expectedU8: "T", expectedU10: "D", expectedU12: "O" },
  { code: "Ł4",  name: "Jazda przodem — crossover", category: "ŁYŻWY", sortOrder: 203, expectedU8: "W", expectedU10: "T", expectedU12: "D", expectedU14: "O" },
  { code: "Ł5",  name: "Jazda tyłem — ślizgi na dwóch nogach", category: "ŁYŻWY", sortOrder: 204, expectedU8: "W", expectedU10: "T", expectedU12: "D" },
  { code: "Ł6",  name: "Jazda tyłem — C-cut", category: "ŁYŻWY", sortOrder: 205, expectedU8: "W", expectedU10: "T", expectedU12: "D" },
  { code: "Ł7",  name: "Jazda tyłem — crossover", category: "ŁYŻWY", sortOrder: 206, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
  { code: "Ł8",  name: "Hamowanie — pługiem", category: "ŁYŻWY", sortOrder: 207, expectedU8: "T", expectedU10: "D", expectedU12: "O" },
  { code: "Ł9",  name: "Hamowanie — hockey stop (obie strony)", category: "ŁYŻWY", sortOrder: 208, expectedU8: "W", expectedU10: "T", expectedU12: "D", expectedU14: "O" },
  { code: "Ł10", name: "Starty — przód, tył, boczne", category: "ŁYŻWY", sortOrder: 209, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
  { code: "Ł11", name: "Pivoty — przód-tył", category: "ŁYŻWY", sortOrder: 210, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
  { code: "Ł12", name: "Pivoty — tył-przód", category: "ŁYŻWY", sortOrder: 211, expectedU10: "W", expectedU12: "T", expectedU14: "D" },

  // ==================== 🏒 KRĄŻEK (K1–K10) ====================
  { code: "K1",  name: "Trzymanie kija — chwyt podstawowy", category: "KRĄŻEK", sortOrder: 300, expectedU8: "T", expectedU10: "D", expectedU12: "O" },
  { code: "K2",  name: "Prowadzenie przodem — forehand", category: "KRĄŻEK", sortOrder: 301, expectedU8: "T", expectedU10: "D", expectedU12: "O" },
  { code: "K3",  name: "Prowadzenie przodem — backhand", category: "KRĄŻEK", sortOrder: 302, expectedU8: "W", expectedU10: "T", expectedU12: "D" },
  { code: "K4",  name: "Prowadzenie z przełożeniem (toe drag)", category: "KRĄŻEK", sortOrder: 303, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
  { code: "K5",  name: "Prowadzenie z głową w górze", category: "KRĄŻEK", sortOrder: 304, expectedU8: "W", expectedU10: "T", expectedU12: "D", expectedU14: "O" },
  { code: "K6",  name: "Ochrona krążka ciałem", category: "KRĄŻEK", sortOrder: 305, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
  { code: "K7",  name: "Zwody (deking) 1-na-1", category: "KRĄŻEK", sortOrder: 306, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
  { code: "K8",  name: "Przyjęcie krążka na kij (cushioning)", category: "KRĄŻEK", sortOrder: 307, expectedU8: "W", expectedU10: "T", expectedU12: "D" },
  { code: "K9",  name: "Podnoszenie krążka łyżką", category: "KRĄŻEK", sortOrder: 308, expectedU12: "W", expectedU14: "T" },
  { code: "K10", name: "Prowadzenie w slalomie z prędkością", category: "KRĄŻEK", sortOrder: 309, expectedU10: "W", expectedU12: "T", expectedU14: "D" },

  // ==================== ↔ PODANIA (P1–P12) ====================
  { code: "P1",  name: "Podanie forehand — po lodzie", category: "PODANIA", sortOrder: 400, expectedU8: "T", expectedU10: "D", expectedU12: "O" },
  { code: "P2",  name: "Podanie backhand — po lodzie", category: "PODANIA", sortOrder: 401, expectedU8: "W", expectedU10: "T", expectedU12: "D" },
  { code: "P3",  name: "Przyjęcie podania — forehand", category: "PODANIA", sortOrder: 402, expectedU8: "T", expectedU10: "D", expectedU12: "O" },
  { code: "P4",  name: "Przyjęcie podania — backhand", category: "PODANIA", sortOrder: 403, expectedU8: "W", expectedU10: "T", expectedU12: "D" },
  { code: "P5",  name: "Podanie w ruchu (przodem)", category: "PODANIA", sortOrder: 404, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
  { code: "P6",  name: "Podanie w ruchu (tyłem)", category: "PODANIA", sortOrder: 405, expectedU12: "W", expectedU14: "T" },
  { code: "P7",  name: "Podanie 'na talerzu' (saucer pass)", category: "PODANIA", sortOrder: 406, expectedU12: "W", expectedU14: "T" },
  { code: "P8",  name: "Podanie o bandę", category: "PODANIA", sortOrder: 407, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
  { code: "P9",  name: "Podanie 'na wolne' (do pustego miejsca)", category: "PODANIA", sortOrder: 408, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
  { code: "P10", name: "Podanie bez patrzenia (no-look)", category: "PODANIA", sortOrder: 409, expectedU14: "W" },
  { code: "P11", name: "Przyjęcie jednym dotykiem + podanie", category: "PODANIA", sortOrder: 410, expectedU12: "W", expectedU14: "T" },
  { code: "P12", name: "Podanie pod presją (obrońca na plecach)", category: "PODANIA", sortOrder: 411, expectedU12: "W", expectedU14: "T" },

  // ==================== 🎯 STRZAŁY (S1–S12) ====================
  { code: "S1",  name: "Strzał nadgarstkowy (wrist shot) — stojąc", category: "STRZAŁY", sortOrder: 500, expectedU8: "W", expectedU10: "T", expectedU12: "D", expectedU14: "O" },
  { code: "S2",  name: "Strzał nadgarstkowy — w ruchu", category: "STRZAŁY", sortOrder: 501, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
  { code: "S3",  name: "Strzał z backhandu", category: "STRZAŁY", sortOrder: 502, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
  { code: "S4",  name: "Strzał slap shot (z zamachu)", category: "STRZAŁY", sortOrder: 503, expectedU12: "W", expectedU14: "T" },
  { code: "S5",  name: "Strzał snap shot", category: "STRZAŁY", sortOrder: 504, expectedU12: "W", expectedU14: "T" },
  { code: "S6",  name: "Dobijanie (rebound)", category: "STRZAŁY", sortOrder: 505, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
  { code: "S7",  name: "Strzał z jednego dotyku (one-timer)", category: "STRZAŁY", sortOrder: 506, expectedU12: "W", expectedU14: "T" },
  { code: "S8",  name: "Celowanie — dół bramki", category: "STRZAŁY", sortOrder: 507, expectedU8: "W", expectedU10: "T", expectedU12: "D" },
  { code: "S9",  name: "Celowanie — góra bramki", category: "STRZAŁY", sortOrder: 508, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
  { code: "S10", name: "Strzał z kręcenia się (spin-o-rama)", category: "STRZAŁY", sortOrder: 509, expectedU14: "W" },
  { code: "S11", name: "Strzał po zwodzie", category: "STRZAŁY", sortOrder: 510, expectedU12: "W", expectedU14: "T" },
  { code: "S12", name: "Strzał pod presją obrońcy", category: "STRZAŁY", sortOrder: 511, expectedU12: "W", expectedU14: "T" },

  // ==================== 🛡 OBRONA (O1–O11) ====================
  { code: "O1",  name: "Pozycja obronna — gap control", category: "OBRONA", sortOrder: 600, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
  { code: "O2",  name: "Jazda tyłem 1-na-1", category: "OBRONA", sortOrder: 601, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
  { code: "O3",  name: "Kij aktywny (stick on puck)", category: "OBRONA", sortOrder: 602, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
  { code: "O4",  name: "Poke check", category: "OBRONA", sortOrder: 603, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
  { code: "O5",  name: "Blokowanie linii podania", category: "OBRONA", sortOrder: 604, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
  { code: "O6",  name: "Blokowanie strzału (shot block)", category: "OBRONA", sortOrder: 605, expectedU12: "W", expectedU14: "T" },
  { code: "O7",  name: "Czyszczenie strefy (clearing)", category: "OBRONA", sortOrder: 606, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
  { code: "O8",  name: "Odbiór krążka przy bandzie", category: "OBRONA", sortOrder: 607, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
  { code: "O9",  name: "Pokrycie gracza bez krążka", category: "OBRONA", sortOrder: 608, expectedU12: "W", expectedU14: "T" },
  { code: "O10", name: "Komunikacja obronna (calling)", category: "OBRONA", sortOrder: 609, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
  { code: "O11", name: "Pierwszy na krążku (compete level)", category: "OBRONA", sortOrder: 610, expectedU8: "W", expectedU10: "T", expectedU12: "D" },

  // ==================== ⚡ ATAK (A1–A13) ====================
  { code: "A1",  name: "Jazda na 'wolne lody' (finding open ice)", category: "ATAK", sortOrder: 700, expectedU8: "W", expectedU10: "T", expectedU12: "D" },
  { code: "A2",  name: "Podanie i rusz (give-and-go)", category: "ATAK", sortOrder: 701, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
  { code: "A3",  name: "Trójkąt ataku (triangle offense)", category: "ATAK", sortOrder: 702, expectedU12: "W", expectedU14: "T" },
  { code: "A4",  name: "Wejście do strefy — carry-in", category: "ATAK", sortOrder: 703, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
  { code: "A5",  name: "Wejście do strefy — dump-and-chase", category: "ATAK", sortOrder: 704, expectedU12: "W", expectedU14: "T" },
  { code: "A6",  name: "Gra na skrzydle — wejście po bandzie", category: "ATAK", sortOrder: 705, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
  { code: "A7",  name: "Zmiana tempa gry", category: "ATAK", sortOrder: 706, expectedU12: "W", expectedU14: "T" },
  { code: "A8",  name: "Podkręcenie do bramki (driving the net)", category: "ATAK", sortOrder: 707, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
  { code: "A9",  name: "Gra przed bramką (net-front)", category: "ATAK", sortOrder: 708, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
  { code: "A10", name: "Kreowanie sytuacji 2-na-1", category: "ATAK", sortOrder: 709, expectedU12: "W", expectedU14: "T" },
  { code: "A11", name: "Gra w przewadze (power play)", category: "ATAK", sortOrder: 710, expectedU12: "W", expectedU14: "T" },
  { code: "A12", name: "Forecheck — F1 / F2", category: "ATAK", sortOrder: 711, expectedU12: "W", expectedU14: "T" },
  { code: "A13", name: "Breakout — wyjście ze strefy obronnej", category: "ATAK", sortOrder: 712, expectedU10: "W", expectedU12: "T", expectedU14: "D" },

  // ==================== 💪 CIAŁO (C1–C5) ====================
  { code: "C1",  name: "Równowaga dynamiczna (single-leg)", category: "CIAŁO", sortOrder: 800, expectedU8: "W", expectedU10: "T", expectedU12: "D" },
  { code: "C2",  name: "Koordynacja ręka-oko-kij", category: "CIAŁO", sortOrder: 801, expectedU8: "W", expectedU10: "T", expectedU12: "D" },
  { code: "C3",  name: "Zwinność (agility) — zmiana kierunku", category: "CIAŁO", sortOrder: 802, expectedU8: "W", expectedU10: "T", expectedU12: "D", expectedU14: "O" },
  { code: "C4",  name: "Wytrzymałość — zdolność powtarzania sprintów", category: "CIAŁO", sortOrder: 803, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
  { code: "C5",  name: "Siła rdzenia (core stability)", category: "CIAŁO", sortOrder: 804, expectedU10: "W", expectedU12: "T", expectedU14: "D" },
];

async function main() {
  console.log("🏒 Seed: Umiejętności wg Koncepcji Szkoleniowej H. Grutha (2016)");
  console.log(`   Łącznie: ${skills.length} umiejętności w 8 kategoriach\n`);

  let created = 0;
  let updated = 0;

  for (const skill of skills) {
    const existing = await prisma.skillDefinition.findUnique({
      where: { code: skill.code },
    });

    if (existing) {
      await prisma.skillDefinition.update({
        where: { code: skill.code },
        data: skill,
      });
      updated++;
    } else {
      await prisma.skillDefinition.create({ data: skill });
      created++;
    }
  }

  console.log(`✅ Utworzono: ${created}, zaktualizowano: ${updated}`);
  console.log("   Kategorie: ROLKI(12), ŁYŻWY(12), KRĄŻEK(10), PODANIA(12), STRZAŁY(12), OBRONA(11), ATAK(13), CIAŁO(5)");
}

main()
  .catch((e) => {
    console.error("❌ Błąd:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
