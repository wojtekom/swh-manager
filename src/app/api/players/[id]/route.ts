import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";
import { z } from "zod";

const updatePlayerSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  dateOfBirth: z.string().transform((v) => new Date(v)).optional(),
  pesel: z.string().optional(),
  category: z.enum(["U8", "U10", "U12", "U14", "U16", "U18", "SENIOR"]).optional(),
  position: z.enum(["GOALIE", "DEFENDER", "FORWARD"]).nullable().optional(),
  jerseyNum: z.number().nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "INJURED", "SUSPENDED"]).optional(),
  notes: z.string().optional(),
});

// GET /api/players/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const player = await prisma.player.findUnique({
    where: { id },
    include: {
      parents: { include: { parent: { select: { id: true, name: true, email: true, phone: true } } } },
      groupMembers: { include: { group: true } },
      payments: { orderBy: { dueDate: "desc" }, take: 10 },
      attendances: { orderBy: { date: "desc" }, take: 20 },
    },
  });

  if (!player) {
    return NextResponse.json({ error: "Nie znaleziono zawodnika" }, { status: 404 });
  }

  return NextResponse.json(player);
}

// PUT /api/players/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const roleError = requireRole(["ADMIN", "COACH"], session!.user.role);
  if (roleError) return roleError;

  const body = await req.json();
  const parsed = updatePlayerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const player = await prisma.player.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(player);
}

// DELETE /api/players/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const roleError = requireRole("ADMIN", session!.user.role);
  if (roleError) return roleError;

  await prisma.player.delete({ where: { id } });

  return NextResponse.json({ message: "Usunięto" });
}
