"use client";

import { useState } from "react";
import { TimeSheetGrid } from "@/components/control-horario/timesheet-grid";

type GridEntry = {
  day: number;
  checkIn: string | null;
  checkOut: string | null;
  totalHours: number;
  normalHours: number;
  overtimeHours: number;
  nightHours: number;
  notes: string | null;
};

export function TimeSheetGridSection({
  month,
  year,
  entries,
}: {
  month: number;
  year: number;
  entries: GridEntry[];
}) {
  const [showAllDays, setShowAllDays] = useState(true);

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowAllDays((v) => !v)}
          className="btn-sm btn-ghost text-slate-500"
        >
          {showAllDays ? "Solo rellenados" : "Ver mes completo"}
        </button>
      </div>
      <TimeSheetGrid
        month={month}
        year={year}
        entries={entries}
        showAllDays={showAllDays}
      />
    </div>
  );
}
