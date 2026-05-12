/**
 * Mapowanie kategorii wiekowych SWH:
 *
 * - Mikrus     — rocznik 2019 i młodsi (U8)
 * - Mini Hokej — rocznik 2016 i młodsi (U10, U12)
 * - Młodzik    — U14
 * - Junior Open — U16, U18
 * - Senior     — SENIOR
 */

export const CATEGORY_LABELS: Record<string, string> = {
  U8: "Mikrus",
  U10: "Mini Hokej",
  U12: "Mini Hokej",
  U14: "Młodzik",
  U16: "Junior Open",
  U18: "Junior Open",
  SENIOR: "Senior",
};

/**
 * Zwraca polską nazwę kategorii dla wyświetlania w UI.
 * Domyślnie zwraca tylko polską nazwę (np. "Mini Hokej").
 * Z parametrem `withCode=true` zwraca polską + kod (np. "Mini Hokej (U10)") — dla dropdownów / formularzy gdzie U10 vs U12 musi być rozróżnialne.
 */
export function getCategoryLabel(
  category: string | null | undefined,
  withCode = false
): string {
  if (!category) return "—";
  const polish = CATEGORY_LABELS[category];
  if (!polish) return category; // nieznana kategoria — zwracaj kod
  if (withCode) return `${polish} (${category})`;
  return polish;
}

/**
 * Lista wszystkich kategorii AgeCategory (do iteracji w dropdownach).
 */
export const ALL_CATEGORIES = ["U8", "U10", "U12", "U14", "U16", "U18", "SENIOR"];
