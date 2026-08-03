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

// Wrap raw JS so that listeners for DOMContentLoaded/load fire immediately
// when the document is already loaded (scripts are injected after hydration).
function wrapDeferred(code: string): string {
  return `;(function(){
  var __d = document.addEventListener.bind(document);
  var __w = window.addEventListener.bind(window);
  document.addEventListener = function(ev, fn, opts){
    if(ev==='DOMContentLoaded' && document.readyState!=='loading'){ try{ setTimeout(fn,0); }catch(e){ console.error(e); } return; }
    return __d(ev, fn, opts);
  };
  window.addEventListener = function(ev, fn, opts){
    if(ev==='load' && document.readyState==='complete'){ try{ setTimeout(fn,0); }catch(e){ console.error(e); } return; }
    return __w(ev, fn, opts);
  };
  try {
${code}
  } catch(e){ console.error('[injected script]', e); }
  finally {
    document.addEventListener = __d;
    window.addEventListener = __w;
  }
})();`;
}

// Execute a script node by cloning into a fresh <script> element so the browser runs it.
function execScript(source: HTMLScriptElement, tag: string): HTMLScriptElement {
  const s = document.createElement("script");
  for (const attr of Array.from(source.attributes)) {
    try { s.setAttribute(attr.name, attr.value); } catch { /* ignore invalid */ }
  }
  if (!source.src && source.textContent) {
    s.text = wrapDeferred(source.textContent);
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

    const scriptNodes = Array.from(frag.querySelectorAll("script")) as HTMLScriptElement[];
    const externals = scriptNodes.filter((s) => !!s.src);

    // Move styles into <head> first so markup is styled as soon as it appears
    frag.querySelectorAll("style").forEach((st) => {
      const el = document.createElement("style");
      el.textContent = st.textContent;
      el.dataset.injectedBy = id;
      document.head.appendChild(el);
      created.push(el);
      st.remove();
    });

    scriptNodes.forEach((s) => s.remove());

    // Remaining markup → append container to body, hidden until scripts/styles settle
    let wrap: HTMLDivElement | null = null;
    if (frag.childNodes.length) {
      wrap = document.createElement("div");
      wrap.dataset.injectedBy = id;
      wrap.style.opacity = "0";
      wrap.style.transition = "opacity .2s ease";
      wrap.style.minHeight = "60px";
      wrap.appendChild(frag);

      const skeleton = document.createElement("div");
      skeleton.dataset.injectedBy = id;
      skeleton.style.cssText =
        "min-height:60px;display:flex;align-items:center;justify-content:center;color:#9a9a9a;font-size:13px;";
      skeleton.textContent = "Yükleniyor...";
      document.body.appendChild(skeleton);
      document.body.appendChild(wrap);
      created.push(skeleton, wrap);

      const reveal = () => {
        if (wrap) wrap.style.opacity = "1";
        skeleton.remove();
      };
      let pending = externals.length;
      if (pending === 0) setTimeout(reveal, 250);
      else {
        const done = () => { if (--pending <= 0) setTimeout(reveal, 120); };
        externals.forEach((s) => { s.addEventListener("load", done); s.addEventListener("error", done); });
        setTimeout(reveal, 4000); // güvenlik ağı
      }
    }

    // Execute scripts (in original order)
    scriptNodes.forEach((s) => { created.push(execScript(s, id)); });
  } else {
    // No HTML tags → treat as raw JavaScript
    const s = document.createElement("script");
    s.text = wrapDeferred(trimmed);
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
    // Do not inject any custom scripts inside the admin panel.
    if (path.startsWith("/admin")) return;
    const active = scripts.filter((s) => matches(s.konum, path));
    const created: HTMLElement[] = [];
    for (const s of active) created.push(...injectRaw(s.id, s.icerik));
    return () => {
      created.forEach((n) => n.remove());
    };
  }, [scripts, path]);

  return null;
}
