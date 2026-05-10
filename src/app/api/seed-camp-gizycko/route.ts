import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * ⚠️  ENDPOINT JEDNORAZOWY — USUŃ PO UDANYM SEEDZIE!
 *
 * Tworzy obóz "Obóz Giżycko 2026" z domyślnymi stawkami i otwartymi zapisami.
 *
 * Wywołanie:
 *   GET /api/seed-camp-gizycko?key=letni2026
 *
 * Po pomyślnym uruchomieniu USUŃ PLIK src/app/api/seed-camp-gizycko/route.ts
 * (zgodnie ze Sprint 0 — endpointy seedów bez auth nie mogą zostać w produkcji).
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");

  // Prosta ochrona kluczem (jak inne seedy SWH)
  if (key !== "letni2026") {
    return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
  }

  // Sprawdź czy obóz już istnieje
  const existing = await prisma.camp.findFirst({
    where: { name: "Obóz Giżycko 2026" },
  });

  if (existing) {
    return NextResponse.json({
      ok: false,
      message: "Obóz \"Obóz Giżycko 2026\" już istnieje.",
      campId: existing.id,
      hint: "Edytuj go w panelu admina (/dashboard/camps) lub usuń z bazy zanim ponowisz seed.",
    });
  }

  // Pierwszy admin jako createdBy (każdy seed musi mieć właściciela)
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
  });

  if (!admin) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Brak użytkownika ADMIN w bazie — utwórz konto administratora przed uruchomieniem seedu.",
      },
      { status: 400 }
    );
  }

  const description = `# Obóz hokejowy SWH — Giżycko 2026

**Termin:** 28 lipca – 3 sierpnia 2026 (7 dni)
**Lokalizacja:** Centralny Ośrodek Sportu, Internaty sportowe „Chaty", ul. Moniuszki 22, Giżycko

## Co w cenie?

- Pełne wyżywienie (3 posiłki dziennie) i nocleg w COS Giżycko
- 1,5 godziny treningów na lodzie dziennie (Mazurskie Centrum Sportów Lodowych)
- Transport autokarowy z Siedlec i z powrotem (opcjonalnie — można dowieźć dziecko własnym autem)
- Opieka kadry trenerskiej SWH
- Ubezpieczenie NNW (polisa zbiorowa SWH)
- Dostęp do strzeżonego kąpieliska, sprzętu wodnego, ścianki wspinaczkowej i ścieżek rowerowych w COS

## Stawki

| Kategoria | Z autokarem | Własny transport |
|---|---:|---:|
| Zawodnik | 2 300 zł | 2 100 zł |
| Towarzysz (rodzic / rodzeństwo) | 1 600 zł | 1 400 zł |

Towarzysze (do 3 osób na rodzinę) korzystają z zakwaterowania i wyżywienia, ale nie z treningów na lodzie.

## Wpłaty

- **Zaliczka 1 000 zł** w ciągu 7 dni od zapisu
- **Reszta** do 30 czerwca 2026

Numer konta SWH: **56 1090 2688 0000 0001 6013 6130**
Tytuł przelewu: *Obóz Gizycko 2026 - [Imię Nazwisko zawodnika]*

## Termin zapisów

**Do 31 maja 2026, godz. 23:59**`;

  const camp = await prisma.camp.create({
    data: {
      name: "Obóz Giżycko 2026",
      type: "CAMP",
      location: "COS OPO Giżycko, Internaty sportowe „Chaty\", ul. Moniuszki 22",
      startDate: new Date("2026-07-28T00:00:00.000Z"),
      endDate: new Date("2026-08-03T23:59:59.000Z"),
      description,
      cost: 2300, // legacy fallback (zawodnik z autokarem)
      maxSpots: 30,
      status: "OPEN",
      createdById: admin.id,

      // Nowe pola: stawki dla 4 wariantów
      priceAthleteBus: 2300,
      priceAthleteOwn: 2100,
      priceCompanionBus: 1600,
      priceCompanionOwn: 1400,

      // Nowe pola: limity i deadline
      maxCompanionsPerFamily: 3,
      signupOpen: true,
      signupDeadline: new Date("2026-05-31T23:59:00.000Z"),

      // Nowe pola: dane do przelewu
      bankAccount: "56 1090 2688 0000 0001 6013 6130",
      bankAccountHolder: "Stowarzyszenie Wybieram Hokej",
      paymentTitleTemplate: "Obóz Gizycko 2026 - {childName}",

      // Nowe pola: wpłaty
      depositAmount: 1000,
      depositDeadlineDays: 7,
      fullPaymentDeadline: new Date("2026-06-30T23:59:00.000Z"),
    },
  });

  return NextResponse.json({
    ok: true,
    message: "Obóz Giżycko 2026 utworzony. Zapisy otwarte.",
    campId: camp.id,
    nextSteps: [
      `Lista (rodzic): /dashboard/wyjazdy`,
      `Formularz: /dashboard/wyjazdy/${camp.id}`,
      `Zapisy (admin): /dashboard/camps (wybierz obóz → Szczegóły)`,
      "USUŃ TEN ENDPOINT: src/app/api/seed-camp-gizycko/route.ts",
    ],
  });
}
