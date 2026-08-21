"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const VIDEO_SRC = "/brand/login-loop.mp4";

/**
 * Fondo en bucle del login.
 * El vídeo permanece visible (no opacity-0): un velo navy se retira al estar listo.
 * Así se evita el deadlock de algunos navegadores que no cargan media invisible.
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
    if (reduceMotion) return;
    const el = videoRef.current;
    if (!el) return;

    const markReady = () => setReady(true);

    if (el.readyState >= 2) markReady();

    const tryPlay = () => {
      void el.play().then(markReady).catch(() => {
        // Autoplay bloqueado: el frame estático sigue visible bajo el velo.
        markReady();
      });
    };

    el.addEventListener("loadeddata", markReady);
    el.addEventListener("canplay", tryPlay);
    el.addEventListener("playing", markReady);

    // Si el navegador ya tenía el recurso en caché.
    if (el.readyState >= 3) tryPlay();

    return () => {
      el.removeEventListener("loadeddata", markReady);
      el.removeEventListener("canplay", tryPlay);
      el.removeEventListener("playing", markReady);
    };
  }, [reduceMotion]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden bg-brand-navy">
      {!reduceMotion && (
        <video
          ref={videoRef}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-[transform,filter] duration-[1200ms] ease-out",
            revealed ? "scale-105 brightness-110" : "scale-100 brightness-100"
          )}
          src={VIDEO_SRC}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onError={() => setReady(true)}
        />
      )}

      {/* Velo que se retira al cargar (en lugar de ocultar el <video>) */}
      <div
        className={cn(
          "absolute inset-0 bg-brand-navy transition-opacity duration-700 ease-out",
          ready || reduceMotion ? "opacity-0" : "opacity-100"
        )}
      />

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
