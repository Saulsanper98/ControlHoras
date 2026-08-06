"use client";

import { cn } from "@/lib/utils";

export function Stagger({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={cn("animate-fade-slide-up", className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export function StaggerGroup({
  children,
  className,
  step = 70,
}: {
  children: React.ReactNode;
  className?: string;
  step?: number;
}) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <div className={className}>
      {items.map((child, i) => (
        <Stagger key={i} delay={i * step}>
          {child}
        </Stagger>
      ))}
    </div>
  );
}
