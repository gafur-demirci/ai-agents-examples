"""Report Agent: analyzes sales data via safe, predefined tools; produces charts and Markdown reports.
The model never writes/executes code; it only calls verified tools."""
from datetime import datetime

import matplotlib

matplotlib.use("Agg")  # headless chart rendering
import matplotlib.pyplot as plt  # noqa: E402
import pandas as pd  # noqa: E402

from .. import config  # noqa: E402
from ..llm import AgentSpec  # noqa: E402
from ..utils import fold, slugify  # noqa: E402

GROUPS = ["bolge", "urun", "ay"]
METRICS = ["ciro", "adet"]
REQUIRED_COLUMNS = {"tarih", "bolge", "urun", "adet", "birim_fiyat"}

SYSTEM = """Sen Örnek A.Ş. için çalışan veri analizi asistanısın. Satış verisini araçlarla analiz eder, rapor üretirsin.
Kurallar:
1. Veri yapısını bilmiyorsan önce describe_data çağır.
2. Sayıları ASLA kendin hesaplama veya uydurma; yalnızca araç sonuçlarını kullan. Para birimi TL.
3. Karşılaştırma/trend sorularında birden fazla aggregate çağrısı yap (örn. bölge bazında ve aylık).
4. Kullanıcı grafik isterse veya rapor isterse make_chart çağır.
5. Kullanıcı "rapor" isterse: analizleri yap, make_chart ile grafik üret, sonra save_report ile Markdown raporu kaydet (Özet, Bulgular, Öneriler bölümleri; sayılar araç sonuçlarından).
6. Veri kapsamı dışındaki soruda (ör. veride olmayan sütun) bunu açıkça söyle.
7. Araç hatası alırsan hatayı oku, düzeltip tekrar dene. Kısa ve net Türkçe yanıt ver."""

_FILTERS = {
    "bolge": {"type": "string", "description": "Bölge filtresi (opsiyonel)"},
    "urun": {"type": "string", "description": "Ürün filtresi (opsiyonel)"},
    "baslangic": {"type": "string", "description": "YYYY-AA-GG (opsiyonel)"},
    "bitis": {"type": "string", "description": "YYYY-AA-GG (opsiyonel)"},
}
_CORE = {"group_by": {"type": "string", "enum": GROUPS},
         "metric": {"type": "string", "enum": METRICS}}


def _fn(name, desc, props, required):
    """Build one OpenAI-style function schema entry."""
    return {"type": "function", "function": {
        "name": name, "description": desc,
        "parameters": {"type": "object", "properties": props, "required": required}}}


SCHEMAS = [
    _fn("describe_data", "Veri setinin sütunlarını, tarih aralığını ve mevcut bölge/ürün değerlerini döner.", {}, []),
    _fn("aggregate", "Veriyi gruplayıp ciro veya adet toplamını hesaplar.",
        {**_CORE, **_FILTERS, "top_n": {"type": "integer", "description": "İlk N satır (varsayılan 10)"}},
        ["group_by", "metric"]),
    _fn("make_chart", "Gruplanmış veriden grafik (PNG) üretir.",
        {**_CORE, **_FILTERS, "chart_type": {"type": "string", "enum": ["bar", "line"]},
         "title": {"type": "string"}}, ["group_by", "metric", "chart_type", "title"]),
    _fn("save_report", "Markdown raporu dosyaya kaydeder.",
        {"title": {"type": "string"}, "content": {"type": "string", "description": "Markdown rapor metni"}},
        ["title", "content"]),
]


def _load() -> pd.DataFrame:
    """Load the sales CSV and derive derived columns (revenue = qty x unit price, month)."""
    if not config.SALES_CSV.exists():
        raise ValueError(f"Veri dosyası bulunamadı: {config.SALES_CSV}")
    try:
        df = pd.read_csv(config.SALES_CSV, parse_dates=["tarih"])
    except Exception as exc:
        raise ValueError(f"Veri dosyası okunamadı: {exc}")
    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        raise ValueError(f"Veride eksik sütun(lar): {', '.join(sorted(missing))}")
    df["ciro"] = df["adet"] * df["birim_fiyat"]
    df["ay"] = df["tarih"].dt.to_period("M").astype(str)
    return df


def _pick(df, column, value):
    """Match a filter value case/diacritic-insensitively; list valid values on miss."""
    options = sorted(df[column].unique())
    for opt in options:
        if fold(opt) == fold(value):
            return opt
    raise ValueError(f"'{value}' bulunamadı. Geçerli {column} değerleri: {', '.join(options)}")


def _date(value, label):
    try:
        return pd.to_datetime(value, format="%Y-%m-%d")
    except (ValueError, TypeError):
        raise ValueError(f"{label} 'YYYY-AA-GG' formatında olmalı (örn. 2026-03-01), gelen: '{value}'")


def _query(group_by, metric, bolge=None, urun=None, baslangic=None, bitis=None) -> pd.Series:
    """Validate arguments, apply filters, return the grouped sum series."""
    if group_by not in GROUPS:
        raise ValueError(f"group_by şunlardan biri olmalı: {', '.join(GROUPS)}")
    if metric not in METRICS:
        raise ValueError(f"metric şunlardan biri olmalı: {', '.join(METRICS)}")
    df = _load()
    if bolge:
        df = df[df["bolge"] == _pick(df, "bolge", bolge)]
    if urun:
        df = df[df["urun"] == _pick(df, "urun", urun)]
    if baslangic:
        df = df[df["tarih"] >= _date(baslangic, "baslangic")]
    if bitis:
        df = df[df["tarih"] <= _date(bitis, "bitis")]
    if df.empty:
        raise ValueError("Bu filtrelerle eşleşen kayıt yok. Filtreleri gevşetin.")
    return df.groupby(group_by)[metric].sum()


def describe_data() -> dict:
    df = _load()
    return {"satir_sayisi": len(df), "sutunlar": list(df.columns),
            "tarih_araligi": [str(df["tarih"].min().date()), str(df["tarih"].max().date())],
            "bolgeler": sorted(df["bolge"].unique()), "urunler": sorted(df["urun"].unique()),
            "not": "ciro = adet x birim_fiyat (TL)"}


def aggregate(group_by, metric, top_n=10, **filters) -> dict:
    series = _query(group_by, metric, **filters)
    series = series.sort_index() if group_by == "ay" else series.sort_values(ascending=False)
    rows = [{group_by: str(k), metric: round(float(v), 2)} for k, v in series.head(max(1, int(top_n))).items()]
    return {"satirlar": rows, "toplam": round(float(series.sum()), 2)}


def make_chart(group_by, metric, chart_type, title, **filters) -> dict:
    if chart_type not in ("bar", "line"):
        raise ValueError("chart_type 'bar' veya 'line' olmalı")
    series = _query(group_by, metric, **filters)
    series = series.sort_index() if group_by == "ay" else series.sort_values(ascending=False)
    fig, ax = plt.subplots(figsize=(8, 4.5))
    labels = [str(i) for i in series.index]
    (ax.bar if chart_type == "bar" else ax.plot)(labels, series.values, **({} if chart_type == "bar" else {"marker": "o"}))
    ax.set_title(title)
    ax.set_ylabel("Ciro (TL)" if metric == "ciro" else "Adet")
    ax.tick_params(axis="x", rotation=30)
    ax.grid(axis="y", alpha=0.3)
    fig.tight_layout()
    out = config.OUTPUT_DIR / "charts"
    out.mkdir(parents=True, exist_ok=True)
    path = out / f"{datetime.now():%Y%m%d-%H%M%S}-{slugify(title)}.png"
    fig.savefig(path, dpi=130)
    plt.close(fig)
    return {"chart_path": str(path)}


def save_report(title, content) -> dict:
    if len((content or "").strip()) < 50:
        raise ValueError("Rapor içeriği çok kısa; analiz sonuçlarını ekleyin.")
    out = config.OUTPUT_DIR / "reports"
    out.mkdir(parents=True, exist_ok=True)
    path = out / f"{datetime.now():%Y%m%d-%H%M%S}-{slugify(title)}.md"
    path.write_text(f"# {title}\n\n{content}\n", encoding="utf-8")
    return {"report_path": str(path)}


def build() -> AgentSpec:
    funcs = {"describe_data": describe_data, "aggregate": aggregate,
             "make_chart": make_chart, "save_report": save_report}
    return AgentSpec("rapor", SYSTEM, SCHEMAS, funcs)
