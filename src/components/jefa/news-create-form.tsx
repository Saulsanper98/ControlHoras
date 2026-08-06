"use client";

import { useRef, useState, useTransition } from "react";
import { Newspaper } from "lucide-react";
import { SectionBlock } from "@/components/ui/list-surface";
import { createNewsAction } from "@/app/(app)/jefa/noticias/actions";

export function NewsCreateForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await createNewsAction(formData);
      if (result.ok) {
        formRef.current?.reset();
        setMessage({ type: "success", text: "Noticia guardada." });
      } else {
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
      <form ref={formRef} action={handleSubmit} className="space-y-3">
        <input
          type="text"
          name="title"
          placeholder="Título"
          required
          className="field-control w-full rounded-md px-3 py-2 text-sm"
        />
        <textarea
          name="body"
          placeholder="Contenido"
          rows={4}
          required
          className="field-control w-full rounded-md px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap items-center gap-4">
          <input type="file" name="image" accept="image/*" className="text-xs text-slate-500" />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" name="pinned" className="accent-brand-blue" />
            Fijar arriba
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" name="draft" className="accent-brand-blue" />
            Guardar como borrador
          </label>
          <input
            type="datetime-local"
            name="scheduledAt"
            className="field-control px-2 py-1 text-xs"
            title="Programar publicación"
          />
          <button
            type="submit"
            disabled={pending}
            className="ml-auto rounded-md bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue-dark disabled:opacity-60"
          >
            Guardar
          </button>
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
