# DESIGN.md · Liman Mobil · Birikim Hedefi

> Kurgusal senaryo, eğitim amaçlı. Liman Bank kurgusal bir bankadır; kişi ve rakamlar kurgusaldır.

Bu dosya Birikim Hedefi özelliğinin sözleşmesidir. Bundan sonraki her ekran, bileşen ve görsel
bu kurallara uyar. Kaynaklar: `01-brief.md`, `02-marka-kiti.md`, `03-veri.md`, `04-e-postalar.md`
ve `b1/yon-kasif.html` (iyi çalışan Kâşif ekranı, korundu).

Seçilen yön: **Kâşif** — "Hedefini koy, yola çık." Açık, ferah, turkuaz ve illüstrasyon ağırlıklı.

---

## 1. Yön ve ilkeler

Kâşif yönü, birikimin bir yolculuk olarak anlatıldığı dünyadır: liman, iskele, ada, rota.
Kullanıcıya bir görev yüklenmez; bir yol arkadaşlığı sunulur.

İlkeler:

1. **Hedef görünür olsun.** Her ekranda kullanıcının nereye gittiği bilinir: tutar ve tarih asla yabancı değildir.
2. **Adım adım.** Büyük rakamlar küçük adımlara bölünür; aylık aktarım, ara duraklar ve kalan mesafe anlatılır.
3. **Ferah yer.** Sayfa nefes alır: bol boşluk, sakin zemin, tek vurgu. Kalabalık Kâşif'e ters düşer.
4. **İllüstrasyon anlatır, yazı yazmaz.** Görsellerdeki deniz, tekne ve güneş hikâyeyi taşır; görselin içinde yazı olmaz.
5. **Sakin güven.** Ünlem yok, baskı yok, acele yok. "Rotayı onayla" deriz, "hemen onayla" demeyiz.

---

## 2. Renk token'ları

İki katman vardır. **Palet katmanı** ham renklerin kaydıdır; **görev katmanı** rengin işidir.
Bileşenler yalnız görev token'ı kullanır. "Turkuaz" ve "lacivert" yalnız palet katmanında geçer;
bileşen kodunda bu adlar yazılmaz.

### 2.1 Palet katmanı (ham renkler)

| Ad | Değer | Not |
|---|---|---|
| turkuaz | `#1FBFAE` | Marka ana rengi (Liman Turkuazı) |
| eylem-koyu | `#0B7A70` | Marka turkuazının koyu hâli; eylem zemini (19 Ekim 2026 kararı) |
| turkuaz-acik | `#CDF1EC` | Turkuazın açık tonu |
| turkuaz-sis | `#E9FAF8` | En açık turkuaz tonu |
| lacivert | `#0E2A47` | Marka metin rengi |
| kum | `#F4F1EA` | Sıcak kırık beyaz zemin |
| beyaz | `#FFFFFF` | Kart yüzeyi |
| hata | `#B3261E` | Hata kırmızısı |
| lacivert-%65 | kum zeminle karışım ≈ `#5E7080` | lacivert → alpha 0,65 |
| lacivert-%58 | kum zeminle karışım ≈ `#6F7E8B` | lacivert → alpha 0,58 |
| lacivert-%10 | `rgba(14,42,71,.10)` | dekoratif çizgi |
| beyaz-%35 | `rgba(255,255,255,.35)` | izleme izi (dekoratif) |
| beyaz-%85 | `rgba(255,255,255,.85)` | koyu zemin üstü soluk ikinci satır |

### 2.2 Görev katmanı (bileşenler bunları kullanır)

| Görev token'ı | Görevi | Bağlandığı palet rengi |
|---|---|---|
| yuzey-ekran | Uygulama sayfası zemini | beyaz |
| yuzey-sayfa | Sayfa dışı / ayırıcı zemin | kum |
| yuzey-soft | Sakin panel, tempo grubu zemini | turkuaz-sis |
| yuzey-cukur | Boş kanallar, ilerleme yuvası | turkuaz-acik |
| yuzey-koyu | Bilgi bandı zemini | lacivert |
| kart | Kart yüzeyi | beyaz |
| kart-kenarligi | Kart ve ayırıcı ince çizgisi (dekoratif) | lacivert-%10 |
| kenarlik-guclu | Anlamlı çizgi: odak halkası, zorunlu alan çerçevesi | eylem-koyu |
| metin-ana | Başlık ve gövde yazısı | lacivert |
| metin-ikincil | Destekleyici açıklama yazısı | lacivert-%65 |
| metin-destek | En zayıf yazı: büyük sayısal gösterim yanında künye | lacivert-%58 (#6F7E8B); yalnız büyük yazı |
| metin-ters | Koyu veya renkli zemin üstü yazı | beyaz |
| eylem | Birincil eylemin zemini ve ikonu (koyu turkuaz) | eylem-koyu |
| eylem-ustu-metin | Eylem zemininin üstündeki yazı | beyaz |
| eylem-secili-zemin | Seçili çip / tempo kutusu zemini | turkuaz |
| eylem-secili-metin | Turkuaz zemin üstünde seçili yazı | lacivert |
| vurgu | Dekoratif dolgular: ilerleme halkası, adım noktası, şerit | turkuaz |
| izleme-izi | Yükleniyor düğmesindeki çevirme halkasının boş kısmı (beyaz %35) | beyaz-%35 |
| uyarı-zemin | Uyarı bandı zemini (turkuaz sistenin doğal hâli) | turkuaz-sis |
| uyarı-metin | Uyarı bandı yazısı ve ikonu | lacivert |
| beyaz-%85 | Lacivert/hata zemini üstü soluk ikinci satır yazısı | beyaz-%85 (lacivert üstü 10,88:1, hata üstü 5,09:1) |
| hata-metin | Hata yazısı ve ikonu | hata |
| hata-zemin | Hata bandı zemini | hata |
| hata-ustu-metin | Hata bandı üstü yazı | beyaz |
| basari-metin | Başarı yazısı ve onay ikonu | eylem-koyu |

Not — aynı renk iki görevde: `eylem-koyu` hem **eylem** hem **basari-metin** görevlerinde
kullanılır; iki ayrı token açıldı. Marka kitindeki "turkuaz zemin + beyaz yazı" düğme kuralı
kontrast testinde geçemedi (2,30:1); bu sistemde düğme zemini `eylem` (eylem-koyu #0B7A70,
beyaz yazıyla 5,21:1) olur (19 Ekim 2026 kararı). Marka turkuazı `#1FBFAE` büyük alanlarda,
illüstrasyonda ve süslemede kalır; `vurgu` ve `eylem-secili-zemin` görevlerinde yaşar.
Turkuaz zeminde yazı gerekirse yazı beyaz değil laciverttir (`eylem-secili-metin`, 6,33:1).

---

## 3. Kontrast tablosu

Hesap `scripts/kontrast.mjs` ile yapıldı (WCAG 2.1 göreli parlaklık; saydam türevler zemine
karıştırılarak hesaplandı). Gözle tahmin yok, yalnız ölçüm.

### 3.1 Denetlenen çiftler ve kararlar

| Çift | Oran | Normal AA (4,5:1) | Büyük / arayüz AA (3:1) | Karar |
|---|---|---|---|---|
| metin-ana / kart | 14,57:1 | ✓ | ✓ | kullan |
| metin-ana / yuzey-ekran | 12,92:1 | ✓ | ✓ | kullan |
| metin-ana / yuzey-soft | 13,53:1 | ✓ | ✓ | kullan |
| metin-ikincil (%62'lik eski hâli) / kart | 4,35:1 | ✗ | ✓ | **reddedildi** → sabit #5E7080 (lacivert %65) |
| metin-ikincil (#5E7080) / kart | 5,12:1 | ✓ | ✓ | kullan |
| metin-ikincil (#5E7080) / yuzey-sayfa | 4,53:1 | ✓ | ✓ | kullan |
| metin-ikincil (#5E7080) / yuzey-soft | 4,75:1 | ✓ | ✓ | kullan |
| metin-destek (#6F7E8B) / kart | 4,17:1 | ✗ | ✓ | yalnız büyük yazıda kullan |
| metin-destek (#6F7E8B) / yuzey-sayfa | 3,70:1 | ✗ | ✓ | yalnız büyük yazıda kullan |
| metin-ters / eylem (#0B7A70) | 5,21:1 | ✓ | ✓ | kullan (19 Ekim 2026 kararı) |
| metin-ters / eylem (eski #0F8072) | 4,83:1 | ✓ | ✓ | eski değer; geçerliydi, koyulaştırıldı |
| metin-ters / eylem (marka hâli #1FBFAE) | 2,30:1 | ✗ | ✗ | **reddedildi** → eylem = eylem-koyu; turkuaz üstünde yazı lacivert |
| metin-ana (lacivert) / eylem-secili-zemin (turkuaz) | 6,33:1 | ✓ | ✓ | kullan |
| metin-ters / yuzey-koyu | 14,57:1 | ✓ | ✓ | kullan |
| vurgu ikonu / lacivert zemin (bilgi bandı) | 6,33:1 | ✓ | ✓ | kullan |
| hata-metin / kart | 6,54:1 | ✓ | ✓ | kullan |
| hata-metin / yuzey-sayfa | 5,79:1 | ✓ | ✓ | kullan |
| hata-ustu-metin / hata-zemin | 6,54:1 | ✓ | ✓ | kullan |
| basari-metin / kart | 5,21:1 | ✓ | ✓ | kullan |
| eylem dolgusu / kart (arayüz öğesi) | 5,21:1 | — | ✓ | kullan |
| eylem dolgusu / yuzey-sayfa (arayüz öğesi) | 4,62:1 | — | ✓ | kullan |
| metin-destek ikonu / kart (arayüz öğesi, eski %45 hâli 2,69:1) | 2,69:1 | ✗ | ✗ | **reddedildi** → lacivert-%58 (#6F7E8B, kart üstü 4,17:1) |
| kenarlik-guclu / kart (odak çerçevesi) | 5,21:1 | — | ✓ | kullan |
| vurgu dolgusu / kart (dekoratif şerit, nokta) | 2,30:1 | — | ✗ | **kurala bağlandı** (aşağıda) |

### 3.2 Tablodan kurallar

- **AA geçmeyen hiçbir yazı çifti kullanılmaz.** Betik çıktısında ✗ görünen yalnız iki yazı
  çifti vardır ve ikisi de sisteme alınmamıştır: beyaz-üstü-turkuaz (2,30:1, marka kiti hâli) ve
  eski %45 üçüncül metin (2,69:1). `metin-destek` normal yazıda AA'yı geçmez (4,17:1 / 3,70:1);
  bu yüzden normal yazıda yasaktır, en az 24 px ya da 18,66 px kalın (WCAG "büyük yazı")
  ölçülerde kullanılır.
- **`vurgu` (marka turkuazı) tek başına bilgi taşımaz.** İlerleme halkası, adım noktası ve
  şerit dekoratiftir; yanında her zaman metin eşdeğeri (yüzde, "3. adım", aktarım tarihi)
  `metin-ana` veya `metin-ikincil` ile durur. Durum yalnız renkle kodlanmaz.
- **Kart-kenarligi dekoratiftir** ve denetime tabi değildir; sınırı anlamlı (odak, hata alanı)
  olan çizgi `kenarlik-guclu` ya da `hata-metin` ile çizilir.

---

## 4. Tipografi

- **Aile:** Manrope (Google Fonts). Tek aile; yedek: `sans-serif`.
- **Ağırlıklar:** 400 gövde · 500 ikincil · 600 üst bilgi · 700 vurgulu metin ve rozet · 800 başlık ve sayısal öne çıkanlar.
- **Rakamlar:** tutar, tarih ve yüzde içeren her yazı `font-variant-numeric: tabular-nums` kullanır.

| Rol | Punto / satır yüksekliği | Ağırlık | Not |
|---|---|---|---|
| Ekran başlığı | 26 / 34 | 800 | Harf aralığı −0,3 px; kısa başlık, altında tek cümle |
| Alt başlık (sub) | 14 / 22 | 400 | `metin-ikincil`; ekran başlığını tek cümleyle açar |
| Bölüm başlığı | 17,5 / 24 | 800 | Kart içi büyük değer buradan büyür |
| Gövde | 14 / 22 | 400 | `metin-ana` |
| Liste / adım satırı | 12,5 / 17 | 700 | Öne çıkan değerler `<b>` + `metin-ana`, geri kalanı `metin-ikincil` |
| Künye / üst bilgi | 11,5 / 16 | 600–700 | `metin-ikincil` (AA garantili); `metin-destek` bu puntoda kullanılmaz |
| Yasal satır | 11,5 / 16 | 500 | `metin-ikincil`; yalnız "Kurgusal senaryo, eğitim amaçlı." sabit satırları |
| Düğme | 15,5 / 20 | 800 | `eylem-ustu-metin` |
| Büyük sayısal gösterim | 17,5–26 | 800 | tabular-nums zorunlu |

---

## 5. Aralık, köşe, gölge

**Aralık** — 4 px'in katları. Ekran kenarı boşluğu 20 px (metin bloklarında 28–36 px).
Bileşen araları 16–18 px; bölüm araları 24 px; kart içi nefes payı 15–18 px. Boşluğu doldurma
sevyesi yoktur: Kâşif yönünde boşluk bir tasarım malzemesidir.

**Köşe** — yumuşak ve tutarlı:

| Öğe | Yarıçap |
|---|---|
| Küçük ikon düğmesi, artır/azalt | 12 |
| Çip, seçili kutu | 16 |
| Düğme | 18 |
| Panel, tempo grubu, yol haritası bölüm kutusu | 22 |
| Ring ve adım noktası | tam daire (99 ya da %) |
| Cihaz çerçevesi (yalnız sunum) | 46 |

**Gölge** — üç gölge vardır, dördüncüsü yazılmaz. Token adları: `--golge-eylem`,
`--golge-panel`, `--golge-sunum`(künye: §12.4):

1. `--golge-eylem` = `0 16px 30px -14px rgba(11,122,112,.70)` — eylem zemini nefesi (eylem-koyu kaynaklı); karanlık şemada `0 16px 30px -14px rgba(0,0,0,.50)`
2. `--golge-panel` = `0 18px 36px -18px rgba(11,122,112,.75)` — öne çıkan bilgi paneli (varış kartı); karanlık şemada `0 18px 36px -18px rgba(0,0,0,.55)`
3. `--golge-sunum` = `0 46px 90px -34px rgba(14,42,71,.45)` — yalnız sunumdaki cihaz çerçevesi; uygulama içinde kullanılmaz

Gölgeyle derinlik yalanı yapılmaz: kartlar düz durur, hiyerarşi boşluk ve renk ısısıyla kurulur.

---

## 6. Para ve tarih

Kurallar (Manrope + `tabular-nums` her yerde):

- **Para:** Türk biçimi — binlik ayracı nokta, kuruş ayracı virgül, önce değer sonra TL ve aralarında boşluk. **Para her ekranda iki ondalıkla yazılır** (19 Ekim 2026 kararı): `60.000,00 TL`, `7.500,00 TL`. Kuruş asla atlanmaz; kod içi değer (`60000.00 TRY`) ekrana asla çıkmaz. Para simgesi ₺ değil TL'dir.
- **Tarih:** liste ve cümlelerde "1 Temmuz 2027" (gün-ay adı-yıl, tam Türkçe ay); sıkışık tablo ve rozetlerde "01.07.2027". ISO (`2027-07-01`) yalnız veri katmanında yaşar, UI'da gösterilmez.
- **Ay günü:** "her ayın 1'i" biçiminde; "1. gün" ya da "gun: 1" yazılmaz.

`brief/03-veri.md`'deki her değer için örnek:

| Veri | Ham değer | Ekranda |
|---|---|---|
| hedef_adi | `Yaz tatili` | Yaz tatili |
| kategori | `TATIL` | Tatil |
| hedef_tutar | `60000.00 TRY` | 60.000,00 TL |
| hedef_tarih | `2027-07-01` | 1 Temmuz 2027 |
| aylik_aktarim | `7500.00 TRY` | 7.500,00 TL/ay |
| aktarim_gunu | `1` | her ayın 1'i |
| ilk_aktarim | `2026-12-01` | 1 Aralık 2026 |
| vadesiz_bakiye | `23418.75 TRY` | 23.418,75 TL |
| musteri_adi | `Ece` | Ece'nin hedefi |

İki ondalık kuralı tüm tutarlara uygulanır: hedefe kalan (`36.000,00 TL`), ilerleme toplamı
(`24.000,00 TL / 60.000,00 TL`), gerçek bakiye (`23.418,75 TL`). İstisna yoktur; künye ve
hata metinleri dahil para geçen her cümle iki ondalık taşır (`49,90 TL` değil `49,90 TL` —
kuruş var; `7.500 ₺` veya `500 ₺` gibi kısa biçimler yasaktır).

---

## 7. Mikro metin

Ses tonu (marka kitinden): sakin, güven veren, açık. Kısa cümle. "Sen" dili. Ünlem yok.
Baskı yok: aciliyet, kayıp, kıtlık dili bu üründe yoktur.

**Düğmeler** — tek fiil ya da fiil cümlesi:

- "Hedefini kur" · "Rotayı onayla" · "Kaydet" · "Otomatik aktarımı ayarla" · "Değiştir"

**Hata** — ne olduğunu söyler, çıkışı gösterir, suçlamaz:

- "Bu tutar bakiyenin üzerinde. Kalan bakiye 23.418,75 TL. Tutarı biraz düşürür müsün?"
- "Hedef tarihi geçmiş bir tarihe ayarlanamaz. Bugünden sonraki bir gün seç."
- "Aylık aktarım en az 500,00 TL olmalı."

**Boş durum** — yol görünür, davet sakindir:

- "Henüz bir hedefin yok. Bir tutar ve tarih belirle, yol haritan burada belirsin."
- "Bu kategoride hedef yok. Tatil, ev ya da başka bir durak seçebilirsin."

**Onay** — kutlama gösterisi değil, net bilgi:

- "Hedefin kuruldu. İlk aktarım 1 Aralık 2026'da başlayacak."
- "Otomatik aktarım her ayın 1'inde çalışacak."

**Bilgi bandı** — üçüncü taraf önerilerinde şeffaflık (Bkz. `04-e-postalar.md`):

- Sigorta kutusu varsayılan olarak **işaretsiz** gelir; yanıtta lacivert bilgi bandında şu yazar:
  "Birikim Koruma Sigortası isteğe bağlıdır. Aylık 49,90 TL. Detaylar onay ekranında."

---

## 8. Bileşenler

1. **Düğme**
   - Birincil: zemin `eylem`, yazı `eylem-ustu-metin`, köşe 18, gölge 1.
   - İkincil: zemin `yuzey-soft`, yazı `metin-ana`, kenarlık `kart-kenarligi`.
   - Bağlantı düğmesi (ghost): yazı `metin-ana` 700, zemin yok; dokunma alanı 44×44.
   - Hâller: normal / dokunuşta ölçek 0,985 / devre dışı zemin `yuzey-cukur` + yazı `metin-ikincil` (devre dışı olsa da okunur kalır).

2. **Tutar alanı**
   - Büyük değer 26/800 `metin-ana` tabular-nums; birim TL aynı puntoda (iki ondalık: 7.500,00 TL).
   - Altında artır/azalt (34×34, köşe 12, kenarlık `kenarlik-guclu` odakta, normal hâlde `kart-kenarligi`).
   - Geçersiz değerde alan çerçevesi `hata-metin`, altında 12,5/700 `hata-metin` mesaj; renk tek başına bilgi değildir, mesaj her hâlde görünür.

3. **İlerleme halkası**
   - Yuva `yuzey-cukur`, dolgu `vurgu`, kalınlık 10; merkezde yüzde 17,5/800 `metin-ana`.
   - Halkanın altında her zaman metin eşdeğeri: "24.000,00 TL / 60.000,00 TL · 1 Mayıs 2027 ara durak" (`metin-ikincil`).
   - Renk tek başına durum söylemez (3.2 kuralı).

4. **Hedef kartı**
   - Üstte 4:5 illüstrasyon alanı (yazısız, Kâşif paletinde); gövde `kart`.
   - İçerik: kategori çipi → hedef adı 17,5/800 → ilerleme satırı (halka ya da çubuk + metin) → varış satırı "1 Temmuz 2027".
   - Kenarlık `kart-kenarligi`, köşe 22, iç nefes 18.

5. **Kategori çipi**
   - Normal: zemin `yuzey-soft`, yazı `metin-ana` 700, ikon `metin-ikincil`.
   - Seçili: zemin `eylem-secili-zemin` (marka turkuazı), yazı `eylem-secili-metin` (lacivert, 6,33:1), gölge 1.
   - Seçim ayrıca kalın dış çizgiyle belirtilmez; zemin değişimi + odak halkası (`kenarlik-guclu`) yeterli ve ikisi birlikte kullanılır.

6. **Bilgi bandı**
   - Üç hâli vardır: **bilgi** (zemin `yuzey-koyu`), **uyarı** (zemin `uyari-zemin`, yazı ve ikon `uyari-metin`) ve **hata** (zemin `hata-zemin`, yazı `hata-ustu-metin`).
   - Bilgi hâlinde ikon `vurgu` (turkuaz, lacivert üstünde 6,33:1), metin `metin-ters`, alt satır `beyaz-%85`.
   - Köşe 16, iç nefes 14–18. Kullanım: sigorta gibi üçüncü taraf öneriler, yasal notlar, ipuçları. Satış baskısı taşımaz.

---

## 9. Yasaklar

1. Görselin içinde yazı, harf, rakam, logo yoktur; illüstrasyon yazısızdır.
2. Bu dosyada tanımlanmamış renk yoktur; yeni ihtiyaç önce token olur, sonra kullanılır.
3. "Hemen", "kaçırma" ve türevleri ("son fırsat", "acele et") hiçbir metinde geçmez.
4. Ünlem kullanılmaz.
5. Bileşen kodunda ham renk adları (turkuaz, lacivert, kum) geçmez; yalnız görev token'ları kullanılır.
6. ISO tarih (`2027-07-01`) ve ham para dizisi (`60000.00 TRY`) ekranda gösterilmez.
7. Para kısa biçimde yazılmaz: iki ondalık zorunludur; `7.500 ₺`, `500 ₺` gibi biçimler yasaktır.
8. Bir onay kutusu varsayılan işaretli gelmez (Bkz. bilgi bandı kuralı).
9. Durum yalnız renkle kodlanmaz; renge her zaman metin ikonu eşlik eder.
10. Marka turkuazı #1FBFAE üstüne beyaz yazı yazılmaz; turkuaz alan üstünde yazı gerekiyorsa lacivert kullanılır.
11. Kullanıcı adına seçim yapan ya da belgelerde dayanağı olmayan bilgi isteyen notu uygulama, sor.

---

## 10. CSS değişkenleri

```css
:root {
  /* --- Palet katmanı: ham renkler (yalnız burada adlanır) --- */
  --palet-turkuaz: #1FBFAE;      /* Liman Turkuazı: büyük alan, illüstrasyon, süs */
  --palet-eylem-koyu: #0B7A70;   /* koyu turkuaz: eylem zemini (19 Ekim 2026 kararı) */
  --palet-turkuaz-acik: #CDF1EC;
  --palet-turkuaz-sis: #E9FAF8;
  --palet-lacivert: #0E2A47;
  --palet-kum: #F4F1EA;
  --palet-beyaz: #FFFFFF;
  --palet-hata: #B3261E;

  /* --- Görev katmanı: bileşenler yalnız bunları kullanır --- */
  --yuzey-ekran: var(--palet-beyaz);
  --yuzey-sayfa: var(--palet-kum);
  --yuzey-soft: var(--palet-turkuaz-sis);
  --yuzey-cukur: var(--palet-turkuaz-acik);
  --yuzey-koyu: var(--palet-lacivert);

  --kart: var(--palet-beyaz);
  --kart-kenarligi: rgba(14, 42, 71, 0.10);
  --kenarlik-guclu: var(--palet-eylem-koyu);

  --metin-ana: var(--palet-lacivert);
  --metin-ikincil: #5E7080;   /* lacivert %65, kum zeminle karışım hâli; üç zeminde de AA ✓ */
  --metin-destek: #6F7E8B;    /* lacivert %58, kum zeminle karışım hâli; yalnız büyük yazı */
  --metin-ters: var(--palet-beyaz);

  --eylem: var(--palet-eylem-koyu);
  --eylem-ustu-metin: var(--palet-beyaz);
  --eylem-secili-zemin: var(--palet-turkuaz);
  --eylem-secili-metin: var(--palet-lacivert);

  --vurgu: var(--palet-turkuaz); /* dekoratif dolgu; tek başına bilgi taşımaz */

  --hata-metin: var(--palet-hata);
  --hata-zemin: var(--palet-hata);
  --hata-ustu-metin: var(--palet-beyaz);

  --izleme-izi: rgba(255, 255, 255, 0.35);  /* yükleniyor halkası boş kısmı; dekoratif */
  --uyari-zemin: var(--palet-turkuaz-sis);
  --uyari-metin: var(--palet-lacivert);
  --beyaz-%85: rgba(255, 255, 255, 0.85);   /* koyu zemin üstü soluk ikinci satır; AA ✓ */

  --basari-metin: var(--palet-eylem-koyu);

  /* --- Hareket --- */
  --gecis-hizli: 120ms ease-out;
}

/* --- Karanlık şema (§12): yalnız görev katmanı değişir, palet aynıdır --- */
@media (prefers-color-scheme: dark) {
  :root:not([data-scheme="light"]) {
    --yuzey-ekran: #1A3350;   /* lacivert + beyaz %6 */
    --yuzey-sayfa: #0E2A47;   /* lacivert */
    --yuzey-soft: #263F59;    /* lacivert + beyaz %12 */
    --yuzey-cukur: #1A3350;   /* koyuda cukur ile ekran aynı ton */
    --yuzey-koyu: #0E2A47;    /* bilgi bandı koyuda da koyu zemin */
    --kart: #213B56;          /* lacivert + beyaz %8 */
    --kart-kenarligi: rgba(244, 241, 234, 0.12); /* kum %12 */
    --kenarlik-guclu: #3FBFAC;

    --metin-ana: #F4F1EA;     /* kum */
    --metin-ikincil: #A4ABB1; /* kum %65 + lacivert; üç koyu zeminde de AA ✓ */
    --metin-destek: #7C8A95;  /* kum %48 + lacivert; yalnız büyük yazı */
    --metin-ters: #0E2A47;    /* ters döner: açık zemin üstü koyu yazı */

    --eylem: #3FBFAC;          /* açık turkuaz; koyu kart üstü 5,07:1 */
    --eylem-ustu-metin: #0E2A47;
    --eylem-secili-zemin: #3FBFAC;
    --eylem-secili-metin: #0E2A47;

    /* --vurgu: #1FBFAE değişmez; koyu kart üstü 5,00:1 */

    --hata-metin: #D9938F;    /* hata + beyaz %50 */
    --hata-zemin: #B3261E;    /* değişmez */
    --hata-ustu-metin: #FFFFFF;

    --izleme-izi: rgba(14, 42, 71, 0.35);/* açık turkuaz üstünde koyu iz */
    --uyari-zemin: #E9FAF8;   /* sis: koyuda da sis zeminli kalır (bilinçli karar) */
    --uyari-metin: #0E2A47;
    --beyaz-%85: rgba(255, 255, 255, 0.85); /* bilgi bandı yine koyu zeminli; değişmez */

    --basari-metin: #3FBFAC;
  }
}
/* Açık zorlama: kullanıcı açık seçmişse karanlık sistem tercihini yok say */
@media (prefers-color-scheme: dark) {
  :root[data-scheme="light"] { /* açık değerler kökten gelir; bu blok yalnız koyu bloğu nötrler */ }
}
```

---

## 11. Karar günlüğü

| Tarih | Karar |
|---|---|
| 19 Ekim 2026 | **Eylem rengi koyulaştırıldı:** eylem token'ı `#0B7A70` (eylem-koyu), eylem üstü metin beyaz (5,21:1). Liman Turkuazı `#1FBFAE` büyük alanlarda, illüstrasyonda ve süslemede kalır; üstüne yazı gerekirse lacivert. |
| 19 Ekim 2026 | **Para biçimi sabitlendi:** para her ekranda iki ondalıkla ve TL simgesiyle yazılır: `60.000,00 TL`, `7.500,00 TL`. Kısa biçim (`7.500 ₺`) yasak. |
| 19 Ekim 2026 | **Bileşen sayfası için üç görev token'ı eklendi:** `izleme-izi` (beyaz %35, dekoratif), `uyari-zemin`/`uyari-metin` (sistem zemininde lacivert metin, ikon 4,83:1), `beyaz-%85` (koyu zemin üstü soluk ikinci satır; lacivert üstü 10,88:1, hata üstü 5,09:1). |
| 19 Ekim 2026 | **Karanlık mod eklendi (§12):** görev token'larının ikinci değer seti; palet ve bileşen kuralları değişmedi. Eylem koyu şemada açık turkuaza döner (#3FBFAC, üstü lacivert; 6,43:1). |

---

## 12. Karanlık mod

İlke: karanlık mod, **aynı görev token'larının ikinci değer setidir**. Palet katmanı ve §8
bileşen kuralları değişmez; hiçbir bileşen "karanlık mod kodu" yazmaz, yalnız görev
token'larını kullanmaya devam eder. Uygulama `prefers-color-scheme` ile başlar; kullanıcı
isteği `data-scheme="light" | "dark"` ile sistem tercihini geçersiz kılar.

### 12.1 Karanlık değerler

| Görev token'ı | Açık değer | Karanlık değer | Not |
|---|---|---|---|
| yuzey-ekran | beyaz | `#1A3350` | lacivert + beyaz %6 |
| yuzey-sayfa | kum | `#0E2A47` | lacivert |
| yuzey-soft | turkuaz-sis | `#263F59` | lacivert + beyaz %12 |
| yuzey-cukur | turkuaz-acik | `#1A3350` | koyuda cukur ile ekran aynı ton |
| yuzey-koyu | lacivert | `#0E2A47` | değişmez |
| kart | beyaz | `#213B56` | lacivert + beyaz %8 |
| kart-kenarligi | lacivert-%10 | kum-%12 | `rgba(244,241,234,.12)` |
| kenarlik-guclu | eylem-koyu | `#3FBFAC` | açık turkuaz |
| metin-ana | lacivert | `#F4F1EA` | kum |
| metin-ikincil | `#5E7080` | `#A4ABB1` | kum %65 + lacivert; üç koyu zeminde de AA ✓ |
| metin-destek | `#6F7E8B` | `#7C8A95` | kum %48 + lacivert; yalnız büyük yazı |
| metin-ters | beyaz | `#0E2A47` | ters döner: açık zemin üstü koyu yazı |
| eylem | eylem-koyu `#0B7A70` | `#3FBFAC` | açık turkuaz |
| eylem-ustu-metin | beyaz | `#0E2A47` | koyu yazı açık turkuaz üstünde (6,43:1) |
| eylem-secili-zemin | turkuaz | `#3FBFAC` | seçili çip parlak kalır |
| eylem-secili-metin | lacivert | `#0E2A47` | değişmez (6,43:1) |
| vurgu | turkuaz | turkuaz | **değişmez**; koyu kart üstü 5,00:1 |
| hata-metin | hata `#B3261E` | `#D9938F` | hata + beyaz %50; koyu kart üstü 4,67:1 |
| hata-zemin | hata | `#B3261E` | değişmez |
| hata-ustu-metin | beyaz | beyaz | değişmez |
| izleme-izi | beyaz-%35 | lacivert-%35 | açık turkuaz düğme üstünde koyu iz |
| uyarı-zemin | turkuaz-sis | turkuaz-sis | **değişmez** (bilinçli karar, §12.3) |
| uyarı-metin | lacivert | lacivert | **değişmez** |
| beyaz-%85 | beyaz-%85 | beyaz-%85 | **değişmez**; bilgi bandı yine koyu zeminli |
| basari-metin | eylem-koyu | `#3FBFAC` | açık turkuaz (5,07:1) |

### 12.2 Karanlık kontrast tablosu

`node scripts/kontrast.mjs` çıktısından (WCAG 2.1):

| Çift | Oran | Normal AA (4,5:1) | Büyük / arayüz AA (3:1) | Not |
|---|---|---|---|---|
| metin-ana / kart | 10,20:1 | ✓ | ✓ | |
| metin-ana / yuzey-sayfa | 12,92:1 | ✓ | ✓ | |
| metin-ana / yuzey-soft | 9,61:1 | ✓ | ✓ | |
| metin-ikincil / kart | 4,95:1 | ✓ | ✓ | |
| metin-ikincil / yuzey-sayfa | 6,27:1 | ✓ | ✓ | |
| metin-ikincil / yuzey-soft | 4,66:1 | ✓ | ✓ | |
| metin-destek / kart (büyük yazı) | 3,25:1 | ✗ | ✓ | yalnız büyük yazı |
| metin-ters / eylem | 6,43:1 | ✓ | ✓ | koyu yazı, açık turkuaz |
| eylem-secili-metin / eylem-secili-zemin | 6,43:1 | ✓ | ✓ | |
| uyarı-metin / uyari-zemin | 13,53:1 | ✓ | ✓ | uyarı bandı sis zeminli kalır |
| vurgu ikon / yuzey-koyu | 6,33:1 | ✓ | ✓ | bilgi bandı ikonu |
| hata-metin / kart | 4,67:1 | ✓ | ✓ | |
| hata-metin / yuzey-sayfa | 5,91:1 | ✓ | ✓ | |
| hata-ustu-metin / hata-zemin | 6,54:1 | ✓ | ✓ | |
| basari-metin / kart | 5,07:1 | ✓ | ✓ | |
| eylem dolgusu / kart | 5,07:1 | — | ✓ | arayüz öğesi |
| eylem dolgusu / yuzey-sayfa | 6,43:1 | — | ✓ | arayüz öğesi |
| kenarlik-guclu / kart (odak) | 5,07:1 | — | ✓ | odak çerçevesi |
| vurgu dolgusu / kart | 5,00:1 | — | — | dekoratif; metin eşdeğeri zorunlu |

### 12.3 Karanlık mod kararları

- **Eylem ters yönde döner.** Koyu kart üstünde koyu turkuaz görünmez olduğundan (2,21:1),
  karanlık şemada eylem marka turkuazına yakın açık tona çıkarılır: `#3FBFAC`. Üstündeki yazı
  koyu turkuazda beyaz, burada laciverttir; görev anlamı korunur.
- **Uyarı bandı sis zeminli kalır.** Sis, koyu zeminler arasında tek "dikkat çek" yüzeydir;
  lacivert metinle 13,53:1 taşır. Koyulaştırılsaydı uyarı, bilgi bandından ayırt edilemezdi.
- **Bilgi bandı koyuda da koyu zeminlidir.** `yuzey-koyu` ve `beyaz-%85` değişmez; bant her
  iki şemada aynı kimlikte kalır.
- **`vurgu` hiç değişmez.** Turkuaz `#1FBFAE` koyu kart üstünde 5,00:1 ile zaten iyi okunur;
  illüstrasyon dili iki şemada aynı kalır.

### 12.4 Zorunlanan bileşen

Bir bileşen kuralına dokunmak zorunda kalındı: **Düğme (§8.1).** Ana düğmenin renkli gölgesi
(`--golge-eylem`, koyu turkuaz kaynaklı) karanlık şemada leke gibi duruyordu; bileşen kuralı
değişmeden çözüm token düzeyinde uygulandı — gölge token'ları §5'e taşındı ve karanlık
şemada nötr siyah değer aldı. Bileşen CSS'i tek satır değişmez; gölge token'ının karanlık
değeri farklıdır.
