import Link from "next/link";
import { Pin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ListSurface } from "@/components/ui/list-surface";

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
      <div>
        <h1 className="text-2xl font-semibold text-brand-navy">Noticias</h1>
        <p className="text-brand-navy/55">Todas las noticias y comunicados de la empresa.</p>
      </div>

      {news.length === 0 ? (
        <p className="border-y border-brand-navy/10 py-6 text-sm text-slate-500">
          Todavía no hay noticias publicadas.
        </p>
      ) : (
        <ListSurface>
          {news.map((n) => (
            <Link
              key={n.id}
              href={`/noticias/${n.id}`}
              className="block py-4 transition hover:bg-brand-navy/[0.03]"
            >
              <div className="flex items-center gap-2">
                {n.pinned && <Pin className="h-3.5 w-3.5 text-brand-blue" />}
                <p className="font-medium text-brand-navy">{n.title}</p>
              </div>
              <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm text-slate-600">{n.body}</p>
              {n.imagePath && (
                <img
                  src={`/api/uploads/${n.imagePath}`}
                  alt=""
                  className="mt-2 max-h-64 rounded-md"
                />
              )}
              <p className="mt-2 text-xs text-slate-500">
                {n.publishedAt.toLocaleDateString("es-ES")} · {n.publishedBy.name}
              </p>
            </Link>
          ))}
        </ListSurface>
      )}
    </div>
  );
}
