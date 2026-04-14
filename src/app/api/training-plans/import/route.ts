import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";
import * as XLSX from "xlsx";

const CATEGORY_MAP: Record<string, string> = {
  jazda: "SKATING",
  strzały: "SHOOTING",
  strzaly: "SHOOTING",
  podania: "PASSING",
  prowadzenie: "STICKHANDLING",
  taktyka: "TACTICS",
  kondycja: "CONDITIONING",
  bramkarz: "GOALIE",
  rozgrzewka: "WARMUP",
  schładzanie: "COOLDOWN",
  schladzanie: "COOLDOWN",
  gra: "GAME",
};

function cleanStr(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

function parseExcelDate(v: unknown): Date | null {
  if (!v) return null;
  const s = String(v).trim();
  // ISO or Polish date
  const iso = new Date(s);
  if (!isNaN(iso.getTime())) return iso;
  // dd.mm.yyyy
  const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  // Excel serial
  const num = Number(v);
  if (!isNaN(num) && num > 40000 && num < 60000) {
    return new Date((num - 25569) * 86400000);
  }
  return null;
}

// POST /api/training-plans/import
export async function POST(req: NextRequest) {
  const { session, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole(["ADMIN", "COACH"], session!.user.role);
  if (roleError) return roleError;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const mode = formData.get("mode") as string; // "sessions" | "drills"

  if (!file) {
    return NextResponse.json({ error: "Brak pliku" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buffer, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws) as Record<string, unknown>[];

  if (rows.length === 0) {
    return NextResponse.json({ error: "Plik jest pusty" }, { status: 400 });
  }

  if (mode === "sessions") {
    const planId = formData.get("planId") as string;
    if (!planId) {
      return NextResponse.json({ error: "planId wymagane" }, { status: 400 });
    }

    // Sprawdź czy plan istnieje
    const plan = await prisma.trainingPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      return NextResponse.json({ error: "Plan nie istnieje" }, { status: 404 });
    }

    // Pobierz max order
    const lastSession = await prisma.trainingSession.findFirst({
      where: { planId },
      orderBy: { order: "desc" },
    });
    let nextOrder = (lastSession?.order ?? -1) + 1;

    // Pobierz istniejące drille do dopasowania nazw
    const allDrills = await prisma.drill.findMany();

    let added = 0;
    let skipped = 0;
    const warnings: string[] = [];

    for (const row of rows) {
      const title = cleanStr(row["Tytuł"] || row["Tytul"] || row["Temat"] || row["title"]);
      if (!title) { skipped++; continue; }

      const dateVal = parseExcelDate(row["Data"] || row["date"]);
      const duration = Number(row["Czas (min)"] || row["Czas"] || row["duration"] || 60) || 60;
      const objectives = cleanStr(row["Cele"] || row["objectives"] || "");
      const notes = cleanStr(row["Plan / Notatki"] || row["Plan"] || row["Notatki"] || row["notes"] || "");
      const drillNames = cleanStr(row["Ćwiczenia"] || row["Cwiczenia"] || row["drills"] || "");

      // Dopasuj ćwiczenia po nazwie
      const matchedDrillIds: string[] = [];
      if (drillNames) {
        const names = drillNames.split(",").map((n) => n.trim().toLowerCase()).filter(Boolean);
        for (const name of names) {
          const found = allDrills.find((d) => d.name.toLowerCase() === name);
          if (found) {
            matchedDrillIds.push(found.id);
          } else {
            warnings.push(`Ćwiczenie "${name}" nie znalezione w bazie`);
          }
        }
      }

      await prisma.trainingSession.create({
        data: {
          planId,
          title,
          date: dateVal,
          duration,
          objectives: objectives || null,
          notes: notes || null,
          order: nextOrder++,
          drills: matchedDrillIds.length > 0 ? {
            create: matchedDrillIds.map((drillId, i) => ({ drillId, order: i })),
          } : undefined,
        },
      });
      added++;
    }

    return NextResponse.json({ added, skipped, warnings: warnings.slice(0, 20) });
  }

  if (mode === "drills") {
    let added = 0;
    let skipped = 0;

    for (const row of rows) {
      const name = cleanStr(row["Nazwa"] || row["name"]);
      if (!name) { skipped++; continue; }

      // Sprawdź duplikat
      const existing = await prisma.drill.findFirst({ where: { name } });
      if (existing) { skipped++; continue; }

      const catRaw = cleanStr(row["Kategoria"] || row["category"]).toLowerCase();
      const category = CATEGORY_MAP[catRaw] || "GAME";
      const description = cleanStr(row["Opis"] || row["description"]);
      const duration = Number(row["Czas (min)"] || row["Czas"] || row["duration"]) || null;
      const equipment = cleanStr(row["Sprzęt"] || row["Sprzet"] || row["equipment"]);
      const difficulty = Math.min(5, Math.max(1, Number(row["Trudność"] || row["Trudnosc"] || row["difficulty"] || 1) || 1));
      const ageGroups = cleanStr(row["Grupy wiekowe"] || row["ageGroups"]);

      await prisma.drill.create({
        data: {
          name,
          category: category as "SKATING" | "SHOOTING" | "PASSING" | "STICKHANDLING" | "TACTICS" | "CONDITIONING" | "GOALIE" | "WARMUP" | "COOLDOWN" | "GAME",
          description: description || null,
          duration,
          equipment: equipment || null,
          difficulty,
          ageGroups: ageGroups || null,
          createdById: session!.user.id,
        },
      });
      added++;
    }

    return NextResponse.json({ added, skipped });
  }

  return NextResponse.json({ error: "Nieznany tryb — użyj 'sessions' lub 'drills'" }, { status: 400 });
}
