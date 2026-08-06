"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";

const STORAGE_KEY = "portal-onboarding-done";

const STEPS = [
  {
    title: "Tu control horario",
    body: "Rellena el mes, guarda borrador y fírmalo cuando esté listo. La responsable lo revisará después.",
    href: "/control-horario",
    cta: "Ir al control horario",
  },
  {
    title: "Firma y envío",
    body: "Al firmar, el control queda bloqueado hasta que la responsable lo apruebe o lo rechace con motivo.",
    href: "/control-horario",
    cta: "Entendido",
  },
  {
    title: "Vacaciones y horas",
    body: "Consulta tu saldo, solicita vacaciones desde el modal y revisa tu bolsa de horas acumulada.",
    href: "/vacaciones",
    cta: "Ver vacaciones",
  },
];

export function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "1") return;
    const t = window.setTimeout(() => setOpen(true), 600);
    return () => window.clearTimeout(t);
  }, []);

  function finish() {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  }

  const current = STEPS[step];

  return (
    <Modal
      open={open}
      onClose={finish}
      title={`Bienvenido · Paso ${step + 1} de ${STEPS.length}`}
    >
      <button
        type="button"
        onClick={finish}
        className="absolute right-14 top-6 text-xs text-slate-400 hover:text-brand-navy"
      >
        Omitir
      </button>
      <p className="font-display text-base font-semibold text-brand-navy">{current.title}</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{current.body}</p>
      <div className="mt-2 flex gap-1">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${i <= step ? "bg-brand-blue" : "bg-brand-navy/10"}`}
          />
        ))}
      </div>
      <div className="mt-6 flex justify-between gap-2">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-brand-navy/6"
          >
            Atrás
          </button>
        ) : (
          <span />
        )}
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="btn-press rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue-dark"
          >
            Siguiente
          </button>
        ) : (
          <Link
            href={current.href}
            onClick={finish}
            className="btn-press rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue-dark"
          >
            {current.cta}
          </Link>
        )}
      </div>
    </Modal>
  );
}
