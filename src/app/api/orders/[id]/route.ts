import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "ORDERED", "DELIVERED", "CANCELLED"]),
});

// GET /api/orders/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      catalog: { select: { id: true, name: true, supplier: true } },
      player: { select: { id: true, firstName: true, lastName: true } },
      user: { select: { id: true, name: true, email: true } },
      items: {
        include: { product: { select: { id: true, name: true, brand: true, equipmentCategory: true, imageUrl: true } } },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Nie znaleziono zamówienia" }, { status: 404 });
  }

  // Parent can only see own orders
  if (session!.user.role === "PARENT" && order.userId !== session!.user.id) {
    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
  }

  return NextResponse.json(order);
}

// PATCH /api/orders/[id] — ADMIN: change status, PARENT: cancel own
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Nie znaleziono zamówienia" }, { status: 404 });
  }

  const role = session!.user.role;

  // Parent can only cancel own SUBMITTED orders
  if (role === "PARENT") {
    if (order.userId !== session!.user.id) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }
    if (body.status !== "CANCELLED" || order.status !== "SUBMITTED") {
      return NextResponse.json({ error: "Możesz anulować tylko złożone zamówienia" }, { status: 400 });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
    return NextResponse.json(updated);
  }

  // ADMIN can change any status
  const roleError = requireRole("ADMIN", role);
  if (roleError) return roleError;

  const parsed = updateStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  return NextResponse.json(updated);
}
