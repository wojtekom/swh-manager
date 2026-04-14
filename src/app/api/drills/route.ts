import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(2),
  category: z.enum(["SKATING", "SHOOTING", "PASSING", "STICKHANDLING", "TACTICS", "CONDITIONING", "GOALIE", "WARMUP", "COOLDOWN", "GAME"]),
  description: z.string().optional(),
  duration: z.number().min(1).optional(),
  equipment: z.string().optional(),
  difficulty: z.number().min(1).max(5).default(1),
  ageGroups: z.string().optional(),
});

// GET /api/drills
export async function GET() {
  const { error } = await getSessionOrError();
  if (error) return error;

  const drills = await prisma.drill.findMany({
    include: { createdBy: { select: { id: true, name: true } } },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(drills);
}

// POST /api/drills
export async function POST(req: NextRequest) {
  const { session, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole(["ADMIN", "COACH"], session!.user.role);
  if (roleError) return roleError;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const drill = await prisma.drill.create({
    data: { ...parsed.data, createdById: session!.user.id },
  });

  return NextResponse.json(drill, { status: 201 });
}
