import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError } from "@/lib/auth-helpers";
import { z } from "zod";

// GET /api/conversations/[id]/messages — wiadomości konwersacji
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { session, error } = await getSessionOrError();
  if (error) return error;

  // Sprawdź czy użytkownik jest uczestnikiem
  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId: id,
        userId: session!.user.id,
      },
    },
  });

  if (!participant) {
    return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const take = 50;

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    include: {
      sender: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = messages.length > take;
  if (hasMore) messages.pop();

  // Oznacz jako przeczytane
  await prisma.conversationParticipant.update({
    where: {
      conversationId_userId: {
        conversationId: id,
        userId: session!.user.id,
      },
    },
    data: { lastReadAt: new Date() },
  });

  return NextResponse.json({
    messages: messages.reverse(),
    hasMore,
    nextCursor: hasMore ? messages[0]?.id : null,
  });
}

const messageSchema = z.object({
  content: z.string().min(1, "Wiadomość nie może być pusta").max(2000),
});

// POST /api/conversations/[id]/messages — wyślij wiadomość
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { session, error } = await getSessionOrError();
  if (error) return error;

  // Sprawdź czy użytkownik jest uczestnikiem
  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId: id,
        userId: session!.user.id,
      },
    },
  });

  if (!participant) {
    return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      conversationId: id,
      senderId: session!.user.id,
      content: parsed.data.content,
    },
    include: {
      sender: { select: { id: true, name: true, role: true } },
    },
  });

  // Aktualizuj updatedAt konwersacji
  await prisma.conversation.update({
    where: { id },
    data: { updatedAt: new Date() },
  });

  // Aktualizuj lastReadAt nadawcy
  await prisma.conversationParticipant.update({
    where: {
      conversationId_userId: {
        conversationId: id,
        userId: session!.user.id,
      },
    },
    data: { lastReadAt: new Date() },
  });

  return NextResponse.json(message, { status: 201 });
}
