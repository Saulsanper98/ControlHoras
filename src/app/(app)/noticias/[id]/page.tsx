import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";

export default async function NoticiaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const now = new Date();
  const news = await prisma.news.findFirst({
    where: {
      id,
      status: "PUBLICADA",
      OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }],
    },
    include: { publishedBy: true },
  });
  if (!news) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/noticias" className="inline-flex items-center gap-1 text-sm text-brand-blue hover:underline">
        <ChevronLeft className="h-4 w-4" />
        Volver a noticias
      </Link>
      <Card>
        <div className="flex items-center gap-2">
          {news.pinned && <Pin className="h-4 w-4 text-brand-blue" />}
          <h1 className="font-display text-2xl font-semibold text-brand-navy">{news.title}</h1>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {news.publishedAt.toLocaleDateString("es-ES")} · {news.publishedBy.name}
        </p>
        {news.imagePath && (
          <img
            src={`/api/uploads/${news.imagePath}`}
            alt=""
            className="mt-4 max-h-[28rem] w-full rounded-xl object-cover"
          />
        )}
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-700">{news.body}</p>
      </Card>
    </div>
  );
}
