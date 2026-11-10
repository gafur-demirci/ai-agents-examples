#!/usr/bin/env node
// Ölçüm koşusu: eval/vakalar.json'daki her kayıt için ajan ayrı bir headless
// `opencode-isbank run` sürecinde koşar, kararı eval/beklenen.json ile alan
// alan karşılaştırılır.
// Kullanım: node eval/kos.mjs <koşu no> [--kuru] [--paralel <n>] [--yalniz <kimlik,kimlik>]
// Yalnız Node'un kendi modülleri; harici paket yok.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EVAL = path.join(KOK, "eval");
const IZLER = path.join(EVAL, "izler");
const OLCUM_NOTU =
  "Bu bir ölçüm koşusu. Dosya yazma ve bilet_ac bu koşuda kapalı, çağırırsan reddedilir, aynı çağrıyı yeniden deneme. Açacağın bileti ve yazacağın taslağı kararında belirt. Son mesajın yalnız karar JSON'u olsun.";
const MODEL = "Model-Garden/glm-5.3";
const IKILI = path.join(os.homedir(), ".local", "opencode-isbank", "opencode-isbank");
const ZAMAN_ASIMI_MS = 240_000;
const ALANLAR = [
  "kategori",
  "oncelik",
  "ekip",
  "aksiyon",
  "bagli",
  "maskele",
  "musteriye_taslak",
];

let kosuNo = null;

function hataCik(m) {
  process.stderr.write(`${m}\n`);
  process.exit(2);
}

function argCoz(argv) {
  const opt = { kosu: null, kuru: false, paralel: 5, yalniz: null };
  const konum = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--kuru") opt.kuru = true;
    else if (a === "--paralel") {
      const n = Number(argv[++i]);
      if (!Number.isInteger(n) || n < 1) hataCik("--paralel pozitif tam sayı olmalı");
      opt.paralel = n;
    } else if (a === "--yalniz") {
      opt.yalniz = String(argv[++i] ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (opt.yalniz.length === 0) hataCik("--yalniz en az bir kimlik bekler");
    } else if (a.startsWith("--")) {
      hataCik(`Bilinmeyen seçenek: ${a}`);
    } else {
      konum.push(a);
    }
  }
  if (konum.length !== 1) {
    hataCik(
      "Kullanım: node eval/kos.mjs <koşu no> [--kuru] [--paralel <n>] [--yalniz <kimlik,kimlik>]",
    );
  }
  opt.kosu = konum[0];
  if (!/^[A-Za-z0-9._-]+$/.test(opt.kosu)) hataCik("Koşu no güvenli bir ad olmalı");
  return opt;
}

// Headless'ta skill ve yetki isteyen araçlar otomatik onaylansın; oturum kuyruğu
// ask'ta kalıp zaman aşısına düşmesin.
const IZIN_ENV = JSON.stringify({
  skill: "allow",
  bilet_ac: "allow",
  write: "allow",
  edit: "allow",
  webfetch: "allow",
  question: "allow",
});

function ortam() {
  const env = { ...process.env };
  env.OPENCODE_PERMISSION = IZIN_ENV;
  env.OPENCODE_DISABLE_AUTOUPDATE = "1";
  return env;
}

function argumanlar(kayitId) {
  return [
    "run",
    `${kayitId}. ${OLCUM_NOTU}`,
    "--command",
    "destek-ayiklama",
    "--format",
    "json",
    "--title",
    `eval-kos-${kayitId}`,
    "--model",
    MODEL,
  ];
}

function komutSatiri(kayitId) {
  return [IKILI, ...argumanlar(kayitId)]
    .map((x) => (/^[\w./:@=-]+$/.test(x) ? x : JSON.stringify(x)))
    .join(" ");
}

// Tek vakanın koşusu ----------------------------------------------------------

function vakaKos(kayitId) {
  return new Promise((coz) => {
    const izYolu = path.join(IZLER, kosuNo, `${kayitId}.jsonl`);
    fs.mkdirSync(path.dirname(izYolu), { recursive: true });
    const iz = fs.createWriteStream(izYolu, { encoding: "utf8" });
    const parcalar = [];
    const bas = Date.now();
    let cozuldu = false;
    let zamanAsimi = false;
    let acilisError = null;

    let p;
    try {
      p = spawn(IKILI, argumanlar(kayitId), {
        stdio: ["ignore", "pipe", "pipe"],
        cwd: KOK,
        shell: false,
        windowsHide: true,
        env: ortam(),
      });
    } catch (e) {
      if (e?.code === "ENOENT") {
        // Windows/npm benzeri kurulumda bir kez shell ile dene (aynen claude akışı).
        const komut =
          JSON.stringify(IKILI) +
          " " +
          argumanlar(kayitId)
            .map((x) => `"${String(x).replaceAll('"', '\\"')}"`)
            .join(" ");
        p = spawn(komut, {
          stdio: ["ignore", "pipe", "pipe"],
          cwd: KOK,
          shell: true,
          windowsHide: true,
          env: ortam(),
        });
        p.shellFallback = true;
      } else {
        coz({ durum: "hata", sure: 0, hata: e?.message ?? String(e) });
        return;
      }
    }

    const bitir = (ek) => {
      if (cozuldu) return;
      cozuldu = true;
      clearTimeout(zamanSayaci);
      iz.end(() => {
        iz.once("close", () => coz({ stdout: parcalar.join(""), sure: Date.now() - bas, ...ek }));
      });
    };

    const zamanSayaci = setTimeout(() => {
      zamanAsimi = true;
      try {
        p.kill("SIGKILL");
      } catch {}
    }, ZAMAN_ASIMI_MS);

    p.stdout.setEncoding("utf8");
    p.stdout.on("data", (parca) => {
      parcalar.push(parca);
      iz.write(parca);
    });
    p.stderr.setEncoding("utf8");
    p.stderr.on("data", (parca) => {
      // otomatik reddedilen yetki isteği stderr'a düşer; izde kalsın
      iz.write(parca);
    });
    p.once("error", (e) => {
      acilisError = e;
      try {
        p.kill("SIGKILL");
      } catch {}
    });
    p.once("close", (kod) => {
      if (zamanAsimi) {
        bitir({ durum: "zaman aşımı" });
      } else if (acilisError) {
        bitir({ durum: "hata", hata: acilisError.message ?? String(acilisError) });
      } else {
        bitir({ durum: "ok", kod });
      }
    });
  });
}

// JSON olay ayrıştırma --------------------------------------------------------

function sonJsonBul(metin) {
  const araliklar = [];
  let str = false;
  let esc = false;
  let derinlik = 0;
  let bas = -1;
  for (let i = 0; i < metin.length; i++) {
    const c = metin[i];
    if (str) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') str = false;
    } else if (c === '"') {
      str = true;
    } else if (c === "{") {
      if (derinlik === 0) bas = i;
      derinlik++;
    } else if (c === "}") {
      derinlik--;
      if (derinlik === 0 && bas >= 0) {
        araliklar.push([bas, i + 1]);
        bas = -1;
      }
    }
  }
  // Dengeli nesne yoksa (model kapanışı kesiyorsa) alanları tek tek regexle
  // kurtar; kısmi karar yine de alan alan karşılaştırmaya girer.
  const alanAdlari = [
    "kategori",
    "oncelik",
    "ekip",
    "aksiyon",
    "bagli",
    "maskele",
    "musteriye_taslak",
  ];
  const kismi = {};
  let buldu = false;
  for (const alan of alanAdlari) {
    const re = new RegExp(
      '"' + alan + '"\\s*:\\s*(null|true|false|"[^"\\\\]*(?:\\\\.[^"\\\\]*)*")',
    );
    const m = metin.match(re);
    if (!m) continue;
    buldu = true;
    const v = m[1];
    if (v === "null") kismi[alan] = null;
    else if (v === "true") kismi[alan] = true;
    else if (v === "false") kismi[alan] = false;
    else kismi[alan] = JSON.parse(v);
  }
  if (buldu) return kismi;
  return undefined;
}

function izleAyristir(stdout) {
  const olaylar = [];
  for (const satir of stdout.split("\n")) {
    const k = satir.trim();
    if (!k) continue;
    try {
      olaylar.push(JSON.parse(k));
    } catch {}
  }

  const cagirilar = [];
  const metinler = [];
  let ilkTs = null;
  let sonTs = null;
  let tokens = 0;
  let maliyet = 0;
  for (const o of olaylar) {
    if (typeof o.timestamp === "number") {
      if (ilkTs === null) ilkTs = o.timestamp;
      sonTs = o.timestamp;
    }
    const p = o.part ?? {};
    if (p.type === "tool") {
      cagirilar.push({
        ad: p.tool ?? "",
        durum: p.state?.status ?? "",
        girdi: p.state?.input ?? {},
        hata: p.error ?? p.state?.error ?? "",
      });
    } else if (p.type === "text" && typeof p.text === "string") {
      metinler.push(p.text);
    } else if (p.type === "step-finish") {
      if (p.tokens && typeof p.tokens.input === "number") {
        tokens += (p.tokens.input ?? 0) + (p.tokens.output ?? 0);
      }
      if (typeof p.cost === "number") maliyet += p.cost;
    }
  }
  const sonMetin = metinler[metinler.length - 1] ?? "";
  return {
    cagirilar,
    sonMetin,
    olaySuresi: ilkTs !== null && sonTs !== null ? sonTs - ilkTs : 0,
    tokens,
    maliyet,
  };
}

// Sızma denetimi --------------------------------------------------------------

function stringDegerler(x, kova = []) {
  if (typeof x === "string") kova.push(x);
  else if (Array.isArray(x)) for (const v of x) stringDegerler(v, kova);
  else if (x && typeof x === "object") for (const v of Object.values(x)) stringDegerler(v, kova);
  return kova;
}

function okumaDicek(girdi) {
  // ! ile başlayan glob (ör. "!eval/**") dışlama kalıbıdır, okuma sayılmaz.
  return stringDegerler(girdi).some(
    (s) => !s.startsWith("!") && (s.includes("eval/") || s.includes("beklenen")),
  );
}

function reddedildiMi(c) {
  const hata = `${c.hata}`;
  return (
    c.durum === "error" ||
    hata.includes("rejected permission") ||
    hata.includes("auto-rejecting")
  );
}

function sizmaDenetle(cagirilar) {
  let bulundu = false;
  let okundu = false;
  for (const c of cagirilar) {
    if (!okumaDicek(c.girdi)) continue;
    bulundu = true;
    if (reddedildiMi(c)) continue;
    okundu = true;
  }
  if (!bulundu) return "";
  return okundu ? "OKUNDU" : "reddedildi";
}

// Karşılaştırma ---------------------------------------------------------------

function norm(v) {
  if (v === null || v === undefined) return "";
  return String(v).trim().toLowerCase();
}

function alanlariKarsilastir(karar, beklenen) {
  const detay = {};
  let dogru = 0;
  for (const alan of ALANLAR) {
    const b = beklenen?.[alan];
    const g = karar?.[alan];
    const tam = norm(g) === norm(b);
    if (tam) dogru++;
    detay[alan] = { beklenen: b ?? null, gelen: g ?? null, tam };
  }
  return { detay, dogru };
}

function goster(v) {
  if (v === null || v === undefined || v === "") return "-";
  if (typeof v === "boolean") return v ? "true" : "false";
  return String(v);
}

// Ana akış --------------------------------------------------------------------

async function vakaDegerlendir(kayitId, beklenen) {
  const kos = await vakaKos(kayitId);
  const sonuc = {
    kayitId,
    durum: kos.durum,
    skor: 0,
    tam: false,
    detay: null,
    karar: null,
    okuma: "",
    red: 0,
    sure: kos.sure ?? 0,
    maliyet: null,
    hata: kos.hata ?? null,
  };

  if (kos.stdout) {
    const { cagirilar, sonMetin, olaySuresi, tokens, maliyet } = izleAyristir(kos.stdout);
    sonuc.okuma = sizmaDenetle(cagirilar);
    sonuc.red = cagirilar.filter(reddedildiMi).length;
    if (olaySuresi > 0) sonuc.sure = olaySuresi;
    if (maliyet > 0) sonuc.maliyet = maliyet;
    if (tokens > 0) sonuc.tokens = tokens;
    if (sonMetin) {
      const karar = sonJsonBul(sonMetin);
      if (karar && typeof karar === "object") {
        sonuc.karar = karar;
        const k = alanlariKarsilastir(karar, beklenen);
        sonuc.skor = k.dogru;
        sonuc.detay = k.detay;
        sonuc.tam = k.dogru === ALANLAR.length;
      } else {
        sonuc.durum = kos.durum === "ok" ? "JSON yok" : kos.durum;
      }
    } else if (kos.durum === "ok") {
      sonuc.durum = "JSON yok";
    }
  } else if (kos.durum === "ok") {
    sonuc.durum = "JSON yok";
  }
  return sonuc;
}

function konsolSatiri(s) {
  const sure = `${(s.sure / 1000).toFixed(1)}s`;
  const maliyet = s.maliyet === null ? "-" : `$${s.maliyet.toFixed(4)}`;
  const etiket = s.detay ? `${s.skor}/7` : s.durum;
  process.stdout.write(`${s.kayitId}  ${etiket}  ${sure}  ${maliyet}\n`);
}

function raporYaz(opt, kayitlar, sonuclar) {
  const yol = path.join(EVAL, `sonuc-${opt.kosu}.md`);
  const L = [];
  L.push(`# Koşu ${opt.kosu}`);
  L.push("");
  L.push(`- Tarih: ${new Date().toISOString()}`);
  L.push(`- Model: ${MODEL}`);
  L.push(`- Paralel: ${opt.paralel}`);
  L.push("");
  const baslik = ALANLAR.map((a) => (a === "musteriye_taslak" ? "taslak" : a)).join(" | ");
  L.push(`| vaka | ${baslik} | skor | eval | red | süre | maliyet |`);
  L.push(`|---|${ALANLAR.map(() => "---").join("|")}|---|---|---|---|---|`);
  let toplamDogru = 0;
  let tamVaka = 0;
  let toplamMaliyet = 0;
  let zamayi = 0;
  let jsonYok = 0;
  for (const s of sonuclar) {
    toplamDogru += s.skor;
    if (s.tam) tamVaka++;
    if (typeof s.maliyet === "number") toplamMaliyet += s.maliyet;
    if (s.durum === "zaman aşımı") zamayi++;
    else if (s.durum === "JSON yok") jsonYok++;
    let hucreler;
    if (s.detay) {
      hucreler = ALANLAR.map((a) => {
        const d = s.detay[a];
        return d.tam ? "✓" : `✗ ${goster(d.gelen)} → ${goster(d.beklenen)}`;
      });
    } else {
      hucreler = ALANLAR.map(() => "-");
    }
    L.push(
      `| ${s.kayitId} | ${hucreler.join(" | ")} | ${s.skor}/7${s.detay ? "" : ` (${s.durum})`} | ${s.okuma || " "} | ${s.red} | ${(s.sure / 1000).toFixed(1)}s | ${s.maliyet === null ? "-" : `$${s.maliyet.toFixed(4)}`} |`,
    );
  }
  L.push("");
  L.push(`- Toplam: doğru alan ${toplamDogru} / ${kayitlar.length * ALANLAR.length}`);
  L.push(`- Tam doğru vaka: ${tamVaka} / ${kayitlar.length}`);
  L.push(`- Toplam maliyet: $${toplamMaliyet.toFixed(4)}`);
  L.push(`- Zaman aşımı: ${zamayi} · JSON yok: ${jsonYok}`);
  L.push("");
  fs.writeFileSync(yol, L.join("\n"));
  return yol;
}

async function main() {
  const opt = argCoz(process.argv.slice(2));
  kosuNo = opt.kosu;

  const idler = JSON.parse(fs.readFileSync(path.join(EVAL, "vakalar.json"), "utf8"));
  if (!Array.isArray(idler) || idler.length === 0) hataCik("eval/vakalar.json boş ya da dizi değil");
  const beklenenler = JSON.parse(fs.readFileSync(path.join(EVAL, "beklenen.json"), "utf8"));
  const kayitIdler = idler.filter((id) => (opt.yalniz ? opt.yalniz.includes(id) : true));
  if (kayitIdler.length === 0) hataCik("--yalniz ile eşleşen vaka yok");

  if (opt.kuru) {
    fs.mkdirSync(IZLER, { recursive: true });
    fs.writeFileSync(
      path.join(IZLER, "mcp.json"),
      JSON.stringify(
        {
          mcpServers: {
            liman: {
              type: "stdio",
              command: "node",
              args: [path.join(KOK, "araclar", "server.ts")],
            },
          },
        },
        null,
        2,
      ) + "\n",
    );
    process.stdout.write(
      `Koşu ${opt.kosu} · ${kayitIdler.length} vaka · paralel ${opt.paralel}\n${komutSatiri(kayitIdler[0])}\n`,
    );
    return;
  }

  fs.mkdirSync(path.join(IZLER, opt.kosu), { recursive: true });
  process.stdout.write(
    `Koşu ${opt.kosu}: ${kayitIdler.length} vaka · paralel=${opt.paralel} · zaman aşımı=${ZAMAN_ASIMI_MS / 1000}s\n`,
  );

  const sonuclar = new Array(kayitIdler.length);
  let sira = 0;
  const isci = async () => {
    while (sira < kayitIdler.length) {
      const i = sira++;
      const id = kayitIdler[i];
      let s;
      try {
        s = await vakaDegerlendir(id, beklenenler[id]);
      } catch (e) {
        s = {
          kayitId: id,
          durum: "hata",
          skor: 0,
          tam: false,
          detay: null,
          karar: null,
          okuma: "",
          red: 0,
          sure: 0,
          maliyet: null,
          hata: e?.message ?? String(e),
        };
      }
      sonuclar[i] = s;
      konsolSatiri(s);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(opt.paralel, kayitIdler.length) }, () => isci()),
  );

  const tamam = sonuclar.filter(Boolean);
  for (const s of tamam) {
    if (s.durum === "zaman aşımı" && s.sure > ZAMAN_ASIMI_MS) s.sure = ZAMAN_ASIMI_MS;
  }
  const rapor = raporYaz(opt, kayitIdler, tamam);
  const toplam = tamam.reduce((a, s) => a + s.skor, 0);
  process.stdout.write(
    `\nToplam: ${toplam}/${kayitIdler.length * ALANLAR.length} doğru alan · rapor: eval/sonuc-${opt.kosu}.md\n`,
  );
}

main();
