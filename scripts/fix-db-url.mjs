/**
 * Alinea DATABASE_URL con docker-compose (puerto 5432) si apunta a 5433
 * y no hay servidor escuchando. No pide editar .env a mano.
 *
 * Uso: node scripts/fix-db-url.mjs
 */
import fs from "node:fs";
import net from "node:net";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const envPath = path.join(root, ".env");

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
const match = env.match(/^DATABASE_URL="?([^"\n]+)"?/m);
if (!match) {
  console.error("DATABASE_URL no está en .env");
  process.exit(1);
}

const url = match[1];
const parsed = new URL(url);
const host = parsed.hostname || "localhost";
const port = Number(parsed.port || 5432);

const open = await canConnect(host, port);
if (open) {
  console.log(`OK — Postgres responde en ${host}:${port}`);
  process.exit(0);
}

console.log(`NO responde ${host}:${port}`);

if (port === 5433) {
  const altOpen = await canConnect(host, 5432);
  if (altOpen) {
    parsed.port = "5432";
    const next = parsed.toString();
    env = upsertEnv(env, "DATABASE_URL", next);
    fs.writeFileSync(envPath, env, "utf8");
    console.log(`OK — DATABASE_URL actualizado a puerto 5432`);
    console.log(`    ${next.replace(/:[^:@]+@/, ":***@")}`);
    process.exit(0);
  }
  console.log("Ni 5433 ni 5432 responden. Arranca la BD:");
  console.log("  docker compose up -d db");
  console.log("Luego: npx prisma migrate deploy && npm run db:seed");
  process.exit(2);
}

console.log("Arranca Postgres y vuelve a intentar.");
console.log("  docker compose up -d db");
process.exit(2);
