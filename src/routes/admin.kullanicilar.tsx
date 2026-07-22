import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/kullanicilar")({ component: Users });

function Users() {
  const qc = useQueryClient();
  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, phone, created_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      const roleMap = new Map<string, string[]>();
      (r ?? []).forEach((row) => {
        const arr = roleMap.get(row.user_id) ?? [];
        arr.push(row.role);
        roleMap.set(row.user_id, arr);
      });
      return (p ?? []).map((u) => ({ ...u, roles: roleMap.get(u.id) ?? [] }));
    },
  });

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

  return (
    <div>
      <h1 className="font-display text-4xl text-brand-ink mb-8">Kullanıcılar ({users.length})</h1>
      <div className="bg-white rounded-2xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground border-b bg-brand-sand/30">
            <tr><th className="p-3">Ad</th><th>Telefon</th><th>Roller</th><th>Kayıt</th><th></th></tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isA = u.roles.includes("admin");
              return (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="p-3">{u.full_name ?? "—"}</td>
                  <td>{u.phone ?? "—"}</td>
                  <td><div className="flex gap-1">{u.roles.map((r) => <span key={r} className="px-2 py-0.5 bg-brand-sand rounded-full text-xs">{r}</span>)}</div></td>
                  <td className="text-muted-foreground">{new Date(u.created_at).toLocaleDateString("tr-TR")}</td>
                  <td>
                    <button onClick={() => toggleAdmin(u.id, isA)} className={`px-3 py-1 rounded-full text-xs ${isA ? "bg-red-100 text-red-700" : "bg-brand-ink text-white"}`}>
                      {isA ? "Admin'i Kaldır" : "Admin Yap"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
