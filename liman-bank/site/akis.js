/* Liman Mobil · Birikim Hedefi — akış yönetimi ve durum
   Sözleşme: DESIGN.md (para: iki ondalık TL; tarih: 1 Temmuz 2027; ses: sakin, ünlemsiz) */

/* — Örnek kullanıcı (brief/03-veri.md) — */
const VERI = {
  musteri: 'Ece',
  bakiye: 23418.75,
  hedefAd: 'Yaz tatili',
  varsayilanAylik: 7500,
  hedefTutar: 60000,
  hedefTarih: new Date(2027, 6, 1),
  ilkAktarim: new Date(2026, 11, 1),
};

const KATEGORILER = [
  { ad: 'Tatil',  gorsel: 'gorseller/tatil.png' },
  { ad: 'Ev',     gorsel: 'gorseller/ev.png' },
  { ad: 'Eğitim', gorsel: 'gorseller/egitim.png' },
  { ad: 'Araba',  gorsel: 'gorseller/araba.png' },
  { ad: 'Düğün',  gorsel: 'gorseller/dugun.png' },
  { ad: 'Acil durum fonu', gorsel: 'gorseller/acil-durum.png' },
];

const AYLAR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

/* — Durum — */
const durum = {
  hedefVar: false,        // ana sayfa boş/ dolu kontrolü
  kategori: null,
  aylik: VERI.varsayilanAylik,
  gun: 1,
  ilkAktarim: new Date(VERI.ilkAktarim),
  sigorta: false,
  düzenlemelikGün: 1,
};

const $ = (id) => document.getElementById(id);
const tl = (n) => n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';
const tarih = (d) => d.getDate() + ' ' + AYLAR[d.getMonth()] + ' ' + d.getFullYear();

/* — Ekran geçişi — */
function git(id) {
  document.querySelectorAll('.ekran').forEach(e => { e.hidden = e.id !== id; });
  const s = document.getElementById(id);
  s.style.animation = 'none'; void s.offsetWidth; s.style.animation = '';
  s.querySelector('.govde')?.scrollTo(0, 0);
}
document.querySelectorAll('[data-gidis]').forEach(b =>
  b.addEventListener('click', () => git(b.dataset.gidis)));

/* — Para/tarih girdisini biçimle — */
function tlDuzelt() { /* iki ondalık sayı üreten yardımcılar yukarıda */ }

/* ═══ 1 · Ana sayfa ═══ */
function anaSayfaCiz() {
  /* Duyuru kartı: hedef kurulduysa gizle (kampanya bitti) */
  const duyuru = $('duyuru-karti');
  if (duyuru) duyuru.hidden = durum.hedefVar;
  const kutu = $('hedef-kutusu');
  if (!durum.hedefVar) {
    kutu.innerHTML = `
      <div class="hedef-kart">
        <div class="govde-kart" style="text-align:center; padding: 22px 20px;">
          <img src="gorseller/bos-durum.png" alt="Henüz hedef yok: boş iskelede durgun deniz illüstrasyonu" style="width:120px; height:120px; object-fit:contain; margin:0 auto;">
          <h2 style="margin-top:10px;">Henüz bir hedefin yok</h2>
          <p style="margin-top:8px; font-size:12.5px; line-height:1.55; color:var(--metin-ikincil); font-weight:600;">Bir tutar ve tarih belirle; yol haritan burada belirsin.</p>
          <button class="btn" id="bos-kur" style="margin-top:16px;">Hedefini kur</button>
        </div>
      </div>`;
    $('bos-kur').addEventListener('click', () => git('ekran-kategori'));
    return;
  }
  const k = KATEGORILER.find(k => k.ad === durum.kategori) || KATEGORILER[0];
  const birikmis = kategoriBirikmis();
  const yuzde = Math.round((birikmis / VERI.hedefTutar) * 100);
  kutu.innerHTML = `
    <div class="hedef-kart">
      <img class="ill" src="${k.gorsel}" alt="${k.ad} kategorisi illüstrasyonu">
      <div class="govde-kart">
        <span class="kategori-cips">${k.ad}</span>
        <h2>${VERI.hedefAd}</h2>
        <p class="ilerleme-yazi"><b>${tl(birikmis)}</b> / ${tl(VERI.hedefTutar)} · her ayın ${durum.gun}'ünde ${tl(durum.aylik)} · varış ${tarih(VERI.hedefTarih)}</p>
        <div class="halka-satiri" style="margin-top:12px">
          <div class="halka" style="--halka-hedef:${yuzde}" data-yuzde="${yuzde}"><span class="halka-ic">%${yuzde}</span></div>
          <div class="halka-yazi"><b>${tl(VERI.hedefTutar - birikmis)}</b> kaldı · ilk aktarım ${tarih(durum.ilkAktarim)}</div>
        </div>
      </div>
    </div>`;
  halkaDoldur(kutu.querySelector('.halka'));
  kutu.querySelector('.hedef-kart').addEventListener('click', () => detayEkraniniAc());
}
/* Halka: %0'dan hedefe CSS animasyonuyla dolar (DESIGN.md §8.3) */
function halkaDoldur(el) {
  if (!el) return;
  const hedef = Number(el.style.getPropertyValue('--halka-hedef')) || 0;
  el.classList.add('doldur');
  el.style.setProperty('--halka-hedef', hedef);
}
function kategoriBirikmis() {
  /* Varsayım: prototipte ilk 2 aktarım gerçekleşmiş kabul edilir (5 Aralık + 5 Ocak),
     böylece detaydaki ilerleme ve geçmiş listesi dolu görülür. */
  if (!durum.hedefVar) return 0;
  if (durum.aylik === 5000) return 10000;
  if (durum.aylik === 10000) return 20000;
  return 15000; // 7.500 için: 2 aktarım
}

/* ═══ 2 · Kategori seçimi ═══ */
function kategoriCiz() {
  const grup = $('kategori-grubu');
  grup.innerHTML = KATEGORILER.map(k =>
    `<button type="button" class="cip" data-ad="${k.ad}">
      <img src="${k.gorsel}" alt="" aria-hidden="true" width="26" height="26" style="border-radius:8px; object-fit:cover;">${k.ad}
    </button>`).join('');
  grup.querySelectorAll('.cip').forEach(c => c.addEventListener('click', () => {
    grup.querySelectorAll('.cip').forEach(x => x.classList.remove('secili'));
    c.classList.add('secili');
    durum.kategori = c.dataset.ad;
    $('kategori-devam').disabled = false;
    $('tutar-basligi').innerHTML = kategoriBasligi(durum.kategori);
    $('tutar-ozet').textContent = `${VERI.hedefTutar.toLocaleString('tr-TR')},00 TL ile ${tarih(VERI.hedefTarih)}'ye ${kategoriEtiketi(durum.kategori)}. Tempo seç, rota seninle birlikte çizilsin.`;
  }));
  $('kategori-devam').disabled = true;
  $('kategori-devam').addEventListener('click', () => git('ekran-tutar'));
}
function kategoriBasligi(ad) {
  const haritalar = {
    'Tatil': 'Ada seni<br>bekliyor.', 'Ev': 'Yeni evin<br>yolda.', 'Eğitim': 'Öğrenmeye<br>hazırsın.',
    'Araba': 'Anahtar<br>yolunu bekliyor.', 'Düğün': 'Büyük güne<br>doğru.', 'Acil durum fonu': 'Güvencen<br>yanında.',
  };
  return (haritalar[ad] || 'Hedefini koy,').replace('\\n', '<br>');
}
function kategoriEtiketi(ad) {
  return { 'Tatil': 'küçük bir deniz yolculuğu', 'Ev': 'sıcak bir yuva', 'Eğitim': 'güçlü bir başlangıç',
           'Araba': 'yeni bir yol', 'Düğün': 'özel bir gün', 'Acil durum fonu': 'güvenli bir liman' }[ad] || 'bir yolculuk';
}

/* ═══ 3 · Tutar ve tarih ═══ */
function rotaCiz() {
  const m = Math.ceil(VERI.hedefTutar / durum.aylik);
  const ilk = yeniAyEkle(durum.ilkAktarim, 0);
  const orta = yeniAyEkle(durum.ilkAktarim, 4);
  const sonGun = yeniAyEkle(VERI.hedefTarih, 0);
  $('rota-listesi').innerHTML = `
    <div class="halka-satiri" style="margin-top:8px; flex-direction:column; align-items:stretch; gap:8px;">
      <div class="gecmis"><div class="g-satir"><span class="g-tarih">${tarih(ilk)}</span> limandan çıkış · <b>${tl(durum.aylik)}</b></div>
      <div class="g-satir"><span class="g-tarih">${tarih(orta)}</span> ara durak</div>
      <div class="g-satir"><span class="g-tarih">${tarih(sonGun)}</span> hedef ada · <b>${tl(VERI.hedefTutar)}</b> · <span class="g-durum">${m} ay</span></div></div>
    </div>`;
}
function yeniAyEkle(d, kacAy) { return new Date(d.getFullYear(), d.getMonth() + kacAy, d.getDate()); }

$('tutar-azalt').addEventListener('click', () => { durum.aylik = Math.max(1000, durum.aylik - 500); tempoGuncelle(); });
$('tutar-artir').addEventListener('click', () => { durum.aylik = Math.min(25000, durum.aylik + 500); tempoGuncelle(); });
document.querySelectorAll('.tempo-kutu button').forEach(b =>
  b.addEventListener('click', () => {
    document.querySelectorAll('.tempo-kutu button').forEach(x => x.classList.remove('secili'));
    b.classList.add('secili');
    durum.aylik = Number(b.dataset.tutar);
    tempoGuncelle();
  }));
function tempoGuncelle() {
  $('aylik-gosterge').textContent = tl(durum.aylik).replace(' TL', '');
  document.querySelectorAll('.tempo-kutu button').forEach(x => {
    x.classList.toggle('secili', Number(x.dataset.tutar) === durum.aylik);
  });
  rotaCiz();
}
$('tutar-devam').addEventListener('click', () => { aktarimCiz(); git('ekran-aktarim'); });

/* ═══ 4 · Otomatik aktarım ═══ */
function aktarimCiz() {
  const gunler = [1, 5, 15, 25];
  $('gun-grubu').innerHTML = gunler.map(g =>
    `<button type="button" class="cip ${g === durum.gun ? 'secili' : ''}" data-gun="${g}">her ayın ${g}'i</button>`).join('');
  $('gun-grubu').querySelectorAll('.cip').forEach(c => c.addEventListener('click', () => {
    $('gun-grubu').querySelectorAll('.cip').forEach(x => x.classList.remove('secili'));
    c.classList.add('secili');
    durum.gun = Number(c.dataset.gun);
  }));
  const ilkSecenekler = [0, 1, 2];
  $('ilk-aktarim-grubu').innerHTML = ilkSecenekler.map(a => {
    const d = yeniAyEkle(VERI.ilkAktarim, a);
    return `<button type="button" class="cip ${a === 0 ? 'secili' : ''}" data-ay="${a}">${tarih(d)}</button>`;
  }).join('');
  $('ilk-aktarim-grubu').querySelectorAll('.cip').forEach(c => c.addEventListener('click', () => {
    $('ilk-aktarim-grubu').querySelectorAll('.cip').forEach(x => x.classList.remove('secili'));
    c.classList.add('secili');
    durum.ilkAktarim = yeniAyEkle(VERI.ilkAktarim, Number(c.dataset.ay));
  }));
}
$('aktarim-devam').addEventListener('click', () => { onayCiz(); git('ekran-onay'); });

/* ═══ 5 · Onay ═══ */
function onayCiz() {
  const k = KATEGORILER.find(k => k.ad === durum.kategori) || KATEGORILER[0];
  const m = Math.ceil(VERI.hedefTutar / durum.aylik);
  $('onay-ozeti').innerHTML = `
    <img src="${k.gorsel}" alt="${k.ad} kategorisi illüstrasyonu">
    <div class="satirlar">
      <div class="o-satir">Hedef adı <b>${VERI.hedefAd}</b></div>
      <div class="o-satir">Kategori <b>${k.ad}</b></div>
      <div class="o-satir">Hedef tutar <b>${tl(VERI.hedefTutar)}</b></div>
      <div class="o-satir">Hedef tarihi <b>${tarih(VERI.hedefTarih)}</b></div>
      <div class="o-satir">Aylık aktarım <b>${tl(durum.aylik)}</b></div>
      <div class="o-satir">Aktarım günü <b>her ayın ${durum.gun}'i</b></div>
      <div class="o-satir">İlk aktarım <b>${tarih(durum.ilkAktarim)}</b></div>
      <div class="o-satir">Süre <b>${m} ay</b></div>
    </div>`;
  /* Karar kutusu her gelişte sıfırdan sorulur (CLAUDE.md kuralı: kullanıcı adına seçim yapılmaz) */
  $('sigorta-onay').checked = false;
  durum.sigorta = false;
  $('sigorta-durum-yazi').textContent = 'Sigorta kararı vermeden devam edemezsin';
  /* Devam düğmesi karar verilene kadar pasif */
  $('onay-devam').disabled = true;
}
$('sigorta-onay').addEventListener('change', e => {
  durum.sigorta = e.target.checked;
  $('sigorta-durum-yazi').textContent = e.target.checked
    ? 'Sigorta eklendi: aylık 49,90 TL. Onaydan sonra istediğin zaman kaldırabilirsin.'
    : 'Sigortasız devam ediyorsun. İstediğinde onaydan sonra ekleyebilirsin.';
  $('onay-devam').disabled = false;
});
$('onay-devam').addEventListener('click', () => {
  durum.hedefVar = true;
  const m = Math.ceil(VERI.hedefTutar / durum.aylik);
  $('basari-ozet').textContent = `İlk aktarım ${tarih(durum.ilkAktarim)}'da başlayacak. ${m} ay sonra hedef adadasın.`;
  git('ekran-basari');
});

/* ═══ 6 · Başarı ═══ */
$('basari-devam').addEventListener('click', () => { detayEkraniniAc(); });

/* ═══ 7 · Hedef detayı ═══ */
function detayEkraniniAc() {
  anaSayfaCiz(); // hedef kartındaki ilerleme ile aynı kaynağı kullan
  const k = KATEGORILER.find(k => k.ad === durum.kategori) || KATEGORILER[0];
  const birikmis = kategoriBirikmis();
  const yuzde = Math.round((birikmis / VERI.hedefTutar) * 100);
  $('detay-ill').src = k.gorsel;
  $('detay-kategori-chip').textContent = k.ad;
  $('detay-ad').textContent = VERI.hedefAd;
  $('detay-halka').style.setProperty('--halka-hedef', yuzde);
  $('detay-halka').setAttribute('aria-label', `Birikim ilerlemesi: yüzde ${yuzde}, ${tl(birikmis)} birikti`);
  $('detay-yuzde').textContent = '%' + yuzde;
  $('detay-halka-yazi').innerHTML = `<b>${tl(birikmis)}</b> birikti · ${tl(VERI.hedefTutar)} hedef · ${tl(VERI.hedefTutar - birikmis)} kaldı · varış ${tarih(VERI.hedefTarih)}`;
  const aktarimlar = [
    { tarih: tarih(yeniAyEkle(durum.ilkAktarim, 0)), tutar: tl(aylikEski(0)), durum: 'Gerçekleşti' },
    { tarih: tarih(yeniAyEkle(durum.ilkAktarim, 1)), tutar: tl(aylikEski(1)), durum: 'Gerçekleşti' },
    { tarih: tarih(yeniAyEkle(durum.ilkAktarim, 2)), tutar: tl(durum.aylik), durum: 'Planlandı' },
  ];
  $('gecmis-listesi').innerHTML = aktarimlar.map(a =>
    `<div class="g-satir"><span class="g-tarih">${a.tarih}</span><span class="g-durum">${a.durum}</span><span class="g-tutar">${a.tutar}</span></div>`).join('');
  halkaDoldur($('detay-halka'));
  git('ekran-detay');
}
function aylikEski(i) { return durum.aylik; } /* varsayım: tempo değişmedi */

/* ═══ 8 · Hedefi düzenle ═══ */
$('duzenle-azalt').addEventListener('click', () => { durum.aylik = Math.max(1000, durum.aylik - 500); duzenleGuncelle(); });
$('duzenle-artir').addEventListener('click', () => { durum.aylik = Math.min(25000, durum.aylik + 500); duzenleGuncelle(); });
function duzenleGuncelle() {
  $('duzenle-tutar').textContent = tl(durum.aylik);
  const kalan = VERI.hedefTutar - kategoriBirikmis();
  const m = Math.ceil(kalan / durum.aylik);
  $('duzenle-tahmin').innerHTML = `Bu tempoyla hedefe <b>${m} ay</b> sonra ulaşırsın.`;
}
$('duzenle-kaydet').addEventListener('click', () => {
  durum.hedefVar = true;
  anaSayfaCiz();
  git('ekran-detay'); // varsayım: kayıt sonrası kullanıcı detayın en güncel hâlini görür
});

/* ═══ Lansman duyuru kartı: tıklanınca akışı başlatır; hedef kurulunca kaybolur ═══ */
$('duyuru-dugme').addEventListener('click', () => git('ekran-kategori'));

/* ═══ İlk çizim ═══ */
$('bakiye-gosterge').textContent = tl(VERI.bakiye);
kategoriCiz();
rotaCiz();
aktiviteCiz();
duzenleGuncelle();
anaSayfaCiz();
function aktiviteCiz() { /* gün ve ilk aktarım seçenekleri ekran açılışında çizilir */ }
