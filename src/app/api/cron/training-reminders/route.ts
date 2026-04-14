import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NOTIFICATION_CONFIG } from "@/lib/notifications/config";
import { triggerTrainingReminder } from "@/lib/notifications/triggers";

const DAYS_PL = [
  "Niedziela",
  "Poniedziałek",
  "Wtorek",
  "Środa",
  "Czwartek",
  "Piątek",
  "Sobota",
];

export async function POST(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${NOTIFICATION_CONFIG.cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find schedules that have training tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayOfWeek = tomorrow.getDay();

    const schedules = await prisma.schedule.findMany({
      where: {
        dayOfWeek,
        recurring: true,
        active: true,
      },
    });

    let sent = 0;
    for (const schedule of schedules) {
      await triggerTrainingReminder(schedule.id);
      sent++;
    }

    return NextResponse.json({
      success: true,
      message: `Wysłano przypomnienia dla ${sent} treningów (${DAYS_PL[dayOfWeek]})`,
    });
  } catch (error) {
    console.error("[CRON] Training reminders failed:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
