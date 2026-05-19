// src/app/api/invitations/diagnostyka/route.ts
//
// DIAGNOSTYCZNY endpoint - pokazuje stan kont rodzicow w bazie.
// TYLKO ODCZYT, nie modyfikuje zadnych danych.
// Cel: zrozumiec dlaczego /dashboard/aktywuj-rodzicow pokazuje 0
//      mimo ze wiemy, ze rodzice zaimportowani istnieja.
//
// Uzycie: zalogowany admin -> GET /api/invitations/diagnostyka
//         -> wynik JSON wkleic do Claude'a do analizy

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";

// Bezpieczny "fingerprint" hasha: tylko pierwsze 4 znaki + dlugosc.
// Nie zwraca pelnego hasha, zeby nie wyciekal w logach/responsach.
function hashFingerprint(hash: string | null | undefined): string {
  if (!hash) return "(empty)";
  if (hash.length < 4) return `(short:len=${hash.length})`;
  return `${hash.substring(0, 4)}...(len=${hash.length})`;
}

// Maska e-maila: jan.kowalski@example.com -> ja***@example.com
function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "***";
  const [local, domain] = email.split("@");
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

export async function GET() {
  // ============================================================
  // 1. AUTORYZACJA — tylko admin
  // ============================================================
  const { session, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole("ADMIN", session!.user.role);
  if (roleError) return roleError;

  // ============================================================
  // 2. POBRANIE WSZYSTKICH USEROW (bez filtra active!)
  // ============================================================
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      passwordHash: true,
      _count: {
        select: { parentPlayers: true },
      },
    },
  });

  // ============================================================
  // 3. AGREGACJE
  // ============================================================
  const byRole: Record<string, number> = {};
  const byRoleAndActive: Record<string, number> = {};
  const hashFingerprintDistribution: Record<string, number> = {};

  let parentsTotal = 0;
  let parentsActiveTrue = 0;
  let parentsActiveFalse = 0;
  let parentsWithBcryptHash = 0;
  let parentsWithOtherHash = 0;
  let parentsWithEmptyHash = 0;
  let parentsWithChildren = 0;
  let parentsWithoutChildren = 0;

  for (const u of allUsers) {
    byRole[u.role] = (byRole[u.role] ?? 0) + 1;
    const activeKey = `${u.role}-active=${u.active}`;
    byRoleAndActive[activeKey] = (byRoleAndActive[activeKey] ?? 0) + 1;

    const fp = hashFingerprint(u.passwordHash);
    hashFingerprintDistribution[fp] =
      (hashFingerprintDistribution[fp] ?? 0) + 1;

    if (u.role === "PARENT") {
      parentsTotal++;
      if (u.active) parentsActiveTrue++;
      else parentsActiveFalse++;

      const h = u.passwordHash || "";
      if (
        h.startsWith("$2a$") ||
        h.startsWith("$2b$") ||
        h.startsWith("$2y$")
      ) {
        parentsWithBcryptHash++;
      } else if (h.length === 0) {
        parentsWithEmptyHash++;
      } else {
        parentsWithOtherHash++;
      }

      if (u._count.parentPlayers > 0) parentsWithChildren++;
      else parentsWithoutChildren++;
    }
  }

  // ============================================================
  // 4. KONKRETNI RODZICE (z poprzednich rozmow z Claude)
  //    Ci, ktorzy odpowiadaja na broadcasty - wiec ich konta DZIALAJA
  // ============================================================
  const knownNames = ["Skolimowski", "Pucyk", "Dmowska", "Perzyna"];
  const knownChecks = await Promise.all(
    knownNames.map(async (lastName) => {
      const found = await prisma.user.findFirst({
        where: {
          role: "PARENT",
          name: { contains: lastName, mode: "insensitive" },
        },
        select: {
          id: true,
          email: true,
          name: true,
          active: true,
          passwordHash: true,
          _count: { select: { parentPlayers: true } },
        },
      });
      if (!found) return { search: lastName, status: "NOT_FOUND" };
      return {
        search: lastName,
        status: "FOUND",
        name: found.name,
        emailMasked: maskEmail(found.email),
        active: found.active,
        hashFingerprint: hashFingerprint(found.passwordHash),
        childrenCount: found._count.parentPlayers,
      };
    })
  );

  // ============================================================
  // 5. PROBKA 5 PIERWSZYCH RODZICOW (zanonimizowana)
  // ============================================================
  const sample = allUsers
    .filter((u) => u.role === "PARENT")
    .slice(0, 5)
    .map((u) => ({
      idPrefix: u.id.slice(0, 8) + "...",
      emailMasked: maskEmail(u.email),
      name: u.name,
      active: u.active,
      hashFingerprint: hashFingerprint(u.passwordHash),
      childrenCount: u._count.parentPlayers,
    }));

  // ============================================================
  // 6. ZWROT WYNIKOW
  // ============================================================
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    summary: {
      totalUsers: allUsers.length,
      parents: {
        total: parentsTotal,
        active_true: parentsActiveTrue,
        active_false: parentsActiveFalse,
        withBcryptHash: parentsWithBcryptHash,
        withOtherHash: parentsWithOtherHash,
        withEmptyHash: parentsWithEmptyHash,
        withChildren: parentsWithChildren,
        withoutChildren: parentsWithoutChildren,
      },
    },
    byRole,
    byRoleAndActive,
    hashFingerprintDistribution,
    knownParents: knownChecks,
    sampleParents: sample,
    interpretacja: {
      problemContext:
        "Strona /dashboard/aktywuj-rodzicow pokazuje 0, ale broadcast dziala dla niektorych rodzicow",
      jakCzytac: [
        "1. Sprawdz parents.total - ilu w ogole rodzicow jest w bazie",
        "2. parents.active_false > 0 -> filtr 'active: true' moze wycinac rodzicow",
        "3. parents.withOtherHash > 0 -> jest rodzaj hasha ktorego isImportPlaceholderHash NIE rozpoznaje",
        "4. parents.withBcryptHash > 0 -> ci moga sie logowac (hasha bcrypt)",
        "5. knownParents - sprawdz konkretnie Skolimowski/Pucyk - jaki maja hashFingerprint i active?",
        "6. hashFingerprintDistribution - rozne 4-znakowe prefixy hashy w bazie - zobacz wzorzec placeholder",
      ],
    },
  });
}

