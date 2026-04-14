import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError } from "@/lib/auth-helpers";

// GET /api/calendar — zbiorczy kalendarz: treningi + turnieje + obozy
export async function GET() {
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const [schedules, tournaments, camps, sessions] = await Promise.all([
    prisma.schedule.findMany({
      where: { active: true },
      include: { group: { select: { id: true, name: true, category: true } } },
    }),
    prisma.tournament.findMany({
      where: { status: { not: "CANCELLED" } },
      include: {
        group: { select: { id: true, name: true } },
        _count: { select: { callups: true, matches: true } },
      },
    }),
    prisma.camp.findMany({
      where: { status: { not: "CANCELLED" } },
      include: { group: { select: { id: true, name: true } } },
    }),
    prisma.trainingSession.findMany({
      where: { date: { not: null } },
      include: {
        plan: { select: { id: true, name: true, category: true } },
      },
    }),
  ]);

  return NextResponse.json({ schedules, tournaments, camps, sessions });
}
