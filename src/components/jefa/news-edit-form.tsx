"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { useToast } from "@/components/ui/toast";
import { updateNewsAction } from "@/app/(app)/jefa/noticias/actions";

function toLocalDatetimeInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Formulario de edición en página de detalle (no inline en el listado). */
export function NewsEditForm({
  id,
  title,
  body,
  pinned,
  scheduledAt,
  status,
  imagePath,
}: {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  scheduledAt?: string | null;
  status: string;
  imagePath: string | null;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [titleValue, setTitleValue] = useState(title);
  const [bodyValue, setBodyValue] = useState(body);
  const [pinnedValue, setPinnedValue] = useState(pinned);
  const [draftValue, setDraftValue] = useState(status === "BORRADOR");
  const [scheduledValue, setScheduledValue] = useState(toLocalDatetimeInput(scheduledAt));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("title", titleValue);
    formData.set("body", bodyValue);
    if (pinnedValue) formData.set("pinned", "on");
    if (draftValue) formData.set("draft", "on");
    if (scheduledValue) formData.set("scheduledAt", scheduledValue);
    if (imageFile) formData.set("image", imageFile);
    startTransition(async () => {
      const result = await updateNewsAction(id, formData);
      if (result.ok) {
        showToast("Noticia actualizada.");
        router.push("/jefa/noticias");
        router.refresh();
      } else {
        showToast(result.error ?? "Error al guardar.", "error");
      }
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <label htmlFor="news-edit-title" className="mb-1 block text-xs font-medium text-slate-500">
          Título
        </label>
        <input
          id="news-edit-title"
          type="text"
          required
          value={titleValue}
          onChange={(e) => setTitleValue(e.target.value)}
          className="field-control w-full px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="news-edit-body" className="mb-1 block text-xs font-medium text-slate-500">
          Contenido
        </label>
        <textarea
          id="news-edit-body"
          required
          value={bodyValue}
          onChange={(e) => setBodyValue(e.target.value)}
          rows={8}
          className="field-control w-full px-3 py-2 text-sm"
        />
      </div>
      <div>
        <p className="mb-1 text-xs font-medium text-slate-500">Imagen (opcional)</p>
        {imagePath && !imageFile && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/uploads/${imagePath}`}
            alt=""
            className="mb-2 max-h-40 rounded-lg object-cover"
          />
        )}
        <FileDropzone
          accept="image/*"
          disabled={pending}
          label={imageFile ? imageFile.name : "Cambiar imagen"}
          onFile={setImageFile}
        />
      </div>
      <div>
        <label htmlFor="news-edit-scheduled" className="mb-1 block text-xs font-medium text-slate-500">
          Programar publicación
        </label>
        <input
          id="news-edit-scheduled"
          type="datetime-local"
          value={scheduledValue}
          onChange={(e) => setScheduledValue(e.target.value)}
          className="field-control w-full px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-slate-500">Hora local Canarias</p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={pinnedValue}
            onChange={(e) => setPinnedValue(e.target.checked)}
          />
          Fijar arriba
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={draftValue}
            onChange={(e) => setDraftValue(e.target.checked)}
          />
          Guardar como borrador
        </label>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-[color:var(--surface-divider)] pt-4">
        <button
          type="button"
          onClick={() => router.push("/jefa/noticias")}
          className="btn-ghost"
        >
          Cancelar
        </button>
        <button type="submit" disabled={pending} className="btn-primary">
          <Check className="h-4 w-4" />
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
