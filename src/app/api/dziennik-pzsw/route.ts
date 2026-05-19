import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";

// GET /api/dziennik-pzsw?groupId=xxx
// Zwraca dane dziennika w formacie PZSW "Łączą nas rolki":
// - lista uczestników z frekwencją
// - tematy zajęć z dat sesji treningowych
export async function GET(request: NextRequest) {
  const { session, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole(["ADMIN", "COACH"], session!.user.role);
  if (roleError) return roleError;

  const groupId = request.nextUrl.searchParams.get("groupId");

  try {
    // Pobierz grupę
    const group = groupId
      ? await prisma.trainingGroup.findUnique({
          where: { id: groupId },
          include: { coach: { include: { user: { select: { name: true } } } } },
        })
      : null;

    // Pobierz zawodników grupy
    const players = groupId
      ? await prisma.player.findMany({
          where: { status: "ACTIVE", groupMembers: { some: { groupId } } },
          orderBy: { lastName: "asc" },
        })
      : await prisma.player.findMany({
          where: { status: "ACTIVE" },
          orderBy: { lastName: "asc" },
        });

    // Pobierz sesje treningowe z datami (zsynchronizowane z planem)
    const sessions = await prisma.trainingSession.findMany({
      where: {
        date: { not: null },
        plan: groupId ? { groupId } : undefined,
      },
      orderBy: { date: "asc" },
      include: {
        plan: { select: { name: true, category: true } },
        skillFocus: { include: { skill: { select: { code: true, name: true } } } },
      },
    });

    // Pobierz frekwencję
    const attendances = await prisma.attendance.findMany({
      where: {
        playerId: { in: players.map((p) => p.id) },
      },
      orderBy: { date: "asc" },
    });

    // Mapuj frekwencję per zawodnik per data
    const attendanceMap: Record<string, Record<string, boolean>> = {};
    for (const a of attendances) {
      const dateKey = a.date.toISOString().split("T")[0];
      if (!attendanceMap[a.playerId]) attendanceMap[a.playerId] = {};
      attendanceMap[a.playerId][dateKey] = a.present;
    }

    // Formatuj sesje jako terminarz PZSW
    const schedule = sessions.map((s) => ({
      date: s.date!.toISOString(),
      dateFormatted: s.date!.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" }),
      title: s.title,
      objectives: s.objectives,
      duration: s.duration,
      skills: s.skillFocus.map((sf) => ({
        code: sf.skill.code,
        name: sf.skill.name,
        intensity: sf.intensity,
      })),
    }));

    // Frekwencja per zawodnik
    const playerData = players.map((p) => {
      const att = attendanceMap[p.id] || {};
      const totalPresent = Object.values(att).filter(Boolean).length;
      const totalSessions = Object.keys(att).length;
      return {
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        dateOfBirth: p.dateOfBirth.toISOString().split("T")[0],
        category: p.category,
        attendance: att,
        totalPresent,
        totalSessions,
        percentPresent: totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 0,
      };
    });

    return NextResponse.json({
      program: "Łączą nas rolki — PZSW 2026",
      projectPeriod: "16.04.2026 – 15.10.2026",
      group: group ? { name: group.name, category: group.category, coach: group.coach?.user?.name } : null,
      participantCount: players.length,
      sessionCount: schedule.length,
      players: playerData,
      schedule,
    });
  } catch (err) {
    console.error("Błąd dziennik-pzsw:", err);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
