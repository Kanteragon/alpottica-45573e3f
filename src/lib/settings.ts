import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = {
  logo_url: string | null;
  favicon_url: string | null;
  logo_max_width: number;
  brand_name: string;
  color_primary: string;
  color_secondary: string;
  color_success: string;
  color_danger: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  instagram: string;
};

export const SETTINGS_DEFAULTS = {
  color_primary: "#241f1c",
  color_secondary: "#2b3a8f",
  color_success: "#16a34a",
  color_danger: "#dc2626",
  phone: "0546 646 02 44",
  whatsapp: "905466460244",
  email: "",
  address: "İstanbul, Türkiye",
  instagram: "alpottica",
};

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site_settings"],
    queryFn: async (): Promise<SiteSettings> => {
      const { data } = await supabase
        .from("site_settings")
        .select(
          "logo_url,favicon_url,logo_max_width,brand_name,color_primary,color_secondary,color_success,color_danger,phone,whatsapp,email,address,instagram",
        )
        .eq("id", 1)
        .maybeSingle();
      const d = (data ?? null) as Record<string, unknown> | null;
      const str = (k: string, fallback: string) => {
        const v = d?.[k];
        return typeof v === "string" && v.trim() ? v.trim() : fallback;
      };
      return {
        logo_url: (d?.["logo_url"] as string | null) ?? null,
        favicon_url: (d?.["favicon_url"] as string | null) ?? null,
        logo_max_width: (d?.["logo_max_width"] as number | null) ?? 260,
        brand_name: str("brand_name", "Alpottica"),
        color_primary: str("color_primary", SETTINGS_DEFAULTS.color_primary),
        color_secondary: str("color_secondary", SETTINGS_DEFAULTS.color_secondary),
        color_success: str("color_success", SETTINGS_DEFAULTS.color_success),
        color_danger: str("color_danger", SETTINGS_DEFAULTS.color_danger),
        phone: str("phone", SETTINGS_DEFAULTS.phone),
        whatsapp: str("whatsapp", SETTINGS_DEFAULTS.whatsapp),
        email: str("email", SETTINGS_DEFAULTS.email),
        address: str("address", SETTINGS_DEFAULTS.address),
        instagram: str("instagram", SETTINGS_DEFAULTS.instagram),
      };
    },
    staleTime: 60_000,
  });
}

/** Marka adı — site genelinde kullanılır. */
export function useBrandName() {
  const { data } = useSiteSettings();
  return data?.brand_name || "Alpottica";
}
