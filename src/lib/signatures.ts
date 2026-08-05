import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { uploadsRoot } from "@/lib/uploads";

export async function saveSignatureImage(
  dataUrl: string,
  subdir: string
): Promise<string> {
  const match = dataUrl.match(/^data:image\/png;base64,(.+)$/);
  if (!match) throw new Error("Firma inválida.");

  const root = uploadsRoot();
  const dir = path.join(/* turbopackIgnore: true */ root, subdir);
  await mkdir(dir, { recursive: true });

  const fileName = `${randomUUID()}.png`;
  const absolutePath = path.join(/* turbopackIgnore: true */ dir, fileName);
  await writeFile(absolutePath, Buffer.from(match[1], "base64"));

  return path.join(subdir, fileName).replaceAll("\\", "/");
}
