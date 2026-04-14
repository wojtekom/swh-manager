import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";
import { z } from "zod";

const updatePaymentSchema = z.object({
  status: z.enum(["PENDING", "PAID", "PARTIAL", "OVERDUE"]).optional(),
  paidDate: z.string().transform((v) => new Date(v)).optional(),
  paidAmount: z.number().optional(),
  notes: z.string().optional(),
});

// PUT /api/payments/[id] — aktualizuj status płatności
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
  const parsed = updatePaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const payment = await prisma.payment.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(payment);
}

// DELETE /api/payments/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const roleError = requireRole("ADMIN", session!.user.role);
  if (roleError) return roleError;

  await prisma.payment.delete({ where: { id } });
  return NextResponse.json({ message: "Usunięto" });
}
