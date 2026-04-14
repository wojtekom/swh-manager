import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";
import { z } from "zod";

const createSchema = z.object({
  catalogId: z.string().min(1),
  playerId: z.string().min(1, "Wybierz zawodnika"),
  items: z.array(z.object({
    productId: z.string().min(1),
    size: z.string().min(1, "Wybierz rozmiar"),
    quantity: z.number().int().min(1).max(10),
  })).min(1, "Dodaj przynajmniej jeden produkt"),
});

// GET /api/orders — ADMIN: all, PARENT: own orders
export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const role = session!.user.role;
  const userId = session!.user.id;
  const { searchParams } = new URL(req.url);
  const catalogId = searchParams.get("catalogId");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (role === "PARENT") where.userId = userId;
  if (catalogId) where.catalogId = catalogId;
  if (status) where.status = status;

  const orders = await prisma.order.findMany({
    where,
    include: {
      catalog: { select: { id: true, name: true, supplier: true } },
      player: { select: { id: true, firstName: true, lastName: true } },
      user: { select: { id: true, name: true } },
      items: {
        include: { product: { select: { id: true, name: true, brand: true, equipmentCategory: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}

// POST /api/orders — PARENT creates order
export async function POST(req: NextRequest) {
  const { session, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole(["PARENT", "ADMIN"], session!.user.role);
  if (roleError) return roleError;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { catalogId, playerId, items } = parsed.data;

  // Verify catalog is OPEN
  const catalog = await prisma.catalog.findUnique({ where: { id: catalogId } });
  if (!catalog || catalog.status !== "OPEN") {
    return NextResponse.json({ error: "Katalog nie jest otwarty do zamówień" }, { status: 400 });
  }

  // Verify parent owns this player
  if (session!.user.role === "PARENT") {
    const link = await prisma.parentPlayer.findFirst({
      where: { parentId: session!.user.id, playerId },
    });
    if (!link) {
      return NextResponse.json({ error: "Nie masz uprawnień do tego zawodnika" }, { status: 403 });
    }
  }

  // Fetch products to get prices
  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, catalogId },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Validate all products exist
  for (const item of items) {
    if (!productMap.has(item.productId)) {
      return NextResponse.json({ error: `Produkt ${item.productId} nie znaleziony w katalogu` }, { status: 400 });
    }
  }

  // Calculate total
  let totalPrice = 0;
  const orderItems = items.map((item) => {
    const product = productMap.get(item.productId)!;
    const unitPrice = product.price;
    totalPrice += unitPrice * item.quantity;
    return {
      productId: item.productId,
      size: item.size,
      quantity: item.quantity,
      unitPrice,
    };
  });

  const order = await prisma.order.create({
    data: {
      catalogId,
      userId: session!.user.id,
      playerId,
      status: "SUBMITTED",
      totalPrice,
      items: { create: orderItems },
    },
    include: {
      items: { include: { product: true } },
      catalog: { select: { name: true, supplier: true } },
      player: { select: { firstName: true, lastName: true } },
    },
  });

  return NextResponse.json(order, { status: 201 });
}
