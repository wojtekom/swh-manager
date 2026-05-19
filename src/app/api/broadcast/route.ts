import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";
import { z } from "zod";
import { sendNotification } from "@/lib/notifications/sender";

const broadcastSchema = z.object({
  content: z.string().min(1, "Tresc jest wymagana").max(2000),
  target: z.enum(["ALL", "GROUP"]),
  groupId: z.string().optional(),
  channels: z
    .object({
      inApp: z.boolean().default(true),
      sms: z.boolean().default(false),
    })
    .default({ inApp: true, sms: false }),
});

// POST /api/broadcast - ADMIN/COACH wysyla wiadomosc masowa
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

  // Zbierz identyfikatory odbiorcow (User.id) w Set zeby uniknac duplikatow
  const recipientSet = new Set<string>();

  if (target === "GROUP" && groupId) {
    // 1) Wszyscy rodzice zawodnikow w grupie
    const members = await prisma.groupMember.findMany({
      where: { groupId },
      include: {
        player: {
          include: {
            parents: { select: { parentId: true } },
            playerUser: { select: { userId: true } },
          },
        },
      },
    });

    for (const member of members) {
      // Rodzice (moze byc wielu na zawodnika)
      for (const pp of member.player.parents) {
        recipientSet.add(pp.parentId);
      }
      // Zawodnik 16+ z wlasnym kontem
      if (member.player.playerUser?.userId) {
        recipientSet.add(member.player.playerUser.userId);
      }
    }

    // 2) Trener grupy - TrainingGroup.coachId wskazuje na Coach.id,
    //    a Coach.userId to User.id ktory odbiera wiadomosci.
    //    Wczesniejsza wersja dodawala Coach.id zamiast User.id i trener
    //    nigdy nie dostawal wiadomosci.
    const group = await prisma.trainingGroup.findUnique({
      where: { id: groupId },
      include: { coach: { select: { userId: true } } },
    });
    if (group?.coach?.userId) {
      recipientSet.add(group.coach.userId);
    }
  } else {
    // ALL aktywni uzytkownicy
    const users = await prisma.user.findMany({
      where: { active: true },
      select: { id: true },
    });
    users.forEach((u: { id: string }) => recipientSet.add(u.id));
  }

  // Usun nadawce z listy odbiorcow
  recipientSet.delete(session!.user.id);

  // Filtr koncowy: tylko aktywni uzytkownicy
  const recipientIds = Array.from(recipientSet);
  const activeRecipients = await prisma.user.findMany({
    where: { id: { in: recipientIds }, active: true },
    select: { id: true },
  });
  const finalIds = activeRecipients.map((u: { id: string }) => u.id);

  if (finalIds.length === 0) {
    return NextResponse.json({ error: "Brak odbiorcow" }, { status: 400 });
  }

  // Nazwa konwersacji
  let groupName: string;
  if (target === "GROUP" && groupId) {
    const g = await prisma.trainingGroup.findUnique({
      where: { id: groupId },
      select: { name: true },
    });
    groupName = `Wiadomosc do: ${g?.name || "Grupa"}`;
  } else {
    groupName = "Wiadomosc do wszystkich";
  }

  // Stworz grupowa konwersacje
  const allParticipants = [session!.user.id, ...finalIds];
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

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: session!.user.id,
      content,
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });

  // Wyslij notyfikacje do odbiorcow
  let sentCount = 0;
  const failures: string[] = [];

  for (const userId of finalIds) {
    try {
      if (channels.inApp) {
        await sendNotification({
          userId,
          type: "NEW_MESSAGE",
          title: `Wiadomosc od ${session!.user.name}`,
          body: content.substring(0, 150),
          link: "/dashboard/messages",
          metadata: {
            messageId: message.id,
            conversationId: conversation.id,
            broadcast: true,
          },
        });
      }

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
    } catch (err) {
      failures.push(userId);
      console.error(`[BROADCAST] Nie udalo sie wyslac do ${userId}:`, err);
    }
  }

  return NextResponse.json(
    {
      conversationId: conversation.id,
      messageId: message.id,
      recipientCount: finalIds.length,
      sentCount,
      failedCount: failures.length,
    },
    { status: 201 }
  );
}
