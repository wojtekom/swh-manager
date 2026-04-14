import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "ACCEPTED", "REJECTED"]).optional(),
  adminNotes: z.string().optional(),
});

// PUT /api/recruitment/[id] — aktualizacja statusu (admin/coach)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const roleError = requireRole(["ADMIN", "COACH"], session!.user.role);
  if (roleError) return roleError;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const recruitment = await prisma.recruitment.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(recruitment);
}
