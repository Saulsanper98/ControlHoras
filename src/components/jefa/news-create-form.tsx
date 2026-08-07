"use client";

import { useRef, useState, useTransition } from "react";
import { Newspaper } from "lucide-react";
import { SectionBlock } from "@/components/ui/list-surface";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { useToast } from "@/components/ui/toast";
import { createNewsAction } from "@/app/(app)/jefa/noticias/actions";

export function NewsCreateForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const formData = new FormData(e.currentTarget);
    if (imageFile) formData.set("image", imageFile);
    startTransition(async () => {
      const result = await createNewsAction(formData);
      if (result.ok) {
        formRef.current?.reset();
        setImageFile(null);
        showToast("Noticia guardada.");
        setMessage({ type: "success", text: "Noticia guardada." });
      } else {
        showToast(result.error ?? "Error al publicar.", "error");
        setMessage({ type: "error", text: result.error ?? "Error al publicar." });
      }
    });
  }

  return (
    <SectionBlock>
      <p className="mb-3 flex items-center gap-2 text-sm font-medium text-brand-navy">
        <Newspaper className="h-4 w-4" />
        Publicar noticia
      </p>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="news-title" className="mb-1 block text-xs font-medium text-slate-500">
              Título
            </label>
            <input
              id="news-title"
              type="text"
              name="title"
              placeholder="Título de la noticia"
              required
              className="field-control w-full rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="news-body" className="mb-1 block text-xs font-medium text-slate-500">
              Contenido
            </label>
            <textarea
              id="news-body"
              name="body"
              placeholder="Texto de la noticia"
              rows={4}
              required
              className="field-control w-full rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="news-scheduled" className="mb-1 block text-xs font-medium text-slate-500">
              Programar publicación
            </label>
            <input
              id="news-scheduled"
              type="datetime-local"
              name="scheduledAt"
              className="field-control w-full px-2 py-2 text-sm"
            />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-slate-500">Imagen (opcional)</p>
            <FileDropzone
              accept="image/*"
              disabled={pending}
              label={imageFile ? imageFile.name : "Arrastra una imagen o haz clic"}
              onFile={setImageFile}
            />
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" name="pinned" className="accent-brand-blue" />
              Fijar arriba
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" name="draft" className="accent-brand-blue" />
              Guardar como borrador
            </label>
            <button type="submit" disabled={pending} className="btn-primary ml-auto disabled:opacity-60">
              Guardar
            </button>
          </div>
        </div>
        {message && (
          <p className={`text-sm ${message.type === "success" ? "text-emerald-700" : "text-red-600"}`}>
            {message.text}
          </p>
        )}
      </form>
    </SectionBlock>
  );
}
