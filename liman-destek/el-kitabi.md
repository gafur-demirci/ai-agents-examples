Kurgusal senaryo, eğitim amaçlı.

# Liman Bank · Destek el kitabı

Sahibi: Ece Doğru, Destek Operasyonları. Liman Mobil'den gelen her destek kaydı bu el kitabına göre
sınıflanır, önceliklenir ve bir ekibe ya da bir taslağa yönlenir.

## Kategoriler

| Kod | Kategori | Varsayılan ekip |
|---|---|---|
| `giris-erisim` | Giriş, şifre, cihaz eşleme, SMS doğrulama | MOBIL-L2 |
| `odeme-transfer` | EFT, FAST, havale, gecikme, iade | ODEME |
| `kart` | Kart kapatma, limit, kart işlemi itirazı | KART |
| `birikim-hedefi` | Hedef oluşturma, otomatik aktarım, hedef bozma | BIRIKIM |
| `uygulama-hatasi` | Çökme, boş ekran, donma, görüntü hatası | MOBIL-L2 |
| `guvenlik` | Dolandırıcılık şüphesi, yetkisiz işlem, hesabın ele geçirilmesi | GUVENLIK |
| `oneri-sikayet` | Görüş, öneri, genel şikâyet | MUSTERI-DENEYIMI |

## Öncelik

| Öncelik | Ne zaman | Hedef süre |
|---|---|---|
| P1 | Para kaybı ya da güvenlik riski. Ya da bilinen sorunlar listesinde olmayan aynı hata 3 ya da daha fazla kayıtta (kesinti) | 1 saat |
| P2 | Müşteri işlem yapamıyor ama para kaybı yok (transfer gerçekleşmedi, aktarım çalışmadı) | 4 iş saati |
| P3 | Bilgi talebi, öneri, görüntü sorunu | 2 iş günü |

## Ekipler

| Ekip | Ne alır |
|---|---|
| MOBIL-L2 | `giris-erisim` ve `uygulama-hatasi` kayıtları |
| ODEME | `odeme-transfer` kayıtları |
| KART | `kart` kayıtları |
| BIRIKIM | `birikim-hedefi` kayıtları ve bilgi bankasında olmayan Birikim Hedefi ürün soruları (K-5). Ürün yöneticisi Selin Aras |
| GUVENLIK | Dolandırıcılık Önleme. `guvenlik` kayıtlarını devralır, müşteriyi arar (K-3) |
| MUSTERI-DENEYIMI | `oneri-sikayet` kayıtları |

## Kurallar

| Kod | Kural |
|---|---|
| K-1 | Kişisel veri maskelenir: TCKN ilk 2 ve son 2 hane açık (`12*******01`), kart numarası yalnız son 4 (`**** **** **** 4417`), IBAN yalnız ülke kodu ve son 4 (`TR** … 0921`). Bilette ve taslakta tam numara olmaz |
| K-2 | Aynı müşteri numarası ve aynı konu 48 saat içinde ikinci kez gelirse yeni bilet açılmaz. İkinci kayıt ilk kaydın biletine bağlanır |
| K-3 | Güvenlik kategorisi her zaman P1 ve GUVENLIK ekibine gider. Müşteriye otomatik yanıt taslağı yazılmaz. Bilete "müşteri aranacak" notu düşülür |
| K-4 | Bilgi bankasında cevabı olan bilgi talebine bilet açılmaz. Cevap taslağı yazılır ve kullanılan bilgi bankası maddesi (BB-xx) taslağın altında belirtilir |
| K-5 | Bilgi bankasında olmayan ürün bilgisi (faiz, getiri, ücret, limit) uydurulmaz. Ürün ekibine (BIRIKIM) soru bileti açılır, müşteriye "kontrol edip size döneceğiz" taslağı yazılır |
| K-6 | Bilinen sorunlar listesindeki bir hataya yeni bilet açılmaz. Kayıt o sorunun biletine (MOB-8812 gibi) bağlanır ve sorunun önceliğini alır, müşteriye düzeltme tarihiyle taslak yazılır |
| K-7 | Müşteriye giden her metin taslaktır. Gönderme kararı insanındır |
| K-8 | Bilet açılan ya da açık bir bilete bağlanan her kayıtta, güvenlik hariç (K-3), müşteriye kısa bir bilgilendirme taslağı yazılır: kaydın alındığı ve hangi ekibin baktığı. Söz verilmeyen tarih yazılmaz |

## Yanıt tonu

- "Siz" dili.
- Sakin ve açık.
- En fazla dört cümle.
- Ünlem yok.
- Söz verilmeyen tarih yazılmaz.

## İlgili dosyalar

- `bilgi-bankasi/`: müşteriye verilebilir cevaplar, BB-01…BB-08.
- `bilinen-sorunlar.md`: açık bilinen sorunlar ve düzeltme tarihleri.
