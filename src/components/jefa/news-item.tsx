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
  status,
}: {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  publishedAt: string;
  imagePath: string | null;
  status: string;
}) {
  const [editing, setEditing] = useState(false);
  const [titleValue, setTitleValue] = useState(title);
  const [bodyValue, setBodyValue] = useState(body);
  const [pinnedValue, setPinnedValue] = useState(pinned);
  const [draftValue, setDraftValue] = useState(status === "BORRADOR");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleSave() {
    setMessage(null);
    const formData = new FormData();
    formData.set("title", titleValue);
    formData.set("body", bodyValue);
    if (pinnedValue) formData.set("pinned", "on");
    if (draftValue) formData.set("draft", "on");
    if (imageFile) formData.set("image", imageFile);
    startTransition(async () => {
      const result = await updateNewsAction(id, formData);
      if (result.ok) setEditing(false);
      else setMessage(result.error ?? "Error al guardar.");
    });
  }

  function handleDelete() {
    if (!window.confirm("¿Eliminar esta noticia?")) return;
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
          className="field-control w-full rounded-md px-3 py-2 text-sm"
        />
        <textarea
          value={bodyValue}
          onChange={(e) => setBodyValue(e.target.value)}
          rows={4}
          className="field-control w-full rounded-md px-3 py-2 text-sm"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          className="text-xs text-slate-500"
        />
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
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-slate-600"
            >
              <X className="h-4 w-4" />
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={pending}
              className="flex items-center gap-1 rounded-md bg-brand-blue px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
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
          <div className="flex flex-wrap items-center gap-2">
            {pinned && <Pin className="h-3.5 w-3.5 text-brand-blue" />}
            {status === "BORRADOR" && (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                Borrador
              </span>
            )}
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
          <button type="button" onClick={() => setEditing(true)} aria-label="Editar noticia" className="text-slate-400 hover:text-brand-blue">
            <Pencil className="h-4 w-4" />
          </button>
          <button type="button" onClick={handleDelete} disabled={pending} aria-label="Eliminar noticia" className="text-slate-400 hover:text-red-600 disabled:opacity-60">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {message && <p className="mt-2 text-sm text-red-600">{message}</p>}
    </Card>
  );
}
