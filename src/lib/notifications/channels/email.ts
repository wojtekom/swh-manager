import {
  NOTIFICATION_CONFIG,
  isDemoUser,
  isServiceConfigured,
} from "../config";

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  userId?: string
): Promise<void> {
  if (userId && isDemoUser(userId)) {
    console.log(`[DEMO EMAIL] To: ${to}, Subject: ${subject}`);
    return;
  }

  if (!isServiceConfigured("email")) {
    console.log(
      `[EMAIL SKIP] Resend not configured. To: ${to}, Subject: ${subject}`
    );
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${NOTIFICATION_CONFIG.resendApiKey}`,
    },
    body: JSON.stringify({
      from: `SWH Manager <${NOTIFICATION_CONFIG.fromEmail}>`,
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Email send failed: ${error}`);
  }
}
