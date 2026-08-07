import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BackLink } from "@/components/ui/back-link";
import { PageHeader } from "@/components/ui/page-header";
import { SectionBlock } from "@/components/ui/list-surface";
import { Stagger } from "@/components/ui/stagger";
import { StatusBadge } from "@/components/ui/status-badge";
import { NewsEditForm } from "@/components/jefa/news-edit-form";
import { requireManagerSession } from "@/lib/auth-helpers";

function newsBadgeStatus(status: string, scheduledAt: Date | null): string {
  if (scheduledAt && scheduledAt.getTime() > Date.now() && status !== "PUBLICADA") {
    return "PROGRAMADA";
  }
  if (status === "PUBLICADA") return "PUBLICADA";
  return "BORRADOR";
}

export default async function JefaNoticiaEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireManagerSession();
  if (!session) redirect("/");

  const { id } = await params;
  const news = await prisma.news.findUnique({ where: { id } });
  if (!news) notFound();

  const badge = newsBadgeStatus(news.status, news.scheduledAt);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Stagger>
        <div>
          <BackLink href="/jefa/noticias">Volver a noticias</BackLink>
          <PageHeader
            title="Editar noticia"
            description="Los cambios se reflejan en el portal de los empleados según el estado."
          >
            <StatusBadge status={badge} preset="news" />
          </PageHeader>
        </div>
      </Stagger>
      <SectionBlock>
        <NewsEditForm
          id={news.id}
          title={news.title}
          body={news.body}
          pinned={news.pinned}
          scheduledAt={news.scheduledAt?.toISOString() ?? null}
          status={news.status}
          imagePath={news.imagePath}
        />
      </SectionBlock>
    </div>
  );
}
