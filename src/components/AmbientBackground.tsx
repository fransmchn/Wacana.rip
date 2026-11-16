"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface Firefly { left: string; top: string; delay: number; duration: number; size: number; }

function createFireflies(count: number): Firefly[] {
  return Array.from({ length: count }, (_, index) => ({
    left: `${8 + ((index * 47) % 84)}%`,
    top: `${8 + ((index * 67) % 82)}%`,
    delay: (index % 7) * -0.7,
    duration: 4 + (index % 4),
    size: index % 3 === 0 ? 3 : 2,
  }));
}

export function AmbientBackground() {
  const reducedMotion = useReducedMotion();
  const [fireflies, setFireflies] = useState<Firefly[]>([]);

  useEffect(() => {
    setFireflies(createFireflies(window.innerWidth < 640 ? 8 : 20));
  }, []);

  return (
    <div aria-hidden="true">
      <div className="noise" />
      <div className="mist" />
      <div className="mist mist-two" />
      {!reducedMotion && <div className="fireflies">{fireflies.map((firefly, index) => <motion.i key={index} className="firefly" style={{ left: firefly.left, top: firefly.top, width: firefly.size, height: firefly.size }} animate={{ opacity: [0.18, 0.8, 0.18], scale: [0.8, 1.25, 0.8] }} transition={{ duration: firefly.duration, delay: firefly.delay, repeat: Infinity, ease: "easeInOut" }} />)}</div>}
    </div>
  );
}
