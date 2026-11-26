"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Mail } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface LoginModalProps {
  onClose: () => void;
}

function formatAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("provider is not enabled") || lower.includes("unsupported provider")) {
    return "Login Google belum diaktifkan di Supabase Dashboard (Authentication → Providers → Google).";
  }
  if (lower.includes("popup") || lower.includes("blocked")) {
    return "Jendela login Google diblokir browser. Izinkan popup atau coba lagi.";
  }
  if (lower.includes("redirect")) {
    return "Redirect URL belum terdaftar di Supabase Authentication → URL Configuration.";
  }
  return message || "Login Google belum berhasil. Coba lagi.";
}

export function LoginModal({ onClose }: LoginModalProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [oauthError, setOauthError] = useState("");
  const [sending, setSending] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);

  useEffect(() => {
    if (!retryAfter) return;
    const timer = window.setInterval(() => setRetryAfter((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [retryAfter]);

  function getCallbackUrl(): string {
    const pathname = window.location.pathname;
    const safeNext = pathname === "/profile" ? "/profile" : "/";
    return `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;
  }

  async function sendMagicLink(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const value = email.trim();
    if (!value || !/^\S+@\S+\.\S+$/.test(value)) {
      setError("Masukkan alamat email yang valid.");
      return;
    }
    const client = createSupabaseBrowserClient();
    if (!client) {
      const msg = "Layanan masuk belum dikonfigurasi. Isi env Supabase terlebih dahulu.";
      setError(msg);
      toast(msg, "danger");
      return;
    }
    setSending(true);
    setError("");
    setOauthError("");
    try {
      const { error: authError } = await client.auth.signInWithOtp({
        email: value,
        options: { emailRedirectTo: getCallbackUrl() },
      });
      if (authError) {
        const msg = authError.message || "Tautan masuk belum terkirim. Coba lagi.";
        setError(msg);
        toast(msg, "danger");
      } else {
        setSent(true);
        setRetryAfter(30);
        toast("Tautan login terkirim ke emailmu.", "success");
      }
    } catch (reason) {
      const msg = reason instanceof Error ? reason.message : "Tautan masuk belum terkirim. Coba lagi.";
      setError(msg);
      toast(msg, "danger");
    } finally {
      setSending(false);
    }
  }

  async function googleLogin() {
    const client = createSupabaseBrowserClient();
    if (!client) {
      const msg = "Layanan masuk belum dikonfigurasi. Isi env Supabase terlebih dahulu.";
      setOauthError(msg);
      toast(msg, "danger");
      return;
    }
    setGoogleLoading(true);
    setOauthError("");
    setError("");
    try {
      const { data, error: authError } = await client.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getCallbackUrl(),
          queryParams: { prompt: "select_account" },
        },
      });
      if (authError) {
        const msg = formatAuthError(authError.message);
        setOauthError(msg);
        toast(msg, "danger");
        setGoogleLoading(false);
        return;
      }
      if (!data?.url) {
        const msg = "URL otentikasi Google tidak diterima. Pastikan provider Google aktif di Supabase.";
        setOauthError(msg);
        toast(msg, "danger");
        setGoogleLoading(false);
      }
    } catch (reason) {
      const msg = formatAuthError(reason instanceof Error ? reason.message : "");
      setOauthError(msg);
      toast(msg, "danger");
      setGoogleLoading(false);
    }
  }

  return (
    <Dialog open title="Masuk ke GRAVEYARD" onClose={onClose} className="login-dialog">
      <div className="login-content">
        <p className="modal-intro">Aksi yang menulis data butuh akun. Lihat-lihat tetap bebas.</p>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="login-google"
          loading={googleLoading}
          disabled={sending}
          onClick={() => void googleLogin()}
        >
          <GoogleIcon />
          Lanjutkan dengan Google
        </Button>
        {oauthError && (
          <p role="alert" className="status-banner status-banner-danger">{oauthError}</p>
        )}
        <div className="login-divider"><span />atau<span /></div>
        {sent ? (
          <div className="login-success" role="status">
            <Mail size={28} aria-hidden="true" />
            <h3>Cek emailmu</h3>
            <p>Tautan masuk sudah dikirim ke <strong>{email.trim()}</strong>.</p>
            <Button
              type="button"
              variant="ghost"
              disabled={sending || retryAfter > 0}
              loading={sending}
              onClick={() => void sendMagicLink()}
            >
              {retryAfter > 0 ? `Kirim ulang dalam ${retryAfter} detik` : "Kirim ulang"}
            </Button>
          </div>
        ) : (
          <form onSubmit={(event) => void sendMagicLink(event)}>
            <Input
              data-autofocus
              label="Alamat Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={error}
              leading={<Mail size={16} />}
            />
            <Button type="submit" size="lg" className="login-submit" loading={sending} disabled={googleLoading}>
              Kirim tautan masuk
            </Button>
          </form>
        )}
      </div>
    </Dialog>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="currentColor" d="M21.6 12.23c0-.72-.06-1.42-.18-2.09H12v3.96h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.22c1.89-1.74 2.99-4.3 2.99-7.4Z" />
      <path fill="currentColor" d="M12 22c2.7 0 4.96-.9 6.61-2.43l-3.22-2.51c-.9.6-2.05.96-3.39.96-2.61 0-4.83-1.76-5.62-4.13H3.05v2.59A9.98 9.98 0 0 0 12 22Z" />
      <path fill="currentColor" d="M6.38 13.89A6 6 0 0 1 6.06 12c0-.66.11-1.3.32-1.89V7.52H3.05A10 10 0 0 0 2 12c0 1.61.39 3.14 1.05 4.48l3.33-2.59Z" />
      <path fill="currentColor" d="M12 5.98c1.47 0 2.8.5 3.84 1.49l2.88-2.88C16.95 2.96 14.7 2 12 2a9.98 9.98 0 0 0-8.95 5.52l3.33 2.59C7.17 7.74 9.39 5.98 12 5.98Z" />
    </svg>
  );
}
