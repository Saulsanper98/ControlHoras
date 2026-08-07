"use client";

import { useRef, useState, useTransition } from "react";
import { Newspaper, Plus } from "lucide-react";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { createNewsAction } from "@/app/(app)/jefa/noticias/actions";

export function NewsCreateForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [imageFile, setImageFile] = useState<File | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (imageFile) formData.set("image", imageFile);
    startTransition(async () => {
      const result = await createNewsAction(formData);
      if (result.ok) {
        formRef.current?.reset();
        setImageFile(null);
        showToast("Noticia guardada.");
        setOpen(false);
      } else {
        showToast(result.error ?? "Error al publicar.", "error");
      }
    });
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-primary">
        <Plus className="h-4 w-4" />
        Nueva noticia
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nueva noticia"
        className="max-w-lg"
      >
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <Newspaper className="h-3.5 w-3.5" />
            Se publicará en el inicio de los empleados.
          </p>
          <div>
            <label htmlFor="news-title" className="mb-1 block text-xs font-medium text-slate-500">
              Título
            </label>
            <input
              id="news-title"
              type="text"
              name="title"
              placeholder="Título de la noticia"
              required
              data-autofocus
              className="field-control w-full rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
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
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" name="pinned" className="accent-brand-blue" />
              Fijar arriba
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" name="draft" className="accent-brand-blue" />
              Guardar como borrador
            </label>
          </div>
          <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-60">
            {pending ? "Guardando…" : "Guardar"}
          </button>
        </form>
      </Modal>
    </>
  );
}
