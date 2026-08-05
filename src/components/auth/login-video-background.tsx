"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Fondo en bucle del login. Fade-in al estar listo el vídeo.
 * Con `revealed`, el velo se aclara en la transición de acceso.
 */
export function LoginVideoBackground({ revealed = false }: { revealed?: boolean }) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [ready, setReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.readyState >= 3) setReady(true);
  }, [reduceMotion]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden bg-brand-navy">
      {!reduceMotion && (
        <video
          ref={videoRef}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-[opacity,transform,filter] duration-[1200ms] ease-out",
            ready ? "opacity-100" : "opacity-0",
            revealed ? "scale-105 brightness-110" : "scale-100 brightness-100"
          )}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onCanPlay={() => setReady(true)}
        >
          <source src="/brand/login-loop.mp4" type="video/mp4" />
        </video>
      )}

      <div
        className={cn(
          "absolute inset-0 bg-brand-navy transition-opacity duration-[1100ms] ease-out",
          revealed ? "opacity-15" : "opacity-55"
        )}
      />
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-[1100ms] ease-out",
          revealed ? "opacity-25" : "opacity-100"
        )}
        style={{
          background: `
            radial-gradient(ellipse 55% 45% at 15% 20%, rgba(0, 124, 186, 0.35), transparent 60%),
            radial-gradient(ellipse 50% 40% at 90% 80%, rgba(245, 234, 97, 0.12), transparent 55%),
            linear-gradient(180deg, rgba(10, 34, 64, 0.25) 0%, rgba(10, 34, 64, 0.55) 100%)
          `,
        }}
      />
    </div>
  );
}
