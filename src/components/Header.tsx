import { ArrowDown, Pencil, Plus } from "lucide-react";

interface HeaderProps {
  onBury: () => void;
  userName?: string;
  onLogin: () => void;
  onEditProfile: () => void;
  onLogout: () => void;
}

export function Header({ onBury, userName, onLogin, onEditProfile, onLogout }: HeaderProps) {
  return (
    <header className="container-shell flex items-start justify-between gap-4 py-5 sm:gap-6 sm:py-8">
      <div className="min-w-0">
        <a href="#top" className="inline-flex items-center gap-2 text-sm font-semibold tracking-[.18em] text-[#f4f1e9] no-underline">
          <span className="grid h-7 w-7 place-items-center rounded-full border border-[#d87078]/70 text-[#f08c91]" aria-hidden="true">✦</span>
          WACANA.RIP
        </a>
        <p className="mt-2 max-w-[250px] text-xs leading-5 text-[#a7a69f] sm:mt-3 sm:max-w-md sm:text-sm sm:leading-6">
          Tempat peristirahatan terakhir bagi wacana yang tak pernah terjadi.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {userName ? <><button onClick={onEditProfile} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#ffffff1a] px-3 text-xs text-[#a7a69f] hover:border-[#ffffff35] hover:bg-[#ffffff08] hover:text-[#f4f1e9]" title="Edit profil"><Pencil size={14} aria-hidden="true" /><span className="hidden sm:inline">Edit profil</span></button><button onClick={onLogout} className="min-h-11 max-w-32 truncate rounded-full border border-[#ffffff1a] px-3 text-xs text-[#a7a69f] hover:border-[#ffffff35] hover:text-[#f4f1e9]" title="Keluar">{userName} · Keluar</button></> : <button onClick={onLogin} className="min-h-11 rounded-full border border-[#ffffff1a] px-3 text-sm text-[#a7a69f] hover:border-[#ffffff35] hover:text-[#f4f1e9] sm:px-4">Masuk</button>}
        <button onClick={onBury} className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-[#d87078]/70 bg-[#d87078] px-4 py-2.5 text-sm font-semibold text-[#1c1114] transition hover:-translate-y-0.5 hover:bg-[#f08c91]">
          <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
          <span className="hidden md:inline">Kuburkan Wacana</span>
          <span className="md:hidden">Kuburkan</span>
        </button>
      </div>
    </header>
  );
}

export function ScrollCue() {
  return (
    <a href="#pemakaman" className="mt-8 inline-flex items-center gap-2 text-xs text-[#a7a69f] transition hover:text-[#f4f1e9]">
      Lihat pemakaman <ArrowDown size={14} aria-hidden="true" />
    </a>
  );
}
