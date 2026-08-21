import Link from "next/link";
import { Pin } from "lucide-react";
import { ListRow } from "@/components/ui/list-surface";
import { NewsImage } from "@/components/noticias/news-image";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { cn } from "@/lib/utils";

export type NewsCardData = {
  id: string;
  title: string;
  body: string;
  pinned?: boolean;
  publishedAt: Date | string;
  authorName?: string | null;
  imagePath?: string | null;
  /** Badge de estado (jefa): PUBLICADA | BORRADOR | PROGRAMADA */
  status?: string | null;
};

/**
 * Pieza compartida de noticias: dashboard, listado empleado y listado jefa.
 * `compact` = dashboard; `list` = empleado; `manage` = jefa (acciones aparte).
 */
export function NewsCard({
  news,
  href,
  variant = "list",
  actions,
  metaExtra,
  className,
}: {
  news: NewsCardData;
  href?: string;
  variant?: "compact" | "list" | "manage";
  actions?: React.ReactNode;
  metaExtra?: React.ReactNode;
  className?: string;
}) {
  const publishedAt =
    typeof news.publishedAt === "string" ? news.publishedAt : news.publishedAt.toISOString();
  const imageSrc = news.imagePath ? `/api/uploads/${news.imagePath}` : null;
  const excerptLines = variant === "compact" ? "line-clamp-2" : "line-clamp-3";

  const titleBlock = (
    <div className="min-w-0 flex-1 space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        {news.pinned && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-brand-blue/12 px-2 py-0.5 text-xs font-medium text-brand-blue">
            <Pin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Fijada
          </span>
        )}
        {news.status && variant === "manage" && (
          <StatusBadge status={news.status} preset="news" />
        )}
      </div>
      <p
        className={cn(
          "font-medium text-brand-navy",
          variant === "compact" ? "text-sm" : "text-base"
        )}
      >
        {news.title}
      </p>
      <p
        className={cn(
          "whitespace-pre-line text-sm text-slate-600",
          excerptLines
        )}
      >
        {news.body}
      </p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
        <span>{formatRelativeTime(publishedAt)}</span>
        {news.authorName ? <span>{news.authorName}</span> : null}
        {metaExtra}
      </div>
    </div>
  );

  const thumb =
    imageSrc && variant !== "compact" ? (
      <NewsImage
        src={imageSrc}
        alt={news.title}
        className={cn(
          "shrink-0 object-cover",
          variant === "list"
            ? "mt-3 h-40 w-full sm:mt-0 sm:h-24 sm:w-36"
            : "mt-3 h-36 w-full max-w-xs sm:mt-0 sm:h-24 sm:w-36"
        )}
        fallbackClassName={
          variant === "list"
            ? "mt-3 h-40 w-full sm:mt-0 sm:h-24 sm:w-36"
            : "mt-3 h-36 w-full max-w-xs sm:mt-0 sm:h-24 sm:w-36"
        }
      />
    ) : null;

  const body = (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col sm:flex-row sm:gap-4">
        {titleBlock}
        {thumb}
      </div>
      {actions && <div className="flex shrink-0 items-start gap-1">{actions}</div>}
    </div>
  );

  if (href && variant !== "manage") {
    return (
      <ListRow className="!py-0" interactive>
        <Link href={href} className="block px-0 py-4 sm:py-3.5">
          {body}
        </Link>
      </ListRow>
    );
  }

  return (
    <ListRow interactive={false} className={cn("py-4", className)}>
      {body}
    </ListRow>
  );
}
