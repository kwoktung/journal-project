import { getDatabase } from "@/database/client";
import { relationshipTable, userTable } from "@/database/schema";
import { eq } from "drizzle-orm";

import { getSession } from "./session";
import { getContext } from "./context";

export type RelationshipInfo = {
  id: number;
  partner: {
    id: number;
    username: string;
    displayName: string | null;
    avatar: string | null;
  };
  relationshipStartDate: string | null;
  status: string;
  createdAt: string;
  endedAt: string | null;
};

/**
 * Gets the current user's relationship information in Next.js context
 * Returns null if user is not authenticated or has no active relationship
 */
export async function getRelationship(): Promise<RelationshipInfo | null> {
  // Get session first
  const session = await getSession();
  if (!session) {
    return null;
  }

  // Get Cloudflare context and database
  const context = await getContext();
  const db = getDatabase(context.env);

  // Get user's current relationship ID
  const [user] = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, session.userId))
    .limit(1);

  if (!user || !user.currentRelationshipId) {
    return null;
  }

  // Get relationship info
  const [relationship] = await db
    .select()
    .from(relationshipTable)
    .where(eq(relationshipTable.id, user.currentRelationshipId))
    .limit(1);

  if (!relationship) {
    return null;
  }

  // Get partner ID
  const partnerId =
    relationship.user1Id === session.userId
      ? relationship.user2Id
      : relationship.user1Id;

  // Get partner info
  const [partner] = await db
    .select({
      id: userTable.id,
      username: userTable.username,
      displayName: userTable.displayName,
      avatar: userTable.avatar,
    })
    .from(userTable)
    .where(eq(userTable.id, partnerId))
    .limit(1);

  if (!partner) {
    return null;
  }

  // Return relationship info
  return {
    id: relationship.id,
    partner: {
      id: partner.id,
      username: partner.username,
      displayName: partner.displayName,
      avatar: partner.avatar,
    },
    relationshipStartDate: relationship.startDate?.toISOString() || null,
    status: relationship.status,
    createdAt:
      relationship.createdAt?.toISOString() || new Date().toISOString(),
    endedAt: relationship?.endedAt?.toISOString() || null,
  };
}
