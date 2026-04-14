import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";

// GET /api/equipment/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await getSessionOrError();
  if (error) return error;

  const item = await prisma.equipment.findUnique({
    where: { id },
    include: {
      loans: {
        include: {
          player: { select: { id: true, firstName: true, lastName: true } },
          issuedBy: { select: { id: true, name: true } },
        },
        orderBy: { loanDate: "desc" },
      },
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Nie znaleziono" }, { status: 404 });
  }

  return NextResponse.json(item);
}

// PUT /api/equipment/[id]
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
  if (body.purchaseDate) body.purchaseDate = new Date(body.purchaseDate);

  const item = await prisma.equipment.update({ where: { id }, data: body });
  return NextResponse.json(item);
}

// DELETE /api/equipment/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { session, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole(["ADMIN", "COACH"], session!.user.role);
  if (roleError) return roleError;

  await prisma.equipment.delete({ where: { id } });
  return NextResponse.json({ message: "Usunięto" });
}
