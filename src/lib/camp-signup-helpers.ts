import { z } from "zod";

/**
 * Helpery dla modułu zapisów rodziców na obóz.
 * Cały koszt w PLN (Float), nie w groszach — żeby zachować spójność z istniejącym `cost`.
 */

// =============================================================
// Typy
// =============================================================

export type TransportType = "BUS" | "OWN";

export interface CampPricing {
  // null oznacza brak konkretnej stawki — fallback na pole `cost`
  priceAthleteBus: number | null;
  priceAthleteOwn: number | null;
  priceCompanionBus: number | null;
  priceCompanionOwn: number | null;
  cost: number; // legacy fallback
}

// =============================================================
// Stawki — z fallbackiem do pola cost
// =============================================================

export function getAthletePrice(p: CampPricing, t: TransportType): number {
  if (t === "BUS") return p.priceAthleteBus ?? p.cost;
  return p.priceAthleteOwn ?? p.cost;
}

export function getCompanionPrice(p: CampPricing, t: TransportType): number {
  if (t === "BUS") return p.priceCompanionBus ?? 0;
  return p.priceCompanionOwn ?? 0;
}

// =============================================================
// Kalkulacja
// =============================================================

export function calculateAthleteCost(
  p: CampPricing,
  transportType: TransportType
): number {
  return getAthletePrice(p, transportType);
}

export function calculateFamilyTotal(
  p: CampPricing,
  athletesCount: number,
  companionsCount: number,
  transportType: TransportType
): number {
  if (athletesCount < 0 || companionsCount < 0) {
    throw new Error("Liczba uczestników nie może być ujemna");
  }
  const athletePrice = getAthletePrice(p, transportType);
  const companionPrice = getCompanionPrice(p, transportType);
  return athletesCount * athletePrice + companionsCount * companionPrice;
}

export function formatPLN(amount: number): string {
  if (Math.round(amount) === amount) {
    return `${amount.toLocaleString("pl-PL")} zł`;
  }
  return `${amount.toLocaleString("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} zł`;
}

// =============================================================
// Walidacja zod
// =============================================================

export const ParentSignupSchema = z
  .object({
    response: z.enum(["YES", "NO"]),
    athleteIds: z.array(z.string().min(1)).max(5),
    companionsCount: z.number().int().min(0).max(10),
    companionNames: z.array(z.string().min(2).max(100)).max(10),
    transportType: z.enum(["BUS", "OWN"]),
    notes: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.response === "NO") return; // brak dalszej walidacji

    if (data.athleteIds.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["athleteIds"],
        message: 'Wybierz co najmniej jednego zawodnika przy odpowiedzi "TAK".',
      });
    }

    if (data.companionNames.length !== data.companionsCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["companionNames"],
        message: `Podaj ${data.companionsCount} ${
          data.companionsCount === 1 ? "imię" : "imion"
        } towarzyszy.`,
      });
    }
  });

export type ValidatedParentSignup = z.infer<typeof ParentSignupSchema>;

// =============================================================
// Walidacja limitów
// =============================================================

export interface CampLimitContext {
  signupOpen: boolean;
  signupDeadline: Date | null;
  maxAthletes: number;
  maxCompanionsPerFamily: number;
  currentAthletes: number; // suma athletów już zarezerwowanych (status != CANCELLED)
}

export interface LimitCheckResult {
  ok: boolean;
  error?: string;
}

export function checkSignupLimits(
  ctx: CampLimitContext,
  athletesRequested: number,
  companionsRequested: number,
  isUpdate: boolean,
  previousAthletesCount: number = 0
): LimitCheckResult {
  if (!ctx.signupOpen) {
    return { ok: false, error: "Zapisy na ten obóz są zamknięte." };
  }

  if (ctx.signupDeadline && new Date() > ctx.signupDeadline) {
    return {
      ok: false,
      error: `Termin zapisów minął ${ctx.signupDeadline.toLocaleDateString(
        "pl-PL"
      )}.`,
    };
  }

  if (companionsRequested > ctx.maxCompanionsPerFamily) {
    return {
      ok: false,
      error: `Maksymalna liczba towarzyszy na rodzinę: ${ctx.maxCompanionsPerFamily}.`,
    };
  }

  const effectiveCurrent = isUpdate
    ? Math.max(0, ctx.currentAthletes - previousAthletesCount)
    : ctx.currentAthletes;

  if (effectiveCurrent + athletesRequested > ctx.maxAthletes) {
    const free = Math.max(0, ctx.maxAthletes - effectiveCurrent);
    return {
      ok: false,
      error: `Brak wolnych miejsc — wolnych: ${free} z ${ctx.maxAthletes}.`,
    };
  }

  return { ok: true };
}

// =============================================================
// Tytuł przelewu
// =============================================================

export function buildPaymentTitle(
  template: string | null | undefined,
  childName: string
): string {
  if (!template) return `Obóz - ${childName}`;
  return template.replace("{childName}", childName);
}
