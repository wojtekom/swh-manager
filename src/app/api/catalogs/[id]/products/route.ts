import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana"),
  description: z.string().optional(),
  brand: z.string().min(1, "Podaj markę"),
  equipmentCategory: z.enum(["HELMET", "SKATES", "ROLLER_SKATES", "STICK", "GLOVES", "PADS", "JERSEY", "PANTS", "BAG", "GOALIE_GEAR", "NECK_GUARD", "MOUTHGUARD", "TRAINING_AID", "ACCESSORY", "OTHER"]),
  productCode: z.string().optional(),
  ageGroup: z.string().optional(),
  level: z.string().optional(),
  price: z.number().min(0, "Cena nie może być ujemna"),
  imageUrl: z.string().optional(),
  sizes: z.array(z.string().min(1)).min(1, "Podaj przynajmniej jeden rozmiar"),
  sizeChartUrl: z.string().optional(),
});

// GET /api/catalogs/[id]/products
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const { id } = await params;

  const products = await prisma.product.findMany({
    where: { catalogId: id, isActive: true },
    orderBy: [{ equipmentCategory: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(products);
}

// POST /api/catalogs/[id]/products — ADMIN only
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole("ADMIN", session!.user.role);
  if (roleError) return roleError;

  const { id } = await params;
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: { ...parsed.data, catalogId: id },
  });

  return NextResponse.json(product, { status: 201 });
}

// PUT /api/catalogs/[id]/products — bulk import (ADMIN only)
const bulkSchema = z.object({
  products: z.array(createSchema).min(1, "Podaj przynajmniej jeden produkt").max(100),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole("ADMIN", session!.user.role);
  if (roleError) return roleError;

  const { id } = await params;
  const body = await req.json();
  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const created = await prisma.product.createMany({
    data: parsed.data.products.map((p) => ({ ...p, catalogId: id })),
  });

  return NextResponse.json({ count: created.count }, { status: 201 });
}
