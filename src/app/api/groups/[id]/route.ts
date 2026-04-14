import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";
import { z } from "zod";

const updateGroupSchema = z.object({
  name: z.string().min(2).optional(),
  category: z.enum(["U8", "U10", "U12", "U14", "U16", "U18", "SENIOR"]).optional(),
  coachId: z.string().nullable().optional(),
});

// PUT /api/groups/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { session, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole("ADMIN", session!.user.role);
  if (roleError) return roleError;

  const body = await req.json();
  const parsed = updateGroupSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const group = await prisma.trainingGroup.update({ where: { id }, data: parsed.data });
  return NextResponse.json(group);
}

// DELETE /api/groups/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { session, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole("ADMIN", session!.user.role);
  if (roleError) return roleError;

  await prisma.trainingGroup.delete({ where: { id } });
  return NextResponse.json({ message: "Usunięto" });
}
