import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = { logo_url: string | null; logo_max_width: number; favicon_url: string | null };

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site_settings"],
    queryFn: async (): Promise<SiteSettings> => {
      const { data } = await supabase
        .from("site_settings")
        .select("logo_url,logo_max_width,favicon_url")
        .eq("id", 1)
        .maybeSingle();
      const d = (data ?? {}) as { logo_url?: string | null; logo_max_width?: number; favicon_url?: string | null };
      return {
        logo_url: d.logo_url ?? null,
        logo_max_width: d.logo_max_width ?? 260,
        favicon_url: d.favicon_url ?? null,
      };
    },
    staleTime: 60_000,
  });
}
