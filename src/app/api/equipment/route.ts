import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(2, "Nazwa min. 2 znaki"),
  category: z.enum(["HELMET", "SKATES", "ROLLER_SKATES", "STICK", "GLOVES", "PADS", "JERSEY", "PANTS", "BAG", "GOALIE_GEAR", "NECK_GUARD", "MOUTHGUARD", "TRAINING_AID", "ACCESSORY", "OTHER"]),
  brand: z.string().optional(),
  model: z.string().optional(),
  size: z.string().optional(),
  serialNum: z.string().optional(),
  condition: z.enum(["NEW", "GOOD", "FAIR", "POOR", "DAMAGED", "RETIRED"]).default("NEW"),
  quantity: z.number().min(1).default(1),
  location: z.string().optional(),
  purchaseDate: z.string().nullable().optional(),
  purchasePrice: z.number().nullable().optional(),
  notes: z.string().optional(),
});

// GET /api/equipment
export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const where: Record<string, unknown> = {};
  if (category) where.category = category;

  const equipment = await prisma.equipment.findMany({
    where,
    include: {
      _count: { select: { loans: true } },
      loans: {
        where: { status: "ACTIVE" },
        include: {
          player: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(equipment);
}

// POST /api/equipment
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

  const item = await prisma.equipment.create({
    data: {
      ...parsed.data,
      available: parsed.data.quantity,
      purchaseDate: parsed.data.purchaseDate ? new Date(parsed.data.purchaseDate) : null,
      purchasePrice: parsed.data.purchasePrice || null,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
