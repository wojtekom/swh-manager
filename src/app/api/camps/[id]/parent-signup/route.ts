import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";
import { sendEmail } from "@/lib/notifications/channels/email";
import {
  ParentSignupSchema,
  calculateAthleteCost,
  calculateFamilyTotal,
  checkSignupLimits,
  getAthletePrice,
  getCompanionPrice,
  formatPLN,
  buildPaymentTitle,
  type CampPricing,
} from "@/lib/camp-signup-helpers";

/**
 * Endpoint zapisów rodzin na obóz.
 *
 * POST   /api/camps/[id]/parent-signup — rodzic składa lub aktualizuje zgłoszenie
 * GET    /api/camps/[id]/parent-signup — rodzic dostaje swój zapis
 * DELETE /api/camps/[id]/parent-signup — rodzic anuluje swój zapis
 *
 * Zgodnie ze schemą:
 *  - Każde dziecko-zawodnik = 1 CampRegistration (z transportType + totalCost)
 *  - Cała rodzina = 1 CampFamilySignup (z liczba towarzyszy + transport rodziny + uwagi)
 */

// =============================================================
// Helpers
// =============================================================

interface CampForLogic {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  cost: number;
  priceAthleteBus: number | null;
  priceAthleteOwn: number | null;
  priceCompanionBus: number | null;
  priceCompanionOwn: number | null;
  signupOpen: boolean;
  signupDeadline: Date | null;
  maxSpots: number | null;
  maxCompanionsPerFamily: number;
  bankAccount: string | null;
  bankAccountHolder: string | null;
  paymentTitleTemplate: string | null;
  depositAmount: number | null;
  depositDeadlineDays: number;
  fullPaymentDeadline: Date | null;
}

function pricingFromCamp(camp: CampForLogic): CampPricing {
  return {
    priceAthleteBus: camp.priceAthleteBus,
    priceAthleteOwn: camp.priceAthleteOwn,
    priceCompanionBus: camp.priceCompanionBus,
    priceCompanionOwn: camp.priceCompanionOwn,
    cost: camp.cost,
  };
}

async function aggregateActiveAthletes(campId: string): Promise<number> {
  const result = await prisma.campRegistration.aggregate({
    where: { campId, status: { not: "CANCELLED" } },
    _count: { _all: true },
  });
  return result._count._all;
}

// =============================================================
// POST — rodzic składa lub aktualizuje zgłoszenie
// =============================================================

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const userRole = (session!.user as { role?: string }).role ?? "PARENT";
  const userId = (session!.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ error: "Brak ID użytkownika w sesji" }, { status: 401 });
  }

  const roleError = requireRole(["PARENT", "ADMIN"], userRole);
  if (roleError) return roleError;

  const { id: campId } = await params;

  // Walidacja danych wejściowych
  const body = await req.json().catch(() => null);
  const parsed = ParentSignupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Nieprawidłowe dane.", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const data = parsed.data;

  // Pobierz obóz
  const camp = await prisma.camp.findUnique({ where: { id: campId } });
  if (!camp) {
    return NextResponse.json({ error: "Obóz nie istnieje." }, { status: 404 });
  }

  // Sprawdź obecny zapis rodziny (do update vs create)
  const existingFamily = await prisma.campFamilySignup.findUnique({
    where: { campId_parentId: { campId, parentId: userId } },
  });

  // Sprawdź obecne registracje dzieci tego rodzica (przez ParentPlayer)
  const parentPlayers = await prisma.parentPlayer.findMany({
    where: { parentId: userId },
    select: { playerId: true, player: { select: { id: true, firstName: true, lastName: true } } },
  });
  const parentPlayerIds = new Set(parentPlayers.map((pp) => pp.playerId));

  // Walidacja: athleteIds muszą być dziećmi tego rodzica
  if (data.response === "YES") {
    for (const aid of data.athleteIds) {
      if (!parentPlayerIds.has(aid)) {
        return NextResponse.json(
          { error: "Nie możesz zapisać zawodnika, który nie jest Twoim dzieckiem." },
          { status: 403 }
        );
      }
    }
  }

  // Sprawdź limity
  const currentAthletes = await aggregateActiveAthletes(campId);
  const previousAthletesOfThisParent = await prisma.campRegistration.count({
    where: {
      campId,
      playerId: { in: Array.from(parentPlayerIds) },
      status: { not: "CANCELLED" },
    },
  });

  const maxAthletes = camp.maxSpots ?? 30;

  const limitCheck = checkSignupLimits(
    {
      signupOpen: camp.signupOpen,
      signupDeadline: camp.signupDeadline,
      maxAthletes,
      maxCompanionsPerFamily: camp.maxCompanionsPerFamily,
      currentAthletes,
    },
    data.response === "YES" ? data.athleteIds.length : 0,
    data.response === "YES" ? data.companionsCount : 0,
    !!existingFamily,
    previousAthletesOfThisParent
  );

  if (!limitCheck.ok) {
    return NextResponse.json({ error: limitCheck.error }, { status: 400 });
  }

  // Pricing snapshot
  const pricing = pricingFromCamp(camp as CampForLogic);

  // === Operacje w transakcji ===
  await prisma.$transaction(async (tx) => {
    if (data.response === "NO") {
      // 1) Anuluj wszystkie istniejące registracje dzieci tego rodzica na ten obóz
      await tx.campRegistration.updateMany({
        where: {
          campId,
          playerId: { in: Array.from(parentPlayerIds) },
          status: { not: "CANCELLED" },
        },
        data: { status: "CANCELLED" },
      });

      // 2) Upsert family signup z response NO (companions=0)
      await tx.campFamilySignup.upsert({
        where: { campId_parentId: { campId, parentId: userId } },
        create: {
          campId,
          parentId: userId,
          companionsCount: 0,
          companionNames: null,
          transportType: data.transportType,
          notes: data.notes ?? null,
        },
        update: {
          companionsCount: 0,
          companionNames: null,
          transportType: data.transportType,
          notes: data.notes ?? null,
        },
      });
      return;
    }

    // === response === "YES" ===

    // 1) Anuluj registracje dzieci NIE WYBRANYCH przez rodzica (jeśli wcześniej były)
    const notSelected = Array.from(parentPlayerIds).filter(
      (pid) => !data.athleteIds.includes(pid)
    );
    if (notSelected.length > 0) {
      await tx.campRegistration.updateMany({
        where: {
          campId,
          playerId: { in: notSelected },
          status: { not: "CANCELLED" },
        },
        data: { status: "CANCELLED" },
      });
    }

    // 2) Upsert registracje dla wybranych dzieci
    const athleteCost = calculateAthleteCost(pricing, data.transportType);
    for (const playerId of data.athleteIds) {
      await tx.campRegistration.upsert({
        where: { campId_playerId: { campId, playerId } },
        create: {
          campId,
          playerId,
          status: "REGISTERED",
          transportType: data.transportType,
          totalCost: athleteCost,
        },
        update: {
          // Jeśli był CANCELLED, przywracamy do REGISTERED
          status: "REGISTERED",
          transportType: data.transportType,
          totalCost: athleteCost,
        },
      });
    }

    // 3) Upsert family signup z towarzyszami
    await tx.campFamilySignup.upsert({
      where: { campId_parentId: { campId, parentId: userId } },
      create: {
        campId,
        parentId: userId,
        companionsCount: data.companionsCount,
        companionNames:
          data.companionNames.length > 0 ? JSON.stringify(data.companionNames) : null,
        transportType: data.transportType,
        notes: data.notes ?? null,
      },
      update: {
        companionsCount: data.companionsCount,
        companionNames:
          data.companionNames.length > 0 ? JSON.stringify(data.companionNames) : null,
        transportType: data.transportType,
        notes: data.notes ?? null,
      },
    });
  });

  // === In-app notification ===
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: "CAMP_UPDATE",
        title: `Zapis na obóz: ${camp.name}`,
        body:
          data.response === "YES"
            ? `Twoje zgłoszenie zostało przyjęte. Sprawdź szczegóły i dane do przelewu w panelu.`
            : `Twoja odpowiedź "NIE" została zapisana.`,
        link: `/dashboard/wyjazdy/${campId}`,
        channel: "IN_APP",
        status: "SENT",
        sentAt: new Date(),
      },
    });
  } catch {
    // nie blokujemy, tylko logujemy
  }

  // === Mail potwierdzający (tylko YES) ===
  if (data.response === "YES") {
    try {
      const parent = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });
      if (parent?.email) {
        const totalFamilyCost = calculateFamilyTotal(
          pricing,
          data.athleteIds.length,
          data.companionsCount,
          data.transportType
        );

        // Pierwsze imię dziecka — do tytułu przelewu
        const firstChild = parentPlayers.find((pp) =>
          data.athleteIds.includes(pp.playerId)
        );
        const childName = firstChild
          ? `${firstChild.player.firstName} ${firstChild.player.lastName}`
          : parent.name ?? "uczestnik";

        const html = buildConfirmationHtml({
          parentName: parent.name ?? "Szanowni Państwo",
          camp: camp as CampForLogic,
          athletesCount: data.athleteIds.length,
          companionsCount: data.companionsCount,
          companionNames: data.companionNames,
          transportType: data.transportType,
          totalFamilyCost,
          athleteUnitCost: getAthletePrice(pricing, data.transportType),
          companionUnitCost: getCompanionPrice(pricing, data.transportType),
          childName,
        });

        await sendEmail(
          parent.email,
          `Potwierdzenie zapisu — ${camp.name}`,
          html,
          userId
        );
      }
    } catch (err) {
      console.error("[CampSignup] Mail error:", err);
    }
  }

  return NextResponse.json({ ok: true });
}

// =============================================================
// GET — rodzic dostaje swój zapis (i listę dzieci)
// =============================================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const userId = (session!.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ error: "Brak ID użytkownika" }, { status: 401 });
  }
  const { id: campId } = await params;

  // Lista dzieci rodzica
  const parentPlayers = await prisma.parentPlayer.findMany({
    where: { parentId: userId },
    select: {
      player: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          category: true,
          jerseyNum: true,
        },
      },
    },
  });

  const children = parentPlayers.map((pp) => pp.player);
  const childIds = children.map((c) => c.id);

  // Aktywne registracje (jego dzieci)
  const registrations = await prisma.campRegistration.findMany({
    where: {
      campId,
      playerId: { in: childIds },
    },
    select: {
      id: true,
      playerId: true,
      status: true,
      transportType: true,
      totalCost: true,
    },
  });

  // Family signup
  const familySignup = await prisma.campFamilySignup.findUnique({
    where: { campId_parentId: { campId, parentId: userId } },
  });

  // Aggregate (ile osób już zapisanych)
  const totalActiveAthletes = await aggregateActiveAthletes(campId);

  return NextResponse.json({
    children,
    registrations,
    familySignup: familySignup
      ? {
          ...familySignup,
          companionNames: familySignup.companionNames
            ? (JSON.parse(familySignup.companionNames) as string[])
            : [],
        }
      : null,
    aggregate: {
      currentAthletes: totalActiveAthletes,
    },
  });
}

// =============================================================
// DELETE — rodzic anuluje swój zapis (wszystko)
// =============================================================

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const userId = (session!.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ error: "Brak ID użytkownika" }, { status: 401 });
  }
  const { id: campId } = await params;

  // Lista dzieci rodzica
  const parentPlayers = await prisma.parentPlayer.findMany({
    where: { parentId: userId },
    select: { playerId: true },
  });
  const childIds = parentPlayers.map((pp) => pp.playerId);

  await prisma.$transaction(async (tx) => {
    await tx.campRegistration.updateMany({
      where: {
        campId,
        playerId: { in: childIds },
        status: { not: "CANCELLED" },
      },
      data: { status: "CANCELLED" },
    });

    await tx.campFamilySignup.deleteMany({
      where: { campId, parentId: userId },
    });
  });

  return NextResponse.json({ ok: true });
}

// =============================================================
// Mail HTML
// =============================================================

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildConfirmationHtml(opts: {
  parentName: string;
  camp: CampForLogic;
  athletesCount: number;
  companionsCount: number;
  companionNames: string[];
  transportType: "BUS" | "OWN";
  totalFamilyCost: number;
  athleteUnitCost: number;
  companionUnitCost: number;
  childName: string;
}): string {
  const {
    parentName,
    camp,
    athletesCount,
    companionsCount,
    companionNames,
    transportType,
    totalFamilyCost,
    athleteUnitCost,
    companionUnitCost,
    childName,
  } = opts;

  const transportLabel =
    transportType === "BUS" ? "Autokar SWH" : "Własny transport";

  const dateRange = `${camp.startDate.toLocaleDateString(
    "pl-PL"
  )} – ${camp.endDate.toLocaleDateString("pl-PL")}`;

  const paymentTitle = buildPaymentTitle(camp.paymentTitleTemplate, childName);

  const depositAmount = camp.depositAmount ?? 0;
  const remainingAmount = Math.max(0, totalFamilyCost - depositAmount);

  const depositDeadline = new Date();
  depositDeadline.setDate(
    depositDeadline.getDate() + (camp.depositDeadlineDays ?? 7)
  );

  return `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:linear-gradient(135deg,#38bdf8,#3b82f6);padding:20px;border-radius:12px 12px 0 0;">
    <h2 style="color:white;margin:0;">🏒 SWH Manager — potwierdzenie zapisu</h2>
  </div>
  <div style="padding:20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:0 0 12px 12px;">
    <p style="color:#0f172a;">${escapeHtml(parentName)},</p>
    <p style="color:#334155;">Dziękujemy za zapis na <strong>${escapeHtml(
      camp.name
    )}</strong> (${escapeHtml(dateRange)}).</p>

    <h3 style="color:#0c4a6e;margin-top:24px;">📋 Szczegóły zgłoszenia</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:6px 0;color:#64748b;">Liczba zawodników:</td><td><strong>${athletesCount}</strong></td></tr>
      ${
        companionsCount > 0
          ? `<tr><td style="padding:6px 0;color:#64748b;">Towarzysze:</td><td><strong>${companionsCount}</strong>${
              companionNames.length > 0
                ? ` (${escapeHtml(companionNames.join(", "))})`
                : ""
            }</td></tr>`
          : ""
      }
      <tr><td style="padding:6px 0;color:#64748b;">Transport:</td><td>${escapeHtml(
        transportLabel
      )}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b;">Stawka zawodnika:</td><td>${escapeHtml(
        formatPLN(athleteUnitCost)
      )}</td></tr>
      ${
        companionsCount > 0
          ? `<tr><td style="padding:6px 0;color:#64748b;">Stawka towarzysza:</td><td>${escapeHtml(
              formatPLN(companionUnitCost)
            )}</td></tr>`
          : ""
      }
      <tr><td style="padding:8px 0;color:#0c4a6e;font-weight:600;border-top:1px solid #e2e8f0;">Łączny koszt:</td><td style="padding:8px 0;font-weight:600;color:#0c4a6e;border-top:1px solid #e2e8f0;">${escapeHtml(
        formatPLN(totalFamilyCost)
      )}</td></tr>
    </table>

    <h3 style="color:#0c4a6e;margin-top:24px;">💰 Wpłaty</h3>
    ${
      depositAmount > 0
        ? `<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px;margin:12px 0;border-radius:4px;">
            <strong>Krok 1 — zaliczka ${escapeHtml(
              formatPLN(depositAmount)
            )}</strong> w ciągu ${
            camp.depositDeadlineDays ?? 7
          } dni (do <strong>${depositDeadline.toLocaleDateString(
            "pl-PL"
          )}</strong>).
          </div>
          <div style="background:#dbeafe;border-left:4px solid #1e40af;padding:12px;margin:12px 0;border-radius:4px;">
            <strong>Krok 2 — pozostała kwota ${escapeHtml(
              formatPLN(remainingAmount)
            )}</strong> do <strong>${
            camp.fullPaymentDeadline
              ? camp.fullPaymentDeadline.toLocaleDateString("pl-PL")
              : "ustalenia z zarządem"
          }</strong>.
          </div>`
        : `<div style="background:#dbeafe;border-left:4px solid #1e40af;padding:12px;margin:12px 0;border-radius:4px;">
            Pełna kwota <strong>${escapeHtml(
              formatPLN(totalFamilyCost)
            )}</strong> do <strong>${
            camp.fullPaymentDeadline
              ? camp.fullPaymentDeadline.toLocaleDateString("pl-PL")
              : "ustalenia z zarządem"
          }</strong>.
          </div>`
    }

    <h3 style="color:#0c4a6e;margin-top:24px;">🏦 Dane do przelewu</h3>
    <table style="width:100%;background:#fff;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
      <tr><td style="padding:8px 12px;color:#64748b;border-bottom:1px solid #e2e8f0;">Odbiorca:</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${escapeHtml(
        camp.bankAccountHolder ?? "Stowarzyszenie Wybieram Hokej"
      )}</td></tr>
      <tr><td style="padding:8px 12px;color:#64748b;border-bottom:1px solid #e2e8f0;">Numer konta:</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-family:monospace;font-weight:600;">${escapeHtml(
        camp.bankAccount ?? "—"
      )}</td></tr>
      <tr><td style="padding:8px 12px;color:#64748b;">Tytuł przelewu:</td><td style="padding:8px 12px;font-style:italic;">${escapeHtml(
        paymentTitle
      )}</td></tr>
    </table>

    <p style="margin-top:24px;color:#475569;">Możesz edytować zgłoszenie w panelu rodzica → zakładka <strong>Wyjazdy</strong> aż do terminu zamknięcia zapisów.</p>

    <p style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;color:#64748b;font-size:13px;">
      W razie pytań: zarzadswh@halalodowa.siedlce.pl<br>
      Pozdrawiamy,<br>
      <strong>Zarząd SWH</strong>
    </p>
  </div>
</div>`;
}
