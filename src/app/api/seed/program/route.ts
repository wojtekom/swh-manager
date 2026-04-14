import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError } from "@/lib/auth-helpers";
import { recalcPlanDirect } from "@/lib/cascade-plans";
import { DRILLS, TRAINING_PLANS, HLH_TOURNAMENTS, CAMPS } from "../../../../../prisma/seed-data";

// Mapowanie kategorii seed → hierarchia
const CATEGORY_GROUPS = [
  { category: "U8", label: "Mikrus / Przedszkolna", hlhLabel: "Mikrus U8" },
  { category: "U10", label: "Mini Hokej", hlhLabel: "Mini Hokej U12" },
  { category: "U14", label: "Młodzik", hlhLabel: "Młodzik U15" },
];

// POST /api/seed/program — import programu szkoleniowego SWH 2025/2026 z hierarchią
export async function POST() {
  const { session, error } = await getSessionOrError();
  if (error) return error;
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
  }

  const stats = { drills: 0, plans: 0, sessions: 0, tournaments: 0, camps: 0 };

  try {
    const userId = session.user.id;

    // 1. Ćwiczenia
    for (const drill of DRILLS) {
      const existing = await prisma.drill.findFirst({ where: { name: drill.name } });
      if (existing) continue;
      await prisma.drill.create({
        data: {
          name: drill.name,
          category: drill.category as any,
          description: drill.description,
          difficulty: drill.difficulty,
          ageGroups: drill.ageGroups,
          duration: drill.duration,
          createdById: userId,
        },
      });
      stats.drills++;
    }

    // 2. Plany treningowe z hierarchią: ROCZNY → SEZONOWY → TYGODNIOWY
    for (const group of CATEGORY_GROUPS) {
      const yearlyName = `Program roczny ${group.label} — SWH 2025/2026`;
      let yearlyPlan = await prisma.trainingPlan.findFirst({ where: { name: yearlyName } });

      if (!yearlyPlan) {
        yearlyPlan = await prisma.trainingPlan.create({
          data: {
            name: yearlyName,
            description: `Roczny program szkoleniowy SWH Siedlce dla grupy ${group.label}. Sezon 2025/2026: faza lodowa (październik–kwiecień) + faza letnia/rolkowa (maj–wrzesień). Programy: Łączą Nas Rolki, HLH Liga, plan aerobowy i wydolnościowy SWH.`,
            category: group.category as any,
            planType: "YEARLY",
            season: "2025/2026",
            periodStart: new Date("2025-10-01"),
            periodEnd: new Date("2026-09-30"),
            createdById: userId,
          },
        });
        stats.plans++;
      }

      // Faza I — Sezon lodowy (SEASONAL)
      const phase1Plans = TRAINING_PLANS.filter(
        (p) => p.category === group.category && p.name.includes("Faza I")
      );
      for (const plan of phase1Plans) {
        let seasonalPlan = await prisma.trainingPlan.findFirst({ where: { name: plan.name } });
        if (!seasonalPlan) {
          seasonalPlan = await prisma.trainingPlan.create({
            data: {
              name: plan.name,
              description: plan.description,
              category: plan.category as any,
              planType: "SEASONAL",
              parentPlanId: yearlyPlan.id,
              season: "lodowy-2025/2026",
              periodStart: new Date("2025-10-01"),
              periodEnd: new Date("2026-04-30"),
              createdById: userId,
            },
          });
          stats.plans++;
        }

        // Sesje treningowe
        for (const s of plan.sessions) {
          const existing = await prisma.trainingSession.findFirst({
            where: { planId: seasonalPlan.id, title: s.title },
          });
          if (existing) continue;
          await prisma.trainingSession.create({
            data: {
              planId: seasonalPlan.id,
              title: s.title,
              objectives: s.objectives,
              duration: s.duration,
              order: s.order,
            },
          });
          stats.sessions++;
        }

        // Przelicz statystyki
        await recalcPlanDirect(seasonalPlan.id);
      }

      // Faza II — Sezon letni/rolkowy (SEASONAL)
      const phase2Plans = TRAINING_PLANS.filter(
        (p) => p.category === group.category && p.name.includes("Faza II")
      );
      for (const plan of phase2Plans) {
        let seasonalPlan = await prisma.trainingPlan.findFirst({ where: { name: plan.name } });
        if (!seasonalPlan) {
          seasonalPlan = await prisma.trainingPlan.create({
            data: {
              name: plan.name,
              description: plan.description,
              category: plan.category as any,
              planType: "SEASONAL",
              parentPlanId: yearlyPlan.id,
              season: "rolkowy-2026",
              periodStart: new Date("2026-05-01"),
              periodEnd: new Date("2026-09-30"),
              createdById: userId,
            },
          });
          stats.plans++;
        }

        for (const s of plan.sessions) {
          const existing = await prisma.trainingSession.findFirst({
            where: { planId: seasonalPlan.id, title: s.title },
          });
          if (existing) continue;
          await prisma.trainingSession.create({
            data: {
              planId: seasonalPlan.id,
              title: s.title,
              objectives: s.objectives,
              duration: s.duration,
              order: s.order,
            },
          });
          stats.sessions++;
        }

        await recalcPlanDirect(seasonalPlan.id);
      }

      // Przelicz plan roczny
      await recalcPlanDirect(yearlyPlan.id);
    }

    // 3. Turnieje HLH
    for (const t of HLH_TOURNAMENTS) {
      const existing = await prisma.tournament.findFirst({
        where: { name: t.name, startDate: new Date(t.startDate) },
      });
      if (existing) continue;

      await prisma.tournament.create({
        data: {
          name: t.name,
          location: t.location,
          startDate: new Date(t.startDate),
          endDate: t.endDate ? new Date(t.endDate) : null,
          category: t.category as any,
          description: t.description,
          status: new Date(t.startDate) < new Date() ? "COMPLETED" : "PLANNED",
          createdById: userId,
        },
      });
      stats.tournaments++;
    }

    // 4. Obozy
    for (const c of CAMPS) {
      const existing = await prisma.camp.findFirst({ where: { name: c.name } });
      if (existing) continue;

      await prisma.camp.create({
        data: {
          name: c.name,
          type: c.type as any,
          location: c.location,
          startDate: new Date(c.startDate),
          endDate: new Date(c.endDate),
          category: c.category as any,
          description: c.description,
          maxSpots: c.maxSpots,
          cost: c.cost,
          status: "PLANNED",
          createdById: userId,
        },
      });
      stats.camps++;
    }

    return NextResponse.json({
      message: "Import programu szkoleniowego SWH 2025/2026 zakończony pomyślnie",
      stats,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET /api/seed/program — status importu
export async function GET() {
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const [drills, plans, sessions, tournaments, camps] = await Promise.all([
    prisma.drill.count(),
    prisma.trainingPlan.count(),
    prisma.trainingSession.count(),
    prisma.tournament.count(),
    prisma.camp.count(),
  ]);

  return NextResponse.json({
    current: { drills, plans, sessions, tournaments, camps },
    available: {
      drills: DRILLS.length,
      plans: TRAINING_PLANS.length,
      sessions: TRAINING_PLANS.reduce((sum, p) => sum + p.sessions.length, 0),
      tournaments: HLH_TOURNAMENTS.length,
      camps: CAMPS.length,
    },
  });
}
