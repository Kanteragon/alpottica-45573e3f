## Amaç
Özellik güncelleme mantığını güvenli hale getirmek, filtre arayüzünü tek tip select + "Uygula" akışına çevirmek ve admin tarafına toplu güncelleme, kargo, kampanya ekranları eklemek.

## 1. Özellik/renk güncellemede birebir eşleme
Bugün `src/routes/admin.ozellikler.tsx` değerleri virgülle parçalayıp **index sırasına göre** eski değerle eşliyor (`oldDegerler[i] -> newDegerler[i]`). Bir değer silinip eklendiğinde sıralar kayıyor ve "siyah → turuncu" tipi yanlış toplu değişim oluşuyor.

Yapılacak:
- Değer editörünü virgüllü tek textarea yerine satır satır listeye çevir; her satır kendi kimliğini (orijinal değer) taşısın.
- Rename yalnızca kullanıcının o satırda yaptığı değişiklik için `{eski değer → yeni değer}` haritası üretsin; sıraya göre tahmin yapılmasın.
- Yeni eklenen/silinen değerler için hiçbir ürün verisi güncellenmesin.
- `apply_attribute_rename` fonksiyonu birebir (exact match) değer eşlemesiyle çağrılmaya devam eder; kaç ürünün etkileneceği kaydetmeden önce onay kutusunda gösterilir.

## 2. Çoklu filtreleme + "Uygula" akışı
`src/routes/urunler.tsx` bugün her seçimde `window.location.search` atayıp sayfayı komple yeniliyor.

Yapılacak:
- Drawer açıldığında mevcut filtreler yerel taslak state'e kopyalanır; seçimler sadece bu taslağı değiştirir, sayfa yenilenmez.
- "UYGULA" butonu tek seferde TanStack Router `navigate` ile arama parametrelerini günceller (tam sayfa reload yok).
- Farklı özelliklerden birden çok filtre birlikte uygulanabilir (renk + ekartman + cam tipi vb.), üst üste daraltma çalışır.
- "TEMİZLE" taslağı ve URL'i sıfırlar.

## 3. Ekartman ve tüm özellikler: sadece select
- Chip/kutucuk (buton listesi) yapısı tamamen kaldırılır.
- Her filtrelenebilir özellik için tek bir `<select>` (Tümü + o özelliğin değerleri) render edilir; ekartman da bu yapıya dahil olur.
- Ekartman değerleri sayısal sıralanır, eşleştirme normalize edilmiş anahtar üzerinden yapılır (Excel'den gelen "Ekartman"/"ekartman" farkı sorun çıkarmaz).
- Aynı özelliğin iki kez listelenmesi (Çerçeve Rengi + Renk gibi) normalize anahtar birleştirmesiyle engellenir.

## 4. Kategoriye göre filtre havuzu
Filtre seçenekleri, sabit özellik tanımlarından değil, **o an listelenen (kategori/etiket filtresi uygulanmış, stoğu > 0) ürün kümesinden** üretilir. Böylece Klipsli veya Outlet kategorisinde yalnızca o üründe var olan değerler görünür; sonuç döndürmeyen değer listelenmez.

## 5. Toplu Ürün Güncelleme ekranı (admin)
Yeni sayfa: `/admin/toplu-guncelleme`
- Üstte filtre: ürün adı arama, kategori, marka, özellik+değer.
- Sonuç tablosu, tümünü seç / tek tek seçim.
- Seçili ürünlere toplu uygulama: özellik değeri ata (mevcut özelliği güncelle veya yeni ekle), kategori ekle/çıkar, etiket ekle.
- İşlem öncesi "X ürün etkilenecek" onayı; işlem sonrası özet.

## 6. Outlet ürünlerinde İngilizce renk düzeltmesi
Aynı ekranda tek tıklık yardımcı aksiyon: Outlet kategorisindeki ürünlerin adında geçen renk kelimelerini tarar ve `çerçeve rengi` özelliğini Türkçeleştirir.
`black → Siyah`, `gold → Altın Rengi`, `silver → Gümüş Rengi`, `gun → Metal Gri`, `blue → Mavi`, `brown → Kahverengi`, `rose → Rose Gold`.
Önce önizleme (kaç ürün, hangi eşleşme), sonra uygulama.

## 7. Kargo Yönetimi
Yeni tablo `shipping_settings`: firma adı, kargo ücreti, aktiflik.
- Admin ekranı: `/admin/kargo` — firma adı + ücret düzenleme.
- Sepet ve ödeme sayfası kargo satırını bu değerden okur; toplam = ara toplam + kargo.
- Siparişe kargo firması ve ücreti kaydedilir.

## 8. Kampanya Yönetimi
Yeni tablo `campaigns`: ad, tip (`ucretsiz_kargo` | `kombine_indirim`), eşik tutarı, ürün/kategori referansları, indirim tutarı/oranı, aktiflik, tarih aralığı.
- Admin ekranı: `/admin/kampanyalar` — kural oluşturma/düzenleme/silme.
- Sepet & ödeme: aktif kampanyalar değerlendirilir; eşik aşılırsa kargo 0 gösterilir, kombine kural sağlanırsa indirim satırı eklenir ve toplam düşer.
- Uygulanan kampanya adı sepet özetinde görünür.

## 9. Arayüz temizliği
Katalog filtre alanında yalnızca: Kategori, Marka, Fiyat aralığı ve dinamik özellik select'leri kalır. Tüm chip/kutucuk kalabalığı silinir.

## 10. Test
- Katalog: çoklu filtre kombinasyonları, ekartman select, kategori bazlı değer havuzu, Uygula/Temizle (sayfa yenilenmeden).
- Admin: özellik adı/değeri değişince yalnız hedef değerin güncellendiğinin doğrulanması.
- Toplu güncelleme ve Outlet renk dönüşümü önizleme + uygulama.
- Sepet/ödeme: kargo ücreti, ücretsiz kargo eşiği, kombine indirim ve sipariş kaydı uçtan uca.

### Teknik notlar
- Yeni tablolar RLS ile: herkes okuyabilir (aktif kayıtlar), yalnız admin yazabilir; GRANT'lar migration içinde.
- Kampanya/kargo hesabı ortak bir `src/lib/pricing.ts` yardımcısında toplanır, sepet ve ödeme aynı sonucu üretir.
- Filtre state'i URL arama parametrelerinde kalır (paylaşılabilir link), ama güncelleme router navigate ile yapılır.
