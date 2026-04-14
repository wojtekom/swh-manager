import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";
import { z } from "zod";

const callupSchema = z.object({
  playerIds: z.array(z.string()).min(1, "Wybierz min. 1 zawodnika"),
});

const updateSchema = z.object({
  callupId: z.string(),
  status: z.enum(["CALLED", "CONFIRMED", "DECLINED", "INJURED"]),
  notes: z.string().optional(),
});

// GET /api/tournaments/[id]/callups
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await getSessionOrError();
  if (error) return error;

  const callups = await prisma.callup.findMany({
    where: { tournamentId: id },
    include: {
      player: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          position: true,
          jerseyNum: true,
          category: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(callups);
}

// POST /api/tournaments/[id]/callups — powołaj zawodników
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
  const parsed = callupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Utwórz powołania (ignoruj duplikaty)
  const results = await Promise.allSettled(
    parsed.data.playerIds.map((playerId) =>
      prisma.callup.create({
        data: { tournamentId: id, playerId },
      })
    )
  );

  const created = results.filter((r) => r.status === "fulfilled").length;
  return NextResponse.json({ created }, { status: 201 });
}

// PUT /api/tournaments/[id]/callups — aktualizacja statusu powołania
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const callup = await prisma.callup.update({
    where: { id: parsed.data.callupId },
    data: {
      status: parsed.data.status,
      notes: parsed.data.notes,
      respondedAt: new Date(),
    },
  });

  return NextResponse.json(callup);
}

// DELETE — usuń powołanie
export async function DELETE(req: NextRequest) {
  const { session, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole(["ADMIN", "COACH"], session!.user.role);
  if (roleError) return roleError;

  const { searchParams } = new URL(req.url);
  const callupId = searchParams.get("callupId");

  if (!callupId) {
    return NextResponse.json({ error: "callupId wymagane" }, { status: 400 });
  }

  await prisma.callup.delete({ where: { id: callupId } });
  return NextResponse.json({ message: "Usunięto" });
}
