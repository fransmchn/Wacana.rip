"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Landmark, ReceiptText, Sparkles } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { STORY_TEMPLATES, downloadStoryPng, renderStoryCanvas, type StoryTemplate } from "@/lib/storyCanvas";
import type { Makam, NisanTema } from "@/types/graveyard";

interface StoryStudioModalProps {
  makam: Makam;
  vip: boolean;
  theme: NisanTema;
  onClose: () => void;
}

export function StoryStudioModal({ makam, vip, theme, onClose }: StoryStudioModalProps) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [template, setTemplate] = useState<StoryTemplate>("struk");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    void renderStoryCanvas(canvas, makam, { template, vip, theme }, 0.5).catch(() => {
      if (!cancelled) toast("Pratinjau story gagal dirender.", "danger");
    });
    return () => { cancelled = true; };
  }, [makam, template, vip, theme, toast]);

  async function download() {
    setBusy(true);
    try {
      await downloadStoryPng(makam, { template, vip, theme });
      toast("Story 9:16 siap dibagikan.", "success");
    } catch (reason) {
      toast(reason instanceof Error ? reason.message : "Story gagal dibuat.", "danger");
    } finally { setBusy(false); }
  }

  return (
    <Dialog open title="IG Story Studio" onClose={onClose} className="modal-dialog-wide story-studio-dialog" footer={<>
      <Button type="button" variant="ghost" onClick={onClose}>Tutup</Button>
      <Button type="button" loading={busy} onClick={() => void download()}><Download size={16} aria-hidden="true" />Unduh Story (1080×1920)</Button>
    </>}>
      <div className="story-studio">
        <p className="modal-intro">Tiga templat viral 9:16 untuk dibagikan ke Instagram Story. Pilih gaya, tinjau hasilnya, lalu unduh PNG tajam 1080×1920.</p>

        <div className="story-template-grid" role="group" aria-label="Pilih templat story">
          {STORY_TEMPLATES.map((item) => (
            <button key={item.id} type="button" className={`story-template-button ${template === item.id ? "story-template-active" : ""}`} aria-pressed={template === item.id} onClick={() => setTemplate(item.id)}>
              <span className="story-template-icon" aria-hidden="true">
                {item.id === "struk" ? <ReceiptText size={15} /> : item.id === "editorial" ? <Sparkles size={15} /> : <Landmark size={15} />}
              </span>
              <span><strong>{item.label}</strong><small>{item.hint}</small></span>
            </button>
          ))}
        </div>

        <div className="story-preview-wrap">
          <div className="story-preview-frame">
            <canvas ref={canvasRef} className="story-preview-canvas" role="img" aria-label={`Pratinjau story ${template}`} />
          </div>
          <span className="story-preview-caption">{vip ? "Ekspor VIP 1080×1920 · branding halus graveyard.rip" : "Ekspor gratis 1080×1920 · GRAVEYARD"}</span>
        </div>
      </div>
    </Dialog>
  );
}
