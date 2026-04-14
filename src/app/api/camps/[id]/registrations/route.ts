import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";
import { z } from "zod";

const registerSchema = z.object({
  playerIds: z.array(z.string()).min(1, "Wybierz min. 1 zawodnika"),
  parentNotes: z.string().optional(),
});

const updateSchema = z.object({
  registrationId: z.string(),
  status: z.enum(["REGISTERED", "CONFIRMED", "WAITLIST", "CANCELLED"]).optional(),
  paidAmount: z.number().min(0).optional(),
  adminNotes: z.string().optional(),
});

// GET /api/camps/[id]/registrations
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await getSessionOrError();
  if (error) return error;

  const registrations = await prisma.campRegistration.findMany({
    where: { campId: id },
    include: {
      player: {
        select: { id: true, firstName: true, lastName: true, category: true, jerseyNum: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(registrations);
}

// POST /api/camps/[id]/registrations — zapisz zawodników
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const body = await req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Sprawdź limit miejsc
  const camp = await prisma.camp.findUnique({
    where: { id },
    include: { _count: { select: { registrations: true } } },
  });

  if (!camp) {
    return NextResponse.json({ error: "Obóz nie znaleziony" }, { status: 404 });
  }

  const currentCount = camp._count.registrations;
  const maxSpots = camp.maxSpots;

  const results = await Promise.allSettled(
    parsed.data.playerIds.map((playerId, i) => {
      const isWaitlist = maxSpots ? (currentCount + i) >= maxSpots : false;
      return prisma.campRegistration.create({
        data: {
          campId: id,
          playerId,
          status: isWaitlist ? "WAITLIST" : "REGISTERED",
          parentNotes: parsed.data.parentNotes || null,
        },
      });
    })
  );

  const created = results.filter((r) => r.status === "fulfilled").length;
  return NextResponse.json({ created }, { status: 201 });
}

// PUT /api/camps/[id]/registrations — aktualizacja statusu/płatności
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole(["ADMIN", "COACH"], session!.user.role);
  if (roleError) return roleError;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { registrationId, ...data } = parsed.data;
  const registration = await prisma.campRegistration.update({
    where: { id: registrationId },
    data,
  });

  return NextResponse.json(registration);
}

// DELETE — usuń rejestrację
export async function DELETE(req: NextRequest) {
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const registrationId = searchParams.get("registrationId");

  if (!registrationId) {
    return NextResponse.json({ error: "registrationId wymagane" }, { status: 400 });
  }

  await prisma.campRegistration.delete({ where: { id: registrationId } });
  return NextResponse.json({ message: "Usunięto" });
}
