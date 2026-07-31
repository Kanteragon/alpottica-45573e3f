import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export function useFavorites() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: ids = [] } = useQuery({
    queryKey: ["favorites", "ids", user?.id ?? null],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("favorites").select("product_id");
      if (error) throw error;
      return (data ?? []).map((r) => r.product_id as string);
    },
  });

  const isFavorite = (productId: string) => ids.includes(productId);

  const toggle = async (productId: string) => {
    if (!user) {
      toast.error("Favorilere eklemek için giriş yapın");
      return;
    }
    if (isFavorite(productId)) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("product_id", productId)
        .eq("user_id", user.id);
      if (error) return toast.error(error.message);
      toast.success("Favorilerden çıkarıldı");
    } else {
      const { error } = await supabase
        .from("favorites")
        .insert({ product_id: productId, user_id: user.id });
      if (error) return toast.error(error.message);
      toast.success("Favorilere eklendi");
    }
    qc.invalidateQueries({ queryKey: ["favorites"] });
  };

  return { ids, isFavorite, toggle, enabled: !!user };
}
