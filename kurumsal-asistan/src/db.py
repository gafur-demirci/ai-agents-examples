"""Destek talebi deposu (SQLite). Doğrulama burada yapılır; hatalar ValueError olarak döner."""
import re
import sqlite3
from contextlib import contextmanager
from datetime import datetime

from . import config
from .utils import fold

TEAMS = {
    "IT": "IT Servis Masası",
    "IK": "İK Operasyon",
    "Finans": "Finans Operasyon",
    "Genel": "İdari İşler",
}
CATEGORIES = list(TEAMS)
PRIORITIES = ["Düşük", "Orta", "Yüksek", "Kritik"]
STATUSES = ["Açık", "Devam Ediyor", "Çözüldü", "Kapatıldı"]
SLA_HOURS = {"Kritik": 4, "Yüksek": 8, "Orta": 24, "Düşük": 72}

_CREATE_SQL = """
CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL, description TEXT NOT NULL,
    category TEXT NOT NULL, priority TEXT NOT NULL, team TEXT NOT NULL,
    requester TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'Açık',
    created_at TEXT NOT NULL
)"""


@contextmanager
def _conn():
    config.DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(config.DB_PATH)
    con.row_factory = sqlite3.Row
    try:
        con.execute(_CREATE_SQL)
        yield con
        con.commit()
    finally:
        con.close()


def _match(value, options, label):
    f = fold(value)
    for opt in options:
        if fold(opt) == f:
            return opt
    raise ValueError(f"Geçersiz {label}: '{value}'. Geçerli değerler: {', '.join(options)}")


def _require(value, label):
    value = (value or "").strip()
    if len(value) < 3:
        raise ValueError(f"'{label}' eksik veya çok kısa. Kullanıcıdan bu bilgiyi isteyin.")
    return value


def _parse_id(ticket_id):
    found = re.search(r"\d+", str(ticket_id))
    if not found:
        raise ValueError(f"Geçersiz talep numarası: '{ticket_id}'. Örnek: TKT-0001")
    return int(found.group())


def _to_dict(row):
    d = dict(row)
    d["id"] = f"TKT-{d['id']:04d}"
    d["sla_saat"] = SLA_HOURS[d["priority"]]
    return d


def create_ticket(title, description, category, priority, requester):
    title = _require(title, "başlık")
    description = _require(description, "açıklama")
    requester = _require(requester, "talep sahibi (ad soyad)")
    category = _match(category, CATEGORIES, "kategori")
    priority = _match(priority, PRIORITIES, "öncelik")
    with _conn() as con:
        cur = con.execute(
            "INSERT INTO tickets (title, description, category, priority, team, requester, created_at)"
            " VALUES (?,?,?,?,?,?,?)",
            (title, description, category, priority, TEAMS[category], requester,
             datetime.now().strftime("%Y-%m-%d %H:%M")),
        )
        row = con.execute("SELECT * FROM tickets WHERE id=?", (cur.lastrowid,)).fetchone()
    return _to_dict(row)


def get_ticket(ticket_id):
    with _conn() as con:
        row = con.execute("SELECT * FROM tickets WHERE id=?", (_parse_id(ticket_id),)).fetchone()
    if row is None:
        raise ValueError(f"'{ticket_id}' numaralı talep bulunamadı.")
    return _to_dict(row)


def list_tickets(status=None, requester=None, limit=10):
    query, params = "SELECT * FROM tickets", []
    if status:
        query += " WHERE status=?"
        params.append(_match(status, STATUSES, "durum"))
    query += " ORDER BY id DESC"
    with _conn() as con:
        rows = [_to_dict(r) for r in con.execute(query, params).fetchall()]
    if requester:
        rows = [r for r in rows if fold(requester) in fold(r["requester"])]
    return rows[: max(1, int(limit))]


def update_status(ticket_id, status):
    status = _match(status, STATUSES, "durum")
    tid = _parse_id(ticket_id)
    with _conn() as con:
        if con.execute("SELECT 1 FROM tickets WHERE id=?", (tid,)).fetchone() is None:
            raise ValueError(f"'{ticket_id}' numaralı talep bulunamadı.")
        con.execute("UPDATE tickets SET status=? WHERE id=?", (status, tid))
    return get_ticket(tid)
