/**
 * Prepara .env para acceso por IP LAN.
 * NO escribe AUTH_URL: con AUTH_TRUST_HOST Auth.js usa el Host de la petición.
 * Si AUTH_URL=localhost y abres por IP (o al revés), la cookie no sirve y
 * tras el login vuelves al login.
 *
 * Uso: node scripts/apply-lan-env.mjs 192.168.12.45
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const envPath = path.join(root, ".env");
const examplePath = path.join(root, ".env.example");

function detectLanIp() {
  const fromArg = process.argv[2]?.trim();
  if (fromArg && /^\d{1,3}(\.\d{1,3}){3}$/.test(fromArg)) return fromArg;

  const nets = os.networkInterfaces();
  for (const entries of Object.values(nets)) {
    for (const entry of entries ?? []) {
      const family = entry.family;
      const isV4 = family === "IPv4" || family === 4;
      if (isV4 && !entry.internal) return entry.address;
    }
  }
  return "192.168.12.45";
}

function upsertEnv(content, key, value) {
  const line = `${key}="${value}"`;
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(content)) return content.replace(re, line);
  return `${content.trimEnd()}\n${line}\n`;
}

function stripEnv(content, key) {
  return content.replace(new RegExp(`^${key}=.*\\r?\\n?`, "m"), "");
}

const ip = detectLanIp();

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envPath);
    console.log("Creado .env desde .env.example");
  } else {
    fs.writeFileSync(envPath, "", "utf8");
  }
}

let env = fs.readFileSync(envPath, "utf8");
env = stripEnv(env, "AUTH_URL");
env = stripEnv(env, "NEXTAUTH_URL");
env = upsertEnv(env, "AUTH_TRUST_HOST", "true");

const secretMatch = env.match(/^AUTH_SECRET="?([^"\n]*)"?$/m);
const currentSecret = secretMatch?.[1]?.trim() ?? "";
const needsSecret =
  !currentSecret ||
  currentSecret.startsWith("genera-uno-con") ||
  currentSecret === "change-me";
if (needsSecret) {
  const secret = Buffer.from(`portal-empleado-dev-secret-${ip}`).toString("base64url");
  env = upsertEnv(env, "AUTH_SECRET", secret);
  console.log("OK — AUTH_SECRET de desarrollo fijado (estable)");
}

fs.writeFileSync(envPath, env, "utf8");
console.log("OK — AUTH_TRUST_HOST=true");
console.log("OK — AUTH_URL eliminado (evita bucle login con IP)");
console.log("");
console.log(`Abre SIEMPRE por IP:  http://${ip}:3000`);
console.log("(No uses http://localhost:3000)");
