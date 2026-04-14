import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError } from "@/lib/auth-helpers";
import { z } from "zod";

const responseSchema = z.object({
  response: z.enum(["yes", "no", "maybe"]),
  comment: z.string().optional(),
});

// POST /api/announcements/[id]/respond — RSVP
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const body = await req.json();
  const parsed = responseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await prisma.announcementResponse.upsert({
    where: {
      announcementId_userId: {
        announcementId: id,
        userId: session!.user.id,
      },
    },
    update: { response: parsed.data.response, comment: parsed.data.comment },
    create: {
      announcementId: id,
      userId: session!.user.id,
      response: parsed.data.response,
      comment: parsed.data.comment,
    },
  });

  return NextResponse.json(result);
}
