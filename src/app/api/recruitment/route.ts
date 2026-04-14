import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";
import { z } from "zod";

const recruitmentSchema = z.object({
  childFirstName: z.string().min(2, "Imię min. 2 znaki"),
  childLastName: z.string().min(2, "Nazwisko min. 2 znaki"),
  childBirthDate: z.string().transform((v) => new Date(v)),
  category: z.enum(["U8", "U10", "U12", "U14", "U16", "U18", "SENIOR"]),
  parentName: z.string().min(3, "Imię i nazwisko rodzica min. 3 znaki"),
  parentEmail: z.string().email("Nieprawidłowy adres email"),
  parentPhone: z.string().min(9, "Numer telefonu min. 9 cyfr"),
  experience: z.string().optional(),
  healthNotes: z.string().optional(),
  howFound: z.string().optional(),
  message: z.string().optional(),
  consentHealth: z.boolean().refine((v) => v, "Wymagana zgoda"),
  consentImage: z.boolean().refine((v) => v, "Wymagana zgoda"),
  consentTravel: z.boolean().refine((v) => v, "Wymagana zgoda"),
  consentGoodPractice: z.boolean().refine((v) => v, "Wymagana zgoda"),
  consentData: z.boolean().refine((v) => v, "Wymagana zgoda"),
});

// POST /api/recruitment — publiczny formularz zgłoszeniowy
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = recruitmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const recruitment = await prisma.recruitment.create({
    data: parsed.data,
  });

  return NextResponse.json(
    { message: "Zgłoszenie zostało wysłane!", id: recruitment.id },
    { status: 201 }
  );
}

// GET /api/recruitment — lista zgłoszeń (admin/coach)
export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const roleError = requireRole(["ADMIN", "COACH"], session!.user.role);
  if (roleError) return roleError;

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (status) where.status = status;

  const recruitments = await prisma.recruitment.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(recruitments);
}
