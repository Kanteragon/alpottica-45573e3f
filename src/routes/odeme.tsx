import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function Odeme() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const [form, setForm] = useState({
    adSoyad: "",
    telefon: "",
    adres: "",
    sehir: "",
    ilce: "",
  });

  // 1. Sayfa açıldığında kullanıcı giriş yapmış mı kontrol et, yapmadıysa giriş sayfasına at
  useEffect(() => {
    async function checkUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        alert("Ödeme yapabilmek için lütfen giriş yapın veya hesap oluşturun.");
        navigate("/auth"); // Giriş sayfanızın rotası
        return;
      }

      setUser(session.user);
      setLoading(false);
    }

    checkUser();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);

      const { error } = await supabase.from("orders").insert([
        {
          user_id: user.id,
          ad_soyad: form.adSoyad,
          telefon: form.telefon,
          adres: form.adres,
          sehir: form.sehir,
          ilce: form.ilce,
          status: "pending",
        },
      ]);

      if (error) throw error;

      alert("Siparişiniz başarıyla alındı!");
      navigate("/");
    } catch (err: any) {
      console.error("Sipariş hatası:", err);
      alert("Sipariş kaydedilirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 font-medium">Yetki kontrolü yapılıyor...</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow rounded-lg my-10">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Ödeme Bilgileri</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Ad Soyad</label>
          <input
            type="text"
            name="adSoyad"
            required
            value={form.adSoyad}
            onChange={handleChange}
            className="w-full mt-1 p-2 border rounded border-gray-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Telefon</label>
          <input
            type="text"
            name="telefon"
            required
            value={form.telefon}
            onChange={handleChange}
            className="w-full mt-1 p-2 border rounded border-gray-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Adres</label>
          <textarea
            name="adres"
            required
            rows={3}
            value={form.adres}
            onChange={handleChange}
            className="w-full mt-1 p-2 border rounded border-gray-300"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Şehir</label>
            <input
              type="text"
              name="sehir"
              required
              value={form.sehir}
              onChange={handleChange}
              className="w-full mt-1 p-2 border rounded border-gray-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">İlçe</label>
            <input
              type="text"
              name="ilce"
              required
              value={form.ilce}
              onChange={handleChange}
              className="w-full mt-1 p-2 border rounded border-gray-300"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded font-medium hover:bg-gray-800 transition"
        >
          {loading ? "İşleniyor..." : "Siparişi Tamamla"}
        </button>
      </form>
    </div>
  );
}
