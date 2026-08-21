/**
 * Fija Cambiar123! en todas las cuentas del roster (Saul incluido).
 * Carga .env para no fallar por DATABASE_URL.
 *
 * Uso: node scripts/reset-dev-passwords.mjs
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const PASSWORD = "Cambiar123!";
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const result = await prisma.user.updateMany({
    where: { email: { endsWith: "@movilidadgc.org" } },
    data: { passwordHash, active: true },
  });
  const saul = await prisma.user.findUnique({
    where: { email: "saul@movilidadgc.org" },
    select: { email: true, active: true, passwordHash: true },
  });
  if (!saul) {
    throw new Error("No existe saul@movilidadgc.org. Ejecuta: npx prisma migrate reset --force");
  }
  const ok = await bcrypt.compare(PASSWORD, saul.passwordHash);
  if (!ok) throw new Error("El hash no coincide tras el reset.");
  console.log(`OK — ${result.count} cuentas con contraseña ${PASSWORD}`);
  console.log(`OK — saul@movilidadgc.org active=${saul.active}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
