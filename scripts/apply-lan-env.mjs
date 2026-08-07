/**
 * Escribe/actualiza .env para acceso por IP LAN.
 * No hace falta editar .env a mano: lo hace este script.
 *
 * Uso: node scripts/apply-lan-env.mjs
 *      node scripts/apply-lan-env.mjs 192.168.12.45
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

const ip = detectLanIp();
const authUrl = `http://${ip}:3000`;

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envPath);
    console.log("Creado .env desde .env.example");
  } else {
    fs.writeFileSync(envPath, "", "utf8");
    console.log("Creado .env vacío");
  }
}

let env = fs.readFileSync(envPath, "utf8");
env = upsertEnv(env, "AUTH_URL", authUrl);
env = upsertEnv(env, "AUTH_TRUST_HOST", "true");

// Asegura secreto de desarrollo si falta (Auth.js lo exige).
if (!/^AUTH_SECRET=.+/m.test(env) || /AUTH_SECRET="genera-uno-con/m.test(env)) {
  const secret = Buffer.from(`dev-${ip}-${Date.now()}`).toString("base64url");
  env = upsertEnv(env, "AUTH_SECRET", secret);
}

fs.writeFileSync(envPath, env, "utf8");
console.log(`OK — AUTH_URL=${authUrl}`);
console.log(`OK — AUTH_TRUST_HOST=true`);
console.log("Abre esa misma URL en el navegador tras npm run dev.");
