import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";
import { z } from "zod";
import { sendNotification } from "@/lib/notifications/sender";

const broadcastSchema = z.object({
  content: z.string().min(1, "Treść jest wymagana").max(2000),
  target: z.enum(["ALL", "GROUP"]),
  groupId: z.string().optional(),
  channels: z.object({
    inApp: z.boolean().default(true),
    sms: z.boolean().default(false),
  }).default({ inApp: true, sms: false }),
});

// POST /api/broadcast — ADMIN/COACH wysyła wiadomość masową
export async function POST(req: NextRequest) {
  const { session, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole(["ADMIN", "COACH"], session!.user.role);
  if (roleError) return roleError;

  const body = await req.json();
  const parsed = broadcastSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { content, target, groupId, channels } = parsed.data;

  // Determine recipients
  let recipientIds: string[] = [];

  if (target === "GROUP" && groupId) {
    // Get all parents of players in this group + coaches
    const members = await prisma.groupMember.findMany({
      where: { groupId },
      include: {
        player: {
          include: {
            parents: { select: { parentId: true } },
          },
        },
      },
    });

    const parentIds = new Set<string>();
    for (const member of members) {
      for (const pp of member.player.parents) {
        parentIds.add(pp.parentId);
      }
    }

    // Add group coach
    const group = await prisma.trainingGroup.findUnique({
      where: { id: groupId },
      select: { coachId: true },
    });
    if (group?.coachId) parentIds.add(group.coachId);

    recipientIds = Array.from(parentIds);
  } else {
    // ALL active users
    const users = await prisma.user.findMany({
      where: { active: true },
      select: { id: true },
    });
    recipientIds = users.map((u) => u.id);
  }

  // Exclude sender
  recipientIds = recipientIds.filter((id) => id !== session!.user.id);

  if (recipientIds.length === 0) {
    return NextResponse.json({ error: "Brak odbiorców" }, { status: 400 });
  }

  // Create a group conversation with all recipients
  const allParticipants = [session!.user.id, ...recipientIds];

  let groupName: string;
  if (target === "GROUP" && groupId) {
    const group = await prisma.trainingGroup.findUnique({
      where: { id: groupId },
      select: { name: true },
    });
    groupName = `Wiadomość do: ${group?.name || "Grupa"}`;
  } else {
    groupName = "Wiadomość do wszystkich";
  }

  const conversation = await prisma.conversation.create({
    data: {
      name: groupName,
      isGroup: true,
      groupId: target === "GROUP" ? groupId : null,
      participants: {
        create: allParticipants.map((userId) => ({ userId })),
      },
    },
  });

  // Send the message
  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: session!.user.id,
      content,
    },
  });

  // Update conversation timestamp
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });

  // Send notifications to all recipients
  let sentCount = 0;
  for (const userId of recipientIds) {
    try {
      // In-app notification (always)
      if (channels.inApp) {
        await sendNotification({
          userId,
          type: "NEW_MESSAGE",
          title: `Wiadomość od ${session!.user.name}`,
          body: content.substring(0, 150),
          link: "/dashboard/messages",
          metadata: { messageId: message.id, conversationId: conversation.id, broadcast: true },
        });
      }

      // SMS notification (if requested and user has phone)
      if (channels.sms) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { phone: true },
        });
        if (user?.phone) {
          const { sendSms } = await import("@/lib/notifications/channels/sms");
          await sendSms(user.phone, `SWH: ${content.substring(0, 140)}`, userId);
        }
      }

      sentCount++;
    } catch (error) {
      console.error(`[BROADCAST] Failed for user ${userId}:`, error);
    }
  }

  return NextResponse.json({
    conversationId: conversation.id,
    messageId: message.id,
    recipientCount: recipientIds.length,
    sentCount,
  }, { status: 201 });
}
