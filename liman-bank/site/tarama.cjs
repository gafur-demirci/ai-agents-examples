// Erişilebilirlik taraması: her ekranda axe-core koşar.
// Kullanım: node tarama.cjs <önek>  → önce/sonra rapor isimlendirmesi için
const { chromium } = require('playwright');
const AxeBuilder = require('@axe-core/playwright').default;

(async () => {
  const onek = process.argv[2] || 'once';
  const b = await chromium.launch();
  const baglam = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const p = await baglam.newPage();
  p.on('pageerror', e => console.error('SAYFA HATASI:', e.message.split('\n')[0]));
  await p.goto('http://127.0.0.1:8735/index.html', { waitUntil: 'load' });
  await p.waitForTimeout(1000);

  const akis = [
    ['ekran-ana', null, null],
    ['ekran-kategori', '#bos-kur', null],
    ['ekran-tutar', '[data-ad="Tatil"]', '#kategori-devam'],
    ['ekran-aktarim', '#tutar-devam', null],
    ['ekran-onay', '#aktarim-devam', null],
    ['ekran-basari', '#sigorta-onay', '#onay-devam'],
    ['ekran-detay', '#basari-devam', null],
    ['ekran-duzenle', '[data-gidis="ekran-duzenle"]', null],
  ];
  const toplam = {}; const bulgular = [];
  for (const [ekran, onCelik, ekCelik] of akis) {
    if (onCelik) { await p.click(onCelik); await p.waitForTimeout(350); }
    if (ekCelik) { await p.click(ekCelik); await p.waitForTimeout(350); }
    if (ekran === 'ekran-basari') { await p.waitForTimeout(600); }
    if (ekran === 'ekran-detay') { await p.waitForTimeout(1300); }
    const sonuc = await new AxeBuilder({ page: p })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    let say = 0;
    for (const hata of sonuc.violations) {
      say += hata.nodes.length;
      bulgular.push({ ekran, kural: hata.id, etki: hata.impact, yardim: hata.help, wcag: (hata.tags || []).filter(t => t.startsWith('wcag')).join(', '), dugumler: hata.nodes.map(n => n.target.join(' ')).slice(0, 4) });
    }
    toplam[ekran] = say;
    console.log(`${ekran}: ${say} ihlal`);
  }
  await b.close();
  let cikti = `## Otomatik tarama (${onek}) — axe-core, WCAG 2.x A+AA\n\n| Ekran | Kural | Etki | Sorun | WCAG | Örnek düğüm |\n|---|---|---|---|---|---|\n`;
  for (const b2 of bulgular) {
    cikti += `| ${b2.ekran.replace('ekran-', '')} | ${b2.kural} | ${b2.etki} | ${b2.yardim} | ${b2.wcag} | ${b2.dugumler[0]} |\n`;
  }
  if (!bulgular.length) cikti += '(ihlal yok)\n';
  cikti += `\n**Toplam:** ${Object.values(toplam).reduce((a, c) => a + c, 0)} ihlal · ${JSON.stringify(toplam)}\n`;
  require('fs').writeFileSync(`${__dirname}/../erisilebilirlik/axe-${onek}.md`, cikti);
  console.log('Rapor: erisilebilirlik/axe-' + onek + '.md');
})().catch(e => { console.error('HATA:', e.message.split('\n')[0]); process.exit(1); });
