"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";

const STORAGE_KEY = "portal-onboarding-done";

const STEPS = [
  {
    title: "Tu control horario",
    body: "Rellena el mes, guarda borrador y fírmalo cuando esté listo. Al firmar, el control queda bloqueado hasta que la responsable lo apruebe o lo rechace con motivo.",
    href: "/control-horario",
    cta: "Ir al control horario",
  },
  {
    title: "Vacaciones y horas",
    body: "Consulta tu saldo, solicita vacaciones desde la pantalla de vacaciones y revisa tu bolsa de horas acumulada.",
    href: "/vacaciones",
    cta: "Ver vacaciones",
  },
  {
    title: "Horario y noticias",
    body: "En Mi horario verás el cuadrante vigente de tu departamento. En Noticias encontrarás los comunicados internos de la empresa.",
    href: "/horario",
    cta: "Ver mi horario",
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
  const isLast = step === STEPS.length - 1;

  return (
    <Modal
      open={open}
      onClose={finish}
      title={`Bienvenido · Paso ${step + 1} de ${STEPS.length}`}
      closeLabel="Cerrar e omitir introducción"
    >
      <p className="font-display text-base font-semibold text-brand-navy">{current.title}</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{current.body}</p>
      <div className="mt-2 flex gap-1" aria-hidden="true">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${i <= step ? "bg-brand-blue" : "bg-brand-navy/10"}`}
          />
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={finish}
          className="btn-sm btn-ghost text-slate-400"
        >
          Omitir introducción
        </button>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="btn-ghost"
            >
              Atrás
            </button>
          )}
          {!isLast && current.href && (
            <Link href={current.href} onClick={finish} className="btn-ghost">
              {current.cta}
            </Link>
          )}
          {isLast ? (
            <Link href={current.href} onClick={finish} className="btn-primary">
              {current.cta}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="btn-primary"
            >
              Siguiente
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
