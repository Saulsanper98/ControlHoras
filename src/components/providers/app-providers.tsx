"use client";

import { ConfirmProvider } from "@/components/ui/confirm-dialog";
import { ToastProvider } from "@/components/ui/toast";
import { DensityProvider } from "@/lib/density";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <DensityProvider>{children}</DensityProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}
