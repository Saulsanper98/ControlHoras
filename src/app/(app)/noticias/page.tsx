import Link from "next/link";
import { Newspaper } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Alert } from "@/components/ui/alert";
import { ListSurface } from "@/components/ui/list-surface";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Stagger } from "@/components/ui/stagger";
import { NewsCard } from "@/components/noticias/news-card";

const PAGE_SIZE = 20;

export default async function NoticiasPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const now = new Date();
  const where = {
    status: "PUBLICADA" as const,
    OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }],
  };

  const [news, total] = await Promise.all([
    prisma.news.findMany({
      where,
      orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
      include: { publishedBy: true },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.news.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-8">
      <Stagger>
        <PageHeader
          title="Noticias"
          description="Comunicados y novedades de la empresa."
        />
      </Stagger>

      {news.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="Sin noticias todavía"
          description="Cuando la responsable publique comunicados, aparecerán aquí."
        />
      ) : (
        <>
          <ListSurface>
            {news.map((n) => (
              <NewsCard
                key={n.id}
                variant="list"
                href={`/noticias/${n.id}`}
                news={{
                  id: n.id,
                  title: n.title,
                  body: n.body,
                  pinned: n.pinned,
                  publishedAt: n.publishedAt,
                  authorName: n.publishedBy.name,
                  imagePath: n.imagePath,
                }}
              />
            ))}
          </ListSurface>

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <p className="text-slate-500">
                Página {page} de {totalPages}
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link href={`/noticias?page=${page - 1}`} className="btn-sm btn-ghost">
                    Anterior
                  </Link>
                )}
                {page < totalPages && (
                  <Link href={`/noticias?page=${page + 1}`} className="btn-sm btn-ghost">
                    Siguiente
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {total > PAGE_SIZE && page === totalPages && (
        <Alert variant="info">
          <p>Fin del listado ({total} noticias).</p>
        </Alert>
      )}
    </div>
  );
}
