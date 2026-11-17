"use client";

import { FormEvent, useState } from "react";
import { Mail, X } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface LoginModalProps { onClose: () => void; }

export function LoginModal({ onClose }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function magicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = createSupabaseBrowserClient();
    if (!client) { setError("Supabase belum dikonfigurasi."); return; }
    setSending(true); setError(""); setMessage("");
    const { error: authError } = await client.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
    if (authError) setError(`Login gagal: ${authError.message}`);
    else setMessage("Link masuk sudah dikirim. Cek inbox, lalu kembali ke TPU Wacana.");
    setSending(false);
  }

  async function googleLogin() {
    const client = createSupabaseBrowserClient();
    if (!client) { setError("Supabase belum dikonfigurasi."); return; }
    const { error: authError } = await client.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` } });
    if (authError) setError(`Login Google gagal: ${authError.message}`);
  }

  return <div role="dialog" aria-modal="true" aria-labelledby="login-title" className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4" onClick={onClose}><div className="panel modal-surface w-full max-w-md rounded-2xl p-6 sm:p-8" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Akses peziarah</p><h2 id="login-title" className="mt-2 text-2xl font-semibold">Masuk dulu biar bisa melayat.</h2><p className="mt-2 text-sm text-[#a7a69f]">Aksi yang menulis data butuh akun. Lihat-lihat tetap bebas.</p></div><button onClick={onClose} className="grid min-h-11 min-w-11 place-items-center rounded-full border border-[#ffffff1a] text-[#a7a69f]" aria-label="Tutup login"><X size={18} /></button></div><button onClick={googleLogin} className="mt-7 min-h-12 w-full rounded-xl border border-[#ffffff22] bg-[#ffffff08] text-sm font-semibold transition hover:bg-[#ffffff12]">Lanjutkan dengan Google</button><div className="my-6 flex items-center gap-3 text-xs text-[#6c6b67]"><span className="h-px flex-1 bg-[#ffffff12]" />atau<span className="h-px flex-1 bg-[#ffffff12]" /></div><form onSubmit={magicLink} className="space-y-3"><label className="block text-sm font-medium" htmlFor="login-email">Email</label><div className="relative"><Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6c6b67]" aria-hidden="true" /><input id="login-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="kamu@contoh.com" className="pl-9" /></div><button disabled={sending} className="min-h-12 w-full rounded-xl bg-[#d87078] text-sm font-semibold text-[#211116] disabled:opacity-60">{sending ? "Mengirim..." : "Kirim magic link"}</button></form>{message && <p role="status" className="mt-4 text-sm text-[#d8ad69]">{message}</p>}{error && <p role="alert" className="mt-4 text-sm text-[#f08c91]">{error}</p>}</div></div>;
}
