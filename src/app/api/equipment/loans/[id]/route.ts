import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";

// PUT /api/equipment/loans/[id] — zwrot lub aktualizacja
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

  // Jeśli zwrot
  if (body.status === "RETURNED") {
    const loan = await prisma.equipmentLoan.findUnique({ where: { id } });
    if (!loan) {
      return NextResponse.json({ error: "Nie znaleziono" }, { status: 404 });
    }

    if (loan.status === "ACTIVE" || loan.status === "OVERDUE") {
      const [updated] = await prisma.$transaction([
        prisma.equipmentLoan.update({
          where: { id },
          data: {
            status: "RETURNED",
            returnDate: new Date(),
            condition: body.condition || null,
            notes: body.notes || loan.notes,
          },
        }),
        prisma.equipment.update({
          where: { id: loan.equipmentId },
          data: { available: { increment: loan.quantity } },
        }),
      ]);
      return NextResponse.json(updated);
    }
  }

  // Inna aktualizacja
  if (body.dueDate) body.dueDate = new Date(body.dueDate);
  const updated = await prisma.equipmentLoan.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(updated);
}
