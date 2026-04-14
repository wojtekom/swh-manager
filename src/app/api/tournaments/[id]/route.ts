import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";

// GET /api/tournaments/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await getSessionOrError();
  if (error) return error;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      group: { select: { id: true, name: true, category: true } },
      createdBy: { select: { id: true, name: true } },
      matches: { orderBy: { matchDate: "asc" } },
      callups: {
        include: {
          player: {
            select: { id: true, firstName: true, lastName: true, position: true, jerseyNum: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!tournament) {
    return NextResponse.json({ error: "Nie znaleziono" }, { status: 404 });
  }

  return NextResponse.json(tournament);
}

// PUT /api/tournaments/[id]
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

  // Przetwórz daty jeśli podane
  if (body.startDate) body.startDate = new Date(body.startDate);
  if (body.endDate) body.endDate = new Date(body.endDate);

  const tournament = await prisma.tournament.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(tournament);
}

// DELETE /api/tournaments/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { session, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole(["ADMIN", "COACH"], session!.user.role);
  if (roleError) return roleError;

  await prisma.tournament.delete({ where: { id } });
  return NextResponse.json({ message: "Usunięto" });
}
