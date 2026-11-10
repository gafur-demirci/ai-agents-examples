// Liman Destek · MCP server (SPEC: araclar/SPEC.md)
// stdout yalnız MCP mesajları içindir; tüm günlük console.error ile stderr'e yazılır.

import { McpServer } from "@modelcontextprotocol/server"
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio"
import * as z from "zod/v4"
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const burasi = fileURLToPath(new URL(".", import.meta.url))
const kokDizini = resolve(burasi, "..")
const bbDizini = resolve(kokDizini, "bilgi-bankasi")
const biletlerDizini = resolve(kokDizini, "ciktilar", "biletler")

const gunluk = (...parcalar) => console.error("[liman-destek]", ...parcalar)

// ---- el-kitabi.md tablolarından geçerli değerler ----
const KATEGORILER = [
  "giris-erisim",
  "odeme-transfer",
  "kart",
  "birikim-hedefi",
  "uygulama-hatasi",
  "guvenlik",
  "oneri-sikayet",
] as const
const ONCELIKLER = ["P1", "P2", "P3"] as const
const EKIPLER = ["MOBIL-L2", "ODEME", "KART", "BIRIKIM", "GUVENLIK", "MUSTERI-DENEYIMI"] as const

// ---- bilgi_ara yardımcıları ----

// Türkçe küçük harfe çevirme: toLocaleLowerCase("tr"); ICU yetersizse de I→ı, İ→i doğru kalsın
function kucult(metin) {
  return metin.replace(/I/g, "ı").replace(/İ/g, "i").toLocaleLowerCase("tr")
}

const DURAK_KELIMELER = new Set([
  "ve", "veya", "ile", "için", "ama", "fakat", "bir", "bu", "şu", "o",
  "ben", "benim", "her", "daha", "çok", "mi", "mı", "mu", "mü", "de", "da", "ki", "ne",
])

function kelimeler(sorgu) {
  return kucult(sorgu)
    .replace(/[^0-9a-zçğıöşü\s]+/g, " ")
    .split(/\s+/)
    .filter((kelime) => kelime.length > 2 && !DURAK_KELIMELER.has(kelime))
}

function bbListesi() {
  const maddeler = []
  for (const dosya of readdirSync(bbDizini)) {
    if (!dosya.endsWith(".md")) continue
    const icerik = readFileSync(resolve(bbDizini, dosya), "utf8")
    const eslesme = /^#\s*(BB-\d+)\s*·\s*(.+)$/m.exec(icerik)
    if (!eslesme) {
      gunluk("uyarı: başlığı okunamadı, atlandı:", dosya)
      continue
    }
    const baslikSatiri = eslesme[0]
    const metin = icerik.slice(icerik.indexOf(baslikSatiri) + baslikSatiri.length).trim()
    maddeler.push({ kod: eslesme[1], baslik: eslesme[2].trim(), metin })
  }
  return maddeler
}

function bbAra(sorgu) {
  const sorguKelimeleri = kelimeler(sorgu)
  if (sorguKelimeleri.length === 0) return { eslesme_yok: true, sonuclar: [] }
  const adaylar = []
  for (const madde of bbListesi()) {
    const tumMetin = kucult(`${madde.kod} ${madde.baslik} ${madde.metin}`)
    const baslik = kucult(`${madde.kod} ${madde.baslik}`)
    let puan = 0
    for (const kelime of sorguKelimeleri) {
      if (baslik.includes(kelime)) puan += 2
      else if (tumMetin.includes(kelime)) puan += 1
    }
    if (puan > 0) adaylar.push({ madde, puan })
  }
  adaylar.sort((a, b) => b.puan - a.puan || a.madde.kod.localeCompare(b.madde.kod))
  return {
    eslesme_yok: adaylar.length === 0,
    sonuclar: adaylar.slice(0, 3).map(({ madde }) => ({
      kod: madde.kod,
      baslik: madde.baslik,
      metin: madde.metin,
    })),
  }
}

// ---- bilet_ac yardımcıları ----

// K-1: maskelenmemiş TCKN (11 ardışık hane), kart (4'lü gruplar hâlinde 16 hane), IBAN (TR + haneler)
const TCKN_ORANTISI = /\b[1-9][0-9]{10}\b/
const KART_ORANTISI = /\b\d{4}(?:[ -]?\d{4}){3}\b/
const IBAN_ORANTISI = /\bTR[0-9]{2}(?:\s?[0-9]{4}){2,}[0-9]{0,3}\b/i

function maskelemeIhlalleri(ozet) {
  const ihlaller = []
  if (TCKN_ORANTISI.test(ozet)) ihlaller.push("TCKN")
  if (KART_ORANTISI.test(ozet)) ihlaller.push("kart numarası")
  if (IBAN_ORANTISI.test(ozet)) ihlaller.push("IBAN")
  return ihlaller
}

function kimlikGecerli(kimlik) {
  return /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(kimlik)
}

function zamanEtiketi() {
  return new Date().toISOString()
}

// ---- server ----

const server = new McpServer({ name: "liman-destek-araclar", version: "0.1.0" })

server.registerTool(
  "bilgi_ara",
  {
    description:
      "Bilgi bankasında (bilgi-bankasi/, BB-01…BB-08) müşteri sorusunun hazır cevabı var mı kontrol etmek için kullan. " +
      "Bir bilgi talebine karar verirken bilet açmadan ya da taslak yazmadan ÖNCE çağır (K-4: BB'de cevap varsa bilet açılmaz). " +
      "Sorguyu müşteri sorusundan anahtar kelimelerle kur. Dönüş: sorguya en ilgili en çok 3 madde (kod, başlık, metin). " +
      "Eşleşen madde yoksa bunu açıkça söyler; o zaman ürün bilgisi sorusuysa K-5 (soru-bileti), arıza ise bilet/bağlama yoluna git. " +
      "Kendi bilginden BB maddesi uydurma.",
    inputSchema: z.object({
      sorgu: z
        .string()
        .describe('Aranacak konu; müşteri sorusundan anahtar kelimeler (örn. "otomatik aktarım günü değiştirme")'),
    }),
  },
  async ({ sorgu }) => {
    gunluk('bilgi_ara çağrıldı: "' + sorgu + '"')
    if (sorgu.trim().length === 0) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: "Sorgu boş olamaz. Müşteri sorusundan anahtar kelimelerle bir sorgu yazıp aracı yeniden çağır.",
          },
        ],
      }
    }
    let sonuc
    try {
      sonuc = bbAra(sorgu)
    } catch (hata) {
      const sebep = hata instanceof Error ? hata.message : String(hata)
      gunluk("bilgi_ara hatası:", sebep)
      return {
        isError: true,
        content: [
          {
            type: "text",
            text:
              "bilgi-bankasi/ okunamadı: " +
              sebep +
              ". Hazır cevap arama adımını atla; kararı bilet ya da soru-bileti (K-5) yoluyla ver; aracı tekrar tekrar çağırma.",
          },
        ],
      }
    }
    gunluk("bilgi_ara: eslesme_yok=" + sonuc.eslesme_yok + ", sonuç sayısı=" + sonuc.sonuclar.length)
    return {
      content: [{ type: "text", text: JSON.stringify(sonuc, null, 2) }],
      structuredContent: sonuc,
    }
  },
)

server.registerTool(
  "bilet_ac",
  {
    description:
      "Kararın aksiyonu bilet, soru-bileti ya da bagla olduğunda kullan. " +
      "48 saat içinde aynı müşteri + aynı konu ikinci kez geldiyse yeni bilet AÇMA; ilk kaydın kimliğini bagli olarak ver (K-2). " +
      "Bilinen bir soruna bağlanacaksan sorun kodunu (örn. MOB-8812) bagli olarak ver (K-6). " +
      "guvenlik kayıtları eskalasyon akışına gider; bu araç müşteriyle temas kurmaz (K-3). " +
      "Bilet numarası kaydın kimliğidir.",
    inputSchema: z.object({
      kayit_id: z
        .string()
        .describe("Ayıklanan kaydın kimliği (örn. LMN-24111). Yeni biletin numarası olur"),
      kategori: z
        .enum(KATEGORILER, {
          error:
            "kategori geçersiz. Geçerli değerler: " +
            KATEGORILER.join(", ") +
            " (el-kitabi.md Kategoriler tablosu). Değeri düzelt ve aracı yeniden çağır.",
        })
        .describe("el-kitabi.md Kategoriler tablosundaki kategori kodu"),
      oncelik: z
        .enum(ONCELIKLER, {
          error:
            "oncelik geçersiz. Geçerli değerler: P1, P2, P3 (öncelik tablosu). Değeri düzelt ve aracı yeniden çağır.",
        })
        .describe("öncelik tablosundaki öncelik kodu"),
      ekip: z
        .enum(EKIPLER, {
          error:
            "ekip geçersiz. Geçerli değerler: " +
            EKIPLER.join(", ") +
            " (Ekipler tablosu). Değeri düzelt ve aracı yeniden çağır.",
        })
        .describe("Ekipler tablosundaki ekip kodu"),
      ozet: z
        .string()
        .describe("Bilet özeti. Maskelenmemiş TCKN, kart numarası ya da IBAN İÇERMEZ (K-1)"),
      bagli: z
        .string()
        .optional()
        .describe(
          "Bağlanılacak bilet numarası (ilk kaydın kimliği) ya da bilinen sorun kodu. Verilirse yeni bilet açılmaz",
        ),
    }),
  },
  async ({ kayit_id, kategori, oncelik, ekip, ozet, bagli }) => {
    gunluk("bilet_ac çağrıldı: kayit_id=" + kayit_id + ", bagli=" + (bagli ?? "yok"))
    for (const [alan, deger] of [
      ["kayit_id", kayit_id],
      ["bagli", bagli],
    ]) {
      if (deger !== undefined && !kimlikGecerli(deger)) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text:
                alan +
                " '" +
                deger +
                "' geçersiz: yalnız harf, rakam, nokta, tire ve alt çizgi içerebilir. Değeri düzelt ve aracı yeniden çağır.",
            },
          ],
        }
      }
    }
    const ihlaller = maskelemeIhlalleri(ozet)
    if (ihlaller.length > 0) {
      gunluk("bilet_ac: maskeleme ihlali:", ihlaller.join(", "))
      return {
        isError: true,
        content: [
          {
            type: "text",
            text:
              "ozet içinde maskelenmemiş kişisel veri var (K-1): TCKN ilk 2 ve son 2 hane açık (12*******01), " +
              "kart numarası yalnız son 4 (**** **** **** 4417), IBAN yalnız ülke kodu ve son 4 (TR** … 0921). " +
              "Tespit edilen: " +
              ihlaller.join(", ") +
              ". Özeti bu biçimde maskele ve aracı yeniden çağır. Tam numara bilete yazılmaz.",
          },
        ],
      }
    }
    try {
      mkdirSync(biletlerDizini, { recursive: true })
      let biletNo
      let dosyaRelatif
      let yeniBilet
      let bagliKayitlar
      if (bagli !== undefined) {
        biletNo = bagli
        yeniBilet = false
        const hedef = resolve(biletlerDizini, bagli + ".json")
        let kayit
        if (existsSync(hedef)) {
          kayit = JSON.parse(readFileSync(hedef, "utf8"))
        } else {
          kayit = { bilet_id: bagli, durum: "acik", olusturma: zamanEtiketi(), bagli_kayitlar: [] }
        }
        if (!Array.isArray(kayit.bagli_kayitlar)) kayit.bagli_kayitlar = []
        kayit.bagli_kayitlar.push({
          kayit_id,
          kategori,
          oncelik,
          ekip,
          ozet,
          baglandigi_tarih: zamanEtiketi(),
        })
        bagliKayitlar = kayit.bagli_kayitlar
        writeFileSync(hedef, JSON.stringify(kayit, null, 2) + "\n")
        dosyaRelatif = relative(kokDizini, hedef).replaceAll("\\", "/")
        gunluk("bilet_ac: kayıt bilete bağlandı:", dosyaRelatif)
      } else {
        biletNo = kayit_id
        yeniBilet = true
        bagliKayitlar = []
        const hedef = resolve(biletlerDizini, kayit_id + ".json")
        const kayit = {
          bilet_id: kayit_id,
          kayit_id,
          kategori,
          oncelik,
          ekip,
          ozet,
          olusturma: zamanEtiketi(),
          durum: "acik",
          bagli_kayitlar: [],
        }
        writeFileSync(hedef, JSON.stringify(kayit, null, 2) + "\n")
        dosyaRelatif = relative(kokDizini, hedef).replaceAll("\\", "/")
        gunluk("bilet_ac: bilet açıldı:", dosyaRelatif)
      }
      const sonuc = {
        bilet_no: biletNo,
        dosya: dosyaRelatif,
        yeni_bilet: yeniBilet,
        bagli_kayitlar: bagliKayitlar,
      }
      return {
        content: [{ type: "text", text: JSON.stringify(sonuc, null, 2) }],
        structuredContent: sonuc,
      }
    } catch (hata) {
      const sebep = hata instanceof Error ? hata.message : String(hata)
      gunluk("bilet_ac hatası:", sebep)
      return {
        isError: true,
        content: [{ type: "text", text: "bilet yazılamadı: " + sebep }],
      }
    }
  },
)

const transport = new StdioServerTransport()
await server.connect(transport)
gunluk("hazır: stdio server başladı")
