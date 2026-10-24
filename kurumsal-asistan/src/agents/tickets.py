"""Talep Agent'ı: sorunu anlar, eksik bilgiyi sorar, talebi sınıflandırıp ilgili ekibe atar."""
from .. import db
from ..llm import AgentSpec

SYSTEM = """Sen Örnek A.Ş. destek talebi asistanısın. Çalışanların sorunlarını talebe dönüştürür ve takip edersin.
Kurallar:
1. Talep açmadan önce şunlar net olmalı: sorunun ne olduğu ve talep sahibinin ad soyadı. Eksikse create_ticket ÇAĞIRMA, kullanıcıya TEK bir soruyla sor. Değer uydurma.
2. Kategoriyi sorundan sen belirle: IT (bilgisayar, erişim, yazılım), IK (izin, bordro, özlük), Finans (masraf, fatura, ödeme), Genel (ofis, idari).
3. Önceliği sen belirle: Kritik = çalışma tamamen durdu veya güvenlik ihlali; Yüksek = iş etkileniyor, geçici çözüm yok; Orta = normal; Düşük = bilgi/öneri.
4. Talep açıldığında numarayı, atanan ekibi ve SLA süresini kullanıcıya bildir.
5. Sorgulama/güncelleme için get_ticket, list_tickets, update_ticket_status araçlarını kullan.
6. Araç hata döndürürse hatayı oku, düzeltip bir kez daha dene; olmazsa durumu kullanıcıya açıkça söyle.
Kısa ve net Türkçe yanıt ver."""


def _fn(name, desc, props, required):
    return {"type": "function", "function": {
        "name": name, "description": desc,
        "parameters": {"type": "object", "properties": props, "required": required}}}


_STR = {"type": "string"}
SCHEMAS = [
    _fn("create_ticket", "Yeni destek talebi oluşturur ve ilgili ekibe atar.",
        {"title": {"type": "string", "description": "Kısa başlık"},
         "description": {"type": "string", "description": "Sorunun ayrıntısı"},
         "category": {"type": "string", "enum": db.CATEGORIES},
         "priority": {"type": "string", "enum": db.PRIORITIES},
         "requester": {"type": "string", "description": "Talep sahibinin ad soyadı"}},
        ["title", "description", "category", "priority", "requester"]),
    _fn("get_ticket", "Talep numarasına göre talep detayını getirir.",
        {"ticket_id": {"type": "string", "description": "Örn: TKT-0001"}}, ["ticket_id"]),
    _fn("list_tickets", "Talepleri listeler; duruma veya talep sahibine göre filtrelenebilir.",
        {"status": {"type": "string", "enum": db.STATUSES}, "requester": _STR}, []),
    _fn("update_ticket_status", "Talebin durumunu günceller.",
        {"ticket_id": _STR, "status": {"type": "string", "enum": db.STATUSES}}, ["ticket_id", "status"]),
]


def build() -> AgentSpec:
    funcs = {
        "create_ticket": lambda **kw: {"ticket": db.create_ticket(**kw)},
        "get_ticket": lambda ticket_id: {"ticket": db.get_ticket(ticket_id)},
        "list_tickets": lambda status=None, requester=None: {"tickets": db.list_tickets(status, requester)},
        "update_ticket_status": lambda ticket_id, status: {"ticket": db.update_status(ticket_id, status)},
    }
    return AgentSpec("talep", SYSTEM, SCHEMAS, funcs)
