import { cn } from "@/lib/utils";
import {
  ACTIVE_STATUS_COLOR,
  ACTIVE_STATUS_LABEL,
  LEAVE_STATUS_COLOR,
  LEAVE_STATUS_LABEL,
  LEAVE_TYPE_COLOR,
  LEAVE_TYPE_LABEL,
  NEWS_STATUS_COLOR,
  NEWS_STATUS_LABEL,
  SCHEDULE_STATUS_COLOR,
  SCHEDULE_STATUS_LABEL,
  TIMESHEET_STATUS_COLOR,
  TIMESHEET_STATUS_LABEL,
} from "@/lib/labels";

const PRESETS = {
  timesheet: { label: TIMESHEET_STATUS_LABEL, color: TIMESHEET_STATUS_COLOR },
  leave: { label: LEAVE_STATUS_LABEL, color: LEAVE_STATUS_COLOR },
  leaveType: { label: LEAVE_TYPE_LABEL, color: {} as Record<string, string> },
  active: { label: ACTIVE_STATUS_LABEL, color: ACTIVE_STATUS_COLOR },
  news: { label: NEWS_STATUS_LABEL, color: NEWS_STATUS_COLOR },
  schedule: { label: SCHEDULE_STATUS_LABEL, color: SCHEDULE_STATUS_COLOR },
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
  const color =
    preset === "leaveType"
      ? LEAVE_TYPE_COLOR[status] ?? "bg-brand-navy/[0.06] text-slate-600"
      : map.color[status] ?? "bg-brand-navy/8 text-slate-600";

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        color,
        className
      )}
    >
      {map.label[status] ?? status}
    </span>
  );
}
