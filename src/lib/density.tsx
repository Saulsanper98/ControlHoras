"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Density = "comfortable" | "compact";

type DensityContextValue = {
  density: Density;
  setDensity: (d: Density) => void;
  tableCell: string;
};

const DensityContext = createContext<DensityContextValue | null>(null);

const STORAGE_KEY = "portal-density";

export function DensityProvider({ children }: { children: React.ReactNode }) {
  const [density, setDensityState] = useState<Density>("comfortable");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Density | null;
    if (stored === "compact" || stored === "comfortable") {
      setDensityState(stored);
    }
  }, []);

  function setDensity(d: Density) {
    setDensityState(d);
    localStorage.setItem(STORAGE_KEY, d);
  }

  const tableCell = density === "compact" ? "px-2 py-1" : "px-3 py-1.5";

  const value = useMemo(
    () => ({ density, setDensity, tableCell }),
    [density, tableCell]
  );

  return (
    <DensityContext.Provider value={value}>{children}</DensityContext.Provider>
  );
}

export function useDensity() {
  const ctx = useContext(DensityContext);
  return ctx ?? { density: "comfortable" as Density, setDensity: () => {}, tableCell: "px-3 py-1.5" };
}
