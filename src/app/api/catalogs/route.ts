import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(2, "Nazwa min. 2 znaki"),
  supplier: z.string().min(1, "Podaj dostawcę"),
  description: z.string().optional(),
  opensAt: z.string().nullable().optional(),
  closesAt: z.string().nullable().optional(),
});

// GET /api/catalogs — ADMIN: all, PARENT: only OPEN
export async function GET() {
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const role = session!.user.role;
  const where = role === "ADMIN" ? {} : { status: "OPEN" as const };

  const catalogs = await prisma.catalog.findMany({
    where,
    include: {
      _count: { select: { products: true, orders: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(catalogs);
}

// POST /api/catalogs — ADMIN only
export async function POST(req: NextRequest) {
  const { session, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole("ADMIN", session!.user.role);
  if (roleError) return roleError;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const catalog = await prisma.catalog.create({
    data: {
      ...parsed.data,
      opensAt: parsed.data.opensAt ? new Date(parsed.data.opensAt) : null,
      closesAt: parsed.data.closesAt ? new Date(parsed.data.closesAt) : null,
    },
  });

  return NextResponse.json(catalog, { status: 201 });
}
