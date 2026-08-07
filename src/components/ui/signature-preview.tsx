import { cn } from "@/lib/utils";

export function SignaturePreview({
  label,
  signedAt,
  src,
  alt,
  className,
}: {
  label: string;
  signedAt?: string | null;
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div className={cn(className)}>
      <p className="mb-1 text-xs text-slate-500">
        {label}
        {signedAt ? <span className="ml-1 text-slate-400">· {signedAt}</span> : null}
      </p>
      <img
        src={src}
        alt={alt}
        className="h-16 rounded-lg border border-[color:var(--surface-divider)] bg-[color:var(--surface-muted)] p-2"
      />
    </div>
  );
}
