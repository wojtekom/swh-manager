import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError } from "@/lib/auth-helpers";

// GET /api/conversations/[id] — szczegóły konwersacji
export async function GET(
  _req: NextRequest,
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

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      group: { select: { id: true, name: true, category: true } },
      participants: {
        include: { user: { select: { id: true, name: true, role: true } } },
      },
    },
  });

  return NextResponse.json(conversation);
}

// DELETE /api/conversations/[id] — usuń konwersację (tylko admin)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { session, error } = await getSessionOrError();
  if (error) return error;

  if (session!.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
  }

  await prisma.conversation.delete({ where: { id } });
  return NextResponse.json({ message: "Usunięto" });
}
