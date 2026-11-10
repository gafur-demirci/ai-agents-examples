# Araçlar · SPEC

Ajanın kullanacağı iki tool'un sözleşmesi. Kod yazılmadan önce tarifi burada tutulur.
Hedef: modelin hangi durumda hangi aracı çağıracağını el-kitabi.md kurallarına bağlamak;
kural ihlallerini tool tarafında yakalayıp modele düzelttirerek yeniden çağırma şansı tanımak.

## bilgi_ara

- **Adı:** `bilgi_ara`
- **Açıklama (modelin göreceği):**
  Bilgi bankasında (bilgi-bankasi/, BB-01…BB-08) müşteri sorusunun hazır cevabı var mı
  kontrol etmek için kullan. Bir bilgi talebine karar verirken bilet açmadan ya da taslak
  yazmadan ÖNCE çağır (K-4: BB'de cevap varsa bilet açılmaz). Sorguyu müşteri sorusunun
  anahtar kelimeleriyle kur. Dönüş: sorguya en ilgili en çok 3 madde (kod, başlık, metin).
  Eşleşen madde yoksa bunu açıkça söyler; o zaman ürün bilgisi sorusuysa K-5 (soru-bileti),
  arıza ise bilet/bağlama yoluna git. Kendi bilginden BB maddesi uydurma.
- **Girdiler:**

  | Girdi | Zorunlu | Açıklama |
  |---|---|---|
  | `sorgu` | evet | Aranacak konu; müşteri sorusundan anahtar kelimeler (örn. "otomatik aktarım günü değiştirme") |

- **Dönüş:** JSON:
  - Eşleşme varsa: `{ "eslesme_yok": false, "sonuclar": [ { "kod": "BB-02", "baslik": "…", "metin": "…" } ] }` (en çok 3 madde, ilgililik sırasıyla)
  - Eşleşme yoksa: `{ "eslesme_yok": true, "sonuclar": [] }`
- **Hata mesajları:**
  - `sorgu` boş ya da yalnız boşluk: `"Sorgu boş olamaz. Müşteri sorusundan anahtar kelimelerle bir sorgu yazıp aracı yeniden çağır."`
  - `bilgi-bankasi/` okunamazsa: araç hatayı aynen döner (sebep bilgisiyle). Mesaj şablonu: `"bilgi-bankasi/ okunamadı: <sebep>. Hazır cevap arama adımını atla; kararı bilet ya da soru-bileti (K-5) yoluyla ver; aracı tekrar tekrar çağırma."` Sessiz boş sonuç dönülmez.

## bilet_ac

- **Adı:** `bilet_ac`
- **Açıklama (modelin göreceği):**
  Kararın aksiyonu `bilet`, `soru-bileti` ya da `bagla` olduğunda kullan. 48 saat içinde
  aynı müşteri + aynı konu ikinci kez geldiyse yeni bilet AÇMA; ilk kaydın kimliğini
  `bagli` olarak ver (K-2). Bilinen bir soruna bağlanacaksan sorun kodunu (örn. MOB-8812)
  `bagli` olarak ver (K-6). `guvenlik` kayıtları eskalasyon akışına gider; bu araç
  müşteriyle temas kurmaz (K-3). Bilet numarası kaydın kimliğidir.
- **Girdiler:**

  | Girdi | Zorunlu | Açıklama |
  |---|---|---|
  | `kayit_id` | evet | Ayıklanan kaydın kimliği (örn. LMN-24111). Yeni biletin numarası olur |
  | `kategori` | evet | el-kitabi.md Kategoriler tablosundan: giris-erisim | odeme-transfer | kart | birikim-hedefi | uygulama-hatasi | guvenlik | oneri-sikayet |
  | `oncelik` | evet | P1 | P2 | P3 (öncelik tablosu) |
  | `ekip` | evet | Ekipler tablosundan: MOBIL-L2 | ODEME | KART | BIRIKIM | GUVENLIK | MUSTERI-DENEYIMI |
  | `ozet` | evet | Bilet özeti. Maskelenmemiş TCKN, kart numarası ya da IBAN İÇERMEZ (K-1) |
  | `bagli` | hayır | Bağlanılacak bilet numarası (ilk kaydın kimliği) ya da bilinen sorun kodu. Verilirse yeni bilet açılmaz |

- **Dönüş:** JSON:
  - Yeni bilet: `{ "bilet_no": "<kayit_id>", "dosya": "ciktilar/biletler/<kayit_id>.json", "yeni_bilet": true }`
  - Bağlama: `{ "bilet_no": "<bagli>", "dosya": "ciktilar/biletler/<bagli>.json", "yeni_bilet": false, "bagli_kayitlar": [ … ] }`
- **Hata mesajları:**
  - Geçersiz `kategori`: `"kategori '<x>' geçersiz. Geçerli değerler: giris-erisim, odeme-transfer, kart, birikim-hedefi, uygulama-hatasi, guvenlik, oneri-sikayet (el-kitabi.md Kategoriler tablosu). Değeri düzelt ve aracı yeniden çağır."`
  - Geçersiz `oncelik`: `"oncelik '<x>' geçersiz. Geçerli değerler: P1, P2, P3 (öncelik tablosu). Değeri düzelt ve aracı yeniden çağır."`
  - Geçersiz `ekip`: `"ekip '<x>' geçersiz. Geçerli değerler: MOBIL-L2, ODEME, KART, BIRIKIM, GUVENLIK, MUSTERI-DENEYIMI (Ekipler tablosu). Değeri düzelt ve aracı yeniden çağır."`
  - Maskeleme ihlali (bilet YAZILMAZ): `"ozet içinde maskelenmemiş kişisel veri var (K-1): TCKN ilk 2 ve son 2 hane açık (12*******01), kart numarası yalnız son 4 (**** **** **** 4417), IBAN yalnız ülke kodu ve son 4 (TR** … 0921). Özeti bu biçimde maskelenip aracı yeniden çağır. Tam numara bilete yazılmaz."`
  - Bağlama yapılacak dosya yoksa hata değil: `ciktilar/biletler/<bagli>.json`, boş `"bagli_kayitlar"` listesiyle açılır (tanım gereği).

## Bilinçli kararlar

1. **Açıklamalar (model talimatı) neden böyle:** Kural numaraları (K-2, K-3, K-4, K-5, K-6)
   doğrudan açıklamaya gömülü; model karar anında el-kitabi.md'yi yeniden okumadan doğru
   aracı ve doğru parametreyi seçebilsin. `bilgi_ara`, "eşleşme yok" bilgisini sessiz boşluk
   yerine açık alan olarak döner ki model BB uydurmasın (K-4/K-5 ayrımı buna dayanır).
2. **Hata mesajları neden böyle:** Her mesaj (a) geçerli değerleri el-kitabi.md tablolarından
   sayar, (b) modele "düzelt ve yeniden çağır" der. Böylece doğrulama hatası ölü nokta değil,
   öz-düzeltme adımı olur; geçerli değerler tek kaynak (el-kitabi.md) ile uyumda kalır.
3. **Maskeleme neden tool içinde de denetleniyor:** K-1 sert bir garantidir ("bilete tam
   numara olmaz"); modele güvenmek tek katman olur. Tool yazma anında ikinci katman olarak
   denetler (derinlemesine savunma): modelin gözünden kaçan TCKN/kart/IBAN bilet dosyasına
   hiç ulaşamaz. Hata mesajı maskeleme biçimini verir; model biçimi kendisi düzeltebilir.
