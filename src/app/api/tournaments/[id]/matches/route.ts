import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";
import { z } from "zod";

const matchSchema = z.object({
  opponent: z.string().min(2, "Przeciwnik wymagany"),
  isHome: z.boolean().default(true),
  ourScore: z.number().nullable().optional(),
  opponentScore: z.number().nullable().optional(),
  matchDate: z.string(),
  notes: z.string().optional(),
});

// GET /api/tournaments/[id]/matches
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await getSessionOrError();
  if (error) return error;

  const matches = await prisma.tournamentMatch.findMany({
    where: { tournamentId: id },
    orderBy: { matchDate: "asc" },
  });

  return NextResponse.json(matches);
}

// POST /api/tournaments/[id]/matches
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { session, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole(["ADMIN", "COACH"], session!.user.role);
  if (roleError) return roleError;

  const body = await req.json();
  const parsed = matchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const match = await prisma.tournamentMatch.create({
    data: {
      tournamentId: id,
      opponent: parsed.data.opponent,
      isHome: parsed.data.isHome,
      ourScore: parsed.data.ourScore ?? null,
      opponentScore: parsed.data.opponentScore ?? null,
      matchDate: new Date(parsed.data.matchDate),
      notes: parsed.data.notes || null,
    },
  });

  return NextResponse.json(match, { status: 201 });
}

// PUT — aktualizacja wyniku meczu
export async function PUT(req: NextRequest) {
  const { session, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole(["ADMIN", "COACH"], session!.user.role);
  if (roleError) return roleError;

  const body = await req.json();
  const { matchId, ...data } = body;

  if (data.matchDate) data.matchDate = new Date(data.matchDate);

  const match = await prisma.tournamentMatch.update({
    where: { id: matchId },
    data,
  });

  return NextResponse.json(match);
}
