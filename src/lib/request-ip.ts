import { headers } from "next/headers";

/** IP del cliente a partir de las cabeceras del proxy/servidor (best-effort). */
export async function clientIp(): Promise<string | null> {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();
  return h.get("x-real-ip");
}
