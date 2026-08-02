import { useState } from "react";
import { X, Instagram, Linkedin, Github, MessageCircle } from "lucide-react";

const LINKS = [
  {
    label: "WhatsApp",
    value: "+90 551 158 87 84",
    href: "https://wa.me/905511588784",
    icon: MessageCircle,
    tone: "bg-emerald-500/15 text-emerald-400",
  },
  {
    label: "Instagram",
    value: "@m.akif_demirel",
    href: "https://instagram.com/m.akif_demirel",
    icon: Instagram,
    tone: "bg-pink-500/15 text-pink-400",
  },
  {
    label: "LinkedIn",
    value: "Mehmet Akif Demirel",
    href: "https://tr.linkedin.com/in/mehmet-akif-demirel-804a11262",
    icon: Linkedin,
    tone: "bg-sky-500/15 text-sky-400",
  },
  {
    label: "GitHub",
    value: "Kanteragon",
    href: "https://github.com/Kanteragon",
    icon: Github,
    tone: "bg-white/10 text-white",
  },
];

export function MadeBy() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-white/50 hover:text-white transition underline-offset-4 hover:underline"
      >
        Made by Mehmet Akif Demirel
      </button>

      {open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-3xl bg-brand-ink text-white border border-white/10 shadow-2xl overflow-hidden"
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Kapat"
              className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-white/10 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="px-7 pt-9 pb-6 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center font-display text-2xl">
                MD
              </div>
              <p className="mt-4 font-display text-2xl tracking-wide">Mehmet Akif Demirel</p>
              <p className="text-xs tracking-[0.25em] text-white/40 mt-1 uppercase">Yazılım Geliştirici</p>
            </div>

            <div className="px-5 pb-6 space-y-2">
              {LINKS.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 hover:border-white/40 hover:bg-white/5 transition"
                >
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${l.tone}`}>
                    <l.icon className="w-4 h-4" />
                  </span>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block text-sm">{l.label}</span>
                    <span className="block text-xs text-white/45 truncate">{l.value}</span>
                  </span>
                  <span className="text-white/30 text-lg">→</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
