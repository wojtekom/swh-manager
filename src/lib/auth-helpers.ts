import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { NextResponse } from "next/server";

export async function getSessionOrError() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { session: null, error: NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 }) };
  }
  return { session, error: null };
}

export function requireRole(role: string | string[], userRole: string): NextResponse | null {
  const roles = Array.isArray(role) ? role : [role];
  if (!roles.includes(userRole)) {
    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
  }
  return null;
}
