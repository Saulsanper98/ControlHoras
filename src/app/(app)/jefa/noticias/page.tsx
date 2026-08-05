import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { NewsCreateForm } from "@/components/jefa/news-create-form";
import { NewsItem } from "@/components/jefa/news-item";
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
        <p className="text-slate-500">Publica y gestiona las noticias de la empresa.</p>
      </div>

      <NewsCreateForm />

      <div className="space-y-3">
        {news.length === NEWS_LIMIT && (
          <p className="text-xs text-slate-400">
            Mostrando las {NEWS_LIMIT} más recientes.
          </p>
        )}
        {news.length === 0 ? (
          <Card className="text-sm text-slate-400">Todavía no hay noticias publicadas.</Card>
        ) : (
          news.map((n) => (
            <NewsItem
              key={n.id}
              id={n.id}
              title={n.title}
              body={n.body}
              pinned={n.pinned}
              publishedAt={n.publishedAt.toISOString()}
              imagePath={n.imagePath}
            />
          ))
        )}
      </div>
    </div>
  );
}
