import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";

// GET /api/training-plans/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await getSessionOrError();
  if (error) return error;

  const plan = await prisma.trainingPlan.findUnique({
    where: { id },
    include: {
      group: { select: { id: true, name: true, category: true } },
      createdBy: { select: { id: true, name: true } },
      sessions: {
        include: {
          drills: {
            include: { drill: true },
            orderBy: { order: "asc" },
          },
          schedule: { select: { id: true, dayOfWeek: true, startTime: true, location: true } },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!plan) {
    return NextResponse.json({ error: "Nie znaleziono" }, { status: 404 });
  }

  return NextResponse.json(plan);
}

// PUT /api/training-plans/[id]
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
  const plan = await prisma.trainingPlan.update({ where: { id }, data: body });
  return NextResponse.json(plan);
}

// DELETE /api/training-plans/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { session, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole(["ADMIN", "COACH"], session!.user.role);
  if (roleError) return roleError;

  await prisma.trainingPlan.delete({ where: { id } });
  return NextResponse.json({ message: "Usunięto" });
}
