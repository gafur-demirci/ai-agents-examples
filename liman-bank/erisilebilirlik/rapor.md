# Erişilebilirlik raporu · site/ prototipi (8 ekran + duyuru kartı)

Denetim: WCAG 2.2 AA · Yöntem: axe-core otomatik tarama (her ekranda, akışla gezinerek) + manuel denetim
(dokunma hedefi ölçüleri, Tab ile odak sırası ve görünürlük, %200 büyütme, img alt metinleri).
Tarama aracı: `site/tarama.cjs` (Playwright + @axe-core/playwright, wcag2a/2aa/21aa/22aa etiketleri).

## Önce / sonra

| Ölçüm | Önce | Sonra |
|---|---|---|
| axe-core ihlali (toplam, 8 ekran) | 2 | **0** |
| 24×24 CSS px altı dokunma hedefi | 1 (onay kutusu 13×18) | **0** |
| img alt="" (anlamsız boş alt) | 10 | **0** |
| %200 büyütmede yatay taşma | 0 | 0 |
| Klavye odak görünür (Tab sırası) | 8/8 görünür | 8/8 görünür (değişmedi) |

Ayrıntılı tarama kayıtları: `axe-once.md`, `axe-sonra.md` (tool çıktısı, ham).

## Bulgular ve düzeltmeler

| Ekran | Öğe | WCAG maddesi | Sorun | Önem | Düzeltme |
|---|---|---|---|---|---|
| Tutar ve tarih | Tempo kutusu seçili düğmesinin alt etiketi ("8 ay · sakin deniz", beyaz %80) | 1.4.3 Kontrast (minimum) | Lacivert yazı, turkuaz zemin üstünde %80 opaklıkla 4,2:1 — 4,5 altında | Ciddi | Opaklık tamamen kaldırıldı; beyaz yerine tam `--eylem-secili-metin` (lacivert, 6,33:1) |
| Hedef detayı | İlerleme halkası (`role="img"`) | 1.1.1 Metin dışı içerik | `role="img"` öğesinin alt metni yok; ekran okuyucu yüzdeyi okuyamıyor | Ciddi | Statik `aria-label` eklendi + `detayEkraniniAc()` her açılışta güncel değerle yeniliyor |
| Onay | Sigorta onay kutusu | 2.5.8 Hedef boyutu (minimum) | 13×18 CSS px — 24×24 altı | Ciddi | Görsel kutu 26×26'ya büyütüldü (18px görsel + saydam pay yöntemi yerine gerçek boyut) |
| Tüm ekranlar | 10 img, `alt=""` | 1.1.1 Metin dışı içerik | Dekoratif sanılıyor ama her görsel kategori/hedef anlatıyor; boş alt = bilgi kaybı | Ciddi | Her img'ye Türkçe anlamlı alt; çip içindeki minik önizleme `aria-hidden="true"` (yanındaki metin zaten kategori adı) |

## Manuel denetim — sorun çıkmayanlar

- **%200 büyütme (1.4.4):** 195px genişlik testinde yatay kaydırma ve taşma yok (0 öğe); tek kolon akıyor.
- **Odak görünürlüğü (2.4.7):** Tab sırası DOM sırasıyla uyumlu; tüm düğmelerde 2px turkuaz outline + gölge görünüyor.
- **Yazı görselleri (1.4.5):** Uygulama içinde yazı içeren görsel yok — tüm metin gerçek metin; yalnız illüstrasyonlar yazısız (bu, kuralın kendisi).
- **Dokunma hedefi (2.5.8):** Kalan 35 hedefin tümü ≥24×24; ikincil düğmeler 42×42 (44'ün 2px altında — AA geçer, 2.5.5 AAA değil).

## Kullanıcının aleyhine çalışan tasarım kalıbı (WCAG maddesi yok, ayrı başlık)

1. **Onay ekranındaki koşullu düğme kilidi:** "Hedefi kur" düğmesi, sigorta kararına kadar `disabled`.
   Görme sorunu olmayan kullanıcı için bile anlaşılması güç bir engel: kullanıcı ne yapacağını bilmiyor,
   düğme neden pasif, söylemi en alttaki küçük yazıda. Ekran okuyucuda `disabled` düğme "soluk düğme"
   olarak duyulur ve nedeni duyulmaz. Öneri: düğme asla kilitlenmesin; karar kutusu varsayılan işaretsiz
   kalsın, kullanıcı kutuya dokunmadan "Hedefi kur" derse aynı onay istemi ekranda alsın. (Kural gereği
   bu kalıp korundu; bu bir ürün kararı, notu CLAUDE.md/DESIGN.md §12.4'e işlendi.)
2. **Sayaç animasyonundaki bilgi erişimi:** Ana sayfa ve detay halkasında ilerleme yüzdeleri animasyonla
   beliriyor; `prefers-reduced-motion` kullanıcıları için animasyonun kapatılan hâli yok. Animasyon
   dekoratif olduğundan bilgi kaybı yok ama hareket hassasiyeti olan kullanıcıda gereksiz hareket var.
   Düzeltme: `@media (prefers-reduced-motion: reduce)` ile `animation: none` + nihai değer.
