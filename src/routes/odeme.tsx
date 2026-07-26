import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function Odeme() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Form alanları
  const [formData, setFormData] = useState({
    adSoyad: "",
    telefon: "",
    adres: "",
    sehir: "",
    ilce: "",
    postaKodu: "",
  });

  // 1. Sayfa açıldığında kullanıcı oturumunu kontrol et (Zorunlu Hesap Kontrolü)
  useEffect(() => {
    async function checkAuth() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session) {
        // Kullanıcı giriş yapmamışsa uyarı verip giriş sayfasına at
        alert("Ödeme yapabilmek için lütfen hesap oluşturun veya giriş yapın.");
        navigate("/auth"); // Giriş/Kayıt sayfanızın rotası
        return;
      }

      setUser(session.user);
      setLoading(false);
    }

    checkAuth();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 2. Siparişi Tamamlama İşlemi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);

      // Siparişi veritabanına kaydetme örneği
      const { error } = await supabase.from("orders").insert([
        {
          user_id: user.id,
          ad_soyad: formData.adSoyad,
          telefon: formData.telefon,
          adres: formData.adres,
          sehir: formData.sehir,
          ilce: formData.ilce,
          posta_kodu: formData.postaKodu,
          status: "pending", // Beklemede
        },
      ]);

      if (error) throw error;

      alert("Siparişiniz başarıyla oluşturuldu!");
      navigate("/"); // Sipariş sonrası yönlendirilecek sayfa (Ana sayfa veya siparişlerim)
    } catch (err: any) {
      console.error("Sipariş hatası:", err.message);
      alert("Sipariş oluşturulurken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Yükleniyor ve yetki kontrolü yapılıyor...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg my-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Ödeme ve Teslimat Bilgileri</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Ad Soyad</label>
          <input
            type="text"
            name="adSoyad"
            required
            value={formData.adSoyad}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Telefon</label>
          <input
            type="tel"
            name="telefon"
            required
            value={formData.telefon}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Adres</label>
          <textarea
            name="adres"
            required
            rows={3}
            value={formData.adres}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Şehir</label>
            <input
              type="text"
              name="sehir"
              required
              value={formData.sehir}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">İlçe</label>
            <input
              type="text"
              name="ilce"
              required
              value={formData.ilce}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Posta Kodu</label>
          <input
            type="text"
            name="postaKodu"
            value={formData.postaKodu}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded-md font-semibold hover:bg-gray-800 transition"
        >
          {loading ? "İşleniyor..." : "Siparişi Tamamla"}
        </button>
      </form>
    </div>
  );
}
