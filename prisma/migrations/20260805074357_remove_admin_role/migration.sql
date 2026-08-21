-- Se elimina el rol ADMIN: existía únicamente para que Saúl combinara la
-- vista de la jefa con su propio control horario, algo que ya no queremos
-- (Saúl es propietario/desarrollador de la app, pero de cara al portal es un
-- empleado más y no debe ver las opciones de gestión de la jefa).
-- No hay ninguna fila con role = 'ADMIN' en el momento de esta migración.

ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE TEXT USING "role"::TEXT;
DROP TYPE "Role";
CREATE TYPE "Role" AS ENUM ('EMPLEADO', 'JEFA');
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role" USING "role"::"Role";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'EMPLEADO';
