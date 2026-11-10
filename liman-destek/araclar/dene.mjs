// Liman Destek · MCP server duman testi
// initialize -> tools/list -> bilgi_ara -> kapat
// Windows uyumlu: kabuk borusu kullanmaz, child_process ile stdio üzerinden uçtan uca konuşur.

import { spawn } from "node:child_process"
import { once } from "node:events"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const burasi = dirname(fileURLToPath(import.meta.url))
const serverYolu = resolve(burasi, "server.ts")

// Node 24, dosya uzantısından .ts dosyalarını derlemesiz çalıştırır; platforma göre doğrudan node ile başlat.
const cocuk = spawn(process.execPath, [serverYolu], {
  stdio: ["pipe", "pipe", "pipe"],
})
cocuk.stdout.setEncoding("utf8")
cocuk.stderr.setEncoding("utf8")
cocuk.stderr.on("data", (parca) => process.stderr.write("[server] " + parca))

let tampon = ""
const cevapBekleyenler = new Map()
cocuk.stdout.on("data", (parca) => {
  tampon += parca
  let satirSonu
  while ((satirSonu = tampon.indexOf("\n")) !== -1) {
    const satir = tampon.slice(0, satirSonu).trim()
    tampon = tampon.slice(satirSonu + 1)
    if (!satir) continue
    const mesaj = JSON.parse(satir)
    if (mesaj.id !== undefined && cevapBekleyenler.has(mesaj.id)) {
      const { coz, reddet } = cevapBekleyenler.get(mesaj.id)
      cevapBekleyenler.delete(mesaj.id)
      if (mesaj.error) reddet(new Error(JSON.stringify(mesaj.error)))
      else coz(mesaj.result)
    }
  }
})

function istek(yontem, parametreler = {}) {
  const id = Math.floor(Math.random() * 1_000_000)
  const mesaj = { jsonrpc: "2.0", id, method: yontem, params: parametreler }
  const satir = JSON.stringify(mesaj) + "\n"
  return new Promise((coz, reddet) => {
    cevapBekleyenler.set(id, { coz, reddet })
    cocuk.stdin.write(satir)
  })
}

function zamanAsili(ms, ne) {
  return new Promise((_coz, reddet) => {
    const zamanlayici = setTimeout(() => reddet(new Error("zaman aşımı: " + ne)), ms)
    zamanlayici.unref?.()
  })
}

async function ana() {
  try {
    const baslangic = await Promise.race([
      istek("initialize", {
        protocolVersion: "2025-11-25",
        capabilities: {},
        clientInfo: { name: "liman-dene-client", version: "0.1.0" },
      }),
      zamanAsili(10_000, "initialize"),
    ])
    console.log("initialize → server:", JSON.stringify(baslangic.serverInfo))
    console.log("protocolVersion:", baslangic.protocolVersion)

    cocuk.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n")

    const liste = await Promise.race([
      istek("tools/list"),
      zamanAsili(10_000, "tools/list"),
    ])
    const adlar = liste.tools.map((t) => t.name).sort()
    console.log("tools/list →", adlar.join(", "))

    const arama = await Promise.race([
      istek("tools/call", { name: "bilgi_ara", arguments: { sorgu: "otomatik aktarım günü değiştirme" } }),
      zamanAsili(15_000, "tools/call bilgi_ara"),
    ])
    if (arama.isError) throw new Error("bilgi_ara hata döndü: " + arama.content[0].text)
    const icerik = arama.content.find((c) => c.type === "text")
    const sonuc = JSON.parse(icerik.text)
    console.log("bilgi_ara → eslesme_yok:", sonuc.eslesme_yok, "| kodlar:", sonuc.sonuclar.map((s) => s.kod).join(", "))

    console.log("DENE: tamam")
  } finally {
    cocuk.stdin.end()
    try {
      if (!cocuk.killed) cocuk.kill()
    } catch {}
    await Promise.race([once(cocuk, "exit"), new Promise((c) => setTimeout(c, 2000))])
  }
}

ana().catch((hata) => {
  console.error("DENE: hata —", hata.message)
  process.exitCode = 1
  cocuk.kill()
})
