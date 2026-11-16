import { ArrowDown, Plus } from "lucide-react";

interface HeaderProps {
  onBury: () => void;
  userName?: string;
  onLogin: () => void;
  onLogout: () => void;
}

export function Header({ onBury, userName, onLogin, onLogout }: HeaderProps) {
  return (
    <header className="container-shell flex items-start justify-between gap-6 py-7 sm:py-9">
      <div>
        <a href="#top" className="inline-flex items-center gap-2 text-sm font-semibold tracking-[.18em] text-[#f4f1e9] no-underline">
          <span className="grid h-7 w-7 place-items-center rounded-full border border-[#d87078]/70 text-[#f08c91]">✳</span>
          WACANA.RIP
        </a>
        <p className="mt-3 max-w-[290px] text-sm leading-6 text-[#a7a69f] sm:max-w-md">
          Tempat peristirahatan terakhir bagi wacana yang tak pernah terjadi.
        </p>
      </div>
      <div className="flex items-center gap-2">
        {userName ? <button onClick={onLogout} className="min-h-11 max-w-32 truncate rounded-full border border-[#ffffff1a] px-3 text-xs text-[#a7a69f] hover:text-[#f4f1e9]" title="Keluar">{userName} · Keluar</button> : <button onClick={onLogin} className="min-h-11 rounded-full border border-[#ffffff1a] px-4 text-sm text-[#a7a69f] hover:text-[#f4f1e9]">Masuk</button>}
        <button onClick={onBury} className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-[#d87078]/70 bg-[#d87078] px-4 py-2.5 text-sm font-semibold text-[#1c1114] transition hover:-translate-y-0.5 hover:bg-[#f08c91]">
          <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
          <span className="hidden sm:inline">Kuburkan Wacana</span>
          <span className="sm:hidden">Kuburkan</span>
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
