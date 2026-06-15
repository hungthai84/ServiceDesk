import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export interface SyncUserParams {
  uid: string;
  name: string;
  email: string;
  avatar?: string;
  phoneNumber?: string;
  role?: string;
}

export async function getOrCreateUser(params: SyncUserParams) {
  try {
    const result = await db.insert(users)
      .values({
        uid: params.uid,
        name: params.name,
        email: params.email,
        avatar: params.avatar,
        phoneNumber: params.phoneNumber,
        role: params.role || 'member',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          name: params.name,
          email: params.email,
          avatar: params.avatar,
          phoneNumber: params.phoneNumber || null,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Failed to sync or select user:", error);
    throw new Error("Database sync failed. Please try again later.", { cause: error });
  }
}

export async function getUserProfile(uid: string) {
  try {
    const result = await db.select()
      .from(users)
      .where(eq(users.uid, uid))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("Failed to get user profile:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}
