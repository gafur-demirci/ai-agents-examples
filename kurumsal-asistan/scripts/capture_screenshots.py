"""Automation: drives the running Streamlit app (port 8599) and captures the five
README screenshots into docs/screenshots/. Requires: ollama serve, streamlit on 8599."""
import time

from playwright.sync_api import sync_playwright

BASE = "http://localhost:8599"
OUT = "docs/screenshots"


def wait_turn_done(page, prev_msgs, timeout=600000):
    """Wait until a new assistant message appears AND Streamlit stops streaming.
    An assistant message is 'settled' when it has the route caption (🧭) appended
    by render(), which only happens after the agent turn finishes."""
    deadline = time.time() + timeout / 1000
    while time.time() < deadline:
        msgs = page.locator("[data-testid='stChatMessage']")
        done = msgs.count() >= prev_msgs + 2 and "🧭" in msgs.nth(msgs.count() - 1).inner_text()
        if done and page.locator("[data-testid='stStatusWidget']").count() == 0:
            time.sleep(1.0)  # let markdown/charts settle
            return
        time.sleep(0.5)
    raise TimeoutError("assistant turn did not finish")


def expand_steps(page):
    """Open the 'Agent adımları' expander of the last assistant message, if present."""
    expanders = page.locator("[data-testid='stExpander']")
    n = expanders.count()
    for i in range(max(0, n - 3), n):
        exp = expanders.nth(i)
        try:
            summary = exp.locator("summary, [data-testid='stExpanderToggleButton']").first
            if "Agent adımları" in (summary.inner_text() or ""):
                summary.click()
                time.sleep(0.6)
                return True
        except Exception:
            continue
    return False


def type_and_send(page, text):
    box = page.locator("textarea[data-testid='stChatInputTextArea']")
    box.wait_for(state="visible", timeout=30000)
    box.fill(text)
    box.press("Enter")


with sync_playwright() as pw:
    browser = pw.chromium.launch()
    page = browser.new_page(viewport={"width": 1600, "height": 1000})
    page.goto(BASE, wait_until="networkidle")
    page.wait_for_selector("[data-testid='stStatusWidget']", state="detached", timeout=600000)
    time.sleep(1.5)

    turns = [
        ("01-bilgi-rag.png", "Yıllık iznim kaç gün? Uzaktan çalışma kuralları nelerdir?", False),
        ("02-talep.png", "VPN bağlanmıyor ve sunuma 1 saat var. Adım Ayşe Yılmaz, talep açar mısın?", False),
        ("03-rapor.png", "Bölgelere göre ciroyu karşılaştır ve grafik çiz.", False),
        ("04-agent-adimlari.png", "Ege bölgesinin aylık trendini analiz edip rapor hazırla.", True),
        ("05-talep-listesi.png", None, False),
    ]
    count = page.locator("[data-testid='stChatMessage']").count()
    for fname, prompt, want_expander in turns:
        if prompt:
            print("sending:", prompt[:50])
            type_and_send(page, prompt)
            wait_turn_done(page, count)
            count = page.locator("[data-testid='stChatMessage']").count()
        if want_expander:
            expand_steps(page)
        page.screenshot(path=f"{OUT}/{fname}", full_page=True)
        print("saved:", fname)

    browser.close()
print("done")
