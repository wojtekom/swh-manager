import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SECRET_KEY = "cleanup-2026-05-13";
const EXPIRES_AT = new Date("2026-05-31T23:59:59Z");

function checkKey(req: NextRequest): NextResponse | null {
  const key = new URL(req.url).searchParams.get("key");
  if (key !== SECRET_KEY) {
    return NextResponse.json(
      { error: "Invalid or missing key" },
      { status: 401 }
    );
  }
  if (new Date() > EXPIRES_AT) {
    return NextResponse.json(
      { error: "Endpoint expired" },
      { status: 410 }
    );
  }
  return null;
}

export async function GET(req: NextRequest) {
  const err = checkKey(req);
  if (err) return err;

  const plans = await prisma.trainingPlan.findMany({
    select: {
      id: true,
      name: true,
      planType: true,
      swhCategory: true,
      category: true,
      parentPlanId: true,
      season: true,
      _count: { select: { sessions: true, childPlans: true } },
    },
    orderBy: [{ planType: "asc" }, { name: "asc" }],
  });

  const [totalSessions, totalSkillFocus, totalDrills] = await Promise.all([
    prisma.trainingSession.count(),
    prisma.sessionSkillFocus.count(),
    prisma.sessionDrill.count(),
  ]);

  return NextResponse.json({
    mode: "DRY RUN - nic nie zostalo skasowane",
    expiresAt: EXPIRES_AT.toISOString(),
    plans: plans.map((p) => ({
      id: p.id.slice(0, 12) + "...",
      name: p.name,
      type: p.planType,
      swh: p.swhCategory,
      category: p.category,
      season: p.season,
      hasParent: !!p.parentPlanId,
      childPlans: p._count.childPlans,
      sessions: p._count.sessions,
    })),
    totals: {
      plans: plans.length,
      sessions: totalSessions,
      sessionSkillFocus: totalSkillFocus,
      sessionDrills: totalDrills,
    },
    note: "Aby skasowac, wywolaj ten URL przez POST.",
  });
}

export async function POST(req: NextRequest) {
  const err = checkKey(req);
  if (err) return err;

  const [beforePlans, beforeSessions, beforeSkillFocus, beforeDrills] =
    await Promise.all([
      prisma.trainingPlan.count(),
      prisma.trainingSession.count(),
      prisma.sessionSkillFocus.count(),
      prisma.sessionDrill.count(),
    ]);

  const planNames = await prisma.trainingPlan.findMany({
    select: {
      name: true,
      planType: true,
      _count: { select: { sessions: true } },
    },
    orderBy: { name: "asc" },
  });

  const result = await prisma.trainingPlan.deleteMany({});

  const [afterPlans, afterSessions, afterSkillFocus, afterDrills] =
    await Promise.all([
      prisma.trainingPlan.count(),
      prisma.trainingSession.count(),
      prisma.sessionSkillFocus.count(),
      prisma.sessionDrill.count(),
    ]);

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    deleted: {
      plans: result.count,
      sessions: beforeSessions - afterSessions,
      sessionSkillFocus: beforeSkillFocus - afterSkillFocus,
      sessionDrills: beforeDrills - afterDrills,
    },
    before: {
      plans: beforePlans,
      sessions: beforeSessions,
      sessionSkillFocus: beforeSkillFocus,
      sessionDrills: beforeDrills,
    },
    after: {
      plans: afterPlans,
      sessions: afterSessions,
      sessionSkillFocus: afterSkillFocus,
      sessionDrills: afterDrills,
    },
    snapshot: planNames.map(
      (p) => `[${p.planType}] ${p.name} (${p._count.sessions} sesji)`
    ),
    nextStep: "Wykonaj seed (Pakiet 2). Po seedzie usun ten plik.",
  });
}
