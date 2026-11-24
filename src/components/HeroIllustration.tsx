"use client";

import { motion, useReducedMotion, useSpring } from "framer-motion";
import { Sparkles } from "lucide-react";
import { StatsBanner } from "@/components/StatsBanner";
import type { Statistik } from "@/types/graveyard";

const dust = Array.from({ length: 22 }, (_, index) => ({
  left: `${6 + ((index * 37) % 88)}%`,
  top: `${10 + ((index * 53) % 78)}%`,
  size: index % 4 === 0 ? 3 : index % 3 === 0 ? 2 : 1,
  delay: (index % 8) * -0.9,
  duration: 4.5 + (index % 5) * 1.3,
  drift: ((index * 19) % 30) - 15,
}));

export function HeroIllustration({ statistik }: { statistik: Statistik }) {
  const reducedMotion = useReducedMotion();
  const rotateX = useSpring(0, { stiffness: 120, damping: 22 });
  const rotateY = useSpring(0, { stiffness: 120, damping: 22 });

  function handleMove(event: React.PointerEvent<HTMLDivElement>) {
    if (reducedMotion || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const nx = (event.clientX - rect.left) / rect.width - 0.5;
    const ny = (event.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(nx * 14);
    rotateX.set(-ny * 10);
  }

  function handleLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <div className="altar-column">
      <div className="altar-scene" onPointerMove={handleMove} onPointerLeave={handleLeave}>
        <div className="altar-aura" aria-hidden="true" />
        <div className="altar-dust" aria-hidden="true">
          {dust.map((particle, index) => (
            <motion.i
              key={index}
              className="dust-mote"
              style={{ left: particle.left, top: particle.top, width: particle.size, height: particle.size }}
              animate={reducedMotion ? undefined : { y: [8, -48], x: [0, particle.drift], opacity: [0, 0.75, 0] }}
              transition={{ duration: particle.duration, delay: particle.delay, repeat: Infinity, ease: "linear" }}
            />
          ))}
        </div>

        <motion.div className="altar-monument" style={reducedMotion ? undefined : { rotateX, rotateY, transformPerspective: 900 }}>
          <div className="altar-ground-shadow" aria-hidden="true" />
          <div className="altar-stone" aria-hidden="true">
            <div className="altar-stone-face">
              <Sparkles className="altar-crest" size={22} strokeWidth={1.4} />
              <p className="altar-kicker">T P U · W A C A N A</p>
              <p className="altar-rip">RIP</p>
              <span className="altar-rule" />
              <p className="altar-name">Wacana</p>
              <p className="altar-year">EST. 2026</p>
            </div>
          </div>
          <div className="altar-plinth altar-plinth-top" aria-hidden="true" />
          <div className="altar-plinth altar-plinth-mid" aria-hidden="true" />
          <div className="altar-plinth altar-plinth-base" aria-hidden="true" />
          <div className="altar-candle altar-candle-left" aria-hidden="true"><span className="altar-flame" /></div>
          <div className="altar-candle altar-candle-right" aria-hidden="true"><span className="altar-flame" /></div>
        </motion.div>
      </div>
      <StatsBanner statistik={statistik} />
    </div>
  );
}
