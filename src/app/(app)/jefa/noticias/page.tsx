import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NewsCreateForm } from "@/components/jefa/news-create-form";
import { NewsItem } from "@/components/jefa/news-item";
import { ListSurface } from "@/components/ui/list-surface";
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
      <div>
        <h1 className="text-2xl font-semibold text-brand-navy">Noticias</h1>
        <p className="text-brand-navy/55">Publica, programa y gestiona las noticias de la empresa.</p>
      </div>

      <NewsCreateForm />

      {news.length === 0 ? (
        <p className="border-y border-brand-navy/10 py-6 text-sm text-slate-500">
          Todavía no hay noticias.
        </p>
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
              imagePath={n.imagePath}
              status={n.status}
            />
          ))}
        </ListSurface>
      )}
    </div>
  );
}
