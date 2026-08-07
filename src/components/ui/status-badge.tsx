import { cn } from "@/lib/utils";
import {
  LEAVE_STATUS_COLOR,
  LEAVE_STATUS_LABEL,
  TIMESHEET_STATUS_COLOR,
  TIMESHEET_STATUS_LABEL,
} from "@/lib/labels";

const PRESETS = {
  timesheet: { label: TIMESHEET_STATUS_LABEL, color: TIMESHEET_STATUS_COLOR },
  leave: { label: LEAVE_STATUS_LABEL, color: LEAVE_STATUS_COLOR },
} as const;

export function StatusBadge({
  status,
  preset = "timesheet",
  className,
}: {
  status: string;
  preset?: keyof typeof PRESETS;
  className?: string;
}) {
  const map = PRESETS[preset];
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        map.color[status] ?? "bg-brand-navy/8 text-slate-600",
        className
      )}
    >
      {map.label[status] ?? status}
    </span>
  );
}
