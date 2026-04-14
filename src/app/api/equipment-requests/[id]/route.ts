import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "FULFILLED", "PROPOSED", "ACCEPTED"]).optional(),
  adminNotes: z.string().optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  playerName: z.string().optional(),
  equipmentCategory: z.enum(["HELMET", "SKATES", "ROLLER_SKATES", "STICK", "GLOVES", "PADS", "JERSEY", "PANTS", "BAG", "GOALIE_GEAR", "NECK_GUARD", "MOUTHGUARD", "TRAINING_AID", "ACCESSORY", "OTHER"]).optional(),
  quantity: z.number().int().min(1).max(100).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  minBudget: z.number().min(0).optional(),
  maxBudget: z.number().min(0).optional(),
  notes: z.string().optional(),
});

// PATCH /api/equipment-requests/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole(["ADMIN", "COACH", "PARENT"], session!.user.role);
  if (roleError) return roleError;

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.equipmentRequest.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Nie znaleziono" }, { status: 404 });
  }

  const role = session!.user.role;

  // PARENT can only edit own PENDING requests or accept proposals (PROPOSED → ACCEPTED)
  if (role === "PARENT") {
    if (existing.userId !== session!.user.id) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }
    if (parsed.data.status === "ACCEPTED" && existing.status === "PROPOSED") {
      // Parent accepts admin's proposal
      const updated = await prisma.equipmentRequest.update({
        where: { id },
        data: { status: "ACCEPTED" },
      });
      return NextResponse.json(updated);
    }
    if (existing.status !== "PENDING") {
      return NextResponse.json({ error: "Można edytować tylko oczekujące zapotrzebowania" }, { status: 400 });
    }
    // Remove admin-only fields
    delete (parsed.data as Record<string, unknown>).status;
    delete (parsed.data as Record<string, unknown>).adminNotes;
  }

  // Coach can only edit own PENDING requests (not status/adminNotes)
  if (role === "COACH") {
    if (existing.userId !== session!.user.id) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }
    if (existing.status !== "PENDING") {
      return NextResponse.json({ error: "Można edytować tylko oczekujące zapotrzebowania" }, { status: 400 });
    }
    delete (parsed.data as Record<string, unknown>).status;
    delete (parsed.data as Record<string, unknown>).adminNotes;
  }

  // Admin reviewing — set reviewedAt/By
  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status && role === "ADMIN") {
    data.reviewedAt = new Date();
    data.reviewedBy = session!.user.id;
  }

  const updated = await prisma.equipmentRequest.update({ where: { id }, data });

  return NextResponse.json(updated);
}

// DELETE /api/equipment-requests/[id] — COACH/PARENT: own pending, ADMIN: any
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole(["ADMIN", "COACH", "PARENT"], session!.user.role);
  if (roleError) return roleError;

  const { id } = await params;

  const existing = await prisma.equipmentRequest.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Nie znaleziono" }, { status: 404 });
  }

  if (session!.user.role === "COACH" || session!.user.role === "PARENT") {
    if (existing.userId !== session!.user.id || existing.status !== "PENDING") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }
  }

  await prisma.equipmentRequest.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
