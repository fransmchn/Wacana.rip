"use client";

import { useEffect, type CSSProperties } from "react";
import { useReducedMotion } from "framer-motion";

interface FlowerBurstProps {
  active: boolean;
  onDone: () => void;
}

const petals = Array.from({ length: 10 }, (_, index) => {
  const spread = ((index * 137) % 100) / 100 - 0.5;
  return {
    x: spread * 150,
    drift: spread * 190 + 24,
    delay: (index % 6) * 0.075,
    duration: 1.35 + (index % 5) * 0.16,
    rotate: (index % 2 ? 1 : -1) * (180 + ((index * 37) % 320)),
    scale: 0.72 + (((index * 29) % 60) / 100),
    tone: index % 3,
  };
});

export function FlowerBurst({ active, onDone }: FlowerBurstProps) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(onDone, reducedMotion ? 600 : 1900);
    return () => window.clearTimeout(timer);
  }, [active, onDone, reducedMotion]);

  if (!active) return null;
  if (reducedMotion) {
    return <span className="flower-burst-reduced" aria-live="polite">+1 bunga</span>;
  }

  return (
    <span className="flower-burst" aria-hidden="true">
      {petals.map((petal, index) => (
        <i
          key={index}
          className={`digital-petal digital-petal-${petal.tone}`}
          style={{
            "--petal-x": `${petal.x}px`,
            "--petal-drift": `${petal.drift}px`,
            "--petal-rotate": `${petal.rotate}deg`,
            "--petal-scale": petal.scale,
            "--petal-delay": `${petal.delay}s`,
            "--petal-duration": `${petal.duration}s`,
          } as CSSProperties}
        />
      ))}
    </span>
  );
}
