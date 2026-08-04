import { useEffect } from "react";
import { useSiteSettings } from "@/lib/settings";

/** Genel ayarlardaki renkleri CSS değişkenlerine uygular. */
export function ThemeVars() {
  const { data } = useSiteSettings();

  useEffect(() => {
    if (!data || typeof document === "undefined") return;
    const r = document.documentElement.style;
    r.setProperty("--brand-ink", data.color_primary);
    r.setProperty("--primary", data.color_primary);
    r.setProperty("--brand-cta", data.color_secondary);
    r.setProperty("--success", data.color_success);
    r.setProperty("--danger", data.color_danger);
    r.setProperty("--destructive", data.color_danger);
  }, [data]);

  return null;
}
