"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pin, Pencil, Trash2, X, Check, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { deleteNewsAction, updateNewsAction } from "@/app/(app)/jefa/noticias/actions";

function newsBadgeStatus(status: string, scheduledAt: string | null | undefined): string {
  if (scheduledAt && new Date(scheduledAt).getTime() > Date.now() && status !== "PUBLICADA") {
    return "PROGRAMADA";
  }
  if (status === "PUBLICADA") return "PUBLICADA";
  return "BORRADOR";
}

function toLocalDatetimeInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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
  const router = useRouter();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [editing, setEditing] = useState(false);
  const [titleValue, setTitleValue] = useState(title);
  const [bodyValue, setBodyValue] = useState(body);
  const [pinnedValue, setPinnedValue] = useState(pinned);
  const [draftValue, setDraftValue] = useState(status === "BORRADOR");
  const [scheduledValue, setScheduledValue] = useState(toLocalDatetimeInput(scheduledAt));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();

  const badge = newsBadgeStatus(status, scheduledAt);
  const isPublishedVisible =
    status === "PUBLICADA" &&
    (!scheduledAt || new Date(scheduledAt).getTime() <= Date.now());

  function resetEditForm() {
    setTitleValue(title);
    setBodyValue(body);
    setPinnedValue(pinned);
    setDraftValue(status === "BORRADOR");
    setScheduledValue(toLocalDatetimeInput(scheduledAt));
    setImageFile(null);
  }

  function cancelEdit() {
    resetEditForm();
    setEditing(false);
  }

  function handleSave() {
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
        setEditing(false);
        setImageFile(null);
        showToast("Noticia actualizada.");
        router.refresh();
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
        router.refresh();
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
            className="field-control w-full px-3 py-2 text-sm"
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
            className="field-control w-full px-3 py-2 text-sm"
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
        <div>
          <label htmlFor={`news-edit-scheduled-${id}`} className="mb-1 block text-xs font-medium text-slate-500">
            Programar publicación
          </label>
          <input
            id={`news-edit-scheduled-${id}`}
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
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={cancelEdit} className="btn-ghost">
              <X className="h-4 w-4" />
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={pending}
              className="btn-primary"
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
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {pinned && <Pin className="h-3.5 w-3.5 text-brand-blue" aria-hidden />}
            <StatusBadge status={badge} preset="news" />
            <p className="font-medium text-brand-navy">{title}</p>
          </div>
          <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{body}</p>
          {imagePath && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/uploads/${imagePath}`}
              alt={title}
              className="mt-2 max-h-48 rounded-lg object-cover"
            />
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span>{formatRelativeTime(publishedAt)}</span>
            {scheduledAt && badge === "PROGRAMADA" && (
              <span>Programada {formatRelativeTime(scheduledAt)}</span>
            )}
            {isPublishedVisible && (
              <Link
                href={`/noticias/${id}`}
                className="inline-flex items-center gap-1 font-medium text-brand-blue hover:underline"
              >
                Ver como empleado
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
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
