"use client";

import { Flower2 } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";

interface FlowerBurstProps {
  active: boolean;
  onDone: () => void;
}

const petals = [
  { x: -34, y: 38, rotate: -30 },
  { x: -20, y: 58, rotate: 22 },
  { x: 0, y: 68, rotate: -10 },
  { x: 20, y: 58, rotate: 35 },
  { x: 34, y: 34, rotate: 12 },
  { x: -28, y: 18, rotate: -45 },
  { x: 12, y: 28, rotate: 60 },
  { x: 0, y: 12, rotate: 0 },
];

export function FlowerBurst({ active, onDone }: FlowerBurstProps) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(onDone, reducedMotion ? 500 : 900);
    return () => window.clearTimeout(timer);
  }, [active, onDone, reducedMotion]);

  if (!active) return null;
  if (reducedMotion) {
    return <span className="flower-burst-reduced" aria-live="polite">+1 bunga</span>;
  }

  return (
    <span className="flower-burst" aria-hidden="true">
      {petals.map((petal, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, x: 0, y: 12, scale: 0.4, rotate: 0 }}
          animate={{ opacity: [0, 1, 0], x: petal.x, y: petal.y, scale: [0.4, 1, 0.7], rotate: petal.rotate }}
          transition={{ duration: 0.8, delay: index * 0.025, ease: "easeOut" }}
          className="flower-petal"
        >
          <Flower2 size={14} strokeWidth={1.8} />
        </motion.span>
      ))}
    </span>
  );
}
