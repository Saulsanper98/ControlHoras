"use client";

import { useState, useTransition } from "react";
import { Pin, Pencil, Trash2, X, Check } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { formatDate } from "@/lib/format-date";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { deleteNewsAction, updateNewsAction } from "@/app/(app)/jefa/noticias/actions";
import { StatusBadge } from "@/components/ui/status-badge";
import Link from "next/link";

export function NewsItem({
  id,
  title,
  body,
  pinned,
  publishedAt,
  scheduledAt,
  imagePath,
  status,
}: {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  publishedAt: string;
  scheduledAt?: string | null;
  imagePath: string | null;
  status: string;
}) {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [editing, setEditing] = useState(false);
  const [titleValue, setTitleValue] = useState(title);
  const [bodyValue, setBodyValue] = useState(body);
  const [pinnedValue, setPinnedValue] = useState(pinned);
  const [draftValue, setDraftValue] = useState(status === "BORRADOR");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    const formData = new FormData();
    formData.set("title", titleValue);
    formData.set("body", bodyValue);
    if (pinnedValue) formData.set("pinned", "on");
    if (draftValue) formData.set("draft", "on");
    if (imageFile) formData.set("image", imageFile);
    startTransition(async () => {
      const result = await updateNewsAction(id, formData);
      if (result.ok) {
        setEditing(false);
        setImageFile(null);
        showToast("Noticia actualizada.");
      } else {
        showToast(result.error ?? "Error al guardar.", "error");
      }
    });
  }

  async function handleDelete() {
    const ok = await confirm({
      title: "Eliminar noticia",
      message: "¿Eliminar esta noticia? Esta acción no se puede deshacer.",
      variant: "danger",
      confirmLabel: "Eliminar",
    });
    if (!ok) return;
    startTransition(async () => {
      const result = await deleteNewsAction(id);
      if (result.ok) {
        showToast("Noticia eliminada.");
      } else {
        showToast(result.error ?? "Error al eliminar la noticia.", "error");
      }
    });
  }

  if (editing) {
    return (
      <div className="space-y-3 py-4">
        <div>
          <label htmlFor={`news-edit-title-${id}`} className="mb-1 block text-xs font-medium text-slate-500">
            Título
          </label>
          <input
            id={`news-edit-title-${id}`}
            type="text"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            className="field-control w-full rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor={`news-edit-body-${id}`} className="mb-1 block text-xs font-medium text-slate-500">
            Contenido
          </label>
          <textarea
            id={`news-edit-body-${id}`}
            value={bodyValue}
            onChange={(e) => setBodyValue(e.target.value)}
            rows={4}
            className="field-control w-full rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-slate-500">Imagen (opcional)</p>
          <FileDropzone
            accept="image/*"
            disabled={pending}
            label={imageFile ? imageFile.name : "Cambiar imagen"}
            onFile={setImageFile}
          />
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
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={() => setEditing(false)} className="btn-ghost">
              <X className="h-4 w-4" />
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={pending}
              className="btn-primary disabled:opacity-60"
            >
              <Check className="h-4 w-4" />
              Guardar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
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
              className="mt-2 max-h-48 rounded-md"
            />
          )}
          <p className="mt-2 text-xs text-slate-500">
            {formatDate(publishedAt)}
            {scheduledAt && status === "BORRADOR" && (
              <span className="ml-2 text-amber-700">
                · Programada {formatDate(scheduledAt)}
              </span>
            )}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Editar noticia"
            className="hit-area inline-flex items-center justify-center rounded-lg text-slate-400 transition hover:bg-brand-navy/6 hover:text-brand-blue"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={pending}
            aria-label="Eliminar noticia"
            className="hit-area inline-flex items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-500/10 hover:text-red-600 disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
