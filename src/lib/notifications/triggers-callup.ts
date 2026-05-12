import { prisma } from "../prisma";
import { sendNotification } from "./sender";

/**
 * Wysyła powiadomienie (in-app + email) rodzicom o powołaniu zawodnika na turniej.
 * Wywoływane po utworzeniu Callup przez trenera.
 */
export async function triggerCallupCreated(callupId: string): Promise<void> {
  try {
    const callup = await prisma.callup.findUnique({
      where: { id: callupId },
      include: {
        tournament: true,
        player: {
          include: {
            parents: { include: { parent: true } },
          },
        },
      },
    });

    if (!callup) return;

    const t = callup.tournament;
    const player = callup.player;
    const dateStr = new Date(t.startDate).toLocaleDateString("pl-PL", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    // Buduj treść powiadomienia
    let body = `${t.location} — ${dateStr}`;
    if (t.transportFee && t.transportFee > 0) {
      body += `. Opłata transportowa: ${t.transportFee} zł`;
    }
    if (t.meetingTime) {
      const time = new Date(t.meetingTime).toLocaleTimeString("pl-PL", {
        hour: "2-digit",
        minute: "2-digit",
      });
      body += `. Zbiórka: ${time}`;
      if (t.meetingLocation) body += ` ${t.meetingLocation}`;
    }
    body += `. Potwierdź udział w panelu Wyjazdy.`;

    // Wyślij każdemu rodzicowi tego zawodnika
    for (const pp of player.parents) {
      await sendNotification({
        userId: pp.parent.id,
        type: "CALLUP",
        title: `Powołanie: ${player.firstName} ${player.lastName} → ${t.name}`,
        body,
        link: `/dashboard/wyjazdy/turniej/${callupId}`,
        metadata: { callupId, tournamentId: t.id, playerId: player.id },
      });
    }

    // Zapisz że powiadomienie poszło
    await prisma.callup.update({
      where: { id: callupId },
      data: { notifiedAt: new Date() },
    });
  } catch (error) {
    console.error("[TRIGGER] Callup created failed:", error);
  }
}
