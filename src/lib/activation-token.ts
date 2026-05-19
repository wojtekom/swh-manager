import { createHmac, timingSafeEqual } from "crypto";

// Token aktywacyjny generowany bez dodatkowych zaleznosci.
// Format: base64url(userId.exp).base64url(hmac)
// Klucz = NEXTAUTH_SECRET (ten sam ktory uzywa NextAuth).

const DEFAULT_TTL_DAYS = 14;

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET nie jest ustawione w srodowisku");
  }
  return secret;
}

function base64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf.toString("base64url");
}

function base64urlDecode(input: string): Buffer {
  return Buffer.from(input, "base64url");
}

function sign(payload: string): string {
  return base64url(createHmac("sha256", getSecret()).update(payload).digest());
}

export function createActivationToken(
  userId: string,
  ttlDays: number = DEFAULT_TTL_DAYS
): string {
  const exp = Math.floor(Date.now() / 1000) + ttlDays * 24 * 60 * 60;
  const payload = `${userId}.${exp}`;
  const payloadB64 = base64url(payload);
  const signature = sign(payload);
  return `${payloadB64}.${signature}`;
}

export function verifyActivationToken(
  token: string
): { userId: string; valid: true } | { valid: false; reason: string } {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) {
      return { valid: false, reason: "Nieprawidlowy format tokena" };
    }
    const [payloadB64, providedSig] = parts;
    const payload = base64urlDecode(payloadB64).toString("utf8");
    const expectedSig = sign(payload);

    // Porownanie w czasie stalym zeby uniknac timing attacks
    const a = base64urlDecode(providedSig);
    const b = base64urlDecode(expectedSig);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { valid: false, reason: "Nieprawidlowy podpis" };
    }

    const [userId, expStr] = payload.split(".");
    const exp = Number(expStr);
    if (!userId || !exp || Number.isNaN(exp)) {
      return { valid: false, reason: "Nieprawidlowy payload" };
    }
    if (Math.floor(Date.now() / 1000) > exp) {
      return { valid: false, reason: "Token wygasl" };
    }
    return { userId, valid: true };
  } catch {
    return { valid: false, reason: "Blad weryfikacji" };
  }
}

// Rozpoznaje hash z importu - ci rodzice nie moga sie zalogowac
export function isImportPlaceholderHash(hash: string): boolean {
  return hash === "$2a$12$sportmanago.import.placeholder";
}
