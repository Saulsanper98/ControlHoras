import { redirect } from "next/navigation";
import { Newspaper } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { NewsCreateForm } from "@/components/jefa/news-create-form";
import { NewsItem } from "@/components/jefa/news-item";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSurface } from "@/components/ui/list-surface";
import { Stagger } from "@/components/ui/stagger";
import { requireManagerSession } from "@/lib/auth-helpers";

const NEWS_LIMIT = 100;

export default async function JefaNoticiasPage() {
  const session = await requireManagerSession();
  if (!session) redirect("/");

  const news = await prisma.news.findMany({
    orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
    take: NEWS_LIMIT,
  });

  return (
    <div className="space-y-6">
      <Stagger>
        <PageHeader
          title="Noticias"
          description="Publica, programa y gestiona las noticias de la empresa."
        >
          <NewsCreateForm />
        </PageHeader>
      </Stagger>

      {news.length >= NEWS_LIMIT && (
        <Alert variant="warning">
          <p>
            Se muestran las {NEWS_LIMIT} noticias más recientes. Hay más en el historial.
          </p>
        </Alert>
      )}

      {news.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="Todavía no hay noticias"
          description="Publica la primera noticia para que aparezca en el inicio de los empleados."
        />
      ) : (
        <ListSurface>
          {news.map((n) => (
            <NewsItem
              key={n.id}
              id={n.id}
              title={n.title}
              body={n.body}
              pinned={n.pinned}
              publishedAt={n.publishedAt.toISOString()}
              scheduledAt={n.scheduledAt?.toISOString() ?? null}
              imagePath={n.imagePath}
              status={n.status}
            />
          ))}
        </ListSurface>
      )}
    </div>
  );
}
