import { Card } from "@/components/ui/card";

export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-navy">{title}</h1>
        <p className="text-slate-500">{description}</p>
      </div>
      <Card className="border-dashed text-center text-sm text-slate-400">
        Esta sección está en construcción. Muy pronto estará disponible.
      </Card>
    </div>
  );
}
