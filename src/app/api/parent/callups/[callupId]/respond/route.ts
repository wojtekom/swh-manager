import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError } from "@/lib/auth-helpers";
import { z } from "zod";

const respondSchema = z.object({
  transportChoice: z.enum(["BUS", "OWN", "NONE"]),
  notes: z.string().max(500).optional(),
});

/**
 * PUT /api/parent/callups/[callupId]/respond
 * Rodzic odpowiada na powołanie zawodnika.
 *   - BUS / OWN  -> status = CONFIRMED (jedzie)
 *   - NONE       -> status = DECLINED (nie jedzie)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ callupId: string }> }
) {
  const { callupId } = await params;
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const userId = session!.user.id;

  // Sprawdź czy zalogowany user jest rodzicem zawodnika z tego powołania
  const callup = await prisma.callup.findUnique({
    where: { id: callupId },
    include: {
      player: { include: { parents: { select: { parentId: true } } } },
    },
  });

  if (!callup) {
    return NextResponse.json({ error: "Powołanie nie istnieje" }, { status: 404 });
  }

  const isParent = callup.player.parents.some(
    (p: { parentId: string }) => p.parentId === userId
  );
  if (!isParent) {
    return NextResponse.json(
      { error: "Brak uprawnień do tego powołania" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const parsed = respondSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const status =
    parsed.data.transportChoice === "NONE" ? "DECLINED" : "CONFIRMED";

  const updated = await prisma.callup.update({
    where: { id: callupId },
    data: {
      status,
      transportChoice: parsed.data.transportChoice,
      notes: parsed.data.notes,
      respondedAt: new Date(),
    },
  });

  return NextResponse.json(updated);
}
