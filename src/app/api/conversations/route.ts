import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError } from "@/lib/auth-helpers";
import { z } from "zod";

// GET /api/conversations — lista konwersacji użytkownika
export async function GET() {
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const conversations = await prisma.conversation.findMany({
    where: {
      participants: { some: { userId: session!.user.id } },
    },
    include: {
      group: { select: { id: true, name: true, category: true } },
      participants: {
        include: { user: { select: { id: true, name: true, role: true } } },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { sender: { select: { id: true, name: true } } },
      },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Dodaj liczbę nieprzeczytanych wiadomości
  const result = conversations.map((conv) => {
    const myParticipant = conv.participants.find(
      (p) => p.userId === session!.user.id
    );
    return {
      ...conv,
      unreadCount: 0, // będzie obliczone po stronie klienta lub w osobnym query
      lastReadAt: myParticipant?.lastReadAt,
    };
  });

  return NextResponse.json(result);
}

const createSchema = z.object({
  name: z.string().optional(),
  isGroup: z.boolean().default(false),
  groupId: z.string().nullable().optional(),
  participantIds: z.array(z.string()).min(1, "Min. 1 uczestnik"),
});

// POST /api/conversations — nowa konwersacja
export async function POST(req: NextRequest) {
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, isGroup, groupId, participantIds } = parsed.data;

  // Dla konwersacji 1:1 sprawdź czy już istnieje
  if (!isGroup && participantIds.length === 1) {
    const existing = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { participants: { some: { userId: session!.user.id } } },
          { participants: { some: { userId: participantIds[0] } } },
        ],
      },
    });
    if (existing) {
      return NextResponse.json({ id: existing.id, existing: true });
    }
  }

  const allParticipants = [...new Set([session!.user.id, ...participantIds])];

  const conversation = await prisma.conversation.create({
    data: {
      name: name || null,
      isGroup,
      groupId: groupId || null,
      participants: {
        create: allParticipants.map((userId) => ({ userId })),
      },
    },
  });

  return NextResponse.json(conversation, { status: 201 });
}
