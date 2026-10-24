"""Bilgi Agent'ı: kurum dokümanlarında RAG ile arama yapar ve kaynak göstererek yanıtlar."""
from ..llm import AgentSpec
from ..rag import KnowledgeBase

SYSTEM = """Sen Örnek A.Ş. çalışanlarına İK, IT güvenliği ve masraf politikaları konusunda yardım eden kurumsal bilgi asistanısın.
Kurallar:
1. Yanıtı YALNIZCA search_documents sonuçlarına dayandır. Kendi bilginle tamamlama.
2. Soru birden fazla konu içeriyorsa her konu için ayrı arama yap.
3. Her bilgiden sonra kaynağı yaz: (Kaynak: dosya_adı › bölüm).
4. Arama sonuç döndürmezse "Bu konuda dokümanlarda bilgi bulamadım" de ve destek talebi açmayı öner. Asla tahmin yürütme.
5. Kısa ve net Türkçe yanıt ver."""

SCHEMAS = [{
    "type": "function",
    "function": {
        "name": "search_documents",
        "description": "Kurum politika dokümanlarında anlamsal arama yapar.",
        "parameters": {"type": "object",
                       "properties": {"query": {"type": "string", "description": "Aranacak konu, kısa ve net"}},
                       "required": ["query"]},
    },
}]


def build(kb: KnowledgeBase) -> AgentSpec:
    def search_documents(query: str) -> dict:
        hits = kb.search(query)
        if not hits:
            return {"results": [], "note": "İlgili doküman bulunamadı."}
        return {"results": [{"kaynak": h["source"], "bolum": h["section"], "metin": h["text"]} for h in hits]}

    return AgentSpec("bilgi", SYSTEM, SCHEMAS, {"search_documents": search_documents})
