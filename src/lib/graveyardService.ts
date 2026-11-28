import { getVipIds, isVipMakam, releaseVipId } from "@/lib/payment";
import { seedData } from "@/lib/seedData";
import { applyThemeOverrides, getThemeOverride, setThemeOverride } from "@/lib/themeService";
import { createId } from "@/lib/utils";
import { DEFAULT_TEMA, getTemaNisan, isNisanTema, isTemaVip } from "@/lib/themes";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import { KATEGORI, normalizeKategori, type CreateMakamInput, type EditMakamInput, type KomentarInput, type Komentar, type Makam, type NisanTema, type Statistik } from "@/types/graveyard";

/** Pemetaan tema bawaan untuk data seed Supabase yang belum memiliki kolom `tema`. */
const SEED_THEME_BY_TITLE: Record<string, { tema: NisanTema; vip?: boolean }> = {
  "analisis sentimen twitter": { tema: "batu-lapuk" },
  "ganti judul skripsi ke-4": { tema: "beton-retak" },
  "aplikasi to-do list super canggih": { tema: "obsidian-emas", vip: true },
  "rewrite semuanya pakai framework baru": { tema: "y2k-chrome", vip: true },
  "redesign logo yang nggak pernah jadi": { tema: "marmer-lumut", vip: true },
  "startup marketplace lokal": { tema: "batu-lapuk" },
  "usaha kopi kekinian": { tema: "beton-retak" },
  "gym tiap hari 2026": { tema: "crimson-velvet", vip: true },
};

function isMissingColumnError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const code = error.code ?? "";
  const msg = (error.message ?? "").toLowerCase();
  return code === "42703" || code === "PGRST204" || msg.includes("column") || msg.includes("schema cache");
}

export interface BungaHariIni { sudahMenabur: boolean; serverNow: string; berlakuHingga?: string; }
export class BungaSudahDitaburError extends Error {
  constructor() {
    super("Kamu sudah menabur bunga di makam ini hari ini.");
    this.name = "BungaSudahDitaburError";
  }
}
const STORAGE_KEY = "wacana-rip:v1";
type SupabaseClient = ReturnType<typeof createSupabaseBrowserClient>;
type MakamRow = Database["public"]["Tables"]["makam"]["Row"];
type KomentarRow = Database["public"]["Tables"]["komentar"]["Row"];

function supabase(): SupabaseClient {
  return createSupabaseBrowserClient();
}

function assertStorageMode(): void {
  if (!isSupabaseConfigured() && process.env.NODE_ENV === "production") {
    throw new Error("Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
}

function localFallback<T>(action: () => T): T {
  assertStorageMode();
  return action();
}

function localStorageAvailable(): boolean {
  return typeof window !== "undefined";
}

function cloneSeed(): Makam[] {
  return applyThemeOverrides(seedData.map((makam) => ({ ...makam, komentar: makam.komentar.map((komentar) => ({ ...komentar })) })));
}

function readLocal(): Makam[] {
  if (!localStorageAvailable()) return cloneSeed();
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const initial = cloneSeed();
      writeLocal(initial);
      return initial;
    }
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) throw new Error("Storage data bukan array");
    return applyThemeOverrides(parsed as Makam[]);
  } catch {
    const fallback = cloneSeed();
    try { writeLocal(fallback); } catch { /* localStorage unavailable; keep memory fallback. */ }
    return fallback;
  }
}

function writeLocal(makam: Makam[]): void {
  if (localStorageAvailable()) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(makam));
}

function updateLocal(id: string, update: (makam: Makam) => Makam): Makam {
  const makam = readLocal();
  const index = makam.findIndex((item) => item.id === id);
  if (index === -1) throw new Error("Makam tidak ditemukan.");
  makam[index] = update(makam[index]);
  writeLocal(makam);
  return makam[index];
}

function cleanText(value: string | undefined, maxLength: number, fallback = ""): string {
  return (value ?? fallback).trim().slice(0, maxLength);
}

function assertDate(value: string, label: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(new Date(`${value}T00:00:00`).getTime())) throw new Error(`${label} tidak valid.`);
}

function assertInput(input: CreateMakamInput): CreateMakamInput {
  const rawKategori = typeof input.kategori === "string" ? input.kategori.trim().toLowerCase() : "";
  if (!(KATEGORI as readonly string[]).includes(rawKategori)) throw new Error("Kategori tidak valid.");
  const clean = {
    ...input,
    judul: cleanText(input.judul, 120),
    kategori: normalizeKategori(rawKategori),
    pembuat: cleanText(input.pembuat, 30, "Anonim") || "Anonim",
    tanggalMulai: cleanText(input.tanggalMulai, 10),
    tanggalMenyerah: cleanText(input.tanggalMenyerah, 10),
    penyebab: cleanText(input.penyebab, 160),
    epitaph: cleanText(input.epitaph, 140),
    kronologi: cleanText(input.kronologi, 1000),
    kerugianTeks: cleanText(input.kerugianTeks, 280),
    tema: getTemaNisan(input.tema).id,
  };
  if (!clean.judul) throw new Error("Nama wacana wajib diisi.");
  assertDate(clean.tanggalMulai, "Tanggal mulai");
  assertDate(clean.tanggalMenyerah, "Tanggal menyerah");
  if (clean.tanggalMenyerah < clean.tanggalMulai) throw new Error("Tanggal gugur tidak boleh sebelum tanggal lahir.");
  if (clean.tanggalMenyerah > new Date().toISOString().slice(0, 10)) throw new Error("Tanggal gugur belum terjadi.");
  if (!clean.penyebab) throw new Error("Penyebab kematian wajib diisi.");
  if (!clean.epitaph) throw new Error("Kata terakhir wajib diisi.");
  assertAngka(clean.kerugianRupiah, "Kerugian rupiah");
  assertAngka(clean.kerugianJam, "Kerugian jam");
  return clean;
}

function assertAngka(value: number | undefined, label: string): void {
  if (value === undefined) return;
  if (!Number.isFinite(value) || value < 0) throw new Error(`${label} tidak boleh negatif.`);
}

function mapComment(row: KomentarRow): Komentar {
  return { id: row.id, nama: row.nama_tampil, isi: row.isi, createdAt: row.created_at };
}

function mapMakam(row: MakamRow, komentar: Komentar[] = [], authorName?: string): Makam {
  const seedHint = SEED_THEME_BY_TITLE[row.judul.trim().toLowerCase()];
  const dbTema = isNisanTema(row.tema) ? row.tema : undefined;
  const resolvedVip = Boolean(row.is_vip) || Boolean(seedHint?.vip);
  const canUseVipTheme = resolvedVip || row.bunga_count >= 20 || getVipIds().includes(row.id);
  const candidateTema = getThemeOverride(row.id) ?? dbTema ?? seedHint?.tema ?? DEFAULT_TEMA;
  const resolvedTema = !canUseVipTheme && isTemaVip(candidateTema) ? DEFAULT_TEMA : candidateTema;
  const pembuat = row.tampil_anonim ? "Anonim" : (authorName?.trim() || "Anonim");

  return {
    id: row.id,
    userId: row.user_id ?? undefined,
    judul: row.judul,
    kategori: row.kategori,
    pembuat,
    tanggalMulai: row.tanggal_mulai,
    tanggalMenyerah: row.tanggal_menyerah,
    penyebab: row.penyebab,
    epitaph: row.epitaph,
    kronologi: row.kronologi ?? "",
    kerugianTeks: row.kerugian_teks ?? "",
    ...(row.kerugian_rupiah === null ? {} : { kerugianRupiah: row.kerugian_rupiah }),
    ...(row.kerugian_jam === null ? {} : { kerugianJam: Number(row.kerugian_jam) }),
    bunga: row.bunga_count,
    tema: resolvedTema,
    ...(resolvedVip ? { vip: true } : {}),
    ...(row.capsule_message ? { capsuleMessage: row.capsule_message } : {}),
    ...(row.capsule_unlock_at ? { capsuleUnlockAt: row.capsule_unlock_at } : {}),
    komentar,
    createdAt: row.created_at,
  };
}

async function fetchAuthorNames(
  client: NonNullable<SupabaseClient>,
  userIds: Array<string | null | undefined>,
): Promise<Map<string, string>> {
  const uniqueIds = Array.from(new Set(userIds.filter((id): id is string => Boolean(id))));
  const map = new Map<string, string>();
  if (!uniqueIds.length) return map;
  try {
    const result = await client.from("profiles").select("id, display_name").in("id", uniqueIds);
    if (!result.error && Array.isArray(result.data)) {
      for (const row of result.data as Array<{ id: string; display_name?: string | null }>) {
        if (row.id && row.display_name?.trim()) map.set(row.id, row.display_name.trim());
      }
    }
  } catch {
    /* Profil bersifat best-effort agar tamu tidak pernah gagal memuat makam. */
  }
  return map;
}

function throwSupabase(error: { message: string } | null): void {
  if (error) throw new Error(`Supabase: ${error.message}`);
}

async function getRemoteComments(client: NonNullable<SupabaseClient>, makamId: string): Promise<Komentar[]> {
  const result = await client.from("komentar").select("*").eq("makam_id", makamId).order("created_at", { ascending: false });
  throwSupabase(result.error);
  return (result.data ?? []).map(mapComment);
}

async function requireUser(client: NonNullable<SupabaseClient>): Promise<string> {
  const { data, error } = await client.auth.getUser();
  throwSupabase(error);
  if (!data.user) throw new Error("Masuk dulu agar bisa melakukan ritual ini.");
  return data.user.id;
}

export async function listMakam(): Promise<Makam[]> {
  const client = supabase();
  if (!client) return localFallback(readLocal);
  const result = await client.from("makam").select("*").order("tanggal_menyerah", { ascending: false });
  throwSupabase(result.error);
  const rows = (result.data ?? []) as MakamRow[];
  const authors = await fetchAuthorNames(client, rows.map((row) => row.user_id));
  return Promise.all(
    rows.map(async (row) => mapMakam(row, await getRemoteComments(client, row.id), row.user_id ? authors.get(row.user_id) : undefined)),
  );
}

export async function getMakam(id: string): Promise<Makam | null> {
  const client = supabase();
  if (!client) return localFallback(() => readLocal().find((makam) => makam.id === id) ?? null);
  const result = await client.from("makam").select("*").eq("id", id).maybeSingle();
  throwSupabase(result.error);
  if (!result.data) return null;
  const row = result.data as MakamRow;
  const authors = await fetchAuthorNames(client, [row.user_id]);
  return mapMakam(row, await getRemoteComments(client, id), row.user_id ? authors.get(row.user_id) : undefined);
}

export async function createMakam(rawInput: CreateMakamInput): Promise<Makam> {
  const input = assertInput(rawInput);
  // Paywall Guard: form pembuatan makam tidak boleh langsung memasang status VIP atau tema VIP.
  // Upgrade VIP hanya sah lewat persistVipUpgrade() setelah pembayaran terverifikasi.
  const safeTema: NisanTema = isTemaVip(input.tema) ? DEFAULT_TEMA : input.tema;
  const client = supabase();
  if (!client) return localFallback(() => {
    const makam: Makam = {
      id: createId(),
      userId: "local",
      judul: input.judul,
      kategori: input.kategori,
      pembuat: input.pembuat ?? "Anonim",
      tanggalMulai: input.tanggalMulai,
      tanggalMenyerah: input.tanggalMenyerah,
      penyebab: input.penyebab,
      epitaph: input.epitaph,
      kronologi: input.kronologi ?? "",
      kerugianTeks: input.kerugianTeks ?? "",
      ...(input.kerugianRupiah === undefined ? {} : { kerugianRupiah: input.kerugianRupiah }),
      ...(input.kerugianJam === undefined ? {} : { kerugianJam: input.kerugianJam }),
      bunga: 0,
      tema: safeTema,
      vip: false,
      komentar: [],
      createdAt: new Date().toISOString(),
    };
    const makamList = readLocal();
    makamList.unshift(makam);
    writeLocal(makamList);
    setThemeOverride(makam.id, safeTema);
    return makam;
  });
  const userId = await requireUser(client);
  const basePayload = {
    user_id: userId,
    judul: input.judul,
    kategori: input.kategori,
    tanggal_mulai: input.tanggalMulai,
    tanggal_menyerah: input.tanggalMenyerah,
    penyebab: input.penyebab,
    epitaph: input.epitaph,
    kronologi: input.kronologi || null,
    kerugian_teks: input.kerugianTeks || null,
    kerugian_rupiah: input.kerugianRupiah ?? null,
    kerugian_jam: input.kerugianJam ?? null,
  };
  let result = await client.from("makam").insert({
    ...basePayload,
    tema: safeTema,
    is_vip: false,
  }).select("*").single();
  if (isMissingColumnError(result.error)) {
    result = await client.from("makam").insert(basePayload).select("*").single();
  }
  throwSupabase(result.error);
  if (!result.data) throw new Error("Supabase tidak mengembalikan makam baru.");
  setThemeOverride(result.data.id, safeTema);
  const authors = await fetchAuthorNames(client, [userId]);
  return {
    ...mapMakam(result.data as MakamRow, [], authors.get(userId) ?? input.pembuat),
    tema: safeTema,
    vip: false,
  };
}

/** Makam milik pengguna. Mode lokal memakai semua data demo sebagai "milik saya". */
export async function listMakamSaya(userId?: string): Promise<Makam[]> {
  const client = supabase();
  if (!client) return localFallback(readLocal);
  if (!userId) throw new Error("Masuk dulu untuk melihat makammu.");
  const result = await client.from("makam").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  throwSupabase(result.error);
  const rows = (result.data ?? []) as MakamRow[];
  const authors = await fetchAuthorNames(client, [userId]);
  const ownerName = authors.get(userId);
  return Promise.all(rows.map(async (row) => mapMakam(row, await getRemoteComments(client, row.id), ownerName)));
}

/** Sunting catatan dan tema nisan; makam non-VIP tidak bisa langsung memasang tema VIP tanpa pembayaran. */
export async function updateMakam(id: string, rawInput: EditMakamInput, userId?: string): Promise<Makam> {
  const rawKategori = typeof rawInput.kategori === "string" ? rawInput.kategori.trim().toLowerCase() : "";
  if (!(KATEGORI as readonly string[]).includes(rawKategori)) throw new Error("Kategori tidak valid.");
  const input = {
    judul: cleanText(rawInput.judul, 120),
    kategori: normalizeKategori(rawKategori),
    penyebab: cleanText(rawInput.penyebab, 160),
    epitaph: cleanText(rawInput.epitaph, 140),
    tema: getTemaNisan(rawInput.tema).id,
  };
  if (!input.judul) throw new Error("Nama wacana wajib diisi.");
  if (!input.penyebab) throw new Error("Penyebab kematian wajib diisi.");
  if (!input.epitaph) throw new Error("Kata terakhir wajib diisi.");

  const client = supabase();
  if (!client) return localFallback(() => {
    const existing = readLocal().find((item) => item.id === id);
    if (!existing) throw new Error("Makam tidak ditemukan.");
    if (isTemaVip(input.tema) && !isVipMakam(existing)) {
      throw new Error("Upgrade ke VIP diperlukan untuk memasang tema premium.");
    }
    setThemeOverride(id, input.tema);
    return updateLocal(id, (makam) => ({ ...makam, ...input }));
  });

  // Verifikasi status VIP makam di database sebelum mengizinkan tema VIP
  const existingCheck = await client.from("makam").select("*").eq("id", id).maybeSingle();
  throwSupabase(existingCheck.error);
  if (!existingCheck.data) throw new Error("Makam tidak ditemukan atau bukan milikmu.");
  const existingRow = existingCheck.data as MakamRow;
  const seedHint = SEED_THEME_BY_TITLE[existingRow.judul.trim().toLowerCase()];
  const alreadyVip =
    Boolean(existingRow.is_vip) ||
    Boolean(seedHint?.vip) ||
    existingRow.bunga_count >= 20 ||
    getVipIds().includes(id);

  if (isTemaVip(input.tema) && !alreadyVip) {
    throw new Error("Upgrade ke VIP diperlukan untuk memasang tema premium.");
  }

  const baseUpdate = {
    judul: input.judul,
    kategori: input.kategori,
    penyebab: input.penyebab,
    epitaph: input.epitaph,
  };
  let query = client.from("makam").update({ ...baseUpdate, tema: input.tema }).eq("id", id);
  if (userId) query = query.eq("user_id", userId);
  let result = await query.select("*").maybeSingle();
  if (isMissingColumnError(result.error)) {
    let fallbackQuery = client.from("makam").update(baseUpdate).eq("id", id);
    if (userId) fallbackQuery = fallbackQuery.eq("user_id", userId);
    result = await fallbackQuery.select("*").maybeSingle();
  }
  throwSupabase(result.error);
  if (!result.data) throw new Error("Makam tidak ditemukan atau bukan milikmu.");
  setThemeOverride(id, input.tema);
  const authors = await fetchAuthorNames(client, [(result.data as MakamRow).user_id]);
  return {
    ...mapMakam(result.data as MakamRow, await getRemoteComments(client, id), authors.get((result.data as MakamRow).user_id ?? "")),
    tema: input.tema,
  };
}

/** Sinkronkan upgrade VIP & tema ke Supabase (graceful jika kolom belum ada) serta localStorage. */
export async function persistVipUpgrade(id: string, tema: NisanTema): Promise<void> {
  setThemeOverride(id, tema);
  const client = supabase();
  if (!client) {
    try { updateLocal(id, (makam) => ({ ...makam, tema, vip: true })); } catch { /* draft id belum tersimpan lokal */ }
    return;
  }
  if (id.startsWith("draft-")) return;
  try {
    const result = await client.from("makam").update({ tema, is_vip: true }).eq("id", id);
    if (result.error && !isMissingColumnError(result.error)) {
      console.warn("[graveyard] Gagal menyinkronkan VIP ke Supabase:", result.error.message);
    }
  } catch {
    /* Tetap aman memakai localStorage override */
  }
}

export async function taburBunga(id: string): Promise<Makam> {
  const client = supabase();
  if (!client) return localFallback(() => updateLocal(id, (makam) => ({ ...makam, bunga: makam.bunga + 1 })));
  const result = await client.rpc("tabur_bunga", { target_makam_id: id });
  throwSupabase(result.error);
  if (!result.data.ok && result.data.code === "ALREADY_TODAY") throw new BungaSudahDitaburError();
  if (!result.data.ok) throw new Error("Bunga belum bisa ditaburkan.");
  const makam = await getMakam(id);
  if (!makam) throw new Error("Makam tidak ditemukan.");
  return makam;
}

export async function tambahKomentar(id: string, input: KomentarInput): Promise<Makam> {
  const isi = cleanText(input.isi, 280);
  const nama = cleanText(input.nama, 30, "Anonim") || "Anonim";
  if (!isi) throw new Error("Doa atau curhat belum ditulis.");
  const client = supabase();
  if (!client) return localFallback(() => updateLocal(id, (makam) => ({ ...makam, komentar: [{ id: createId(), nama, isi, createdAt: new Date().toISOString() }, ...makam.komentar] })));
  const userId = await requireUser(client);
  const result = await client.from("komentar").insert({ makam_id: id, user_id: userId, nama_tampil: nama, isi }).select("*").single();
  throwSupabase(result.error);
  const makam = await getMakam(id);
  if (!makam) throw new Error("Makam tidak ditemukan.");
  return makam;
}

export async function getStatistik(): Promise<Statistik> {
  const client = supabase();
  if (!client) return localFallback(() => {
    const makam = readLocal();
    return { totalMakam: makam.length, totalBunga: makam.reduce((total, item) => total + item.bunga, 0), totalRupiah: makam.reduce((total, item) => total + (item.kerugianRupiah ?? 0), 0), totalJam: makam.reduce((total, item) => total + (item.kerugianJam ?? 0), 0) };
  });
  const result = await client.from("statistik").select("*").single();
  throwSupabase(result.error);
  return { totalMakam: result.data?.total_makam ?? 0, totalBunga: Number(result.data?.total_bunga ?? 0), totalRupiah: Number(result.data?.total_rupiah ?? 0), totalJam: Number(result.data?.total_jam ?? 0) };
}

function getWibDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(date);
}

export function getNextWibMidnight(date: Date): Date {
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" });
  const parts = formatter.formatToParts(date).reduce<Record<string, string>>((result, part) => { result[part.type] = part.value; return result; }, {});
  const next = new Date(`${parts.year}-${parts.month}-${parts.day}T00:00:00+07:00`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

export async function getStatusBungaHariIni(ids: string[]): Promise<Record<string, BungaHariIni>> {
  const client = supabase();
  if (!client) return localFallback(() => { const serverNow = new Date().toISOString(); const berlakuHingga = getNextWibMidnight(new Date(serverNow)).toISOString(); return Object.fromEntries(ids.map((id) => [id, { sudahMenabur: false, serverNow, berlakuHingga }])); });
  if (!ids.length) return {};
  const userId = await requireUser(client);
  const serverNow = new Date().toISOString();
  const result = await client.from("bunga").select("makam_id, hari, created_at").eq("user_id", userId).in("makam_id", ids);
  throwSupabase(result.error);
  type BungaStatusRow = { makam_id: string; hari: string; created_at: string };
  const rows = (result.data ?? []) as BungaStatusRow[];
  const rowsByMakam = new Map(rows.filter((row) => getWibDate(new Date(row.created_at)) === row.hari).map((row) => [row.makam_id, row]));
  return Object.fromEntries(ids.map((id) => {
    const row = rowsByMakam.get(id);
    const statusServerNow = row?.created_at ?? serverNow;
    return [id, { sudahMenabur: Boolean(row), serverNow: statusServerNow, berlakuHingga: getNextWibMidnight(new Date(statusServerNow)).toISOString() }];
  }));
}

export async function hapusMakam(id: string, userId?: string): Promise<void> {
  const client = supabase();
  if (!client) { localFallback(() => { writeLocal(readLocal().filter((makam) => makam.id !== id)); releaseVipId(id); }); return; }
  let query = client.from("makam").delete().eq("id", id);
  if (userId) query = query.eq("user_id", userId);
  const result = await query.select("id");
  throwSupabase(result.error);
  if (!result.data?.length) throw new Error("Makam tidak ditemukan atau bukan milikmu.");
  releaseVipId(id);
}

export async function hapusKomentar(id: string): Promise<void> {
  const client = supabase();
  if (!client) { localFallback(() => writeLocal(readLocal().map((makam) => ({ ...makam, komentar: makam.komentar.filter((komentar) => komentar.id !== id) })))); return; }
  const result = await client.from("komentar").delete().eq("id", id);
  throwSupabase(result.error);
}

export async function laporkan(targetType: "makam" | "komentar", targetId: string, alasan = ""): Promise<void> {
  const client = supabase();
  if (!client) throw new Error("Pelaporan tersedia setelah Supabase dikonfigurasi.");
  const userId = await requireUser(client);
  const result = await client.from("laporan").insert({ target_type: targetType, target_id: targetId, user_id: userId, alasan: cleanText(alasan, 200) || null });
  throwSupabase(result.error);
}
