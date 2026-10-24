"""Küçük yardımcılar: Türkçe karakterlere duyarsız karşılaştırma."""
import re

_TR = str.maketrans("İıÖöÜüÇçĞğŞş", "IiOoUuCcGgSs")


def fold(text: str) -> str:
    """'İK', 'ik', 'Yüksek', 'yuksek' gibi yazımları eşitler."""
    return str(text).translate(_TR).strip().lower()


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", fold(text)).strip("-") or "rapor"
