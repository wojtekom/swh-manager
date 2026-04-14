import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";
import { z } from "zod";

const memberSchema = z.object({
  playerIds: z.array(z.string()).min(1),
});

// POST /api/groups/[id]/members — dodaj zawodników do grupy
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
  const parsed = memberSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Skip already existing members
  const existing = await prisma.groupMember.findMany({
    where: { groupId: id, playerId: { in: parsed.data.playerIds } },
    select: { playerId: true },
  });
  const existingIds = new Set(existing.map((e) => e.playerId));
  const newIds = parsed.data.playerIds.filter((pid) => !existingIds.has(pid));

  if (newIds.length > 0) {
    await prisma.groupMember.createMany({
      data: newIds.map((playerId) => ({ groupId: id, playerId })),
    });
  }

  return NextResponse.json({ added: newIds.length });
}

// DELETE /api/groups/[id]/members — usuń zawodnika z grupy
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { session, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole(["ADMIN", "COACH"], session!.user.role);
  if (roleError) return roleError;

  const { playerId } = await req.json();
  if (!playerId) return NextResponse.json({ error: "Brak playerId" }, { status: 400 });

  await prisma.groupMember.deleteMany({
    where: { groupId: id, playerId },
  });

  return NextResponse.json({ message: "Usunięto z grupy" });
}
