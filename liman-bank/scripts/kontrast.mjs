// WCAG 2.1 göreli parlaklık ve kontrast hesabı — DESIGN.md §3 ve §12 tablolarının kaynağı
// Çalıştır: node scripts/kontrast.mjs
const LACIVERT = [14, 42, 71];
const TURKUAZ = [31, 191, 174];
const RENK = {
  turkuaz: TURKUAZ,
  "eylem-koyu": hex("#0B7A70"),
  "turkuaz-acik": hex("#CDF1EC"),
  "turkuaz-sis": hex("#E9FAF8"),
  lacivert: LACIVERT,
  kum: hex("#F4F1EA"),
  beyaz: [255, 255, 255],
  hata: hex("#B3261E"),
};
function hex(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const chan = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const lum = (rgb) => 0.2126 * chan(rgb[0]) + 0.7152 * chan(rgb[1]) + 0.0722 * chan(rgb[2]);
const karisim = (fg, a, bg) => fg.map((c, i) => Math.round(a * c + (1 - a) * bg[i]));
const oran = (fg, bg) => {
  const [l1, l2] = [lum(fg), lum(bg)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
};
const yuvarla = (r) => Number(r.toFixed(2));

// ---------- Açık şema (DESIGN.md §3) ----------
const T = {
  "metin-ana": RENK.lacivert,
  "metin-ikincil": hex("#5E7080"), // lacivert %65 + kum
  "metin-destek": hex("#6F7E8B"),  // lacivert %58 + kum; yalnız büyük yazı
  "metin-ters": RENK.beyaz,
  "eylem": RENK["eylem-koyu"],
  "eylem-ustu-metin": RENK.beyaz,
  "eylem-secili-zemin": TURKUAZ,
  "eylem-secili-metin": RENK.lacivert,
  "vurgu": TURKUAZ,
  "hata-metin": RENK.hata,
  "hata-zemin": RENK.hata,
  "hata-ustu-metin": RENK.beyaz,
  "basari-metin": RENK["eylem-koyu"],
};
const Z = { kart: RENK.beyaz, "yuzey-sayfa": RENK.kum, "yuzey-soft": RENK["turkuaz-sis"], "yuzey-koyu": RENK.lacivert };

const rowsAcik = [
  ["metin-ana / kart", T["metin-ana"], Z.kart, "metin", ""],
  ["metin-ana / yuzey-sayfa", T["metin-ana"], Z["yuzey-sayfa"], "metin", ""],
  ["metin-ana / yuzey-soft", T["metin-ana"], Z["yuzey-soft"], "metin", ""],
  ["metin-ikincil / kart", T["metin-ikincil"], Z.kart, "metin", ""],
  ["metin-ikincil / yuzey-sayfa", T["metin-ikincil"], Z["yuzey-sayfa"], "metin", ""],
  ["metin-ikincil / yuzey-soft", T["metin-ikincil"], Z["yuzey-soft"], "metin", ""],
  ["metin-destek / kart (büyük yazı)", T["metin-destek"], Z.kart, "buyuk", "yalnız ≥24px veya ≥18,66px kalın"],
  ["metin-destek / yuzey-sayfa (büyük yazı)", T["metin-destek"], Z["yuzey-sayfa"], "buyuk", "yalnız büyük yazı"],
  ["metin-ters / eylem", T["metin-ters"], T.eylem, "metin", ""],
  ["metin-ters / eylem-secili-zemin", T["metin-ters"], T["eylem-secili-zemin"], "metin", "YASAK: marka kitinin beyaz-üstü-turkuaz hâli"],
  ["eylem-secili-metin / eylem-secili-zemin", T["eylem-secili-metin"], T["eylem-secili-zemin"], "metin", ""],
  ["metin-ters / yuzey-koyu", T["metin-ters"], Z["yuzey-koyu"], "metin", ""],
  ["vurgu ikon / yuzey-koyu", T.vurgu, Z["yuzey-koyu"], "ui", "bilgi bandı ikonu"],
  ["hata-metin / kart", T["hata-metin"], Z.kart, "metin", ""],
  ["hata-metin / yuzey-sayfa", T["hata-metin"], Z["yuzey-sayfa"], "metin", ""],
  ["hata-ustu-metin / hata-zemin", T["hata-ustu-metin"], T["hata-zemin"], "metin", ""],
  ["basari-metin / kart", T["basari-metin"], Z.kart, "metin", ""],
  ["eylem dolgusu / kart", T.eylem, Z.kart, "ui", "arayüz öğesi"],
  ["eylem dolgusu / yuzey-sayfa", T.eylem, Z["yuzey-sayfa"], "ui", "arayüz öğesi"],
  ["metin-ters / eski eylem #0F8072", BEYAZ_ESKI(), hex("#0F8072"), "metin", "eski değer; koyulaştırıldı"],
  ["kenarlik-guclu / kart (odak)", T.eylem, Z.kart, "ui", "odak çerçevesi"],
  ["vurgu dolgusu / kart", T.vurgu, Z.kart, "dekor", "dekoratif; yanında metin eşdeğeri zorunlu"],
  ["eski metin-üçüncül (%45) / kart", karisim(LACIVERT, 0.45, RENK.beyaz), Z.kart, "metin", "REDDEDİLDİ: bu sistemde yok"],
];
function BEYAZ_ESKI() { return RENK.beyaz; }

// ---------- Karanlık şema (DESIGN.md §12) ----------
const D = {
  "metin-ana": hex("#F4F1EA"),      // kum
  "metin-ikincil": hex("#A4ABB1"),  // kum %65 + lacivert; üç koyu zeminde de AA ✓
  "metin-destek": hex("#7C8A95"),   // kum %48 + lacivert; yalnız büyük yazı
  "metin-ters": hex("#0E2A47"),     // koyu yazı, açık zemin üstünde
  "eylem": hex("#3FBFAC"),          // açık turkuaz
  "eylem-ustu-metin": hex("#0E2A47"),
  "eylem-secili-zemin": hex("#3FBFAC"),
  "eylem-secili-metin": hex("#0E2A47"),
  "vurgu": TURKUAZ,
  "hata-metin": hex("#D9938F"),     // hata + beyaz %50
  "hata-zemin": hex("#B3261E"),
  "hata-ustu-metin": RENK.beyaz,
  "basari-metin": hex("#3FBFAC"),
};
const ZD = { kart: hex("#213B56"), "yuzey-sayfa": hex("#0E2A47"), "yuzey-soft": hex("#263F59"), "yuzey-koyu": hex("#0E2A47") };

const rowsKoyu = [
  ["metin-ana / kart", D["metin-ana"], ZD.kart, "metin", ""],
  ["metin-ana / yuzey-sayfa", D["metin-ana"], ZD["yuzey-sayfa"], "metin", ""],
  ["metin-ana / yuzey-soft", D["metin-ana"], ZD["yuzey-soft"], "metin", ""],
  ["metin-ikincil / kart", D["metin-ikincil"], ZD.kart, "metin", ""],
  ["metin-ikincil / yuzey-sayfa", D["metin-ikincil"], ZD["yuzey-sayfa"], "metin", ""],
  ["metin-ikincil / yuzey-soft", D["metin-ikincil"], ZD["yuzey-soft"], "metin", ""],
  ["metin-destek / kart (büyük yazı)", D["metin-destek"], ZD.kart, "buyuk", "yalnız büyük yazı"],
  ["metin-ters / eylem", D["metin-ters"], D.eylem, "metin", "koyu yazı, açık turkuaz"],
  ["eylem-ustu-metin / eylem", D["eylem-ustu-metin"], D.eylem, "metin", "aynı çiftin token adıyla"],
  ["eylem-secili-metin / eylem-secili-zemin", D["eylem-secili-metin"], D["eylem-secili-zemin"], "metin", ""],
  ["uyarı-metin / uyari-zemin (uyarı bandı)", hex("#0E2A47"), RENK["turkuaz-sis"], "metin", "uyarı bandı koyu şemada da sis zeminli kalır (bilinçli karar)"],
  ["vurgu ikon / yuzey-koyu", D.vurgu, ZD["yuzey-koyu"], "ui", "bilgi bandı ikonu"],
  ["hata-metin / kart", D["hata-metin"], ZD.kart, "metin", ""],
  ["hata-metin / yuzey-sayfa", D["hata-metin"], ZD["yuzey-sayfa"], "metin", ""],
  ["hata-ustu-metin / hata-zemin", D["hata-ustu-metin"], D["hata-zemin"], "metin", ""],
  ["basari-metin / kart", D["basari-metin"], ZD.kart, "metin", ""],
  ["eylem dolgusu / kart", D.eylem, ZD.kart, "ui", "arayüz öğesi"],
  ["eylem dolgusu / yuzey-sayfa", D.eylem, ZD["yuzey-sayfa"], "ui", "arayüz öğesi"],
  ["kenarlik-guclu / kart (odak)", D.eylem, ZD.kart, "ui", "odak çerçevesi"],
  ["vurgu dolgusu / kart", D.vurgu, ZD.kart, "dekor", "dekoratif; metin eşdeğeri zorunlu"],
];

const f = (r) => r.toFixed(2).replace(".", ",");
function tablo(rows, baslik) {
  let out = `### ${baslik}\n\n| Çift | Oran | Normal yazı AA (4,5:1) | Büyük yazı / arayüz AA (3:1) | Not |
|---|---|---|---|---|
`;
  let fail = 0;
  for (const [name, fg, bg, kind, note] of rows) {
    const r = oran(fg, bg);
    const normal = kind === "dekor" ? "—" : r >= 4.5 ? "✓" : "✗";
    const large = kind === "dekor" ? "—" : r >= 3 ? "✓" : "✗";
    if (kind !== "dekor" && r < 3) fail++;
    out += `| ${name} | ${f(r)}:1 | ${normal} | ${large} | ${note} |\n`;
  }
  out += fail === 0 ? "\nSONUÇ: kural dışı çift yok.\n" : `\nSONUÇ: ${fail} çift AA altında — DESIGN.md kararlarına bak.\n`;
  return out;
}
console.log(tablo(rowsAcik, "Açık şema"));
console.log(tablo(rowsKoyu, "Karanlık şema"));
