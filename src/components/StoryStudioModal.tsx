"use client";

import { useEffect, useRef, useState } from "react";
import { Award, Crown, Download, Flame, Lock, ReceiptText, Share2, Sparkles } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  STORY_TEMPLATES,
  downloadStoryPng,
  getCertificateSerial,
  renderStoryCanvas,
  shareStoryImage,
  type StoryTemplate,
} from "@/lib/storyCanvas";
import type { Makam, NisanTema } from "@/types/graveyard";

interface StoryStudioModalProps {
  makam: Makam;
  vip: boolean;
  theme: NisanTema;
  onClose: () => void;
  onUpgrade?: (makam: Makam) => void;
}

export function StoryStudioModal({ makam, vip, theme, onClose, onUpgrade }: StoryStudioModalProps) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [template, setTemplate] = useState<StoryTemplate>("struk");
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);

  const activeMeta = STORY_TEMPLATES.find((t) => t.id === template);
  const lockedAkta = Boolean(activeMeta?.vipOnly && !vip);
  const serial = getCertificateSerial(makam.id);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    void renderStoryCanvas(canvas, makam, { template, vip, theme }, 0.5).catch(() => {
      if (!cancelled) toast("Pratinjau story gagal dirender.", "danger");
    });
    return () => { cancelled = true; };
  }, [makam, template, vip, theme, toast]);

  async function handleDownload() {
    if (lockedAkta) {
      onUpgrade?.(makam);
      return;
    }
    setDownloading(true);
    try {
      await downloadStoryPng(makam, { template, vip, theme });
      toast(
        template === "akta"
          ? `Akta Gugur Resmi (${serial}) berhasil diunduh.`
          : "Gambar diunduh! Siap di-upload ke Instagram Story.",
        "success",
      );
    } catch (reason) {
      toast(reason instanceof Error ? reason.message : "Story gagal dibuat.", "danger");
    } finally {
      setDownloading(false);
    }
  }

  async function handleShare() {
    if (lockedAkta) {
      onUpgrade?.(makam);
      return;
    }
    setSharing(true);
    try {
      const outcome = await shareStoryImage(makam, { template, vip, theme });
      if (outcome === "shared") {
        toast("Berhasil dibagikan ke aplikasi pilihanmu!", "success");
      } else if (outcome === "fallback") {
        toast("Gambar diunduh! Siap di-upload ke Instagram Story.", "success");
      }
    } catch (reason) {
      toast(reason instanceof Error ? reason.message : "Gagal membagikan gambar story.", "danger");
    } finally {
      setSharing(false);
    }
  }

  const busy = downloading || sharing;

  return (
    <Dialog
      open
      title="IG Story Studio & Akta"
      onClose={onClose}
      className="modal-dialog-wide story-studio-dialog"
      footer={
        <div className="story-footer-actions">
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>Tutup</Button>
          <div className="story-footer-primary">
            {lockedAkta ? (
              <Button type="button" onClick={() => onUpgrade?.(makam)}>
                <Crown size={16} aria-hidden="true" />
                Buka Akta Resmi (VIP — Rp 15.000)
              </Button>
            ) : (
              <>
                <Button type="button" variant="secondary" loading={downloading} disabled={sharing} onClick={() => void handleDownload()}>
                  <Download size={16} aria-hidden="true" />
                  Unduh PNG
                </Button>
                <Button type="button" loading={sharing} disabled={downloading} onClick={() => void handleShare()}>
                  <Share2 size={16} aria-hidden="true" />
                  Bagikan ke IG Story / Apps
                </Button>
              </>
            )}
          </div>
        </div>
      }
    >
      <div className="story-studio">
        <p className="modal-intro">Pilih templat 9:16 untuk dibagikan ke Instagram Story, atau cetak Akta Gugur Resmi eksklusif VIP.</p>

        <div className="story-template-grid" role="group" aria-label="Pilih templat story">
          {STORY_TEMPLATES.map((item) => {
            const isLocked = Boolean(item.vipOnly && !vip);
            return (
              <button
                key={item.id}
                type="button"
                className={`story-template-button ${template === item.id ? "story-template-active" : ""} ${isLocked ? "story-template-locked" : ""}`}
                aria-pressed={template === item.id}
                onClick={() => setTemplate(item.id)}
              >
                <span className="story-template-icon" aria-hidden="true">
                  {item.id === "struk" ? <ReceiptText size={15} /> : item.id === "wrapped" ? <Flame size={15} /> : item.id === "aura" ? <Sparkles size={15} /> : isLocked ? <Lock size={14} /> : <Award size={15} />}
                </span>
                <span><strong>{item.label}</strong><small>{item.hint}</small></span>
              </button>
            );
          })}
        </div>

        <div className="story-preview-wrap">
          <div className="story-preview-frame">
            <canvas ref={canvasRef} className={`story-preview-canvas ${lockedAkta ? "story-preview-locked" : ""}`} role="img" aria-label={`Pratinjau story ${template}`} />
            {lockedAkta && (
              <div className="story-lock-overlay" role="status">
                <Crown size={20} aria-hidden="true" />
                <strong>Akta Gugur Resmi · Eksklusif VIP</strong>
                <p>No. Seri {serial} · Upgrade monumen ini ke Bukit Kehormatan untuk mengunduh akta resmi bersegel emas.</p>
              </div>
            )}
          </div>
          <span className="story-preview-caption">
            {template === "akta"
              ? `Akta Resmi No. ${serial} · Resolusi cetak 1080×1920`
              : vip
                ? "Ekspor VIP ARCHIVE 1080×1920 · graveyard.rip"
                : "Ekspor gratis 1080×1920 · GRAVEYARD"}
          </span>
        </div>
      </div>
    </Dialog>
  );
}
