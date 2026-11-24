"use client";

import { useEffect, useRef } from "react";

type PointerGlowMode = "viewport" | "element";

/**
 * Menulis posisi pointer langsung ke CSS custom properties, paling banyak
 * sekali per frame. Tidak ada state React dan tidak ada render ulang saat
 * kursor bergerak. Mode "viewport" dipakai overlay layar penuh, mode
 * "element" dipakai untuk cahaya/paralaks di dalam satu container.
 */
export function usePointerGlow<T extends HTMLElement>(mode: PointerGlowMode = "element") {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;

    let frame = 0;
    let clientX = 0;
    let clientY = 0;
    let outside = true;

    const write = () => {
      frame = 0;

      if (outside) {
        if (mode === "element") {
          element.style.setProperty("--mouse-x", "50%");
          element.style.setProperty("--mouse-y", "50%");
          element.style.setProperty("--tilt-x", "0");
          element.style.setProperty("--tilt-y", "0");
        }
        return;
      }

      let x = clientX;
      let y = clientY;

      if (mode === "element") {
        // Satu pembacaan layout per frame, bukan per event pointermove.
        const rect = element.getBoundingClientRect();
        x -= rect.left;
        y -= rect.top;
        element.style.setProperty("--tilt-x", String(Math.max(-0.5, Math.min(0.5, x / rect.width - 0.5))));
        element.style.setProperty("--tilt-y", String(Math.max(-0.5, Math.min(0.5, y / rect.height - 0.5))));
      }

      element.style.setProperty("--mouse-x", `${x}px`);
      element.style.setProperty("--mouse-y", `${y}px`);
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(write);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      outside = false;
      clientX = event.clientX;
      clientY = event.clientY;
      schedule();
    };

    const onLeave = () => {
      outside = true;
      schedule();
    };

    if (mode === "viewport") {
      window.addEventListener("pointermove", onMove, { passive: true });
    } else {
      element.addEventListener("pointermove", onMove, { passive: true });
      element.addEventListener("pointerleave", onLeave, { passive: true });
    }

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      if (mode === "viewport") {
        window.removeEventListener("pointermove", onMove);
      } else {
        element.removeEventListener("pointermove", onMove);
        element.removeEventListener("pointerleave", onLeave);
      }
    };
  }, [mode]);

  return ref;
}
