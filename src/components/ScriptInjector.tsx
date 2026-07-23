import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Script = { id: string; ad: string; konum: string; icerik: string; aktif: boolean; sira: number };

function matches(konum: string, path: string): boolean {
  if (konum === "all") return true;
  if (konum === "home") return path === "/";
  if (konum === "product") return path.startsWith("/urun/");
  if (konum === "category") return path === "/urunler" || path.startsWith("/urunler");
  if (konum === "cart") return path === "/sepet";
  if (konum === "checkout") return path === "/odeme";
  return false;
}

// Execute a script node by cloning into a fresh <script> element so the browser runs it.
function execScript(source: HTMLScriptElement, tag: string): HTMLScriptElement {
  const s = document.createElement("script");
  for (const attr of Array.from(source.attributes)) {
    try { s.setAttribute(attr.name, attr.value); } catch { /* ignore invalid */ }
  }
  if (!source.src && source.textContent) {
    s.text = source.textContent;
  }
  s.dataset.injectedBy = tag;
  document.body.appendChild(s);
  return s;
}

function injectRaw(id: string, raw: string): HTMLElement[] {
  const created: HTMLElement[] = [];
  const trimmed = raw.trim();
  if (!trimmed) return created;

  // If the content has any HTML-like tags, parse as HTML and re-execute scripts.
  if (/<\s*(script|style|link|meta|div|span|iframe|img|a|p|h[1-6])\b/i.test(trimmed)) {
    const tmpl = document.createElement("template");
    tmpl.innerHTML = trimmed;
    const frag = tmpl.content;

    // Extract & execute scripts (in original order)
    frag.querySelectorAll("script").forEach((s) => {
      created.push(execScript(s as HTMLScriptElement, id));
      s.remove();
    });

    // Move styles into <head>
    frag.querySelectorAll("style").forEach((st) => {
      const el = document.createElement("style");
      el.textContent = st.textContent;
      el.dataset.injectedBy = id;
      document.head.appendChild(el);
      created.push(el);
      st.remove();
    });

    // Remaining markup → append container to body
    if (frag.childNodes.length) {
      const wrap = document.createElement("div");
      wrap.dataset.injectedBy = id;
      wrap.appendChild(frag);
      document.body.appendChild(wrap);
      created.push(wrap);
    }
  } else {
    // No HTML tags → treat as raw JavaScript
    const s = document.createElement("script");
    s.text = trimmed;
    s.dataset.injectedBy = id;
    document.body.appendChild(s);
    created.push(s);
  }
  return created;
}

export function ScriptInjector() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { data: scripts = [] } = useQuery({
    queryKey: ["custom-scripts"],
    queryFn: async () => {
      const { data } = await supabase.from("custom_scripts").select("*").eq("aktif", true).order("sira");
      return (data ?? []) as Script[];
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    const active = scripts.filter((s) => matches(s.konum, path));
    const created: HTMLElement[] = [];
    for (const s of active) created.push(...injectRaw(s.id, s.icerik));
    return () => {
      created.forEach((n) => n.remove());
    };
  }, [scripts, path]);

  return null;
}
