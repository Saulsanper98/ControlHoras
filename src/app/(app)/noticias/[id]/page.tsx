import { notFound } from "next/navigation";
import { Pin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SectionBlock } from "@/components/ui/list-surface";
import { BackLink } from "@/components/ui/back-link";
import { PageHeader } from "@/components/ui/page-header";
import { Stagger } from "@/components/ui/stagger";
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
      <Stagger>
        <div>
          <BackLink href="/noticias">Volver a noticias</BackLink>
          <PageHeader
            title={news.title}
            description={`${formatRelativeTime(news.publishedAt)} · ${news.publishedBy.name}`}
          />
        </div>
      </Stagger>
      <SectionBlock className="space-y-4">
        {news.pinned && (
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-blue">
            <Pin className="h-3.5 w-3.5" aria-hidden />
            Fijada
          </p>
        )}
        {news.imagePath && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/uploads/${news.imagePath}`}
            alt={news.title}
            className="max-h-[28rem] w-full rounded-lg object-cover"
          />
        )}
        <p className="max-w-prose whitespace-pre-line text-base leading-relaxed text-slate-700">
          {news.body}
        </p>
      </SectionBlock>
    </div>
  );
}
