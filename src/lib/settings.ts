import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = { logo_url: string | null; logo_max_width: number };

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site_settings"],
    queryFn: async (): Promise<SiteSettings> => {
      const { data } = await supabase
        .from("site_settings")
        .select("logo_url,logo_max_width")
        .eq("id", 1)
        .maybeSingle();
      return {
        logo_url: data?.logo_url ?? null,
        logo_max_width: data?.logo_max_width ?? 180,
      };
    },
    staleTime: 60_000,
  });
}
