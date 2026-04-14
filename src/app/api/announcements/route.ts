import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(3, "Tytuł min. 3 znaki"),
  content: z.string().min(5, "Treść min. 5 znaków"),
  type: z.enum(["INFO", "TRAINING", "MATCH", "RSVP"]).default("INFO"),
  groupId: z.string().nullable().optional(),
  pinned: z.boolean().default(false),
});

// GET /api/announcements
export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get("groupId");

  const where: Record<string, unknown> = {};
  if (groupId) where.groupId = groupId;

  const announcements = await prisma.announcement.findMany({
    where,
    include: {
      author: { select: { id: true, name: true, role: true } },
      group: { select: { id: true, name: true, category: true } },
      responses: {
        include: { user: { select: { id: true, name: true } } },
      },
      _count: { select: { responses: true } },
    },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(announcements);
}

// POST /api/announcements
export async function POST(req: NextRequest) {
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const roleError = requireRole(["ADMIN", "COACH"], session!.user.role);
  if (roleError) return roleError;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const announcement = await prisma.announcement.create({
    data: {
      ...parsed.data,
      groupId: parsed.data.groupId || null,
      authorId: session!.user.id,
    },
  });

  return NextResponse.json(announcement, { status: 201 });
}
