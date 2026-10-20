// Kullanım: node araclar/mp4.mjs <girdi.html> <çıktı.mp4> <süre-sn> <fps> <genişlik> <yükseklik>
// CSS animasyonlu HTML'i kare kare başa sarıp PNG'ye basar, ffmpeg ile sessiz MP4 üretir.
// Yöntem: her karede Chrome'a --animation-kind ve --animation-t=<oran> argümanı şema değişkeni olarak
// verilmez (Chrome desteklemez); bunun yerine HTML'e <meta name="kare-t"> enjekte edilir ve sayfa
// bu değeri CSS :root değişkenine koyar. Animasyonlar animation-delay: calc() yerine
// animation-play-state değil; yönlendirme için her karede sayfa yeniden yüklenir ve
// animation-duration toplam süre, animation-delay -t olarak ayarlanır: t saniyedeki kareyi gösterir.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync, mkdirSync, rm } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join, dirname } from 'node:path';

const [,, girisArg, ciktiArg, sureArg, fpsArg, genislikArg, yukseklikArg] = process.argv;
if (!girisArg || !ciktiArg || !sureArg || !fpsArg || !genislikArg || !yukseklikArg) {
  console.error('Kullanım: node araclar/mp4.mjs <html> <mp4> <süre-sn> <fps> <genişlik> <yükseklik>');
  process.exit(1);
}
const SURE = Number(sureArg), FPS = Number(fpsArg), W = Number(genislikArg), H = Number(yukseklikArg);
const KARE_SAYISI = Math.round(SURE * FPS);
const giris = girisArg.startsWith('/') ? girisArg : join(process.cwd(), girisArg);

let html = readFileSync(giris, 'utf8');
const kok = dirname(giris);
const dataUrlYol = (yol) => {
  const dosyaYolu = yol.startsWith('kaynak/') ? join(kok, '..', yol) : join(kok, yol);
  const mime = yol.endsWith('.png') ? 'image/png' : 'application/octet-stream';
  return `data:${mime};base64,${readFileSync(dosyaYolu).toString('base64')}`;
};
html = html.replace(/<link rel="stylesheet" href="([^"]+)"( \/)?>/g, (m, y) =>
  y.startsWith('http') ? m : `<style>${readFileSync(join(kok, y), 'utf8')}</style>`);
html = html.replace(/src="(gorseller\/[^"]+|kaynak\/[^"]+|[^"]+\.png)"/g, (_, yol) =>
  `src="${dataUrlYol(yol)}"`);

// Çerçeve yönlendirme: HTML'e kare betiği enjekte et (yalnız mp4 aracı ekler; sayfa kendisi JS'siz çalışır)
const enjeksiyon = `
<style>
  /* mp4 aracı: kare yönlendirmesi. t = saniyedeki an. JS yok; CSS hesaplar. */
  html { --t: 0; }
</style>
<script>
  /* Bu betik yalnız mp4 aracıyla basılırken kareyi sabitler; tarayıcıda bağımsız
     açıldığında animation normal akar. Chrome --virtual-time-budget ile uyumlu. */
  (function () {
    var m = location.hash.match(/t=([0-9.]+)/);
    if (!m) return;
    var t = parseFloat(m[1]);
    document.documentElement.style.setProperty('--t', t);
    /* Sayfa açılışında tüm animasyonları t anına sabitle: delay negatif, play paused */
    window.addEventListener('DOMContentLoaded', function () {
      document.getAnimations().forEach(function (a) {
        try {
          a.currentTime = t * 1000;
          a.pause();
        } catch (e) {}
      });
    });
  })();
</script>`;
html = html.replace('</head>', enjeksiyon + '\n</head>');

// Chrome seç
const adaylar = [];
const pw = join(homedir(), 'Library/Caches/ms-playwright');
try {
  const surumler = readdirSync(pw).filter(d => d.startsWith('chromium-')).sort().reverse();
  for (const s of surumler) {
    adaylar.push(`${pw}/${s}/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`);
  }
} catch {}
adaylar.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
const chrome = adaylar.find(existsSync);
if (!chrome) { console.error('Chromium/Chrome bulunamadı'); process.exit(2); }

// Kareleri bas
const kareDizin = mkdtempSync(join(tmpdir(), 'liman-kare-'));
const geciciHtml = join(kareDizin, 'sayfa.html');
writeFileSync(geciciHtml, html);
const kareler = [];
function kareBas(i) {
  const t = i / FPS;
  const kareDosyasi = join(kareDizin, `kare-${String(i).padStart(4, '0')}.png`);
  const sayfa = 'file://' + geciciHtml + '#t=' + t.toFixed(4);
  const komut = [
    '--headless', '--no-first-run', '--no-default-browser-check',
    '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    `--window-size=${W},${H}`, '--virtual-time-budget=2500',
    `--screenshot=${kareDosyasi}`, sayfa,
  ];
  try {
    execFileSync(chrome, komut, { stdio: ['ignore', 'pipe', 'pipe'], timeout: 25000, encoding: 'utf8' });
  } catch {}
  if (!existsSync(kareDosyasi)) throw new Error(`Kare ${i} basılamadı`);
  return kareDosyasi;
}
const PARALEL = 6;
for (let baslangic = 0; baslangic < KARE_SAYISI; baslangic += PARALEL) {
  const grup = [];
  for (let i = baslangic; i < Math.min(baslangic + PARALEL, KARE_SAYISI); i++) grup.push(i);
  const sonuc = grup.map(i => { try { return kareBas(i); } catch (e) { console.error(e.message); process.exit(3); } });
  kareler.push(...sonuc);
  console.log(`  kare ${Math.min(baslangic + PARALEL, KARE_SAYISI)}/${KARE_SAYISI}`);
}

// ffmpeg: sessiz mp4
const cikti = ciktiArg.startsWith('/') ? ciktiArg : join(process.cwd(), ciktiArg);
const ffmpegKomut = ['-y', '-framerate', String(FPS), '-i', join(kareDizin, 'kare-%04d.png'),
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', cikti];
execFileSync('ffmpeg', ffmpegKomut, { stdio: 'pipe' });
rmSync(kareDizin, { recursive: true, force: true });
console.log(`MP4 tamam: ${cikti} (${SURE}s, ${FPS} fps, ${W}×${H}, ${KARE_SAYISI} kare)`);
