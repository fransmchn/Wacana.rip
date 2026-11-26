"use client";

import type { CSSProperties } from "react";
import { Sparkles } from "lucide-react";
import { StatsBanner } from "@/components/StatsBanner";
import { usePointerGlow } from "@/hooks/usePointerGlow";
import type { Statistik } from "@/types/graveyard";

const dust = Array.from({ length: 8 }, (_, index) => ({
  left: `${6 + ((index * 37) % 88)}%`,
  top: `${10 + ((index * 53) % 78)}%`,
  size: index % 4 === 0 ? 3 : 2,
  delay: (index % 8) * -0.9,
  duration: 5 + (index % 5) * 1.3,
  drift: ((index * 19) % 30) - 15,
}));

export function HeroIllustration({ statistik }: { statistik: Statistik }) {
  const sceneRef = usePointerGlow<HTMLDivElement>("element");

  return (
    <div className="altar-column">
      <div ref={sceneRef} className="altar-scene">
        <div className="altar-aura" aria-hidden="true" />
        <div className="altar-dust" aria-hidden="true">
          {dust.map((particle, index) => (
            <i
              key={index}
              className="dust-mote"
              style={{ left: particle.left, top: particle.top, width: particle.size, height: particle.size, "--dust-delay": `${particle.delay}s`, "--dust-duration": `${particle.duration}s`, "--dust-drift": `${particle.drift}px` } as CSSProperties}
            />
          ))}
        </div>

        <div className="altar-monument">
          <div className="altar-ground-shadow" aria-hidden="true" />
          <div className="altar-stone" aria-hidden="true">
            <div className="altar-stone-face">
              <Sparkles className="altar-crest" size={22} strokeWidth={1.4} />
              <p className="altar-kicker">G R A V E Y A R D</p>
              <p className="altar-rip">RIP</p>
              <span className="altar-rule" />
              <p className="altar-name">Graveyard</p>
              <p className="altar-year">EST. 2026</p>
            </div>
          </div>
          <div className="altar-plinth altar-plinth-top" aria-hidden="true" />
          <div className="altar-plinth altar-plinth-mid" aria-hidden="true" />
          <div className="altar-plinth altar-plinth-base" aria-hidden="true" />
          <div className="altar-candle altar-candle-left" aria-hidden="true"><span className="altar-flame" /></div>
          <div className="altar-candle altar-candle-right" aria-hidden="true"><span className="altar-flame" /></div>
        </div>
      </div>
      <StatsBanner statistik={statistik} />
    </div>
  );
}
