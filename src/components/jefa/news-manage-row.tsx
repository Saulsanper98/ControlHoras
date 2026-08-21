"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, ExternalLink } from "lucide-react";
import { NewsCard } from "@/components/noticias/news-card";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { deleteNewsAction } from "@/app/(app)/jefa/noticias/actions";

function newsBadgeStatus(status: string, scheduledAt: string | null | undefined): string {
  if (scheduledAt && new Date(scheduledAt).getTime() > Date.now() && status !== "PUBLICADA") {
    return "PROGRAMADA";
  }
  if (status === "PUBLICADA") return "PUBLICADA";
  return "BORRADOR";
}

/** Fila de listado jefa: card compartida + acciones (editar en detalle, no inline). */
export function NewsManageRow({
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
  const [pending, startTransition] = useTransition();

  const badge = newsBadgeStatus(status, scheduledAt);
  const isPublishedVisible =
    status === "PUBLICADA" &&
    (!scheduledAt || new Date(scheduledAt).getTime() <= Date.now());

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

  return (
    <NewsCard
      variant="manage"
      news={{
        id,
        title,
        body,
        pinned,
        publishedAt,
        imagePath,
        status: badge,
      }}
      metaExtra={
        <>
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
        </>
      }
      actions={
        <>
          <Link
            href={`/jefa/noticias/${id}`}
            aria-label="Editar noticia"
            className="hit-area inline-flex items-center justify-center rounded-lg text-slate-400 transition hover:bg-brand-navy/6 hover:text-brand-blue"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={pending}
            aria-label="Eliminar noticia"
            className="hit-area inline-flex items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-500/10 hover:text-red-600 disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </>
      }
    />
  );
}
