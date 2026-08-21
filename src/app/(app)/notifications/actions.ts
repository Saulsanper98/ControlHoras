"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/notifications";

export async function markNotificationReadAction(id: string) {
  const session = await auth();
  if (!session) return { ok: false };
  await markNotificationRead(id, session.user.id);
  revalidatePath("/");
  return { ok: true };
}

export async function markAllNotificationsReadAction() {
  const session = await auth();
  if (!session) return { ok: false };
  await markAllNotificationsRead(session.user.id);
  revalidatePath("/");
  return { ok: true };
}
