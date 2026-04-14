import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError } from "@/lib/auth-helpers";

// GET /api/conversations/users — lista użytkowników do komunikatora
export async function GET() {
  const { session, error } = await getSessionOrError();
  if (error) return error;

  const users = await prisma.user.findMany({
    where: { active: true },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
}
