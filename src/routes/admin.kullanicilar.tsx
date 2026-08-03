import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatTL } from "@/lib/products";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { ChevronDown, ChevronUp, Download, Search } from "lucide-react";

export const Route = createFileRoute("/admin/kullanicilar")({ component: Users });

type OrderRow = { id: string; created_at: string; toplam: number; durum: string; user_id: string | null };

function Users() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [orderFilter, setOrderFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: p }, { data: r }, { data: o }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, phone, email, created_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("orders").select("id, created_at, toplam, durum, user_id").order("created_at", { ascending: false }),
      ]);
      const roleMap = new Map<string, string[]>();
      (r ?? []).forEach((row) => {
        const arr = roleMap.get(row.user_id) ?? [];
        arr.push(row.role);
        roleMap.set(row.user_id, arr);
      });
      const orderMap = new Map<string, OrderRow[]>();
      ((o ?? []) as OrderRow[]).forEach((row) => {
        if (!row.user_id) return;
        const arr = orderMap.get(row.user_id) ?? [];
        arr.push(row);
        orderMap.set(row.user_id, arr);
      });
      return (p ?? []).map((u) => {
        const orders = orderMap.get(u.id) ?? [];
        const spend = orders
          .filter((x) => x.durum !== "iptal")
          .reduce((s, x) => s + Number(x.toplam || 0), 0);
        return { ...u, roles: roleMap.get(u.id) ?? [], orders, spend };
      });
    },
  });

  const shown = useMemo(() => {
    const term = q.trim().toLocaleLowerCase("tr");
    return users.filter((u) => {
      if (term) {
        const hay = `${u.full_name ?? ""} ${u.phone ?? ""} ${(u as { email?: string }).email ?? ""}`.toLocaleLowerCase("tr");
        if (!hay.includes(term)) return false;
      }
      if (roleFilter === "admin" && !u.roles.includes("admin")) return false;
      if (roleFilter === "user" && u.roles.includes("admin")) return false;
      if (orderFilter === "with" && u.orders.length === 0) return false;
      if (orderFilter === "without" && u.orders.length > 0) return false;
      return true;
    });
  }, [users, q, roleFilter, orderFilter]);

  const toggleAdmin = async (userId: string, isAdmin: boolean) => {
    if (isAdmin) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
      if (error) return toast.error(error.message);
    }
    toast.success("Rol güncellendi");
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  };

  const exportExcel = () => {
    const rows = shown.map((u) => ({
      İsim: u.full_name ?? "",
      Telefon: u.phone ?? "",
      "E-posta": (u as { email?: string | null }).email ?? "",
      "Toplam Harcama": Number(u.spend.toFixed(2)),
      "Sipariş Sayısı": u.orders.length,
      Roller: u.roles.join(", "),
      Kayıt: new Date(u.created_at).toLocaleDateString("tr-TR"),
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Kullanicilar");
    XLSX.writeFile(wb, `kullanicilar-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <h1 className="font-display text-3xl sm:text-4xl text-brand-ink">Kullanıcılar ({shown.length})</h1>
        <button onClick={exportExcel} className="inline-flex items-center gap-2 bg-brand-ink text-white rounded-full px-4 py-2 text-sm">
          <Download className="w-4 h-4" /> Excel İndir
        </button>
      </div>

      <div className="bg-white rounded-2xl border p-4 grid gap-3 md:grid-cols-4 mb-4">
        <label className="relative md:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="İsim, telefon veya e-posta ara"
            className="w-full border rounded-xl pl-9 pr-3 py-2 text-sm"
          />
        </label>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="border rounded-xl px-3 py-2 text-sm">
          <option value="all">Tüm roller</option>
          <option value="admin">Sadece adminler</option>
          <option value="user">Sadece üyeler</option>
        </select>
        <select value={orderFilter} onChange={(e) => setOrderFilter(e.target.value)} className="border rounded-xl px-3 py-2 text-sm">
          <option value="all">Sipariş durumu (hepsi)</option>
          <option value="with">Siparişi olanlar</option>
          <option value="without">Siparişi olmayanlar</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground border-b bg-brand-sand/30">
              <tr>
                <th className="p-3">Ad</th>
                <th>E-posta</th>
                <th>Telefon</th>
                <th>Harcama</th>
                <th>Roller</th>
                <th>Kayıt</th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((u) => {
                const isA = u.roles.includes("admin");
                const open = expanded === u.id;
                return (
                  <>
                    <tr key={u.id} className="border-b last:border-0">
                      <td className="p-3">{u.full_name ?? "—"}</td>
                      <td className="break-all">{(u as { email?: string | null }).email ?? "—"}</td>
                      <td>{u.phone ?? "—"}</td>
                      <td className="font-semibold">{formatTL(u.spend)}</td>
                      <td>
                        <div className="flex gap-1">
                          {u.roles.map((r) => (
                            <span key={r} className="px-2 py-0.5 bg-brand-sand rounded-full text-xs">{r}</span>
                          ))}
                        </div>
                      </td>
                      <td className="text-muted-foreground">{new Date(u.created_at).toLocaleDateString("tr-TR")}</td>
                      <td>
                        <button onClick={() => toggleAdmin(u.id, isA)} className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${isA ? "bg-red-100 text-red-700" : "bg-brand-ink text-white"}`}>
                          {isA ? "Admin'i Kaldır" : "Admin Yap"}
                        </button>
                      </td>
                      <td>
                        <button
                          onClick={() => setExpanded(open ? null : u.id)}
                          aria-label="Detay"
                          className="p-2 hover:bg-brand-sand rounded"
                        >
                          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                    {open && (
                      <tr key={`${u.id}-d`} className="border-b bg-brand-sand/10">
                        <td colSpan={8} className="p-4">
                          {u.orders.length === 0 ? (
                            <p className="text-muted-foreground text-sm">Bu kullanıcının siparişi yok.</p>
                          ) : (
                            <div className="divide-y">
                              {u.orders.map((o) => (
                                <div key={o.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                                  <span className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</span>
                                  <span>{new Date(o.created_at).toLocaleString("tr-TR")}</span>
                                  <span className="px-2 py-0.5 bg-white border rounded-full text-xs">{o.durum}</span>
                                  <span className="ml-auto font-semibold">{formatTL(Number(o.toplam))}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
