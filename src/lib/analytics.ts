import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const SID_KEY = "alpottica_sid";

function sessionId(): string {
  try {
    let v = localStorage.getItem(SID_KEY);
    if (!v) {
      v = crypto.randomUUID();
      localStorage.setItem(SID_KEY, v);
    }
    return v;
  } catch {
    return "anon";
  }
}

export async function trackEvent(
  tip: "visit" | "add_to_cart" | "order",
  extra?: { product_id?: string | null },
) {
  if (typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/admin")) return;
  try {
    const { data } = await supabase.auth.getSession();
    await supabase.from("site_events").insert({
      tip,
      session_id: sessionId(),
      path: window.location.pathname,
      product_id: extra?.product_id ?? null,
      user_id: data.session?.user.id ?? null,
    });
  } catch {
    /* analytics is best-effort */
  }
}

export function VisitTracker() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    trackEvent("visit");
  }, [path]);
  return null;
}
