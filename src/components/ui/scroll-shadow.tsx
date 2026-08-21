"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function ScrollShadow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function check() {
      const node = el!;
      setShowLeft(node.scrollLeft > 4);
      setShowRight(node.scrollWidth - node.scrollLeft - node.clientWidth > 4);
    }

    check();
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      el.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  return (
    <div className={cn("relative", className)}>
      <div ref={ref} className="overflow-x-auto">
        {children}
      </div>
      {showLeft && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[color:var(--app-gradient-top)]/90 to-transparent"
        />
      )}
      {showRight && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[color:var(--app-gradient-top)]/90 to-transparent"
        />
      )}
    </div>
  );
}
