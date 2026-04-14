import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NOTIFICATION_TYPE_LABELS } from "@/lib/notifications/config";

const ALL_TYPES = Object.keys(NOTIFICATION_TYPE_LABELS);

// GET - get user notification preferences
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prefs = await prisma.notificationPreference.findMany({
      where: { userId: session.user.id },
    });

    const prefsMap = new Map(prefs.map((p) => [p.type, p]));
    const allPrefs = ALL_TYPES.map((type) => {
      const existing = prefsMap.get(type as never);
      return (
        existing || {
          type,
          email: true,
          push: true,
          sms: false,
          inApp: true,
        }
      );
    });

    return NextResponse.json({ preferences: allPrefs });
  } catch {
    // Demo mode defaults
    return NextResponse.json({
      preferences: ALL_TYPES.map((type) => ({
        type,
        email: true,
        push: true,
        sms: false,
        inApp: true,
      })),
    });
  }
}

// PUT - update preferences
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { preferences } = await req.json();

    for (const pref of preferences) {
      await prisma.notificationPreference.upsert({
        where: {
          userId_type: {
            userId: session.user.id,
            type: pref.type,
          },
        },
        update: {
          email: pref.email,
          push: pref.push,
          sms: pref.sms,
          inApp: pref.inApp,
        },
        create: {
          userId: session.user.id,
          type: pref.type,
          email: pref.email,
          push: pref.push,
          sms: pref.sms,
          inApp: pref.inApp,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
