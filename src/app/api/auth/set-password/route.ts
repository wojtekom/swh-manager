import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyActivationToken } from "@/lib/activation-token";
import { z } from "zod";

const schema = z.object({
  token: z.string().min(10),
  password: z
    .string()
    .min(8, "Haslo musi miec minimum 8 znakow")
    .max(128, "Haslo jest za dlugie"),
});

// POST /api/auth/set-password
// Ustawia nowe haslo na podstawie tokena aktywacyjnego
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
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
    return NextResponse.json(
      { error: "Konto nie istnieje" },
      { status: 404 }
    );
  }
  if (!user.active) {
    return NextResponse.json(
      { error: "Konto zostalo dezaktywowane" },
      { status: 403 }
    );
  }

  const bcrypt = await import("bcryptjs");
  const hash = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hash },
  });

  return NextResponse.json({ message: "Haslo ustawione pomyslnie", email: user.email });
}

// GET /api/auth/set-password?token=...
// Weryfikuje czy token jest prawidlowy (dla widoku strony)
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
