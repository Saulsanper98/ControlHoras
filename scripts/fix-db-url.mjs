/**
 * Fija DATABASE_URL al Postgres del portal (Docker en :5433).
 * No cambia a :5432: en Windows suele haber otro Postgres ahí y falla auth.
 *
 * Uso: node scripts/fix-db-url.mjs
 */
import fs from "node:fs";
import net from "node:net";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const envPath = path.join(root, ".env");
const PORTAL_URL =
  "postgresql://portal:portal_dev_password@localhost:5433/portal_empleado?schema=public";

function canConnect(host, port, ms = 1500) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const done = (ok) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(ms);
    socket.on("connect", () => done(true));
    socket.on("timeout", () => done(false));
    socket.on("error", () => done(false));
  });
}

function upsertEnv(content, key, value) {
  const line = `${key}="${value}"`;
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(content)) return content.replace(re, line);
  return `${content.trimEnd()}\n${line}\n`;
}

if (!fs.existsSync(envPath)) {
  console.error("No hay .env. Copia .env.example a .env primero.");
  process.exit(1);
}

let env = fs.readFileSync(envPath, "utf8");
env = upsertEnv(env, "POSTGRES_PASSWORD", "portal_dev_password");
env = upsertEnv(env, "DATABASE_URL", PORTAL_URL);
fs.writeFileSync(envPath, env, "utf8");
console.log("OK — DATABASE_URL = localhost:5433 (usuario portal)");

const open = await canConnect("127.0.0.1", 5433);
if (open) {
  console.log("OK — Postgres responde en localhost:5433");
  process.exit(0);
}

console.log("");
console.log("NO responde localhost:5433");
console.log("1) Abre Docker Desktop y espera a que esté en verde");
console.log("2) Ejecuta:  docker compose up -d db");
console.log("3) Espera unos segundos y:  npx prisma migrate deploy && npm run db:seed");
process.exit(2);
