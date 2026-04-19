import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";
import {
  createActivationToken,
  isImportPlaceholderHash,
} from "@/lib/activation-token";
import { sendEmail } from "@/lib/notifications/channels/email";

// GET /api/invitations/activate-imported
// Zwraca liczbe kont z importu, ktore czekaja na aktywacje (bez wysylki)
export async function GET() {
  const { session, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole("ADMIN", session!.user.role);
  if (roleError) return roleError;

  const all = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, email: true, name: true, passwordHash: true },
  });
  type PendingUser = { id: string; email: string; name: string; passwordHash: string };
  const pending = all.filter((u: PendingUser) => isImportPlaceholderHash(u.passwordHash));

  return NextResponse.json({
    count: pending.length,
    users: pending.map((u: PendingUser) => ({ id: u.id, email: u.email, name: u.name })),
  });
}

// POST /api/invitations/activate-imported
// Wysyla email aktywacyjny do wszystkich zaimportowanych rodzicow
export async function POST(req: NextRequest) {
  const { session, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole("ADMIN", session!.user.role);
  if (roleError) return roleError;

  // Opcjonalnie: cel tylko konkretnych userId (jesli front przesle)
  let targetIds: string[] | null = null;
  try {
    const body = await req.json();
    if (Array.isArray(body?.userIds) && body.userIds.length > 0) {
      targetIds = body.userIds;
    }
  } catch {
    // brak body = wyslij do wszystkich
  }

  const whereBase = { active: true, ...(targetIds ? { id: { in: targetIds } } : {}) };
  const users = await prisma.user.findMany({
    where: whereBase,
    select: { id: true, email: true, name: true, passwordHash: true },
  });
  type PendingUser = { id: string; email: string; name: string; passwordHash: string };
  const pending = users.filter((u: PendingUser) => isImportPlaceholderHash(u.passwordHash));

  if (pending.length === 0) {
    return NextResponse.json({
      message: "Brak kont do aktywacji",
      sent: 0,
      failed: 0,
    });
  }

  const appUrl = process.env.NEXTAUTH_URL || "https://swh-manager.vercel.app";
  let sent = 0;
  let failed = 0;
  const errors: Array<{ email: string; reason: string }> = [];

  for (const user of pending) {
    try {
      const token = createActivationToken(user.id);
      const link = `${appUrl}/set-password?token=${encodeURIComponent(token)}`;
      const html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#38bdf8,#3b82f6);padding:24px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="color:white;margin:0;font-size:24px;">SWH Manager</h1>
          <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;">Stowarzyszenie Wybieram Hokej Siedlce</p>
        </div>
        <div style="padding:24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:0 0 12px 12px;">
          <h2 style="color:#0c4a6e;margin-top:0;">Witaj, ${user.name}!</h2>
          <p style="color:#334155;">Twoje konto w aplikacji <strong>SWH Manager</strong> zostalo utworzone i czeka na aktywacje.</p>
          <p style="color:#334155;">Aby uzyskac dostep do aplikacji (harmonogram, skladki, wiadomosci od trenerow, ogloszenia) — ustaw wlasne haslo klikajac ponizszy przycisk:</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${link}" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#38bdf8,#3b82f6);color:white;border-radius:10px;text-decoration:none;font-weight:bold;">
              Ustaw haslo i zaloguj sie
            </a>
          </div>
          <p style="color:#64748b;font-size:13px;">Link jest wazny przez 14 dni. Twoj email logowania to: <strong>${user.email}</strong></p>
          <p style="color:#64748b;font-size:13px;">Jesli nie oczekujesz tej wiadomosci — mozesz ja zignorowac.</p>
        </div>
      </div>`;
      await sendEmail(user.email, "Aktywacja konta w SWH Manager", html, user.id);
      sent++;
    } catch (err) {
      failed++;
      errors.push({
        email: user.email,
        reason: err instanceof Error ? err.message : "Nieznany blad",
      });
      console.error(`[ACTIVATE-IMPORTED] Failed for ${user.email}:`, err);
    }
  }

  return NextResponse.json({
    message: `Wyslano ${sent} z ${pending.length} zaproszen`,
    sent,
    failed,
    total: pending.length,
    errors: errors.slice(0, 10),
  });
}
