import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";
import { z } from "zod";

const loanSchema = z.object({
  equipmentId: z.string(),
  playerId: z.string(),
  quantity: z.number().min(1).default(1),
  dueDate: z.string().nullable().optional(),
  notes: z.string().optional(),
});

// GET /api/equipment/loans — wszystkie aktywne wypożyczenia
export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "ACTIVE";
  const playerId = searchParams.get("playerId");

  const where: Record<string, unknown> = {};
  if (status !== "ALL") where.status = status;
  if (playerId) where.playerId = playerId;

  const loans = await prisma.equipmentLoan.findMany({
    where,
    include: {
      equipment: { select: { id: true, name: true, category: true, size: true } },
      player: { select: { id: true, firstName: true, lastName: true } },
      issuedBy: { select: { id: true, name: true } },
    },
    orderBy: { loanDate: "desc" },
  });

  return NextResponse.json(loans);
}

// POST /api/equipment/loans — nowe wypożyczenie
export async function POST(req: NextRequest) {
  const { session, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole(["ADMIN", "COACH"], session!.user.role);
  if (roleError) return roleError;

  const body = await req.json();
  const parsed = loanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Sprawdź dostępność
  const equipment = await prisma.equipment.findUnique({
    where: { id: parsed.data.equipmentId },
  });

  if (!equipment) {
    return NextResponse.json({ error: "Sprzęt nie znaleziony" }, { status: 404 });
  }

  if (equipment.available < parsed.data.quantity) {
    return NextResponse.json({ error: "Brak wystarczającej ilości" }, { status: 400 });
  }

  // Utwórz wypożyczenie i zmniejsz dostępność
  const [loan] = await prisma.$transaction([
    prisma.equipmentLoan.create({
      data: {
        equipmentId: parsed.data.equipmentId,
        playerId: parsed.data.playerId,
        issuedById: session!.user.id,
        quantity: parsed.data.quantity,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        notes: parsed.data.notes || null,
      },
    }),
    prisma.equipment.update({
      where: { id: parsed.data.equipmentId },
      data: { available: { decrement: parsed.data.quantity } },
    }),
  ]);

  return NextResponse.json(loan, { status: 201 });
}
