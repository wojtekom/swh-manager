import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";
import { z } from "zod";
import { sendEmail } from "@/lib/notifications/channels/email";
import { randomBytes } from "crypto";

const inviteSchema = z.object({
  email: z.string().email("Podaj poprawny adres email"),
  parentName: z.string().min(1, "Podaj imię rodzica"),
  playerName: z.string().optional(),
});

// POST /api/invitations — ADMIN wysyła zaproszenie do rodzica
export async function POST(req: NextRequest) {
  const { session, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole("ADMIN", session!.user.role);
  if (roleError) return roleError;

  const body = await req.json();
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { email, parentName, playerName } = parsed.data;

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Użytkownik z tym adresem email już istnieje w systemie" },
      { status: 409 }
    );
  }

  // Generate temp password
  const tempPassword = randomBytes(4).toString("hex") + "A1!";

  // Create user account
  const bcrypt = await import("bcryptjs");
  const hashedPassword = await bcrypt.hash(tempPassword, 12);

  const user = await prisma.user.create({
    data: {
      email,
      name: parentName,
      passwordHash: hashedPassword,
      role: "PARENT",
      active: true,
    },
  });

  // Send invitation email
  const appUrl = process.env.NEXTAUTH_URL || "https://swh-manager.vercel.app";

  try {
    await sendEmail(
      email,
      "Zaproszenie do SWH Manager — Wybieram Hokej Siedlce",
      `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#38bdf8,#3b82f6);padding:24px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="color:white;margin:0;font-size:24px;">SWH Manager</h1>
          <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;">Stowarzyszenie Wybieram Hokej — Siedlce</p>
        </div>
        <div style="padding:24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:0 0 12px 12px;">
          <h2 style="color:#0c4a6e;margin-top:0;">Witaj, ${parentName}!</h2>
          <p style="color:#334155;">Zostałeś/aś zaproszony/a do aplikacji SWH Manager${playerName ? ` jako rodzic zawodnika <strong>${playerName}</strong>` : ""}.</p>
          <p style="color:#334155;">Aplikacja pozwala na:</p>
          <ul style="color:#334155;">
            <li>Przeglądanie harmonogramu treningów</li>
            <li>Komunikację z trenerami</li>
            <li>Śledzenie obecności i turniejów</li>
            <li>Zgłaszanie zapotrzebowania na sprzęt</li>
            <li>Zarządzanie składkami</li>
          </ul>
          <div style="background:#e0f2fe;border-radius:8px;padding:16px;margin:16px 0;">
            <p style="margin:0 0 8px;font-weight:bold;color:#0369a1;">Dane logowania:</p>
            <p style="margin:4px 0;color:#334155;">Email: <strong>${email}</strong></p>
            <p style="margin:4px 0;color:#334155;">Hasło tymczasowe: <strong>${tempPassword}</strong></p>
          </div>
          <p style="color:#64748b;font-size:13px;">Zalecamy zmianę hasła po pierwszym logowaniu.</p>
          <a href="${appUrl}/login" style="display:inline-block;padding:12px 24px;background:#38bdf8;color:white;border-radius:8px;text-decoration:none;margin-top:12px;font-weight:bold;">Zaloguj się do aplikacji</a>
        </div>
      </div>`,
      user.id
    );
  } catch (emailError) {
    console.error("[INVITATION EMAIL ERROR]", emailError);
    // Account created but email failed — return credentials so admin can share manually
    return NextResponse.json({
      userId: user.id,
      email,
      tempPassword,
      emailSent: false,
      message: "Konto utworzone, ale email nie został wysłany. Przekaż dane logowania ręcznie.",
    }, { status: 201 });
  }

  return NextResponse.json({
    userId: user.id,
    email,
    tempPassword,
    emailSent: true,
    message: "Zaproszenie wysłane!",
  }, { status: 201 });
}

// GET /api/invitations — lista zaproszonych rodziców (ADMIN)
export async function GET() {
  const { session, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole("ADMIN", session!.user.role);
  if (roleError) return roleError;

  const parents = await prisma.user.findMany({
    where: { role: "PARENT" },
    select: {
      id: true, email: true, name: true, active: true, createdAt: true,
      parentPlayers: {
        include: { player: { select: { id: true, firstName: true, lastName: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(parents);
}
