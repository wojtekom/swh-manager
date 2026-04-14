import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";
import { z } from "zod";

const createFeeSchema = z.object({
  name: z.string().min(2, "Nazwa min. 2 znaki"),
  amount: z.number().positive("Kwota musi być dodatnia"),
  frequency: z.enum(["MONTHLY", "QUARTERLY", "YEARLY", "ONE_TIME"]),
  groupId: z.string().optional(),
});

// GET /api/fees — lista definicji składek
export async function GET() {
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const fees = await prisma.feeDefinition.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(fees);
}

// POST /api/fees — dodaj składkę (admin)
export async function POST(req: NextRequest) {
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const roleError = requireRole("ADMIN", session!.user.role);
  if (roleError) return roleError;

  const body = await req.json();
  const parsed = createFeeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const fee = await prisma.feeDefinition.create({ data: parsed.data });
  return NextResponse.json(fee, { status: 201 });
}
