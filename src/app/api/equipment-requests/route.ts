import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana"),
  description: z.string().optional(),
  playerName: z.string().optional(),
  equipmentCategory: z.enum(["HELMET", "SKATES", "ROLLER_SKATES", "STICK", "GLOVES", "PADS", "JERSEY", "PANTS", "BAG", "GOALIE_GEAR", "NECK_GUARD", "MOUTHGUARD", "TRAINING_AID", "ACCESSORY", "OTHER"]),
  quantity: z.number().int().min(1).max(100).default(1),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  minBudget: z.number().min(0).optional(),
  maxBudget: z.number().min(0).optional(),
  notes: z.string().optional(),
});

// GET /api/equipment-requests — ADMIN: all, COACH/PARENT: own
export async function GET() {
  const { session, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole(["ADMIN", "COACH", "PARENT"], session!.user.role);
  if (roleError) return roleError;

  const where = session!.user.role === "ADMIN" ? {} : { userId: session!.user.id };

  const requests = await prisma.equipmentRequest.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, role: true } },
      proposals: {
        include: {
          product: {
            select: {
              id: true, name: true, brand: true, price: true,
              equipmentCategory: true, productCode: true, ageGroup: true,
              level: true, sizes: true, description: true,
              catalog: { select: { id: true, name: true, supplier: true } },
            },
          },
          admin: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(requests);
}

// POST /api/equipment-requests — COACH/ADMIN/PARENT creates request
export async function POST(req: NextRequest) {
  const { session, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole(["ADMIN", "COACH", "PARENT"], session!.user.role);
  if (roleError) return roleError;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const request = await prisma.equipmentRequest.create({
    data: {
      ...parsed.data,
      userId: session!.user.id,
    },
  });

  return NextResponse.json(request, { status: 201 });
}
