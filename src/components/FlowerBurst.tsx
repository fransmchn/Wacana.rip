"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";

interface FlowerBurstProps {
  active: boolean;
  onDone: () => void;
}

const petals = Array.from({ length: 16 }, (_, index) => {
  const spread = ((index * 137) % 100) / 100 - 0.5;
  return {
    x: spread * 150,
    drift: spread * 190 + 24,
    delay: (index % 6) * 0.075,
    duration: 1.35 + (index % 5) * 0.16,
    rotate: (index % 2 ? 1 : -1) * (180 + (index * 37) % 320),
    scale: 0.72 + ((index * 29) % 60) / 100,
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
        <motion.i
          key={index}
          className={`digital-petal digital-petal-${petal.tone}`}
          style={{ scale: petal.scale }}
          initial={{ opacity: 0, x: petal.x, y: -70, rotate: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: [petal.x, petal.x + petal.drift * 0.4, petal.drift],
            y: [-70, -10, 64, 140],
            rotate: [0, petal.rotate],
          }}
          transition={{ duration: petal.duration, delay: petal.delay, ease: [0.22, 0.61, 0.36, 1], times: [0, 0.35, 0.7, 1] }}
        />
      ))}
    </span>
  );
}
