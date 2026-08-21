import { redirect } from "next/navigation";
import Link from "next/link";
import { Newspaper } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { NewsCreateForm } from "@/components/jefa/news-create-form";
import { NewsManageRow } from "@/components/jefa/news-manage-row";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSurface } from "@/components/ui/list-surface";
import { Select } from "@/components/ui/select";
import { Stagger } from "@/components/ui/stagger";
import { SectionBlock } from "@/components/ui/list-surface";
import { requireManagerSession } from "@/lib/auth-helpers";

const PAGE_SIZE = 20;

export default async function JefaNoticiasPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; estado?: string }>;
}) {
  const session = await requireManagerSession();
  if (!session) redirect("/");

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const estado = params.estado || "";

  const where =
    estado === "BORRADOR" || estado === "PUBLICADA"
      ? { status: estado as "BORRADOR" | "PUBLICADA" }
      : estado === "PROGRAMADA"
        ? {
            status: "BORRADOR" as const,
            scheduledAt: { gt: new Date() },
          }
        : {};

  const [news, total] = await Promise.all([
    prisma.news.findMany({
      where,
      orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.news.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(p: number) {
    const qs = new URLSearchParams();
    if (estado) qs.set("estado", estado);
    if (p > 1) qs.set("page", String(p));
    const q = qs.toString();
    return q ? `/jefa/noticias?${q}` : "/jefa/noticias";
  }

  return (
    <div className="space-y-8">
      <Stagger>
        <PageHeader
          title="Noticias"
          description="Publica, programa y gestiona los comunicados de la empresa."
        >
          <NewsCreateForm />
        </PageHeader>
      </Stagger>

      <SectionBlock>
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div className="w-44">
            <label htmlFor="news-estado" className="mb-1 block text-xs font-medium text-slate-500">
              Estado
            </label>
            <Select id="news-estado" name="estado" defaultValue={estado}>
              <option value="">Todos</option>
              <option value="PUBLICADA">Publicada</option>
              <option value="BORRADOR">Borrador</option>
              <option value="PROGRAMADA">Programada</option>
            </Select>
          </div>
          <button type="submit" className="btn-primary">
            Filtrar
          </button>
          {estado && (
            <Link href="/jefa/noticias" className="btn-ghost">
              Limpiar filtros
            </Link>
          )}
        </form>
      </SectionBlock>

      {news.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title={estado ? "Ninguna noticia coincide" : "Todavía no hay noticias"}
          description={
            estado
              ? "Prueba otro estado o limpia el filtro."
              : "Publica la primera noticia para que aparezca en el inicio de los empleados."
          }
          action={
            estado ? (
              <Link href="/jefa/noticias" className="btn-primary">
                Limpiar filtros
              </Link>
            ) : (
              <NewsCreateForm />
            )
          }
        />
      ) : (
        <>
          <ListSurface>
            {news.map((n) => (
              <NewsManageRow
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

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <p className="text-slate-500">
                Página {page} de {totalPages} · {total} noticias
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link href={pageHref(page - 1)} className="btn-sm btn-ghost">
                    Anterior
                  </Link>
                )}
                {page < totalPages && (
                  <Link href={pageHref(page + 1)} className="btn-sm btn-ghost">
                    Siguiente
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
