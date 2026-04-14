import { prisma } from "@/lib/prisma";

/**
 * Kaskadowa korekta planów nadrzędnych.
 * Gdy zmienia się plan tygodniowy → aktualizuj miesięczny → sezonowy → roczny.
 *
 * Zbiera statystyki (totalSessions, totalDuration) i podsumowanie
 * ze wszystkich planów podrzędnych, rekurencyjnie w górę hierarchii.
 */
export async function cascadeUpdateParents(planId: string): Promise<void> {
  const plan = await prisma.trainingPlan.findUnique({
    where: { id: planId },
    select: { parentPlanId: true },
  });

  if (!plan?.parentPlanId) return;

  await recalcPlan(plan.parentPlanId);
}

async function recalcPlan(planId: string): Promise<void> {
  // Pobierz wszystkie podplany
  const childPlans = await prisma.trainingPlan.findMany({
    where: { parentPlanId: planId },
    select: {
      id: true,
      name: true,
      planType: true,
      totalSessions: true,
      totalDuration: true,
      periodStart: true,
      periodEnd: true,
    },
    orderBy: { periodStart: "asc" },
  });

  // Pobierz sesje bezpośrednio przypisane do tego planu
  const directSessions = await prisma.trainingSession.aggregate({
    where: { planId },
    _count: true,
    _sum: { duration: true },
  });

  // Podsumuj statystyki z podplanów + własnych sesji
  const childTotalSessions = childPlans.reduce((sum, c) => sum + c.totalSessions, 0);
  const childTotalDuration = childPlans.reduce((sum, c) => sum + c.totalDuration, 0);

  const totalSessions = (directSessions._count || 0) + childTotalSessions;
  const totalDuration = (directSessions._sum.duration || 0) + childTotalDuration;

  // Generuj podsumowanie z podplanów
  const summaryParts: string[] = [];
  for (const child of childPlans) {
    const period = child.periodStart
      ? `${child.periodStart.toLocaleDateString("pl-PL", { month: "short" })}` +
        (child.periodEnd ? `–${child.periodEnd.toLocaleDateString("pl-PL", { month: "short" })}` : "")
      : "";
    summaryParts.push(
      `${child.name}${period ? ` (${period})` : ""}: ${child.totalSessions} sesji, ${child.totalDuration} min`
    );
  }

  const summary = summaryParts.length > 0
    ? summaryParts.join("\n")
    : `${totalSessions} sesji, ${totalDuration} min łącznie`;

  // Zaktualizuj plan
  const updated = await prisma.trainingPlan.update({
    where: { id: planId },
    data: {
      totalSessions,
      totalDuration,
      summary,
    },
    select: { parentPlanId: true },
  });

  // Rekurencja w górę
  if (updated.parentPlanId) {
    await recalcPlan(updated.parentPlanId);
  }
}

/**
 * Przelicz statystyki planu na podstawie jego bezpośrednich sesji (bez podplanów).
 * Wywoływane po dodaniu/edycji/usunięciu sesji.
 */
export async function recalcPlanDirect(planId: string): Promise<void> {
  const childPlans = await prisma.trainingPlan.findMany({
    where: { parentPlanId: planId },
    select: { totalSessions: true, totalDuration: true },
  });

  const directSessions = await prisma.trainingSession.aggregate({
    where: { planId },
    _count: true,
    _sum: { duration: true },
  });

  const childTotalSessions = childPlans.reduce((sum, c) => sum + c.totalSessions, 0);
  const childTotalDuration = childPlans.reduce((sum, c) => sum + c.totalDuration, 0);

  await prisma.trainingPlan.update({
    where: { id: planId },
    data: {
      totalSessions: (directSessions._count || 0) + childTotalSessions,
      totalDuration: (directSessions._sum.duration || 0) + childTotalDuration,
    },
  });

  // Kaskada w górę
  await cascadeUpdateParents(planId);
}
