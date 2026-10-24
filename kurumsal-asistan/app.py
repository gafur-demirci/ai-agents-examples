"""Streamlit UI: single chat box backed by a Supervisor + 3 expert agents."""
from pathlib import Path

import pandas as pd
import streamlit as st

from src import config, db
from src.agents import knowledge, reports, tickets
from src.llm import check_models, make_client
from src.rag import KnowledgeBase
from src.supervisor import handle

st.set_page_config(page_title="Kurumsal Operasyon Asistanı", page_icon="🏢", layout="wide")

# Display labels for the route chosen by the supervisor.
ROUTE_LABELS = {"bilgi": "📚 Bilgi Agent'ı (RAG)", "talep": "🎫 Talep Agent'ı",
                "rapor": "📊 Rapor Agent'ı", "belirsiz": "❓ Netleştirme"}
EXAMPLES = [
    "Yıllık iznim kaç gün? Uzaktan çalışma kuralları nelerdir?",
    "Laptopum çalındı, ne yapmalıyım?",
    "VPN bağlanmıyor ve sunuma 1 saat var. Adım Ayşe Yılmaz, talep açar mısın?",
    "Bölgelere göre ciroyu karşılaştır ve grafik çiz.",
    "Ege bölgesinin aylık trendini analiz edip rapor hazırla.",
]


@st.cache_resource
def get_runtime():
    """Build the LLM client, knowledge base and agent specs once per process."""
    client = make_client()
    kb = KnowledgeBase(client)
    agents = {"bilgi": knowledge.build(kb), "talep": tickets.build(), "rapor": reports.build()}
    return client, kb, agents


client, kb, agents = get_runtime()
st.session_state.setdefault("messages", [])

with st.sidebar:
    st.title("🏢 Operasyon Asistanı")
    ok, status = check_models(client)
    (st.success if ok else st.error)(status)
    if st.button("📚 Dokümanları yeniden indeksle", disabled=not ok):
        with st.spinner("İndeksleniyor..."):
            st.success(f"{kb.index()} parça indekslendi.")
    st.divider()
    st.caption("Örnek sorular")
    for ex in EXAMPLES:
        if st.button(ex, use_container_width=True):
            st.session_state["pending"] = ex
    if st.button("🗑️ Sohbeti temizle"):
        st.session_state.messages = []
        st.rerun()


def render(m: dict):
    """Render one chat message: text, route caption, chart images and tool-step expander."""
    with st.chat_message(m["role"]):
        st.markdown(m["content"])
        if m.get("route"):
            st.caption(f"🧭 {ROUTE_LABELS[m['route']]}")
        for s in m.get("steps", []):
            chart = s["result"].get("chart_path")
            if chart and Path(chart).exists():
                st.image(chart)
        if m.get("steps"):
            with st.expander(f"🔧 Agent adımları ({len(m['steps'])})"):
                for i, s in enumerate(m["steps"], 1):
                    st.markdown(f"**{i}. `{s['tool']}`** {'✅' if s['result'].get('ok') else '⚠️ hata'}")
                    st.json({"argümanlar": s["args"], "sonuç": s["result"]}, expanded=False)


tab_chat, tab_tickets = st.tabs(["💬 Asistan", "🎫 Talepler"])

with tab_chat:
    for m in st.session_state.messages:
        render(m)

    # chat_input or a clicked example (stored as "pending") triggers a turn.
    prompt = st.chat_input("Bir soru sorun, sorun bildirin veya rapor isteyin...") \
        or st.session_state.pop("pending", None)
    if prompt:
        history = [{"role": m["role"], "content": m["content"]} for m in st.session_state.messages]
        user_msg = {"role": "user", "content": prompt}
        st.session_state.messages.append(user_msg)
        render(user_msg)
        with st.spinner("Düşünüyorum..."):
            turn = handle(client, agents, history, prompt)
        bot_msg = {"role": "assistant", "content": turn.answer, "route": turn.route, "steps": turn.steps}
        st.session_state.messages.append(bot_msg)
        render(bot_msg)

with tab_tickets:
    rows = db.list_tickets(limit=100)
    if rows:
        df = pd.DataFrame(rows).rename(columns={
            "id": "No", "title": "Başlık", "category": "Kategori", "priority": "Öncelik", "team": "Ekip",
            "requester": "Talep Sahibi", "status": "Durum", "created_at": "Oluşturulma", "sla_saat": "SLA (saat)"})
        st.dataframe(df[["No", "Başlık", "Kategori", "Öncelik", "Ekip", "Talep Sahibi", "Durum", "SLA (saat)",
                         "Oluşturulma"]], use_container_width=True, hide_index=True)
    else:
        st.info("Henüz talep yok. Asistan sekmesinden bir sorun bildirerek deneyin.")
    st.caption("Sohbette talep oluşturduktan sonra bu sekmeyi yenilemek için herhangi bir mesaj gönderin.")
