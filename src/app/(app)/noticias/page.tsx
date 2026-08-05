import { Pin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";

const NEWS_LIMIT = 100;

export default async function NoticiasPage() {
  const news = await prisma.news.findMany({
    orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
    include: { publishedBy: true },
    take: NEWS_LIMIT,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-navy">Noticias</h1>
        <p className="text-slate-500">Todas las noticias y comunicados de la empresa.</p>
      </div>

      <div className="space-y-3">
        {news.length === 0 ? (
          <Card className="text-sm text-slate-400">Todavía no hay noticias publicadas.</Card>
        ) : (
          news.map((n) => (
            <Card key={n.id}>
              <div className="flex items-center gap-2">
                {n.pinned && <Pin className="h-3.5 w-3.5 text-brand-blue" />}
                <p className="font-medium text-brand-navy">{n.title}</p>
              </div>
              <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{n.body}</p>
              {n.imagePath && (
                <img
                  src={`/api/uploads/${n.imagePath}`}
                  alt=""
                  className="mt-2 max-h-64 rounded-md border border-slate-200"
                />
              )}
              <p className="mt-2 text-xs text-slate-400">
                {n.publishedAt.toLocaleDateString("es-ES")} · {n.publishedBy.name}
              </p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
