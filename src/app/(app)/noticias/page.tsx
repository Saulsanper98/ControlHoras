import { Newspaper, Pin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Alert } from "@/components/ui/alert";
import { ListSurface } from "@/components/ui/list-surface";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Stagger } from "@/components/ui/stagger";
import { NewsImage } from "@/components/noticias/news-image";
import { formatRelativeTime } from "@/lib/format-relative-time";
import Link from "next/link";

const NEWS_LIMIT = 100;

export default async function NoticiasPage() {
  const now = new Date();
  const news = await prisma.news.findMany({
    where: {
      status: "PUBLICADA",
      OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }],
    },
    orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
    include: { publishedBy: true },
    take: NEWS_LIMIT,
  });

  return (
    <div className="space-y-6">
      <Stagger>
        <PageHeader
          title="Noticias"
          description="Todas las noticias y comunicados de la empresa."
        />
      </Stagger>

      {news.length >= NEWS_LIMIT && (
        <Alert variant="warning">
          <p>Hay más noticias antiguas fuera de esta vista.</p>
        </Alert>
      )}

      {news.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="Sin noticias todavía"
          description="Cuando la responsable publique comunicados, aparecerán aquí."
        />
      ) : (
        <ListSurface>
          {news.map((n) => (
            <Link
              key={n.id}
              href={`/noticias/${n.id}`}
              className="block py-4 transition hover:bg-brand-navy/[0.03]"
            >
              <div className="space-y-1">
                {n.pinned && (
                  <span className="inline-flex w-fit items-center gap-1 rounded-full bg-brand-blue/12 px-2.5 py-0.5 text-xs font-medium text-brand-blue">
                    <Pin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Fijada
                  </span>
                )}
                <p className="font-medium text-brand-navy">{n.title}</p>
              </div>
              <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm text-slate-600">{n.body}</p>
              {n.imagePath && (
                <NewsImage
                  src={`/api/uploads/${n.imagePath}`}
                  alt={n.title}
                  className="mt-3 h-36 w-full rounded-lg object-cover"
                  fallbackClassName="mt-3 h-36 w-full"
                />
              )}
              <p className="mt-2 text-xs text-slate-500">
                {formatRelativeTime(n.publishedAt)} · {n.publishedBy.name}
              </p>
            </Link>
          ))}
        </ListSurface>
      )}
    </div>
  );
}
