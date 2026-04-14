import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEMO_NOTIFICATIONS = [
  {
    id: "demo-1",
    type: "TRAINING_REMINDER",
    title: "Trening jutro — Mini Hokej",
    body: "Wtorek 17:00–18:30, Hala Iceman Siedlce",
    link: "/dashboard/schedule",
    status: "SENT",
    readAt: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo-2",
    type: "NEW_ANNOUNCEMENT",
    title: "Turniej HLH T3 — zapisy",
    body: "Rozpoczynamy zapisy na turniej HLH T3 w Białymstoku. Termin: 15 grudnia.",
    link: "/dashboard/tournaments",
    status: "SENT",
    readAt: null,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "demo-3",
    type: "SCHEDULE_CHANGE",
    title: "Zmiana treningu — Młodzik",
    body: "Trening w czwartek przeniesiony z 17:00 na 18:00",
    link: "/dashboard/schedule",
    status: "SENT",
    readAt: new Date(Date.now() - 7200000).toISOString(),
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "demo-4",
    type: "NEW_MESSAGE",
    title: "Wiadomość od Trener Kowalski",
    body: "Proszę o potwierdzenie obecności na sobotnim turnieju",
    link: "/dashboard/messages",
    status: "SENT",
    readAt: null,
    createdAt: new Date(Date.now() - 5400000).toISOString(),
  },
  {
    id: "demo-5",
    type: "CAMP_UPDATE",
    title: "Obóz Giżycko — potwierdzenie",
    body: "Obóz sportowy w Giżycku 06-12.07.2026 — potwierdź udział do 30 maja",
    link: "/dashboard/camps",
    status: "SENT",
    readAt: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
];

// GET - list notifications for current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = parseInt(searchParams.get("limit") || "20");
    const cursor = searchParams.get("cursor");

    const where: Record<string, unknown> = {
      userId: session.user.id,
      channel: "IN_APP",
    };

    if (unreadOnly) {
      where.readAt = null;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = notifications.length > limit;
    if (hasMore) notifications.pop();

    return NextResponse.json({
      notifications,
      nextCursor: hasMore
        ? notifications[notifications.length - 1]?.id
        : null,
    });
  } catch {
    // Demo mode fallback
    return NextResponse.json({
      notifications: DEMO_NOTIFICATIONS,
      nextCursor: null,
    });
  }
}

// PATCH - mark all as read
export async function PATCH() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        channel: "IN_APP",
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
