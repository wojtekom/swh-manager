import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";
import { z } from "zod";

const proposalSchema = z.object({
  productId: z.string().min(1, "Wybierz produkt"),
  comment: z.string().optional(),
});

// POST /api/equipment-requests/[id]/proposals — ADMIN proposes a product
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
  const parsed = proposalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const request = await prisma.equipmentRequest.findUnique({ where: { id } });
  if (!request) {
    return NextResponse.json({ error: "Nie znaleziono zapotrzebowania" }, { status: 404 });
  }

  const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } });
  if (!product) {
    return NextResponse.json({ error: "Nie znaleziono produktu" }, { status: 404 });
  }

  const proposal = await prisma.requestProposal.create({
    data: {
      requestId: id,
      productId: parsed.data.productId,
      adminId: session!.user.id,
      comment: parsed.data.comment,
    },
    include: {
      product: {
        select: {
          id: true, name: true, brand: true, price: true,
          equipmentCategory: true, productCode: true, ageGroup: true,
          level: true, sizes: true, description: true,
          catalog: { select: { id: true, name: true, supplier: true } },
        },
      },
      admin: { select: { id: true, name: true } },
    },
  });

  // Update request status to PROPOSED if it was PENDING
  if (request.status === "PENDING") {
    await prisma.equipmentRequest.update({
      where: { id },
      data: { status: "PROPOSED", reviewedAt: new Date(), reviewedBy: session!.user.id },
    });
  }

  return NextResponse.json(proposal, { status: 201 });
}

// DELETE /api/equipment-requests/[id]/proposals?proposalId=xxx — ADMIN removes proposal
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole("ADMIN", session!.user.role);
  if (roleError) return roleError;

  const proposalId = req.nextUrl.searchParams.get("proposalId");
  if (!proposalId) {
    return NextResponse.json({ error: "Brak proposalId" }, { status: 400 });
  }

  await prisma.requestProposal.delete({ where: { id: proposalId } });

  return NextResponse.json({ success: true });
}
