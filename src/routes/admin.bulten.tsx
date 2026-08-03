import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/bulten")({
  head: () => ({ meta: [{ title: "Bülten Aboneleri — Admin" }, { name: "robots", content: "noindex" }] }),
  component: BultenPage,
});

type Sub = { id: string; email: string; kaynak: string; created_at: string };

function BultenPage() {
  const { data: subs = [], isLoading } = useQuery({
    queryKey: ["newsletter-subs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("id,email,kaynak,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Sub[];
    },
  });

  const exportCsv = () => {
    const rows = [["Email", "Kaynak", "Tarih"], ...subs.map((s) => [s.email, s.kaynak, new Date(s.created_at).toLocaleString("tr-TR")])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulten-aboneleri.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Bülten Aboneleri</h1>
          <p className="text-sm text-muted-foreground">Toplam {subs.length} abone</p>
        </div>
        <Button onClick={exportCsv} disabled={!subs.length}>CSV indir</Button>
      </div>

      <div className="rounded-xl border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3">E-posta</th>
              <th className="text-left p-3">Kaynak</th>
              <th className="text-left p-3">Tarih</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={3} className="p-4 text-muted-foreground">Yükleniyor...</td></tr>}
            {!isLoading && !subs.length && <tr><td colSpan={3} className="p-4 text-muted-foreground">Henüz abone yok.</td></tr>}
            {subs.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-3">{s.email}</td>
                <td className="p-3">{s.kaynak}</td>
                <td className="p-3">{new Date(s.created_at).toLocaleString("tr-TR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
