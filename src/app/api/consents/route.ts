import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError } from "@/lib/auth-helpers";
import { z } from "zod";

// GET /api/consents — sprawdź status zgód
export async function GET() {
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: {
      consentImageAt: true,
      consentTravelAt: true,
      consentHealthAt: true,
      consentGoodPracticeAt: true,
      consentDataAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Nie znaleziono" }, { status: 404 });
  }

  const allAccepted = !!(
    user.consentImageAt &&
    user.consentTravelAt &&
    user.consentHealthAt &&
    user.consentGoodPracticeAt &&
    user.consentDataAt
  );

  return NextResponse.json({ ...user, allAccepted });
}

const acceptSchema = z.object({
  consentImage: z.boolean().refine((v) => v, "Wymagana zgoda"),
  consentTravel: z.boolean().refine((v) => v, "Wymagana zgoda"),
  consentHealth: z.boolean().refine((v) => v, "Wymagana zgoda"),
  consentGoodPractice: z.boolean().refine((v) => v, "Wymagana zgoda"),
  consentData: z.boolean().refine((v) => v, "Wymagana zgoda"),
});

// POST /api/consents — zaakceptuj wszystkie zgody
export async function POST(req: NextRequest) {
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const body = await req.json();
  const parsed = acceptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const now = new Date();
  await prisma.user.update({
    where: { id: session!.user.id },
    data: {
      consentImageAt: now,
      consentTravelAt: now,
      consentHealthAt: now,
      consentGoodPracticeAt: now,
      consentDataAt: now,
    },
  });

  return NextResponse.json({ success: true, acceptedAt: now });
}
