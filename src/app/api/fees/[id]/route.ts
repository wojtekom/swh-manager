import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";
import { z } from "zod";

const updateFeeSchema = z.object({
  name: z.string().min(2).optional(),
  amount: z.number().positive().optional(),
  frequency: z.enum(["MONTHLY", "QUARTERLY", "YEARLY", "ONE_TIME"]).optional(),
  active: z.boolean().optional(),
});

// PUT /api/fees/[id]
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
  const parsed = updateFeeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const fee = await prisma.feeDefinition.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json(fee);
}

// DELETE /api/fees/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const roleError = requireRole("ADMIN", session!.user.role);
  if (roleError) return roleError;

  await prisma.feeDefinition.delete({ where: { id } });
  return NextResponse.json({ message: "Usunięto" });
}
