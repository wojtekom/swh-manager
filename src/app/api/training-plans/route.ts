import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  category: z.enum(["U8", "U10", "U12", "U14", "U16", "U18", "SENIOR"]),
  planType: z.enum(["YEARLY", "SEASONAL", "MONTHLY", "WEEKLY"]).optional(),
  parentPlanId: z.string().nullable().optional(),
  season: z.string().nullable().optional(),
  periodStart: z.string().nullable().optional(),
  periodEnd: z.string().nullable().optional(),
  groupId: z.string().nullable().optional(),
});

// GET /api/training-plans
export async function GET(req: NextRequest) {
  const { error } = await getSessionOrError();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const parentId = searchParams.get("parentId");
  const planType = searchParams.get("planType");
  const category = searchParams.get("category");

  const where: Record<string, unknown> = {};
  if (parentId === "root") where.parentPlanId = null;
  else if (parentId) where.parentPlanId = parentId;
  if (planType) where.planType = planType;
  if (category) where.category = category;

  const plans = await prisma.trainingPlan.findMany({
    where,
    include: {
      group: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      parentPlan: { select: { id: true, name: true, planType: true } },
      _count: { select: { sessions: true, childPlans: true } },
    },
    orderBy: [{ planType: "asc" }, { periodStart: "asc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json(plans);
}

// POST /api/training-plans
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

  const plan = await prisma.trainingPlan.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      category: parsed.data.category,
      planType: parsed.data.planType || "WEEKLY",
      parentPlanId: parsed.data.parentPlanId || null,
      season: parsed.data.season || null,
      periodStart: parsed.data.periodStart ? new Date(parsed.data.periodStart) : null,
      periodEnd: parsed.data.periodEnd ? new Date(parsed.data.periodEnd) : null,
      groupId: parsed.data.groupId || null,
      createdById: session!.user.id,
    },
  });

  return NextResponse.json(plan, { status: 201 });
}
