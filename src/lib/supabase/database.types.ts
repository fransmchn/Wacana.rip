export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row, Insert = Row, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<{ id: string; display_name: string; avatar_url: string | null; username: string | null; bio: string | null; updated_at: string; created_at: string }, { id?: string; display_name?: string; avatar_url?: string | null; username?: string | null; bio?: string | null; updated_at?: string; created_at?: string }, { display_name?: string; avatar_url?: string | null; username?: string | null; bio?: string | null; updated_at?: string; created_at?: string }>;
      makam: Table<{
        id: string;
        user_id: string | null;
        judul: string;
        kategori: "skripsi" | "koding" | "desain" | "bisnis" | "resolusi" | "hubungan" | "pribadi" | "pekerjaan" | "keluarga" | "kesehatan" | "perjalanan" | "lainnya";
        tampil_anonim: boolean;
        tanggal_mulai: string;
        tanggal_menyerah: string;
        penyebab: string;
        epitaph: string;
        kronologi: string | null;
        kerugian_teks: string | null;
        kerugian_rupiah: number | null;
        kerugian_jam: number | null;
        bunga_count: number;
        lilin_count: number;
        tema?: string | null;
        is_vip?: boolean | null;
        created_at: string;
      }>;
      bunga: Table<{ id: string; makam_id: string; user_id: string; hari: string; created_at: string }>;
      lilin: Table<{ makam_id: string; user_id: string; created_at: string }>;
      komentar: Table<{ id: string; makam_id: string; user_id: string; nama_tampil: string; isi: string; created_at: string }>;
      laporan: Table<{ id: string; target_type: "makam" | "komentar"; target_id: string; user_id: string; alasan: string | null; created_at: string }>;
    };
    Views: {
      statistik: {
        Row: { total_makam: number; total_bunga: number; total_rupiah: number; total_jam: number };
      };
    };
    Functions: {
      tabur_bunga: { Args: { target_makam_id: string }; Returns: { ok: boolean; code?: string; bunga_count?: number } };
      toggle_lilin: { Args: { target_makam_id: string }; Returns: { ok: boolean; code?: string; enabled?: boolean; lilin_count?: number } };
      my_profile_stats: { Args: Record<string, never>; Returns: { wacana_dikubur: number; bunga_ditabur: number; lilin_dinyalakan: number }[] };
    };
    CompositeTypes: never;
    Enums: { kategori: "skripsi" | "koding" | "desain" | "bisnis" | "resolusi" | "hubungan" | "pribadi" | "pekerjaan" | "keluarga" | "kesehatan" | "perjalanan" | "lainnya" };
  };
};
