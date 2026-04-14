// Notification system configuration

export const NOTIFICATION_CONFIG = {
  resendApiKey: process.env.RESEND_API_KEY || "",
  fromEmail: process.env.FROM_EMAIL || "noreply@swh-siedlce.pl",
  vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || "",
  smsapiToken: process.env.SMSAPI_TOKEN || "",
  cronSecret: process.env.CRON_SECRET || "dev-secret",
};

export function isDemoUser(userId: string): boolean {
  return userId.startsWith("demo-");
}

export function isServiceConfigured(service: "email" | "push" | "sms"): boolean {
  switch (service) {
    case "email":
      return !!NOTIFICATION_CONFIG.resendApiKey;
    case "push":
      return (
        !!NOTIFICATION_CONFIG.vapidPublicKey &&
        !!NOTIFICATION_CONFIG.vapidPrivateKey
      );
    case "sms":
      return !!NOTIFICATION_CONFIG.smsapiToken;
  }
}

// Polish labels for notification types
export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  TRAINING_REMINDER: "Przypomnienie o treningu",
  SCHEDULE_CHANGE: "Zmiana harmonogramu",
  SCHEDULE_CANCEL: "Odwołanie treningu",
  TOURNAMENT_UPDATE: "Aktualizacja turnieju",
  NEW_ANNOUNCEMENT: "Nowe ogłoszenie",
  NEW_MESSAGE: "Nowa wiadomość",
  CAMP_UPDATE: "Aktualizacja obozu",
  PAYMENT_REMINDER: "Przypomnienie o płatności",
  CALLUP: "Powołanie na turniej",
};

// Polish labels for channels
export const CHANNEL_LABELS: Record<string, string> = {
  IN_APP: "W aplikacji",
  EMAIL: "Email",
  PUSH: "Push",
  SMS: "SMS",
};
