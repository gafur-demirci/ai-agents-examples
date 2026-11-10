Kurgusal senaryo, eğitim amaçlı.

# Liman Destek · senaryo klasörü

Liman Bank'ın mobil uygulaması Liman Mobil'e 2 Kasım 2026 Pazartesi **Birikim Hedefi** özelliği girdi.
Lansman haftası destek kuyruğunu doldurdu: 9 Kasım 18.00 itibarıyla **40 kayıt** bekliyor. Destek
Operasyonları yöneticisi Ece Doğru bugün bir ajan istiyor. Sen Liman Bank Dijital Kanallar ekibindesin
ve bu ajanı gün boyu katman katman kuracaksın.

Bu klasördeki her şey kurgusaldır: Liman Bank, kişiler, müşteri numaraları, kayıtlar, rakamlar ve
belgeler. Bu not JSON dosyaları için de geçerlidir.

## Nasıl kullanılır

1. Zip'i aç, `liman-destek` klasörünü bilgisayarında bir yere koy.
2. Terminalde klasöre gir ve Claude Code'u bu klasörde başlat:

   ```sh
   cd liman-destek
   claude
   ```

3. İlk iş `talep.md`. Sonraki adımlar eğitimde blok blok gelecek.

## Klasör

| Yol | İçerik |
|---|---|
| `talep.md` | Ece Doğru'nun mesajı, 10 Kasım 2026 |
| `el-kitabi.md` | Destek el kitabı: kategoriler, öncelik, ekipler, kurallar K-1…K-8, yanıt tonu |
| `bilgi-bankasi/` | Müşteriye verilebilir sekiz cevap, BB-01…BB-08 |
| `bilinen-sorunlar.md` | Açık bilinen sorunlar listesi |
| `kuyruk/kayitlar.json` | Kuyruktaki 40 kayıt, LMN-24101…LMN-24140 |
| `eval/vakalar.json` | Eval setinin 15 kayıt kimliği |
| `eval/beklenen.json` | Her eval vakasının doğru cevabı |
| `ciktilar/biletler/` | Boş. Ajanın açtığı biletler buraya düşer |
| `ciktilar/taslaklar/` | Boş. Ajanın yazdığı müşteri taslakları buraya düşer |

## Kayıt alanları (`kuyruk/kayitlar.json`)

| Alan | Ne |
|---|---|
| `id` | Kayıt kimliği, `LMN-24101` biçiminde |
| `kanal` | `uygulama-ici`, `e-posta` ya da `cagri-merkezi-notu` |
| `tarih` | Kaydın geldiği an, ISO 8601, Türkiye saati (+03:00) |
| `musteri_no` | Müşteri numarası, `M-3xxxx` |
| `musteri_adi` | Müşterinin adı |
| `cihaz` | İşletim sistemi ve sürümü |
| `uygulama_surumu` | Liman Mobil sürümü |
| `konu` | Kaydın konu satırı |
| `metin` | Müşterinin yazdığı ya da çağrı merkezinin not aldığı metin |

## Bilmen gerekenler

- Kayıtlardaki TCKN ve kart numaraları bilerek geçersizdir: TCKN algoritmasını ve Luhn denetimini
  geçmezler. Yine de gerçek veri gibi davran, el kitabındaki maskeleme kuralı (K-1) geçerlidir.
- Müşteriye hiçbir şey gönderilmez. Ajanın müşteriye yazdığı her metin `ciktilar/taslaklar/` altına
  taslak olarak düşer, gönderme kararı insanındır (K-7).
- `eval/beklenen.json` ölçüm içindir, ajan bu dosyayı okumaz. B4'te bunu bir izin kuralıyla kapatacağız.
