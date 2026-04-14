import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";
import { recalcPlanDirect } from "@/lib/cascade-plans";
import { z } from "zod";

const sessionSchema = z.object({
  title: z.string().min(2),
  date: z.string().nullable().optional(),
  scheduleId: z.string().nullable().optional(),
  duration: z.number().min(1).default(60),
  objectives: z.string().optional(),
  notes: z.string().optional(),
  drillIds: z.array(z.string()).optional(),
});

// POST /api/training-plans/[id]/sessions
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { session: authSession, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole(["ADMIN", "COACH"], authSession!.user.role);
  if (roleError) return roleError;

  const body = await req.json();
  const parsed = sessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Pobierz max order
  const lastSession = await prisma.trainingSession.findFirst({
    where: { planId: id },
    orderBy: { order: "desc" },
  });

  const trainingSession = await prisma.trainingSession.create({
    data: {
      planId: id,
      title: parsed.data.title,
      date: parsed.data.date ? new Date(parsed.data.date) : null,
      scheduleId: parsed.data.scheduleId || null,
      duration: parsed.data.duration,
      objectives: parsed.data.objectives || null,
      notes: parsed.data.notes || null,
      order: (lastSession?.order ?? -1) + 1,
      drills: parsed.data.drillIds ? {
        create: parsed.data.drillIds.map((drillId, i) => ({
          drillId,
          order: i,
        })),
      } : undefined,
    },
    include: {
      drills: { include: { drill: true }, orderBy: { order: "asc" } },
    },
  });

  // Kaskadowa korekta planów nadrzędnych
  await recalcPlanDirect(id);

  return NextResponse.json(trainingSession, { status: 201 });
}

// PUT — edytuj sesję
export async function PUT(req: NextRequest) {
  const { session, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole(["ADMIN", "COACH"], session!.user.role);
  if (roleError) return roleError;

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId wymagane" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = sessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const sess = await tx.trainingSession.update({
      where: { id: sessionId },
      data: {
        title: parsed.data.title,
        date: parsed.data.date ? new Date(parsed.data.date) : null,
        scheduleId: parsed.data.scheduleId || null,
        duration: parsed.data.duration,
        objectives: parsed.data.objectives || null,
        notes: parsed.data.notes || null,
      },
    });

    if (parsed.data.drillIds) {
      await tx.sessionDrill.deleteMany({ where: { sessionId } });
      if (parsed.data.drillIds.length > 0) {
        await tx.sessionDrill.createMany({
          data: parsed.data.drillIds.map((drillId, i) => ({
            sessionId,
            drillId,
            order: i,
          })),
        });
      }
    }

    return tx.trainingSession.findUnique({
      where: { id: sessionId },
      include: {
        drills: { include: { drill: true }, orderBy: { order: "asc" } },
      },
    });
  });

  // Kaskadowa korekta — znajdź planId sesji i przelicz
  if (updated) {
    await recalcPlanDirect(updated.planId);
  }

  return NextResponse.json(updated);
}

// DELETE — usuń sesję
export async function DELETE(req: NextRequest) {
  const { session, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole(["ADMIN", "COACH"], session!.user.role);
  if (roleError) return roleError;

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId wymagane" }, { status: 400 });
  }

  // Pobierz planId przed usunięciem
  const sess = await prisma.trainingSession.findUnique({
    where: { id: sessionId },
    select: { planId: true },
  });

  await prisma.trainingSession.delete({ where: { id: sessionId } });

  // Kaskadowa korekta
  if (sess) {
    await recalcPlanDirect(sess.planId);
  }

  return NextResponse.json({ message: "Usunięto" });
}
