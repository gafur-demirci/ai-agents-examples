"""Demo için deterministik (seed'li) satış verisi üretir -> data/satis.csv.
Veride bilinçli bir senaryo var: Ege bölgesi 2026 3. çeyrekte (Tem-Eyl) belirgin düşüş gösterir."""
import random
from datetime import date
from pathlib import Path

import pandas as pd

random.seed(42)
REGIONS = {"Marmara": 1.5, "Ege": 1.0, "Akdeniz": 0.8, "İç Anadolu": 0.9, "Karadeniz": 0.5}
PRODUCTS = {"Bulut Depolama": (1200, 40), "Siber Güvenlik Paketi": (3500, 15),
            "ERP Lisansı": (9000, 5), "Destek Hizmeti": (800, 30)}

rows = []
for month in range(1, 10):
    for region, rf in REGIONS.items():
        for product, (price, base) in PRODUCTS.items():
            for _ in range(2):
                factor = rf * (1 + 0.03 * month) * random.uniform(0.7, 1.3)
                if region == "Ege" and month >= 7:
                    factor *= 0.55
                rows.append({
                    "tarih": date(2026, month, random.randint(1, 28)).isoformat(),
                    "bolge": region, "urun": product,
                    "adet": max(1, round(base * factor / 2)),
                    "birim_fiyat": round(price * random.uniform(0.95, 1.05), 2),
                })

out = Path(__file__).resolve().parent.parent / "data" / "satis.csv"
pd.DataFrame(rows).sort_values("tarih").to_csv(out, index=False)
print(f"{len(rows)} satır yazıldı -> {out}")
