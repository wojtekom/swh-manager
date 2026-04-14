import { isDemoUser, isServiceConfigured } from "../config";

interface PushPayload {
  title: string;
  body: string;
  link?: string;
  icon?: string;
}

interface PushSubscriptionData {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: PushPayload,
  userId?: string
): Promise<void> {
  if (userId && isDemoUser(userId)) {
    console.log(`[DEMO PUSH] ${payload.title}: ${payload.body}`);
    return;
  }

  if (!isServiceConfigured("push")) {
    console.log(`[PUSH SKIP] VAPID keys not configured`);
    return;
  }

  try {
    // @ts-expect-error web-push is an optional dependency for push notifications
    const webpush = await import("web-push");
    const { NOTIFICATION_CONFIG } = await import("../config");

    webpush.setVapidDetails(
      "mailto:kontakt@swh-siedlce.pl",
      NOTIFICATION_CONFIG.vapidPublicKey,
      NOTIFICATION_CONFIG.vapidPrivateKey
    );

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload)
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "MODULE_NOT_FOUND") {
      console.log("[PUSH SKIP] web-push package not installed");
      return;
    }
    throw error;
  }
}
