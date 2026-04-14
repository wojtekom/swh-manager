import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";

// GET /api/camps/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await getSessionOrError();
  if (error) return error;

  const camp = await prisma.camp.findUnique({
    where: { id },
    include: {
      group: { select: { id: true, name: true, category: true } },
      createdBy: { select: { id: true, name: true } },
      registrations: {
        include: {
          player: {
            select: { id: true, firstName: true, lastName: true, category: true, jerseyNum: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!camp) {
    return NextResponse.json({ error: "Nie znaleziono" }, { status: 404 });
  }

  return NextResponse.json(camp);
}

// PUT /api/camps/[id]
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
  if (body.startDate) body.startDate = new Date(body.startDate);
  if (body.endDate) body.endDate = new Date(body.endDate);

  const camp = await prisma.camp.update({ where: { id }, data: body });
  return NextResponse.json(camp);
}

// DELETE /api/camps/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { session, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole(["ADMIN", "COACH"], session!.user.role);
  if (roleError) return roleError;

  await prisma.camp.delete({ where: { id } });
  return NextResponse.json({ message: "Usunięto" });
}
