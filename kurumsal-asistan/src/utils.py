"""Small helpers: case/Turkish-diacritic-insensitive comparison."""
import re

# Maps Turkish accented chars to their ASCII counterparts before lowercasing.
_TR = str.maketrans("İıÖöÜüÇçĞğŞş", "IiOoUuCcGgSs")


def fold(text: str) -> str:
    """Makes 'İK', 'ik', 'Yüksek', 'yuksek' etc. compare equal."""
    return str(text).translate(_TR).strip().lower()


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", fold(text)).strip("-") or "rapor"
