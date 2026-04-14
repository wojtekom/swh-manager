import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError } from "@/lib/auth-helpers";
import * as XLSX from "xlsx";

// Grupy SWH Siedlce wg kategorii HLH (sezon 2026/2027)
// Mikrus:     ur. 2018-2020 (U8)
// Mini Hokej: ur. 2014-2017 (U12)
// Młodzik:    ur. 2011-2013 (U15 → U14 w schemacie)
// Open:       ur. 2009-2010 i pozostałe
function hlhCategoryByBirthYear(year: number | null): { group: string; category: "U8" | "U10" | "U12" | "U14" | "U16" | "SENIOR" } {
  if (!year) return { group: "Open", category: "U16" };
  if (year >= 2018 && year <= 2020) return { group: "Mikrus", category: "U8" };
  if (year >= 2014 && year <= 2017) return { group: "Mini Hokej", category: "U12" };
  if (year >= 2011 && year <= 2013) return { group: "Młodzik", category: "U14" };
  return { group: "Open", category: "U16" };
}

// Mapowanie nazw grup z SportManago → AgeCategory (fallback)
function mapGroup(group: string | null): "U8" | "U10" | "U12" | "U14" | "U16" | null {
  if (!group) return null;
  const g = group.toLowerCase().trim();
  if (g.includes("mikrus") || g.includes("przedszkoln")) return "U8";
  if (g.includes("mini")) return "U12";
  if (g.includes("młodzik") || g.includes("mlodzik")) return "U14";
  if (g.includes("open")) return "U16";
  return null;
}

// Excel date serial → JS Date
function excelDate(val: any): Date | null {
  if (!val) return null;
  if (typeof val === "number") {
    // Excel serial date (days since 1899-12-30)
    const d = new Date((val - 25569) * 86400000);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof val === "string") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function cleanStr(val: any): string {
  if (!val) return "";
  return String(val).trim();
}

function cleanPhone(val: any): string {
  if (!val) return "";
  return String(val).replace(/\D/g, "").trim();
}

// POST /api/import — import zawodników z pliku SportManago (.xlsx)
export async function POST(req: NextRequest) {
  const { session, error } = await getSessionOrError();
  if (error) return error;
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "Brak pliku" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buffer, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws) as Record<string, any>[];

    const stats = {
      players: 0,
      parents: 0,
      groups: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // 1. Przygotuj grupy HLH wg rocznika
    const groupCache = new Map<string, string>(); // group name → id

    async function getOrCreateGroup(name: string, category: any): Promise<string> {
      if (groupCache.has(name)) return groupCache.get(name)!;
      let group = await prisma.trainingGroup.findFirst({
        where: { name: { equals: name, mode: "insensitive" } },
      });
      if (!group) {
        group = await prisma.trainingGroup.create({ data: { name, category } });
        stats.groups++;
      }
      groupCache.set(name, group.id);
      return group.id;
    }

    // 2. Import zawodników i rodziców
    for (const row of rows) {
      try {
        const lastName = cleanStr(row["Nazwisko"]);
        const firstName = cleanStr(row["Imię"]);
        if (!lastName || !firstName) {
          stats.skipped++;
          continue;
        }

        const birthDate = excelDate(row["Data urodzenia"]);
        const pesel = cleanStr(row["PESEL"]);
        const rocznik = row["Rocznik"] ? Number(row["Rocznik"]) : null;
        const birthYear = birthDate ? birthDate.getFullYear() : rocznik;

        // Sprawdź czy zawodnik już istnieje (po imieniu i nazwisku)
        const existing = await prisma.player.findFirst({
          where: {
            firstName: { equals: firstName, mode: "insensitive" },
            lastName: { equals: lastName, mode: "insensitive" },
          },
        });
        if (existing) {
          stats.skipped++;
          continue;
        }

        // Określ grupę HLH na podstawie rocznika
        const hlh = hlhCategoryByBirthYear(birthYear);

        // Utwórz zawodnika
        const player = await prisma.player.create({
          data: {
            firstName,
            lastName,
            dateOfBirth: birthDate || new Date(birthYear || 2015, 0, 1),
            pesel: pesel || null,
            category: hlh.category,
            status: "ACTIVE",
            notes: [
              row["Szkoła"] ? `Szkoła: ${cleanStr(row["Szkoła"])}` : "",
              row["Uwagi"] ? `Uwagi: ${cleanStr(row["Uwagi"])}` : "",
              row["Nr klubowy"] ? `Nr klubowy: ${cleanStr(row["Nr klubowy"])}` : "",
              birthYear ? `Rocznik: ${birthYear}` : "",
            ].filter(Boolean).join(" | ") || null,
          },
        });
        stats.players++;

        // Przypisz do grupy HLH wg rocznika
        const groupId = await getOrCreateGroup(hlh.group, hlh.category);
        await prisma.groupMember.create({
          data: { groupId, playerId: player.id },
        }).catch(() => {});

        // Rodzic 1
        const parent1Name = cleanStr(row["Imię i nazwisko rodzica"]);
        const parent1Email = cleanStr(row["E-mail rodzica"]);
        const parent1Phone = cleanPhone(row["Telefon rodzica"]);

        if (parent1Name && parent1Name !== " " && parent1Email) {
          let parentUser = await prisma.user.findUnique({
            where: { email: parent1Email },
          });
          if (!parentUser) {
            parentUser = await prisma.user.create({
              data: {
                email: parent1Email,
                passwordHash: "$2a$12$sportmanago.import.placeholder",
                name: parent1Name,
                phone: parent1Phone || null,
                role: "PARENT",
              },
            });
            stats.parents++;
          }

          // Powiąż rodzica z zawodnikiem
          await prisma.parentPlayer.create({
            data: { parentId: parentUser.id, playerId: player.id },
          }).catch(() => {}); // ignoruj duplikaty
        }

        // Rodzic 2
        const parent2Name = cleanStr(row["Imię i nazwisko rodzica (2)"]);
        const parent2Email = cleanStr(row["E-mail rodzica (2)"]);
        const parent2Phone = cleanPhone(row["Telefon rodzica (2)"]);

        if (parent2Name && parent2Name !== " " && parent2Email) {
          let parentUser2 = await prisma.user.findUnique({
            where: { email: parent2Email },
          });
          if (!parentUser2) {
            parentUser2 = await prisma.user.create({
              data: {
                email: parent2Email,
                passwordHash: "$2a$12$sportmanago.import.placeholder",
                name: parent2Name,
                phone: parent2Phone || null,
                role: "PARENT",
              },
            });
            stats.parents++;
          }

          await prisma.parentPlayer.create({
            data: { parentId: parentUser2.id, playerId: player.id },
          }).catch(() => {});
        }
      } catch (e: any) {
        stats.errors.push(`${cleanStr(row["Imię"])} ${cleanStr(row["Nazwisko"])}: ${e.message}`);
      }
    }

    return NextResponse.json({
      message: "Import zakończony pomyślnie",
      stats,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
