import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";
import * as XLSX from "xlsx";
import { formatPLN } from "@/lib/camp-signup-helpers";

/**
 * Eksport listy zapisów rodzin na obóz do XLSX (tylko ADMIN/COACH).
 * GET /api/camps/[id]/family-signups/export
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const userRole = (session!.user as { role?: string }).role ?? "PARENT";
  const roleError = requireRole(["ADMIN", "COACH"], userRole);
  if (roleError) return roleError;

  const { id: campId } = await params;

  const camp = await prisma.camp.findUnique({ where: { id: campId } });
  if (!camp) {
    return NextResponse.json({ error: "Obóz nie istnieje." }, { status: 404 });
  }

  // Wszystkie zapisy rodzin (z towarzyszami)
  const familySignups = await prisma.campFamilySignup.findMany({
    where: { campId },
    include: {
      parent: { select: { name: true, email: true, phone: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Dla każdego rodzica — które dzieci zapisał
  const parentIds = familySignups.map((f) => f.parentId);
  const parentPlayerLinks = await prisma.parentPlayer.findMany({
    where: { parentId: { in: parentIds } },
    select: {
      parentId: true,
      player: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  const allPlayerIds = parentPlayerLinks.map((pp) => pp.player.id);
  const registrations = await prisma.campRegistration.findMany({
    where: {
      campId,
      playerId: { in: allPlayerIds },
      status: { not: "CANCELLED" },
    },
    select: {
      playerId: true,
      transportType: true,
      totalCost: true,
      status: true,
    },
  });

  // Mapa playerId -> registration
  const regByPlayer = new Map(registrations.map((r) => [r.playerId, r]));
  // Mapa parentId -> [{ playerId, name }]
  const playersByParent = new Map<
    string,
    Array<{ playerId: string; name: string }>
  >();
  parentPlayerLinks.forEach((link) => {
    const list = playersByParent.get(link.parentId) ?? [];
    list.push({
      playerId: link.player.id,
      name: `${link.player.firstName} ${link.player.lastName}`,
    });
    playersByParent.set(link.parentId, list);
  });

  // Wiersze: jeden per rodzina (parent)
  const rows = familySignups.map((f, idx) => {
    const myPlayers = playersByParent.get(f.parentId) ?? [];
    const myRegistrations = myPlayers
      .map((p) => regByPlayer.get(p.playerId))
      .filter((r): r is NonNullable<typeof r> => Boolean(r));

    const enrolledNames = myPlayers
      .filter((p) => regByPlayer.has(p.playerId))
      .map((p) => p.name);

    const companionNames = f.companionNames
      ? (JSON.parse(f.companionNames) as string[])
      : [];

    const totalAthletesCost = myRegistrations.reduce(
      (sum, r) => sum + (r.totalCost ?? 0),
      0
    );

    return {
      "Lp.": idx + 1,
      "Rodzic": f.parent.name ?? "",
      "Email": f.parent.email ?? "",
      "Telefon": f.parent.phone ?? "",
      "Liczba zawodników": enrolledNames.length,
      "Imiona zawodników": enrolledNames.join(", "),
      "Liczba towarzyszy": f.companionsCount,
      "Imiona towarzyszy": companionNames.join(", "),
      "Łącznie osób": enrolledNames.length + f.companionsCount,
      "Transport": f.transportType === "BUS" ? "Autokar" : "Własny",
      "Łączny koszt": formatPLN(totalAthletesCost),
      "Łączny koszt (liczba)": totalAthletesCost,
      "Uwagi rodzica": f.notes ?? "",
      "Data zgłoszenia": new Date(f.createdAt).toLocaleString("pl-PL"),
    };
  });

  // Statystyki
  const totalFamilies = familySignups.length;
  const totalEnrolledAthletes = registrations.length;
  const totalCompanions = familySignups.reduce(
    (s, f) => s + f.companionsCount,
    0
  );
  const totalRevenue = registrations.reduce(
    (s, r) => s + (r.totalCost ?? 0),
    0
  );
  const busFamilies = familySignups.filter(
    (f) => f.transportType === "BUS"
  ).length;
  const ownFamilies = totalFamilies - busFamilies;

  const statsRows = [
    { Metryka: "Obóz", Wartość: camp.name },
    {
      Metryka: "Termin",
      Wartość: `${camp.startDate.toLocaleDateString("pl-PL")} – ${camp.endDate.toLocaleDateString("pl-PL")}`,
    },
    { Metryka: "Limit zawodników", Wartość: camp.maxSpots ?? "—" },
    { Metryka: "Zapisanych zawodników", Wartość: totalEnrolledAthletes },
    {
      Metryka: "Wolne miejsca",
      Wartość: camp.maxSpots
        ? Math.max(0, camp.maxSpots - totalEnrolledAthletes)
        : "—",
    },
    { Metryka: "Liczba rodzin", Wartość: totalFamilies },
    { Metryka: "Towarzyszy łącznie", Wartość: totalCompanions },
    { Metryka: "Rodzin z autokarem", Wartość: busFamilies },
    { Metryka: "Rodzin własny transport", Wartość: ownFamilies },
    { Metryka: "Łączny przychód z zawodników", Wartość: formatPLN(totalRevenue) },
    { Metryka: "Data eksportu", Wartość: new Date().toLocaleString("pl-PL") },
  ];

  const wb = XLSX.utils.book_new();
  const wsRows = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, wsRows, "Zapisy rodzin");
  const wsStats = XLSX.utils.json_to_sheet(statsRows);
  XLSX.utils.book_append_sheet(wb, wsStats, "Statystyki");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const filename = `zapisy_${slugify(camp.name)}_${new Date()
    .toISOString()
    .slice(0, 10)}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
