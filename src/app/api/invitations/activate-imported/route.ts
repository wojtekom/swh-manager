import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";
import {
  createActivationToken,
  isImportPlaceholderHash,
} from "@/lib/activation-token";
import { sendEmail } from "@/lib/notifications/channels/email";

// === KONFIGURACJA POMIJANIA ===
//
// ID kont, ktore NIGDY nie dostaja mejli aktywacyjnych.
// Powod: konta testowe / demo, ktore istnieja w bazie ale nie naleza
// do prawdziwych rodzicow.
const EXCLUDED_USER_IDS = new Set<string>([
  "demo-parent", // konto testowe "Anna Nowak (Rodzic)" / rodzic@swh.pl
]);

// Walidacja czy adres email jest sensownie poprawny.
// Nie robimy regex z RFC, tylko podstawowy check: ma @, ma local, ma domain z kropka.
// Cel: wylapywac literowki z importu (np. "adam.tlen.pl" zamiast "adam@tlen.pl").
function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  if (!email.includes("@")) return false;
  const parts = email.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || local.length === 0) return false;
  if (!domain || !domain.includes(".")) return false;
  return true;
}

// GET /api/invitations/activate-imported
// Zwraca liczbe i liste rodzicow do aktywacji.
//
// UWAGA (Sprint 0, fix maj 2026): Wszyscy rodzice zaimportowani z SportsManago
// dostali wygenerowane hashe bcrypt ($2b$ len=60), ktorych NIE ZNAJA —
// czyli technicznie maja hash, ale nie moga sie zalogowac.
//
// Dlatego TYMCZASOWO traktujemy WSZYSTKICH active PARENT jako "do aktywacji".
// Wysylka mejla = zaproszenie do ustawienia wlasnego hasla
// (set-password nadpisze hash). Filtrowanie po isImportPlaceholderHash
// nie dziala dla tej populacji — placeholder zostal zastapiony przez
// realny hash z importu.
//
// W przyszlosci dodamy pole User.passwordSetByUser (migracja Prismy)
// i bedziemy filtrowac po nim — dopoki tego nie ma, idziemy ta drogą.
export async function GET() {
  const { session, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole("ADMIN", session!.user.role);
  if (roleError) return roleError;

  const pending = await prisma.user.findMany({
    where: { active: true, role: "PARENT" },
    select: { id: true, email: true, name: true, passwordHash: true },
  });
  type PendingUser = { id: string; email: string; name: string; passwordHash: string };

  // Diagnostyka: ile z nich ma jeszcze techniczny placeholder.
  const withPlaceholder = pending.filter(
    (u: PendingUser) => isImportPlaceholderHash(u.passwordHash)
  ).length;

  // Diagnostyka: ile zostanie pominietych przy faktycznej wysylce.
  const willBeSkipped = pending.filter(
    (u: PendingUser) => EXCLUDED_USER_IDS.has(u.id) || !isValidEmail(u.email)
  );

  return NextResponse.json({
    count: pending.length,
    willBeSent: pending.length - willBeSkipped.length,
    willBeSkipped: willBeSkipped.length,
    withPlaceholder,
    users: pending.map((u: PendingUser) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      willBeSkipped: EXCLUDED_USER_IDS.has(u.id) || !isValidEmail(u.email),
      skipReason: EXCLUDED_USER_IDS.has(u.id)
        ? "Konto testowe (pominiete)"
        : !isValidEmail(u.email)
        ? "Niepoprawny adres email"
        : undefined,
    })),
  });
}

// POST /api/invitations/activate-imported
// Wysyla email aktywacyjny do wszystkich zaimportowanych rodzicow
// (lub do podzbioru przekazanego w body.userIds).
// Pomija konta testowe (EXCLUDED_USER_IDS) i z niepoprawnym emailem.
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

  const whereBase = {
    active: true,
    role: "PARENT" as const,
    ...(targetIds ? { id: { in: targetIds } } : {}),
  };
  const pending = await prisma.user.findMany({
    where: whereBase,
    select: { id: true, email: true, name: true, passwordHash: true },
  });

  if (pending.length === 0) {
    return NextResponse.json({
      message: "Brak kont do aktywacji",
      sent: 0,
      failed: 0,
      skipped: 0,
    });
  }

  const appUrl = process.env.NEXTAUTH_URL || "https://swh-manager.vercel.app";
  let sent = 0;
  let failed = 0;
  const errors: Array<{ email: string; name: string; reason: string }> = [];
  const skipped: Array<{ email: string; name: string; reason: string }> = [];

  for (const user of pending) {
    // FILTR 1: pomijamy konta testowe
    if (EXCLUDED_USER_IDS.has(user.id)) {
      skipped.push({
        email: user.email,
        name: user.name,
        reason: "Konto testowe (pominiete)",
      });
      continue;
    }

    // FILTR 2: pomijamy uzytkownikow z niepoprawnym emailem
    if (!isValidEmail(user.email)) {
      skipped.push({
        email: user.email,
        name: user.name,
        reason: "Niepoprawny adres email — wymaga poprawy w bazie",
      });
      continue;
    }

    // WYSYLKA
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
        name: user.name,
        reason: err instanceof Error ? err.message : "Nieznany blad",
      });
      console.error(`[ACTIVATE-IMPORTED] Failed for ${user.email}:`, err);
    }
  }

  return NextResponse.json({
    message: `Wyslano ${sent} z ${pending.length} zaproszen (pominieto: ${skipped.length}, nieudane: ${failed})`,
    sent,
    failed,
    skipped: skipped.length,
    total: pending.length,
    errors: errors.slice(0, 10),
    skippedDetails: skipped.slice(0, 10),
  });
}
