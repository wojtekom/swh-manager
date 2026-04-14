import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(3, "Nazwa min. 3 znaki"),
  type: z.enum(["CAMP", "TRIP", "WORKSHOP"]).default("CAMP"),
  location: z.string().min(2, "Lokalizacja wymagana"),
  startDate: z.string(),
  endDate: z.string(),
  category: z.enum(["U8", "U10", "U12", "U14", "U16", "U18", "SENIOR"]).nullable().optional(),
  description: z.string().optional(),
  cost: z.number().min(0).default(0),
  maxSpots: z.number().min(1).nullable().optional(),
  groupId: z.string().nullable().optional(),
});

// GET /api/camps
export async function GET() {
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const camps = await prisma.camp.findMany({
    include: {
      group: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      _count: { select: { registrations: true } },
    },
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json(camps);
}

// POST /api/camps
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

  const camp = await prisma.camp.create({
    data: {
      name: parsed.data.name,
      type: parsed.data.type,
      location: parsed.data.location,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      category: parsed.data.category || null,
      description: parsed.data.description || null,
      cost: parsed.data.cost,
      maxSpots: parsed.data.maxSpots || null,
      groupId: parsed.data.groupId || null,
      createdById: session!.user.id,
    },
  });

  return NextResponse.json(camp, { status: 201 });
}
