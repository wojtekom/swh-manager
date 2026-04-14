import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(3, "Nazwa min. 3 znaki"),
  location: z.string().min(2, "Lokalizacja wymagana"),
  startDate: z.string(),
  endDate: z.string().nullable().optional(),
  category: z.enum(["U8", "U10", "U12", "U14", "U16", "U18", "SENIOR"]),
  description: z.string().optional(),
  groupId: z.string().nullable().optional(),
});

// GET /api/tournaments
export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (status) where.status = status;

  const tournaments = await prisma.tournament.findMany({
    where,
    include: {
      group: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      _count: { select: { matches: true, callups: true } },
    },
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json(tournaments);
}

// POST /api/tournaments
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

  const tournament = await prisma.tournament.create({
    data: {
      name: parsed.data.name,
      location: parsed.data.location,
      startDate: new Date(parsed.data.startDate),
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
      category: parsed.data.category,
      description: parsed.data.description || null,
      groupId: parsed.data.groupId || null,
      createdById: session!.user.id,
    },
  });

  return NextResponse.json(tournament, { status: 201 });
}
