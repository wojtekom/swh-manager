import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";
import { z } from "zod";

const createScheduleSchema = z.object({
  groupId: z.string(),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:MM"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:MM"),
  location: z.string().min(2),
  recurring: z.boolean().default(true),
});

// GET /api/schedules
export async function GET() {
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const schedules = await prisma.schedule.findMany({
    where: { active: true },
    include: {
      group: { select: { id: true, name: true, category: true } },
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json(schedules);
}

// POST /api/schedules
export async function POST(req: NextRequest) {
  const { session, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole(["ADMIN", "COACH"], session!.user.role);
  if (roleError) return roleError;

  const body = await req.json();
  const parsed = createScheduleSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const schedule = await prisma.schedule.create({ data: parsed.data });
  return NextResponse.json(schedule, { status: 201 });
}
