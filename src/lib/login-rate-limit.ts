// Limitador de intentos de login en memoria. Válido para un despliegue de un
// único proceso Node (el caso de este portal interno); no es distribuido, así
// que un reinicio del proceso o varias réplicas lo resetean/desincronizan.
// Trade-off aceptado deliberadamente por simplicidad dado el tamaño de la app.

const WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const MAX_ATTEMPTS = 5;

type Bucket = { count: number; firstAttemptAt: number };

const buckets = new Map<string, Bucket>();

function normalizeKey(email: string): string {
  return email.toLowerCase().trim();
}

function prune(now: number) {
  for (const [key, bucket] of buckets) {
    if (now - bucket.firstAttemptAt > WINDOW_MS) buckets.delete(key);
  }
}

/** Devuelve null si se permite el intento, o los minutos restantes de bloqueo si no. */
export function checkLoginRateLimit(email: string): { blocked: boolean; retryAfterMinutes?: number } {
  const now = Date.now();
  prune(now);

  const key = normalizeKey(email);
  const bucket = buckets.get(key);
  if (!bucket) return { blocked: false };

  if (now - bucket.firstAttemptAt > WINDOW_MS) {
    buckets.delete(key);
    return { blocked: false };
  }

  if (bucket.count >= MAX_ATTEMPTS) {
    const retryAfterMs = WINDOW_MS - (now - bucket.firstAttemptAt);
    return { blocked: true, retryAfterMinutes: Math.max(1, Math.ceil(retryAfterMs / 60000)) };
  }

  return { blocked: false };
}

export function recordLoginFailure(email: string): void {
  const now = Date.now();
  const key = normalizeKey(email);
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.firstAttemptAt > WINDOW_MS) {
    buckets.set(key, { count: 1, firstAttemptAt: now });
    return;
  }

  bucket.count += 1;
}
