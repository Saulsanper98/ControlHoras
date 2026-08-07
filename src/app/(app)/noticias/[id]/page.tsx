import { notFound } from "next/navigation";
import { Pin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SectionBlock } from "@/components/ui/list-surface";
import { BackLink } from "@/components/ui/back-link";
import { formatRelativeTime } from "@/lib/format-relative-time";

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
      <BackLink href="/noticias">Volver a noticias</BackLink>
      <SectionBlock className="space-y-4">
        <div className="flex items-center gap-2">
          {news.pinned && (
            <Pin className="h-4 w-4 shrink-0 text-brand-blue" aria-label="Fijada" />
          )}
          <h1 className="font-display text-2xl font-semibold text-brand-navy">{news.title}</h1>
        </div>
        <p className="text-xs text-slate-500">
          {formatRelativeTime(news.publishedAt)} · {news.publishedBy.name}
        </p>
        {news.imagePath && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/uploads/${news.imagePath}`}
            alt=""
            className="max-h-[28rem] w-full rounded-lg object-cover"
          />
        )}
        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{news.body}</p>
      </SectionBlock>
    </div>
  );
}
