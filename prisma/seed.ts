import { PrismaClient, type Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "Cambiar123!";

type SeedUser = {
  email: string;
  name: string;
  role?: Role; // por defecto EMPLEADO
};

// Roster real de la empresa, agrupado por departamento. Saúl es el
// propietario/desarrollador de la app, pero de cara al portal es un empleado
// más de Sistemas: NO debe ver las opciones de gestión de la jefa.
const ROSTER: Record<string, SeedUser[]> = {
  Sistemas: [
    { email: "Saul@movilidadgc.org", name: "Saúl" },
    { email: "Sergio@movilidadgc.org", name: "Sergio" },
    { email: "Clemente@movilidadgc.org", name: "Clemente" },
    { email: "Mendoza@movilidadgc.org", name: "Mendoza" },
    { email: "Alberto@movilidadgc.org", name: "Alberto" },
    { email: "Adrian@movilidadgc.org", name: "Adrián" },
    { email: "Ramon@movilidadgc.org", name: "Ramón" },
  ],
  Redes: [
    { email: "Ruben@movilidadgc.org", name: "Rubén" },
    { email: "IvanRedes@movilidadgc.org", name: "Iván (Redes)" },
    { email: "Erico@movilidadgc.org", name: "Erico" },
    { email: "Kike@movilidadgc.org", name: "Kike" },
    { email: "AlbertoRedes@movilidadgc.org", name: "Alberto (Redes)" },
  ],
  Sala: [
    { email: "Ivansala@movilidadgc.org", name: "Iván (Sala)" },
    { email: "Rene@movilidadgc.org", name: "René" },
    { email: "Miranda@movilidadgc.org", name: "Miranda" },
    { email: "Zule@movilidadgc.org", name: "Zule" },
    { email: "Tenaro@movilidadgc.org", name: "Tenaro" },
  ],
  Operadores: [
    { email: "Abian@movilidadgc.org", name: "Abián" },
    { email: "Dahir@movilidadgc.org", name: "Dahir" },
    { email: "Esau@movilidadgc.org", name: "Esaú" },
    { email: "Hacomar@movilidadgc.org", name: "Hacomar" },
    { email: "Ibra@movilidadgc.org", name: "Ibra" },
    { email: "Javier@movilidadgc.org", name: "Javier" },
    { email: "Jorge@movilidadgc.org", name: "Jorge" },
    { email: "OP03@movilidadgc.org", name: "Operador 03" },
    { email: "Pedro@movilidadgc.org", name: "Pedro" },
    { email: "RamonOp@movilidadgc.org", name: "Ramón (Operadores)" },
  ],
};

// Cuentas genéricas antiguas de prueba, ya sustituidas por el roster real.
// Se desactivan (no se borran) para no perder ningún dato histórico asociado.
const LEGACY_EMPLOYEE_EMAILS = [
  "sistemas@portal.local",
  "redes@portal.local",
  "sala@portal.local",
  "operadores@portal.local",
];

async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const departmentNames = Object.keys(ROSTER);
  const departments = await Promise.all(
    departmentNames.map((name) =>
      prisma.department.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );
  const departmentIdByName = new Map(departments.map((d) => [d.name, d.id]));

  // La jefa (responsable de operaciones) tiene su propia cuenta real, sin
  // departamento asignado y sin control horario propio.
  await prisma.user.upsert({
    where: { email: "responsableoperaciones@movilidadgc.org" },
    update: { name: "Responsable de Operaciones", role: "JEFA" },
    create: {
      name: "Responsable de Operaciones",
      email: "responsableoperaciones@movilidadgc.org",
      passwordHash,
      role: "JEFA",
      // Solo en creación: no queremos forzar el cambio de contraseña de
      // nuevo a una cuenta que ya lo hizo, cada vez que se re-ejecuta el seed.
      mustChangePassword: true,
    },
  });

  let created = 0;
  for (const [deptName, users] of Object.entries(ROSTER)) {
    const departmentId = departmentIdByName.get(deptName);
    for (const u of users) {
      const email = u.email.toLowerCase().trim();
      await prisma.user.upsert({
        where: { email },
        update: {
          name: u.name,
          role: u.role ?? "EMPLEADO",
          departmentId,
          active: true,
        },
        create: {
          name: u.name,
          email,
          passwordHash,
          role: u.role ?? "EMPLEADO",
          departmentId,
          // Solo en creación, por el mismo motivo que arriba.
          mustChangePassword: true,
        },
      });
      created += 1;
    }
  }

  // Desactivar (no borrar) las cuentas genéricas de prueba ya reemplazadas.
  await prisma.user.updateMany({
    where: { email: { in: LEGACY_EMPLOYEE_EMAILS } },
    data: { active: false },
  });

  // Saldos de vacaciones anuales por defecto (22 días laborables).
  const vacationYear = new Date().getFullYear();
  const employees = await prisma.user.findMany({
    where: { role: "EMPLEADO", active: true },
    select: { id: true },
  });
  for (const emp of employees) {
    await prisma.vacationBalance.upsert({
      where: { userId_year: { userId: emp.id, year: vacationYear } },
      update: {},
      create: { userId: emp.id, year: vacationYear, totalDays: 22 },
    });
  }

  console.log("Seed completada. Contraseña temporal para todos los usuarios nuevos: %s", DEFAULT_PASSWORD);
  console.log("  responsableoperaciones@movilidadgc.org (JEFA)");
  console.log(`  ${created} cuentas creadas/actualizadas a partir del roster real.`);
  console.log("  Saul@movilidadgc.org -> EMPLEADO (Sistemas), sin acceso a las opciones de la jefa.");
  console.log(`  Cuentas antiguas desactivadas: ${LEGACY_EMPLOYEE_EMAILS.join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
