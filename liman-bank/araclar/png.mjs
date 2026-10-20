// Kullanım: node araclar/png.mjs <girdi.html> <çıktı.png> <genişlik> <yükseklik>
// HTML'i verilen boyutta PNG'ye bastırır.
// Notlar (bu Chromium kurulumunda):
//  - --user-data-dir headless baskıyı dondurur; kullanılmaz.
//  - file:// baskıda çalışmıyor; HTML gömülü kaynaklarla tek dosyaya çevrilip
//    geçici dosyadan açılır (argüman uzunluğu E2BIG olmasın diye data URL değil dosya).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join, dirname } from 'node:path';

const [,, girisArg, cikti, genislikArg, yukseklikArg] = process.argv;
if (!girisArg || !cikti || !genislikArg || !yukseklikArg) {
  console.error('Kullanım: node araclar/png.mjs <html> <png> <genişlik> <yükseklik>');
  process.exit(1);
}
const W = Number(genislikArg), H = Number(yukseklikArg);
const giris = girisArg.startsWith('/') ? girisArg : join(process.cwd(), girisArg);

// 1) HTML'i oku; yerel kaynakları tek dosyaya göm
let html = readFileSync(giris, 'utf8');
const kok = dirname(giris);
const dataUrlYol = (yol) => {
  // HTML'in dizini kok (kampanya/kaynak); göreceli yollar kok'e göre çözülür.
  // "kaynak/x.png" gibi yollar bir üst dizine (kampanya) çıkar.
  const dosyaYolu = yol.startsWith('kaynak/') ? join(kok, '..', yol) : join(kok, yol);
  const mime = yol.endsWith('.png') ? 'image/png' : yol.endsWith('.woff2') ? 'font/woff2' : 'application/octet-stream';
  return `data:${mime};base64,${readFileSync(dosyaYolu).toString('base64')}`;
};
html = html.replace(/<link rel="stylesheet" href="([^"]+)"( \/)?>/g, (m, y) =>
  y.startsWith('http') ? m : `<style>${readFileSync(join(kok, y), 'utf8')}</style>`);
html = html.replace(/src="(gorseller\/[^"]+|kaynak\/[^"]+|[^"]+\.png)"/g, (_, yol) =>
  `src="${dataUrlYol(yol)}"`);

// 2) Chrome seç
const adaylar = [];
const pw = join(homedir(), 'Library/Caches/ms-playwright');
try {
  const surumler = readdirSync(pw).filter(d => d.startsWith('chromium-')).sort().reverse();
  for (const s of surumler) {
    adaylar.push(`${pw}/${s}/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`);
  }
} catch {}
adaylar.unshift('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');

const chrome = adaylar.find(existsSync);
if (!chrome) { console.error('Chromium/Chrome bulunamadı'); process.exit(2); }

// 3) Basta: gömülü HTML'i geçici dosyaya yaz, oradan bastır
const geciciDizin = mkdtempSync(join(tmpdir(), 'liman-'));
const geciciHtml = join(geciciDizin, 'sayfa.html');
writeFileSync(geciciHtml, html);
const komut = [
  '--headless', '--no-first-run', '--no-default-browser-check',
  '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
  `--window-size=${W},${H}`, '--virtual-time-budget=8000',
  `--screenshot=${join(process.cwd(), cikti)}`,
  'file://' + geciciHtml,
];
let ciktiLog = '';
try {
  ciktiLog = execFileSync(chrome, komut, { stdio: ['ignore', 'pipe', 'pipe'], timeout: 45000, encoding: 'utf8' });
} catch (e) {
  ciktiLog = (e.stdout || '') + (e.stderr || '');
}
const geciciTarama = join(geciciDizin, 'sayfa.html');
if (!existsSync(cikti)) {
  console.error('Baskı başarısız:', ciktiLog.slice(0, 300), '| geçici:', geciciTarama);
  process.exit(3);
}
console.log(`Baskı tamam: ${cikti} (${W}×${H})`);
