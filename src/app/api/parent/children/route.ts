import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrError, requireRole } from "@/lib/auth-helpers";

// GET /api/parent/children — returns linked children for current parent
export async function GET() {
  const { session, error } = await getSessionOrError();
  if (error) return error;
  const roleError = requireRole(["PARENT", "ADMIN"], session!.user.role);
  if (roleError) return roleError;

  const links = await prisma.parentPlayer.findMany({
    where: { parentId: session!.user.id },
    include: {
      player: {
        select: { id: true, firstName: true, lastName: true, category: true, dateOfBirth: true },
      },
    },
  });

  return NextResponse.json(links);
}
