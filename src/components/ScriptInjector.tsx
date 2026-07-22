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

function parseAndInject(id: string, raw: string): HTMLElement[] {
  const nodes: HTMLElement[] = [];
  // Extract <script> and <style> blocks; treat rest as HTML fragment appended to body
  const tmp = document.createElement("div");
  tmp.innerHTML = raw;

  const scripts = tmp.querySelectorAll("script");
  scripts.forEach((s) => {
    const el = document.createElement("script");
    for (const attr of Array.from(s.attributes)) el.setAttribute(attr.name, attr.value);
    el.textContent = s.textContent;
    el.dataset.injectedBy = id;
    document.body.appendChild(el);
    nodes.push(el);
    s.remove();
  });

  const styles = tmp.querySelectorAll("style");
  styles.forEach((s) => {
    const el = document.createElement("style");
    el.textContent = s.textContent;
    el.dataset.injectedBy = id;
    document.head.appendChild(el);
    nodes.push(el);
    s.remove();
  });

  // Remaining content: if not empty, append as script (JS) OR as HTML container
  const rest = tmp.innerHTML.trim();
  if (rest) {
    // Heuristic: if it contains typical JS keywords and no HTML tags → JS
    const looksLikeJs = /^(?:function|var |let |const |window\.|document\.|\(|\/\/)/m.test(rest) && !/</.test(rest);
    if (looksLikeJs) {
      const el = document.createElement("script");
      el.textContent = rest;
      el.dataset.injectedBy = id;
      document.body.appendChild(el);
      nodes.push(el);
    } else {
      const el = document.createElement("div");
      el.innerHTML = rest;
      el.dataset.injectedBy = id;
      document.body.appendChild(el);
      nodes.push(el);
    }
  }
  return nodes;
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
    for (const s of active) {
      created.push(...parseAndInject(s.id, s.icerik));
    }
    return () => {
      created.forEach((n) => n.remove());
    };
  }, [scripts, path]);

  return null;
}
