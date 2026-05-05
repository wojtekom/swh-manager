import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";

// 6 testów rolkarza PZSW
const TESTS = [
  { key: "T1_sprint_20m", label: "T1 Sprint 20m", unit: "s" },
  { key: "T2_slalom", label: "T2 Slalom", unit: "s" },
  { key: "T3_jazda_tylem_15m", label: "T3 Jazda tyłem 15m", unit: "s" },
  { key: "T4_podanie_celne", label: "T4 Podanie celne ×5", unit: "trafienia" },
  { key: "T5_prowadzenie_slalom", label: "T5 Prowadzenie krążka slalom", unit: "s" },
  { key: "T6_wytrzymalosc", label: "T6 Wytrzymałość (kursowanie/beep)", unit: "s/m" },
];

// GET /api/test-rolkarza?groupId=xxx
// Zwraca: { tests, players: [{ id, name, results: { T1: { start, end }, ... } }] }
export async function GET(request: NextRequest) {
  const { session, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole(["ADMIN", "COACH"], session!.user.role);
  if (roleError) return roleError;

  const groupId = request.nextUrl.searchParams.get("groupId");

  try {
    // Pobierz zawodników (z grupy lub wszystkich)
    const whereClause = groupId
      ? { status: "ACTIVE" as const, groupMembers: { some: { groupId } } }
      : { status: "ACTIVE" as const };

    const players = await prisma.player.findMany({
      where: whereClause,
      include: {
        fitnessTests: {
          where: { testType: { startsWith: "T" } },
          orderBy: { testDate: "desc" },
        },
        groupMembers: { include: { group: { select: { name: true } } } },
      },
      orderBy: { lastName: "asc" },
    });

    const result = players.map((p) => {
      const results: Record<string, Record<string, { result: string; testDate: string }>> = {};
      for (const test of TESTS) {
        results[test.key] = {};
        for (const period of ["start", "end"]) {
          const ft = p.fitnessTests.find(
            (f) => f.testType === test.key && f.period === period
          );
          if (ft) {
            results[test.key][period] = {
              result: ft.result,
              testDate: ft.testDate.toISOString(),
            };
          }
        }
      }
      return {
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        category: p.category,
        groupName: p.groupMembers[0]?.group?.name || null,
        results,
      };
    });

    return NextResponse.json({ tests: TESTS, players: result });
  } catch (err) {
    console.error("Błąd test-rolkarza GET:", err);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

// POST /api/test-rolkarza
// Body: { playerId, testType, period, result, testDate? }
export async function POST(request: NextRequest) {
  const { session, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole(["ADMIN", "COACH"], session!.user.role);
  if (roleError) return roleError;

  try {
    const body = await request.json();
    const { playerId, testType, period, result, testDate } = body;

    if (!playerId || !testType || !period || result === undefined) {
      return NextResponse.json({ error: "Brakujące dane" }, { status: 400 });
    }

    if (!["start", "end"].includes(period)) {
      return NextResponse.json({ error: "Okres musi być 'start' lub 'end'" }, { status: 400 });
    }

    // Upsert — nadpisz istniejący wynik dla tego gracza/testu/okresu
    const existing = await prisma.playerFitnessTest.findFirst({
      where: { playerId, testType, period },
    });

    const data = {
      playerId,
      testType,
      result: String(result),
      period,
      testDate: testDate ? new Date(testDate) : new Date(),
      notes: `Zapisał: ${session!.user.name}`,
    };

    const saved = existing
      ? await prisma.playerFitnessTest.update({ where: { id: existing.id }, data })
      : await prisma.playerFitnessTest.create({ data });

    return NextResponse.json({ ok: true, test: saved });
  } catch (err) {
    console.error("Błąd test-rolkarza POST:", err);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
