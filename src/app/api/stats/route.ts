import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError } from "@/lib/auth-helpers";

// GET /api/stats — statystyki dla dashboardu
export async function GET() {
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const role = session!.user.role;

  const [
    playersCount,
    paymentsOverdue,
    paymentsPaid,
    recruitmentNew,
  ] = await Promise.all([
    prisma.player.count({ where: { status: "ACTIVE" } }),
    prisma.payment.aggregate({
      where: { status: { in: ["PENDING", "OVERDUE"] } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: { status: "PAID" },
      _sum: { paidAmount: true },
    }),
    prisma.recruitment.count({ where: { status: "NEW" } }),
  ]);

  return NextResponse.json({
    players: playersCount,
    paymentsOverdueCount: paymentsOverdue._count,
    paymentsOverdueAmount: paymentsOverdue._sum.amount || 0,
    paymentsPaidAmount: paymentsPaid._sum.paidAmount || 0,
    recruitmentNew,
  });
}
