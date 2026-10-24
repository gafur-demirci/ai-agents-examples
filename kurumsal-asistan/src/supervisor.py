"""Supervisor: classifies user intent and routes to the matching expert agent."""
import json
from dataclasses import dataclass, field

from . import config
from .llm import AgentSpec, run_agent

ROUTES = ["bilgi", "talep", "rapor", "belirsiz"]

ROUTER_SYSTEM = """Bir kurumsal asistanın yönlendiricisisin. Kullanıcının SON mesajının niyetini sınıflandır.
- bilgi: İK/IT/masraf politikaları hakkında soru (izin, uzaktan çalışma, şifre, VPN, harcama limiti...)
- talep: Bir sorunu bildirme, destek talebi açma veya var olan talebi sorgulama/güncelleme (TKT-xxxx)
- rapor: Satış verisi analizi, karşılaştırma, grafik veya rapor isteği
- belirsiz: Yukarıdakilerin hiçbiri veya anlaşılamayan mesaj
Önemli: Önceki asistan mesajı bir soru soruyorsa ve kullanıcı ona cevap veriyorsa, aynı konuya (aynı rota) devam et."""

# Structured output schema so the router answer is always parseable JSON.
ROUTER_SCHEMA = {
    "type": "object",
    "properties": {"route": {"type": "string", "enum": ROUTES}, "reason": {"type": "string"}},
    "required": ["route", "reason"],
}

CLARIFY = ("Talebinizi tam anlayamadım. Size şu konularda yardımcı olabilirim:\n"
           "- **Bilgi:** İK, IT güvenliği ve masraf politikaları\n"
           "- **Talep:** Destek talebi açma veya sorgulama\n"
           "- **Rapor:** Satış verisi analizi ve raporlama\n\n"
           "Hangisiyle ilgili olduğunu biraz daha açabilir misiniz?")


@dataclass
class Turn:
    route: str
    answer: str
    reason: str = ""
    steps: list[dict] = field(default_factory=list)
    error: bool = False


def route_message(client, history: list[dict], user_message: str) -> dict:
    """Ask the model to classify intent; falls back to 'belirsiz' on malformed output."""
    messages = [{"role": "system", "content": ROUTER_SYSTEM}]
    messages += history[-4:] + [{"role": "user", "content": user_message}]
    resp = client.chat(model=config.LLM_MODEL, messages=messages,
                       format=ROUTER_SCHEMA, options={"temperature": 0})
    try:
        data = json.loads(resp.message.content)
    except (json.JSONDecodeError, TypeError):
        return {"route": "belirsiz", "reason": "Yönlendirici çıktısı okunamadı"}
    if data.get("route") not in ROUTES:
        return {"route": "belirsiz", "reason": "Geçersiz rota"}
    return {"route": data["route"], "reason": data.get("reason", "")}


def handle(client, agents: dict[str, AgentSpec], history: list[dict], user_message: str) -> Turn:
    """One full conversation turn: classify -> dispatch to the expert agent."""
    if not user_message.strip():
        return Turn("belirsiz", CLARIFY)
    try:
        decision = route_message(client, history, user_message)
    except Exception as exc:
        return Turn("belirsiz", f"Model servisine ulaşılamadı: {exc}", error=True)

    if decision["route"] == "belirsiz":
        return Turn("belirsiz", CLARIFY, decision["reason"])

    result = run_agent(client, agents[decision["route"]], history, user_message)
    return Turn(decision["route"], result.answer, decision["reason"], result.steps, result.error)
