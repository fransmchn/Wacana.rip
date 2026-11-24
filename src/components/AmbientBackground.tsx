"use client";

import type { CSSProperties } from "react";
import { usePointerGlow } from "@/hooks/usePointerGlow";

interface Firefly { left: string; top: string; delay: number; duration: number; size: number; }

/** Delapan partikel statis: animasinya dijalankan CSS, bukan JS per frame. */
const fireflies: Firefly[] = Array.from({ length: 8 }, (_, index) => ({
  left: `${8 + ((index * 47) % 84)}%`,
  top: `${8 + ((index * 67) % 82)}%`,
  delay: (index % 7) * -0.7,
  duration: 5 + (index % 4),
  size: index % 3 === 0 ? 3 : 2,
}));

export function AmbientBackground() {
  const ref = usePointerGlow<HTMLDivElement>("viewport");

  return (
    <div ref={ref} aria-hidden="true">
      <div className="noise" />
      <div className="fog-bank fog-bank-low" />
      <div className="fog-bank fog-bank-high" />
      <div className="mist" />
      <div className="mist mist-two" />
      <div className="fireflies">
        {fireflies.map((firefly, index) => (
          <i
            key={index}
            className="firefly"
            style={{ left: firefly.left, top: firefly.top, width: firefly.size, height: firefly.size, "--firefly-delay": `${firefly.delay}s`, "--firefly-duration": `${firefly.duration}s` } as CSSProperties}
          />
        ))}
      </div>
      <div className="cursor-light" />
      <div className="cursor-dark" />
    </div>
  );
}
