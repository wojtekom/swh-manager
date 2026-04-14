import { prisma } from "../prisma";
import { sendNotification } from "./sender";

const DAYS_PL = [
  "Niedziela",
  "Poniedziałek",
  "Wtorek",
  "Środa",
  "Czwartek",
  "Piątek",
  "Sobota",
];

// Helper: get parent user IDs for players in a group
async function getParentUserIdsForGroup(groupId: string): Promise<string[]> {
  try {
    const members = await prisma.groupMember.findMany({
      where: { groupId },
      include: {
        player: {
          include: {
            parents: { include: { parent: true } },
          },
        },
      },
    });

    const parentIds = new Set<string>();
    for (const member of members) {
      for (const pp of member.player.parents) {
        parentIds.add(pp.parent.id);
      }
    }
    return Array.from(parentIds);
  } catch {
    return [];
  }
}

// Helper: get coach user IDs for a group
async function getCoachIdsForGroup(groupId: string): Promise<string[]> {
  try {
    const group = await prisma.trainingGroup.findUnique({
      where: { id: groupId },
      select: { coachId: true },
    });
    return group?.coachId ? [group.coachId] : [];
  } catch {
    return [];
  }
}

export async function triggerTrainingReminder(
  scheduleId: string
): Promise<void> {
  try {
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: { group: true },
    });

    if (!schedule || !schedule.active) return;

    const parentIds = await getParentUserIdsForGroup(schedule.groupId);
    const coachIds = await getCoachIdsForGroup(schedule.groupId);
    const allUserIds = [...parentIds, ...coachIds];

    const dayName = DAYS_PL[schedule.dayOfWeek];

    for (const userId of allUserIds) {
      await sendNotification({
        userId,
        type: "TRAINING_REMINDER",
        title: `Trening jutro — ${schedule.group.name}`,
        body: `${dayName} ${schedule.startTime}–${schedule.endTime}, ${schedule.location}`,
        link: "/dashboard/schedule",
        metadata: { scheduleId },
      });
    }
  } catch (error) {
    console.error("[TRIGGER] Training reminder failed:", error);
  }
}

export async function triggerScheduleChange(
  scheduleId: string,
  changeType: "CHANGE" | "CANCEL"
): Promise<void> {
  try {
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: { group: true },
    });

    if (!schedule) return;

    const parentIds = await getParentUserIdsForGroup(schedule.groupId);
    const coachIds = await getCoachIdsForGroup(schedule.groupId);
    const allUserIds = [...parentIds, ...coachIds];

    const dayName = DAYS_PL[schedule.dayOfWeek];
    const isCancel = changeType === "CANCEL";

    for (const userId of allUserIds) {
      await sendNotification({
        userId,
        type: isCancel ? "SCHEDULE_CANCEL" : "SCHEDULE_CHANGE",
        title: isCancel
          ? `⚠️ Trening odwołany — ${schedule.group.name}`
          : `Zmiana treningu — ${schedule.group.name}`,
        body: isCancel
          ? `Trening ${dayName} ${schedule.startTime} został odwołany`
          : `Zmieniono szczegóły treningu: ${dayName} ${schedule.startTime}–${schedule.endTime}, ${schedule.location}`,
        link: "/dashboard/schedule",
        metadata: { scheduleId, changeType },
      });
    }
  } catch (error) {
    console.error("[TRIGGER] Schedule change failed:", error);
  }
}

export async function triggerNewAnnouncement(
  announcementId: string
): Promise<void> {
  try {
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
      include: { author: true, group: true },
    });

    if (!announcement) return;

    let userIds: string[] = [];
    if (announcement.groupId) {
      const parentIds = await getParentUserIdsForGroup(announcement.groupId);
      const coachIds = await getCoachIdsForGroup(announcement.groupId);
      userIds = [...parentIds, ...coachIds];
    } else {
      const users = await prisma.user.findMany({ select: { id: true } });
      userIds = users.map((u) => u.id);
    }

    // Exclude the author
    userIds = userIds.filter((id) => id !== announcement.authorId);

    for (const userId of userIds) {
      await sendNotification({
        userId,
        type: "NEW_ANNOUNCEMENT",
        title: announcement.title,
        body: announcement.content.substring(0, 200),
        link: "/dashboard/announcements",
        metadata: { announcementId },
      });
    }
  } catch (error) {
    console.error("[TRIGGER] New announcement failed:", error);
  }
}

export async function triggerNewMessage(
  messageId: string,
  conversationId: string
): Promise<void> {
  try {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { sender: true },
    });

    if (!message) return;

    const participants = await prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true },
    });

    const recipientIds = participants
      .map((p) => p.userId)
      .filter((id) => id !== message.senderId);

    for (const userId of recipientIds) {
      await sendNotification({
        userId,
        type: "NEW_MESSAGE",
        title: `Wiadomość od ${message.sender.name}`,
        body: message.content.substring(0, 150),
        link: "/dashboard/messages",
        metadata: { messageId, conversationId },
      });
    }
  } catch (error) {
    console.error("[TRIGGER] New message failed:", error);
  }
}

export async function triggerTournamentUpdate(
  tournamentId: string
): Promise<void> {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { group: true },
    });

    if (!tournament || !tournament.groupId) return;

    const parentIds = await getParentUserIdsForGroup(tournament.groupId);
    const coachIds = await getCoachIdsForGroup(tournament.groupId);
    const allUserIds = [...parentIds, ...coachIds];

    for (const userId of allUserIds) {
      await sendNotification({
        userId,
        type: "TOURNAMENT_UPDATE",
        title: `Turniej: ${tournament.name}`,
        body: `${tournament.location}, ${new Date(tournament.startDate).toLocaleDateString("pl-PL")}`,
        link: "/dashboard/tournaments",
        metadata: { tournamentId },
      });
    }
  } catch (error) {
    console.error("[TRIGGER] Tournament update failed:", error);
  }
}

export async function triggerCampUpdate(campId: string): Promise<void> {
  try {
    const camp = await prisma.camp.findUnique({
      where: { id: campId },
      include: { group: true },
    });

    if (!camp || !camp.groupId) return;

    const parentIds = await getParentUserIdsForGroup(camp.groupId);

    for (const userId of parentIds) {
      await sendNotification({
        userId,
        type: "CAMP_UPDATE",
        title: `Obóz: ${camp.name}`,
        body: `${camp.location}, ${new Date(camp.startDate).toLocaleDateString("pl-PL")} – ${new Date(camp.endDate).toLocaleDateString("pl-PL")}`,
        link: "/dashboard/camps",
        metadata: { campId },
      });
    }
  } catch (error) {
    console.error("[TRIGGER] Camp update failed:", error);
  }
}
