import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = {
  logo_url: string | null;
  favicon_url: string | null;
  logo_max_width: number;
  brand_name: string;
};

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site_settings"],
    queryFn: async (): Promise<SiteSettings> => {
      const { data } = await supabase
        .from("site_settings")
        .select("logo_url,favicon_url,logo_max_width,brand_name")
        .eq("id", 1)
        .maybeSingle();
      const d = data as {
        logo_url?: string | null;
        favicon_url?: string | null;
        logo_max_width?: number | null;
        brand_name?: string | null;
      } | null;
      return {
        logo_url: d?.logo_url ?? null,
        favicon_url: d?.favicon_url ?? null,
        logo_max_width: d?.logo_max_width ?? 260,
        brand_name: d?.brand_name?.trim() || "Alpottica",
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
