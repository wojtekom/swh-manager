import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyActivationToken } from "@/lib/activation-token";
import { hash } from "bcryptjs";
import { z } from "zod";

const setPasswordSchema = z.object({
  token: z.string().min(1, "Token jest wymagany"),
  password: z
    .string()
    .min(8, "Haslo musi miec co najmniej 8 znakow")
    .max(128, "Haslo zbyt dlugie"),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidlowy JSON" }, { status: 400 });
  }

  const parsed = setPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { token, password } = parsed.data;

  const verification = verifyActivationToken(token);
  if (!verification.valid) {
    return NextResponse.json(
      { error: `Nieprawidlowy lub wygasly link: ${verification.reason}` },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: verification.userId },
    select: { id: true, email: true, active: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Konto nie istnieje" }, { status: 404 });
  }
  if (!user.active) {
    return NextResponse.json({ error: "Konto zostalo dezaktywowane" }, { status: 403 });
  }

  const passwordHash = await hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return NextResponse.json({ message: "Haslo ustawione pomyslnie", email: user.email });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ valid: false, reason: "Brak tokena" }, { status: 400 });
  }

  const verification = verifyActivationToken(token);
  if (!verification.valid) {
    return NextResponse.json({ valid: false, reason: verification.reason });
  }

  const user = await prisma.user.findUnique({
    where: { id: verification.userId },
    select: { email: true, name: true, active: true },
  });

  if (!user || !user.active) {
    return NextResponse.json({ valid: false, reason: "Konto nie jest aktywne" });
  }

  return NextResponse.json({ valid: true, email: user.email, name: user.name });
}
