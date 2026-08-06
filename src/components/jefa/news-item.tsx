"use client";

import { useState, useTransition } from "react";
import { Pin, Pencil, Trash2, X, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { deleteNewsAction, updateNewsAction } from "@/app/(app)/jefa/noticias/actions";

export function NewsItem({
  id,
  title,
  body,
  pinned,
  publishedAt,
  imagePath,
}: {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  publishedAt: string;
  imagePath: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [titleValue, setTitleValue] = useState(title);
  const [bodyValue, setBodyValue] = useState(body);
  const [pinnedValue, setPinnedValue] = useState(pinned);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateNewsAction(id, titleValue, bodyValue, pinnedValue);
      if (result.ok) setEditing(false);
      else setMessage(result.error ?? "Error al guardar.");
    });
  }

  function handleDelete() {
    if (!window.confirm("¿Eliminar esta noticia? Esta acción no se puede deshacer.")) return;
    setMessage(null);
    startTransition(async () => {
      const result = await deleteNewsAction(id);
      if (!result.ok) setMessage(result.error ?? "Error al eliminar la noticia.");
    });
  }

  if (editing) {
    return (
      <Card className="space-y-3">
        <input
          type="text"
          value={titleValue}
          onChange={(e) => setTitleValue(e.target.value)}
          className="surface-input w-full rounded-md px-3 py-2 text-sm"
        />
        <textarea
          value={bodyValue}
          onChange={(e) => setBodyValue(e.target.value)}
          rows={4}
          className="surface-input w-full rounded-md px-3 py-2 text-sm"
        />
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={pinnedValue}
              onChange={(e) => setPinnedValue(e.target.checked)}
              className="rounded border-brand-navy/25"
            />
            Fijar arriba
          </label>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="surface-btn flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-slate-600"
            >
              <X className="h-4 w-4" />
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={pending}
              className="flex items-center gap-1 rounded-md bg-brand-blue px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-blue-dark disabled:opacity-60"
            >
              <Check className="h-4 w-4" />
              Guardar
            </button>
          </div>
        </div>
        {message && <p className="text-sm text-red-600">{message}</p>}
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {pinned && <Pin className="h-3.5 w-3.5 text-brand-blue" />}
            <p className="font-medium text-brand-navy">{title}</p>
          </div>
          <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{body}</p>
          {imagePath && (
            <img
              src={`/api/uploads/${imagePath}`}
              alt=""
              className="mt-2 max-h-48 rounded-md border border-brand-navy/10"
            />
          )}
          <p className="mt-2 text-xs text-slate-500">
            {new Date(publishedAt).toLocaleDateString("es-ES")}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Editar noticia"
            className="text-slate-400 hover:text-brand-blue"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            aria-label="Eliminar noticia"
            className="text-slate-400 hover:text-red-600 disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {message && <p className="mt-2 text-sm text-red-600">{message}</p>}
    </Card>
  );
}
