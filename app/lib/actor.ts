import { auth, currentUser } from "@clerk/nextjs/server";

export interface Actor {
  userId: string;
  email: string;
}

// Resolves the signed-in user for mutation routes. null means not signed in.
export async function getActor(): Promise<Actor | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  const email =
    user?.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress ??
    "unknown";

  return { userId, email };
}
