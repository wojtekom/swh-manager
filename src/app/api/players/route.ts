import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";
import { z } from "zod";

const createPlayerSchema = z.object({
  firstName: z.string().min(2, "Imię min. 2 znaki"),
  lastName: z.string().min(2, "Nazwisko min. 2 znaki"),
  dateOfBirth: z.string().transform((v) => new Date(v)),
  pesel: z.string().optional(),
  category: z.enum(["U8", "U10", "U12", "U14", "U16", "U18", "SENIOR"]),
  position: z.enum(["GOALIE", "DEFENDER", "FORWARD"]).optional(),
  jerseyNum: z.number().optional(),
  notes: z.string().optional(),
});

// GET /api/players — lista zawodników
export async function GET() {
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const roleError = requireRole(["ADMIN", "COACH"], session!.user.role);
  if (roleError) return roleError;

  const players = await prisma.player.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: {
      parents: { include: { parent: { select: { id: true, name: true, email: true, phone: true } } } },
      groupMembers: { include: { group: { select: { id: true, name: true, category: true } } } },
    },
  });

  return NextResponse.json(players);
}

// POST /api/players — dodaj zawodnika
export async function POST(req: NextRequest) {
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const roleError = requireRole(["ADMIN", "COACH"], session!.user.role);
  if (roleError) return roleError;

  const body = await req.json();
  const parsed = createPlayerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const player = await prisma.player.create({
    data: parsed.data,
  });

  return NextResponse.json(player, { status: 201 });
}
