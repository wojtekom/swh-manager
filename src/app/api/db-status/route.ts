import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Endpoint do sprawdzenia stanu bazy danych i schematu.
 * Pomocny gdy z buildu wyrzuciliśmy `prisma migrate deploy` (bo baza Neon zasypia).
 *
 * Migracje teraz aplikuj ręcznie:
 * - z lokalnego komputera: `npx prisma migrate deploy` z dobrym DATABASE_URL w .env
 * - lub przez Vercel CLI: `vercel env pull && npx prisma migrate deploy`
 *
 * Ten endpoint pozwala upewnić się, że baza jest osiągalna i ma nasze tabele.
 */
export async function GET(_req: NextRequest) {
  try {
    const tournamentsCount = await prisma.tournament.count();
    const callupsCount = await prisma.callup.count();
    const campsCount = await prisma.camp.count();

    // Sprawdź czy nowe kolumny istnieją (transportFee, meetingTime — z naszej migracji)
    const tournamentSample = await prisma.tournament.findFirst({
      select: {
        id: true,
        transportFee: true,
        meetingTime: true,
        meetingLocation: true,
        parentDeadline: true,
      },
    });

    return NextResponse.json({
      ok: true,
      counts: {
        tournaments: tournamentsCount,
        callups: callupsCount,
        camps: campsCount,
      },
      hasNewColumns: tournamentSample !== null,
      sample: tournamentSample,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e) },
      { status: 500 }
    );
  }
}
