## Alpottica — Tam E-Ticaret + Admin Paneli

Bu plan üç aşamada teslim edilir. Her aşama önceki aşamayı bozmadan üstüne inşa edilir.

---

### Aşama 0 — Altyapı
- **Lovable Cloud** aktif edilir (veritabanı, auth, storage, edge functions dahili).
- Şu tablolar kurulur (RLS + grant ile):
  - `categories` (id, name, slug, sort)
  - `brands` (id, name, slug)
  - `products` — Excel şemasıyla birebir: `model_kodu, stok_kodu, barkod, urun_adi, aciklama, stok_adedi, alis_fiyati, liste_fiyati, satis_fiyati, kategori_id, marka_id, resimler (text[]), ozellikler (jsonb), etiketler (text[]), aktif, slug`
  - `sliders` (id, baslik, alt_baslik, gorsel, buton_yazi, buton_link, sira, aktif)
  - `menu_items` (id, label, url, sira, aktif)
  - `showcase_items` (vitrin — ana sayfa öne çıkanlar)
  - `announcements` (duyurular)
  - `pages` (statik sayfalar — hakkımızda vb.)
  - `orders` (id, user_id nullable, ad_soyad, telefon, email, adres, odeme_tipi ['nakit'|'kart'], toplam, durum, notlar, created_at)
  - `order_items` (order_id, product_id, adet, birim_fiyat, urun_adi_snapshot)
  - `profiles` + `user_roles` (rol tabanlı yetki — admin sadece `has_role()` üzerinden)
- Mevcut 436 statik ürün otomatik olarak `products` tablosuna migrate edilir.

### Aşama 1 — Ön yüz (müşteri tarafı)
- **Navbar** menüsü `menu_items`'tan dinamik gelir (sabit sticky davranışı korunur).
- **HeroSlider** `sliders`'tan dinamik gelir.
- **Ana sayfa "Öne Çıkan"** `showcase_items` + fallback ilk 8 aktif ürün.
- **Katalog `/urunler`** — sol sidebar filtreler:
  - Kategori, Marka (çoklu seçim)
  - Fiyat min-max (slider)
  - Dinamik özellik filtreleri (Çerçeve Rengi, Cam Tipi, Ekartman — `ozellikler` jsonb üzerinden otomatik üretilir)
  - Sıralama: yeni, fiyat artan/azalan, en çok satan
- **KRİTİK**: Tüm public sorgular `stok_adedi > 0 AND aktif = true` filtresiyle çalışır (RLS + client filter). Stokta olmayan hiçbir yerde görünmez.
- **Sepet** — misafir sepeti localStorage'da tutulur.
- **Checkout akışı**:
  1. Sepet onayla → giriş/kayıt istenir (Cloud auth: e-posta+şifre)
  2. Kayıt formu: ad soyad, telefon, e-posta, adres (`profiles`'a yazılır)
  3. Ödeme adımı: sadece **Kapıda Nakit** / **Kapıda Kartla** seçenekleri
  4. Sipariş `orders` + `order_items`'a yazılır, kullanıcıya onay ekranı
  5. Stok otomatik düşer (edge function / RPC)

### Aşama 2 — Admin Paneli `/admin`
- **Giriş `/admin/login`** — kullanıcı adı+şifre. `adminalpottica` / `Ays10112006!` için özel bootstrap: bu kimlikle ilk giriş yapıldığında hesap otomatik oluşturulur ve `admin` rolü atanır. Tüm admin rotaları `has_role(auth.uid(), 'admin')` ile korunur.
- **Sol menü** (görsele uygun, koyu tema):
  - **Kontrol Paneli**: toplam ciro, sipariş sayısı, aktif ürün, düşük stok uyarıları, son 7 gün grafiği
  - **Katalog**
    - Ürün Yönetimi (liste, ara, filtrele, tekil düzenle/sil)
    - Kategori Yönetimi (CRUD)
    - Marka Yönetimi (CRUD)
    - Toplu İşlemler (seçili ürünlerde fiyat/stok/aktif toplu güncelle)
    - **Aktarım**:
      - Excel/CSV yükle (sütunlar: ModelKodu, StokKodu, Barkod, UrunAdi, Aciklama, StokAdedi, AlisFiyati, ListeFiyati, SatisFiyati, Kategori, Marka, Resim (`;` ayraçlı), Ozellik, Etiketler, Aktif) — upsert mantığı (StokKodu unique)
      - Görseller URL'leri üzerinden çekilir, ilk görsel kapak
      - Tüm ürünleri Excel olarak dışa aktar
  - **Siparişler**: liste, filtre (durum/tarih), detay (müşteri bilgi, adres, ödeme, ürünler), durum değiştir (yeni → hazırlanıyor → kargoda → teslim → iptal)
  - **Kullanıcılar**: liste, rol yönetimi, engelleme
  - **İçerik Yönetimi**
    - Sayfalar (hakkımızda, iade vb. rich text)
    - Menü Yönetimi (menu_items sürükle-bırak sıralama)
    - Slider Yönetimi (görsel yükle, metin, sıralama)
    - Vitrin Yönetimi (öne çıkanları seç)
    - Duyurular (üst bant metni)

---

### Teknik detaylar
- **Stack**: TanStack Start (mevcut) + Cloud (Supabase yönetimli) + shadcn/ui + `xlsx` paketi (Excel), + `react-hook-form` + `zod`
- **RLS**: `products` public SELECT sadece `aktif=true AND stok_adedi>0`; admin SELECT/INSERT/UPDATE/DELETE `has_role`
- **Rol tablosu**: `user_roles` + `app_role` enum + `has_role()` security definer fonksiyonu
- **Excel**: `xlsx` kütüphanesi client-side parse, sonra edge function ile bulk upsert
- **Storage**: slider/ürün görselleri için Cloud storage bucket

### Kabul kriterleri
- Stok=0 ürün hiçbir public sayfada görünmez
- Excel yükle → 436+ ürün 30 sn içinde içeri alınır
- Misafir sepete ekler, checkout'ta kayıt olur, sipariş admin panelinde anında görünür
- Admin kimliği ilk girişte otomatik provision olur

Onaylarsan Aşama 0'dan başlayıp sırayla teslim ederim.