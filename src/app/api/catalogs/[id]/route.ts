import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  supplier: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["DRAFT", "OPEN", "CLOSED", "COMPLETED"]).optional(),
  opensAt: z.string().nullable().optional(),
  closesAt: z.string().nullable().optional(),
});

// GET /api/catalogs/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const { id } = await params;

  const catalog = await prisma.catalog.findUnique({
    where: { id },
    include: {
      products: { where: { isActive: true }, orderBy: { equipmentCategory: "asc" } },
      _count: { select: { orders: true } },
    },
  });

  if (!catalog) {
    return NextResponse.json({ error: "Nie znaleziono katalogu" }, { status: 404 });
  }

  return NextResponse.json(catalog);
}

// PATCH /api/catalogs/[id] — ADMIN only
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole("ADMIN", session!.user.role);
  if (roleError) return roleError;

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.opensAt !== undefined) {
    data.opensAt = parsed.data.opensAt ? new Date(parsed.data.opensAt) : null;
  }
  if (parsed.data.closesAt !== undefined) {
    data.closesAt = parsed.data.closesAt ? new Date(parsed.data.closesAt) : null;
  }

  const catalog = await prisma.catalog.update({ where: { id }, data });

  return NextResponse.json(catalog);
}

// DELETE /api/catalogs/[id] — ADMIN only
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole("ADMIN", session!.user.role);
  if (roleError) return roleError;

  const { id } = await params;

  await prisma.catalog.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
