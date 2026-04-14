import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";
import { z } from "zod";

const createGroupSchema = z.object({
  name: z.string().min(2),
  category: z.enum(["U8", "U10", "U12", "U14", "U16", "U18", "SENIOR"]),
  coachId: z.string().optional(),
});

// GET /api/groups
export async function GET() {
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const groups = await prisma.trainingGroup.findMany({
    include: {
      coach: { include: { user: { select: { name: true } } } },
      members: { include: { player: { select: { id: true, firstName: true, lastName: true, category: true, status: true } } } },
      schedules: true,
      _count: { select: { members: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(groups);
}

// POST /api/groups
export async function POST(req: NextRequest) {
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const roleError = requireRole("ADMIN", session!.user.role);
  if (roleError) return roleError;

  const body = await req.json();
  const parsed = createGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const group = await prisma.trainingGroup.create({ data: parsed.data });
  return NextResponse.json(group, { status: 201 });
}
