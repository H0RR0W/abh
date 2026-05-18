import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";

// Returns all migrants who have chat messages, with last message and count
export async function GET(req: NextRequest) {
  const staff = await requireRole(req, "messages.view");
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get all chat messages grouped by migrantId
  const messages = await prisma.chatMessage.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      migrant: { select: { id: true, firstName: true, lastName: true, photo: true } },
    },
  });

  // Group by migrantId
  const map = new Map<string, {
    migrant: { id: string; firstName: string; lastName: string; photo?: string | null };
    lastMessage: string;
    lastAt: string;
    lastFrom: string;
    lastMigrantAt: string | null;
    totalCount: number;
    migrantCount: number;
  }>();

  for (const msg of messages) {
    if (!map.has(msg.migrantId)) {
      map.set(msg.migrantId, {
        migrant: msg.migrant,
        lastMessage: msg.text,
        lastAt: msg.createdAt.toISOString(),
        lastFrom: msg.from,
        lastMigrantAt: null,
        totalCount: 0,
        migrantCount: 0,
      });
    }
    const entry = map.get(msg.migrantId)!;
    entry.totalCount++;
    if (msg.from === "migrant") {
      entry.migrantCount++;
      // messages are desc so first migrant message we encounter = most recent
      if (!entry.lastMigrantAt) entry.lastMigrantAt = msg.createdAt.toISOString();
    }
  }

  const conversations = Array.from(map.values()).sort(
    (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
  );

  return NextResponse.json({ conversations });
}
