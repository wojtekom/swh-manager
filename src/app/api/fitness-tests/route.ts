import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";
import { z } from "zod";

const upsertSchema = z.object({
  playerId: z.string(),
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  testCode: z.enum(["T1", "T2", "T3", "T4", "T5", "T6", "T7"]),
  rawValue: z.number().nullable().optional(),
  grade: z.number().int().min(1).max(4).nullable().optional(),
  notes: z.string().optional(),
});

// GET /api/fitness-tests?playerId=xxx[&year=2026]
export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const playerId = searchParams.get("playerId");
  const year = searchParams.get("year");

  if (!playerId) {
    return NextResponse.json({ error: "Brak playerId" }, { status: 400 });
  }

  // PARENT widzi tylko własne dziecko
  if (session!.user.role === "PARENT") {
    const link = await prisma.parentPlayer.findFirst({
      where: { parentId: session!.user.id, playerId },
    });
    if (!link) return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
  }

  const results = await prisma.fitnessTestResult.findMany({
    where: {
      playerId,
      ...(year ? { year: parseInt(year) } : {}),
    },
    orderBy: [{ year: "asc" }, { month: "asc" }, { testCode: "asc" }],
  });

  return NextResponse.json(results);
}

// PUT /api/fitness-tests — upsert jednego wyniku
export async function PUT(req: NextRequest) {
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const roleError = requireRole(["ADMIN", "COACH"], session!.user.role);
  if (roleError) return roleError;

  const body = await req.json();
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { playerId, year, month, testCode, rawValue, grade, notes } = parsed.data;

  const result = await prisma.fitnessTestResult.upsert({
    where: { playerId_year_month_testCode: { playerId, year, month, testCode } },
    create: {
      playerId,
      year,
      month,
      testCode,
      rawValue: rawValue ?? null,
      grade: grade ?? null,
      notes,
      createdById: session!.user.id,
    },
    update: {
      rawValue: rawValue ?? null,
      grade: grade ?? null,
      notes,
    },
  });

  return NextResponse.json(result);
}

// DELETE /api/fitness-tests?playerId=xxx&year=2026&month=4&testCode=T1
export async function DELETE(req: NextRequest) {
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const roleError = requireRole(["ADMIN", "COACH"], session!.user.role);
  if (roleError) return roleError;

  const { searchParams } = new URL(req.url);
  const playerId = searchParams.get("playerId");
  const year = searchParams.get("year");
  const month = searchParams.get("month");
  const testCode = searchParams.get("testCode");

  if (!playerId || !year || !month || !testCode) {
    return NextResponse.json({ error: "Brak parametrów" }, { status: 400 });
  }

  await prisma.fitnessTestResult.deleteMany({
    where: {
      playerId,
      year: parseInt(year),
      month: parseInt(month),
      testCode,
    },
  });

  return NextResponse.json({ ok: true });
}
