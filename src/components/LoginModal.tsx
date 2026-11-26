"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Mail } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface LoginModalProps { onClose: () => void; }

export function LoginModal({ onClose }: LoginModalProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);

  useEffect(() => { if (!retryAfter) return; const timer = window.setInterval(() => setRetryAfter((value) => Math.max(0, value - 1)), 1000); return () => window.clearInterval(timer); }, [retryAfter]);

  async function sendMagicLink(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const value = email.trim();
    if (!value || !/^\S+@\S+\.\S+$/.test(value)) { setError("Masukkan alamat email yang valid."); return; }
    const client = createSupabaseBrowserClient();
    if (!client) { setError("Layanan masuk belum dikonfigurasi."); return; }
    setSending(true); setError("");
    const { error: authError } = await client.auth.signInWithOtp({ email: value, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
    if (authError) { setError("Tautan masuk belum terkirim. Coba lagi."); toast("Tautan masuk belum terkirim. Coba lagi.", "danger"); }
    else { setSent(true); setRetryAfter(30); toast("Tautan login terkirim.", "success"); }
    setSending(false);
  }

  async function googleLogin() {
    const client = createSupabaseBrowserClient();
    if (!client) { setError("Layanan masuk belum dikonfigurasi."); return; }
    const { error: authError } = await client.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` } });
    if (authError) { setError("Login Google belum berhasil. Coba lagi."); toast("Login Google belum berhasil. Coba lagi.", "danger"); }
  }

  return <Dialog open title="Masuk ke GRAVEYARD" onClose={onClose} className="login-dialog"><div className="login-content"><p className="modal-intro">Aksi yang menulis data butuh akun. Lihat-lihat tetap bebas.</p><Button variant="secondary" size="lg" className="login-google" onClick={() => void googleLogin}><GoogleIcon />Lanjutkan dengan Google</Button><div className="login-divider"><span />atau<span /></div>{sent ? <div className="login-success" role="status"><Mail size={28} aria-hidden="true" /><h3>Cek emailmu</h3><p>Tautan masuk sudah dikirim ke <strong>{email.trim()}</strong>.</p><Button variant="ghost" disabled={sending || retryAfter > 0} loading={sending} onClick={() => void sendMagicLink()}>{retryAfter > 0 ? `Kirim ulang dalam ${retryAfter} detik` : "Kirim ulang"}</Button></div> : <form onSubmit={(event) => void sendMagicLink(event)}><Input data-autofocus label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="kamu@contoh.com" error={error} leading={<Mail size={16} />} /><Button type="submit" size="lg" className="login-submit" loading={sending}>Kirim tautan masuk</Button></form>}</div></Dialog>;
}

function GoogleIcon() { return <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M21.6 12.23c0-.72-.06-1.42-.18-2.09H12v3.96h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.22c1.89-1.74 2.99-4.3 2.99-7.4Z" /><path fill="currentColor" d="M12 22c2.7 0 4.96-.9 6.61-2.43l-3.22-2.51c-.9.6-2.05.96-3.39.96-2.61 0-4.83-1.76-5.62-4.13H3.05v2.59A9.98 9.98 0 0 0 12 22Z" /><path fill="currentColor" d="M6.38 13.89A6 6 0 0 1 6.06 12c0-.66.11-1.3.32-1.89V7.52H3.05A10 10 0 0 0 2 12c0 1.61.39 3.14 1.05 4.48l3.33-2.59Z" /><path fill="currentColor" d="M12 5.98c1.47 0 2.8.5 3.84 1.49l2.88-2.88C16.95 2.96 14.7 2 12 2a9.98 9.98 0 0 0-8.95 5.52l3.33 2.59C7.17 7.74 9.39 5.98 12 5.98Z" /></svg>; }
