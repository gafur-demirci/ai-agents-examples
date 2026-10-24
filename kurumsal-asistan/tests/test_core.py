"""LLM- and Ollama-free tests: tools, validation, agent loop, routing."""
import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace

from src import config, db
from src.agents import reports, tickets
from src.llm import AgentSpec, _parse_tool_json, run_agent
from src.rag import chunk_markdown
from src.supervisor import CLARIFY, handle


def reply(content="", calls=None):
    """Build a fake chat response message."""
    return SimpleNamespace(message=SimpleNamespace(content=content, tool_calls=calls))


def call(name, args):
    """Build a fake structured tool call."""
    return SimpleNamespace(function=SimpleNamespace(name=name, arguments=args))


class FakeClient:
    """Returns queued responses; records incoming requests for assertions."""
    def __init__(self, *responses):
        self.responses, self.requests = list(responses), []

    def chat(self, **kw):
        self.requests.append(kw)
        r = self.responses.pop(0)
        if isinstance(r, Exception):
            raise r
        return r


class TempEnv(unittest.TestCase):
    """Redirects DB/outputs to a temp dir so tests never touch real data."""
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        tmp = Path(self._tmp.name)
        self._old = (config.DB_PATH, config.OUTPUT_DIR)
        config.DB_PATH, config.OUTPUT_DIR = tmp / "t.db", tmp / "out"

    def tearDown(self):
        config.DB_PATH, config.OUTPUT_DIR = self._old
        self._tmp.cleanup()


class TicketTests(TempEnv):
    def test_create_normalizes_and_assigns_team(self):
        t = db.create_ticket("VPN bağlanmıyor", "VPN hata veriyor", "it", "yuksek", "Ayşe Yılmaz")
        self.assertEqual((t["id"], t["category"], t["priority"], t["team"], t["sla_saat"]),
                         ("TKT-0001", "IT", "Yüksek", "IT Servis Masası", 8))

    def test_turkish_category_ik(self):
        self.assertEqual(db.create_ticket("İzin", "İzin bakiyem yanlış", "İK", "Orta", "Ali Veli")["category"], "IK")

    def test_validation_errors(self):
        with self.assertRaises(ValueError):
            db.create_ticket("Sorun", "Detay var", "Bilinmeyen", "Orta", "Ali Veli")
        with self.assertRaises(ValueError):
            db.create_ticket("Sorun", "Detay var", "IT", "Acil", "Ali Veli")
        with self.assertRaises(ValueError):
            db.create_ticket("Sorun", "Detay var", "IT", "Orta", "")

    def test_get_list_update(self):
        db.create_ticket("A sorunu", "açıklama a", "IT", "Orta", "Ali Veli")
        db.create_ticket("B sorunu", "açıklama b", "Finans", "Düşük", "Ayşe Kaya")
        self.assertEqual(db.get_ticket("TKT-0002")["category"], "Finans")
        self.assertEqual(len(db.list_tickets(requester="ayşe")), 1)
        self.assertEqual(db.update_status("tkt-0001", "çözüldü")["status"], "Çözüldü")
        self.assertEqual(len(db.list_tickets(status="Açık")), 1)
        with self.assertRaises(ValueError):
            db.get_ticket("TKT-0099")
        with self.assertRaises(ValueError):
            db.get_ticket("abc")


class ReportTests(TempEnv):
    def test_describe_and_aggregate(self):
        d = reports.describe_data()
        self.assertEqual(d["satir_sayisi"], 360)
        agg = reports.aggregate("bolge", "ciro")
        self.assertEqual(len(agg["satirlar"]), 5)
        self.assertAlmostEqual(sum(r["ciro"] for r in agg["satirlar"]), agg["toplam"], delta=1)
        months = reports.aggregate("ay", "adet", bolge="ege")["satirlar"]
        self.assertEqual([m["ay"] for m in months], sorted(m["ay"] for m in months))

    def test_demo_scenario_ege_drops_in_q3(self):
        ege = {r["ay"]: r["ciro"] for r in reports.aggregate("ay", "ciro", bolge="Ege")["satirlar"]}
        self.assertLess(sum(ege[m] for m in ("2026-07", "2026-08", "2026-09")),
                        sum(ege[m] for m in ("2026-04", "2026-05", "2026-06")))

    def test_errors_are_clear(self):
        for kwargs in ({"group_by": "musteri", "metric": "ciro"}, {"group_by": "bolge", "metric": "kar"},
                       {"group_by": "bolge", "metric": "ciro", "bolge": "Mars"},
                       {"group_by": "bolge", "metric": "ciro", "baslangic": "12/03/2026"},
                       {"group_by": "bolge", "metric": "ciro", "baslangic": "2030-01-01"}):
            with self.assertRaises(ValueError, msg=kwargs):
                reports.aggregate(**kwargs)

    def test_chart_and_report_files(self):
        chart = reports.make_chart("ay", "ciro", "line", "Aylık Ciro", bolge="Ege")
        self.assertTrue(Path(chart["chart_path"]).stat().st_size > 1000)
        rep = reports.save_report("Ege Analizi", "## Özet\n" + "Ege bölgesi 3. çeyrekte düşüş gösterdi. " * 3)
        self.assertTrue(Path(rep["report_path"]).read_text(encoding="utf-8").startswith("# Ege Analizi"))
        with self.assertRaises(ValueError):
            reports.save_report("Boş", "kısa")

    def test_missing_csv(self):
        old, config.SALES_CSV = config.SALES_CSV, Path("/yok/satis.csv")
        try:
            with self.assertRaises(ValueError):
                reports.describe_data()
        finally:
            config.SALES_CSV = old


class ChunkTests(unittest.TestCase):
    def test_sections_and_titles(self):
        chunks = chunk_markdown("# Ana\n\nGiriş metni\n\n## A\n\nBirinci\n\n## B\n\nİkinci", "x.md")
        self.assertEqual([c["section"] for c in chunks], ["Ana", "A", "B"])
        self.assertTrue(chunks[1]["text"].startswith("A\n"))

    def test_long_section_is_split(self):
        text = "## Uzun\n\n" + "\n\n".join(f"Paragraf {i} " + "x" * 300 for i in range(6))
        chunks = chunk_markdown(text, "x.md", max_chars=700)
        self.assertGreater(len(chunks), 1)
        self.assertTrue(all(len(c["text"]) <= 1100 for c in chunks))

    def test_real_docs_chunk(self):
        for p in config.DOCS_DIR.glob("*.md"):
            self.assertGreaterEqual(len(chunk_markdown(p.read_text(encoding="utf-8"), p.name)), 3)


class AgentLoopTests(TempEnv):
    def test_tool_call_then_answer(self):
        """Structured tool call -> executed -> tool result fed back -> final answer."""
        spec = tickets.build()
        client = FakeClient(
            reply(calls=[call("create_ticket", {"title": "VPN sorunu", "description": "VPN bağlanmıyor",
                                                "category": "IT", "priority": "Yüksek", "requester": "Ayşe Yılmaz"})]),
            reply("Talebiniz TKT-0001 olarak açıldı."))
        res = run_agent(client, spec, [], "VPN bağlanmıyor, adım Ayşe Yılmaz")
        self.assertEqual(res.answer, "Talebiniz TKT-0001 olarak açıldı.")
        self.assertEqual(res.steps[0]["result"]["ticket"]["id"], "TKT-0001")
        tool_msg = [m for m in client.requests[1]["messages"] if m["role"] == "tool"][0]
        self.assertIn("TKT-0001", tool_msg["content"])

    def test_tool_error_is_fed_back_and_model_recovers(self):
        spec = tickets.build()
        client = FakeClient(
            reply(calls=[call("create_ticket", {"title": "Sorun var", "description": "Detay var",
                                                "category": "Yanlış", "priority": "Orta", "requester": "Ali Veli"})]),
            reply(calls=[call("create_ticket", {"title": "Sorun var", "description": "Detay var",
                                                "category": "IT", "priority": "Orta", "requester": "Ali Veli"})]),
            reply("Açıldı."))
        res = run_agent(client, spec, [], "x")
        self.assertFalse(res.steps[0]["result"]["ok"])
        self.assertIn("Geçersiz kategori", res.steps[0]["result"]["error"])
        self.assertTrue(res.steps[1]["result"]["ok"])

    def test_unknown_tool_and_bad_args(self):
        spec = tickets.build()
        client = FakeClient(reply(calls=[call("hack", {}), call("get_ticket", {"yanlis": 1})]), reply("Tamam."))
        res = run_agent(client, spec, [], "x")
        self.assertIn("araç yok", res.steps[0]["result"]["error"])
        self.assertIn("Geçersiz argümanlar", res.steps[1]["result"]["error"])

    def test_max_steps_stops_infinite_loop(self):
        spec = AgentSpec("t", "s", [], {"ping": lambda: {"x": 1}})
        client = FakeClient(*[reply(calls=[call("ping", {})]) for _ in range(config.MAX_AGENT_STEPS)])
        res = run_agent(client, spec, [], "x")
        self.assertTrue(res.error)
        self.assertEqual(len(res.steps), config.MAX_AGENT_STEPS)

    def test_model_unreachable_and_empty_answer(self):
        spec = AgentSpec("t", "s", [], {})
        self.assertTrue(run_agent(FakeClient(ConnectionError("down")), spec, [], "x").error)
        self.assertTrue(run_agent(FakeClient(reply("")), spec, [], "x").error)

    def test_history_window_is_applied(self):
        spec = AgentSpec("t", "s", [], {})
        hist = [{"role": "user", "content": str(i)} for i in range(20)]
        client = FakeClient(reply("ok"))
        run_agent(client, spec, hist, "son")
        self.assertEqual(len(client.requests[0]["messages"]), 1 + config.HISTORY_WINDOW + 1)

    def test_parse_tool_json_accepts_and_rejects(self):
        """Content salvage: raw JSON, fenced, wrapped in prose are accepted."""
        tool = '{"name": "create_ticket", "arguments": {"title": "x"}}'
        self.assertEqual(_parse_tool_json(tool), [("create_ticket", {"title": "x"})])
        self.assertEqual(_parse_tool_json(f"```json\n{tool}\n```"), [("create_ticket", {"title": "x"})])
        self.assertEqual(_parse_tool_json(f'önsöz {tool} kuyruk'), [("create_ticket", {"title": "x"})])
        self.assertEqual(_parse_tool_json('{"name": "x"}'), [("x", {})])
        # Multiple calls in one message must all be salvaged.
        two = ('{"name": "search_documents", "arguments": {"query": "yıllık izin"}}\n'
               '{"name": "search_documents", "arguments": {"query": "uzaktan çalışma"}}')
        self.assertEqual([n for n, _ in _parse_tool_json(two)], ["search_documents", "search_documents"])
        # Non-tool JSON and garbage must be rejected.
        self.assertEqual(_parse_tool_json("normal metin"), [])
        self.assertEqual(_parse_tool_json('{"route": "talep"}'), [])
        self.assertEqual(_parse_tool_json('{"name": 3}'), [])
        self.assertEqual(_parse_tool_json('{"name": "x", "arguments": [1]}'), [])
        self.assertEqual(_parse_tool_json('{"kesik'), [])
        self.assertEqual(_parse_tool_json('{"kesik {"name": "ok", "arguments": {}}'), [("ok", {})])

    def test_content_json_tool_call_is_salvaged_and_executed(self):
        """Regression: model writes the call as plain JSON in content; it must still run.
        Multi-call content (one search per topic) executes every call in order."""
        spec = tickets.build()
        client = FakeClient(
            reply('{"name": "create_ticket", "arguments": {"title": "VPN sorunu", \
"description": "VPN bağlanmıyor", "category": "IT", "priority": "Yüksek", "requester": "Ayşe Yılmaz"}}'),
            reply("Talebiniz TKT-0001 olarak açıldı."))
        res = run_agent(client, spec, [], "VPN bağlanmıyor, adım Ayşe Yılmaz")
        self.assertEqual(res.answer, "Talebiniz TKT-0001 olarak açıldı.")
        self.assertEqual(res.steps[0]["tool"], "create_ticket")
        self.assertTrue(res.steps[0]["result"]["ok"])
        self.assertEqual(res.steps[0]["result"]["ticket"]["id"], "TKT-0001")

        knowledge = AgentSpec("k", "s", [], {"search_documents": lambda query: {"results": [query]}})
        two = ('{"name": "search_documents", "arguments": {"query": "izin"}}\n'
               '{"name": "search_documents", "arguments": {"query": "vpn"}}')
        res2 = run_agent(FakeClient(reply(two), reply("İki arama yapıldı.")), knowledge, [], "izin ve vpn")
        self.assertEqual([s["args"]["query"] for s in res2.steps], ["izin", "vpn"])
        self.assertEqual(res2.answer, "İki arama yapıldı.")

    def test_salvaged_unknown_tool_gets_error_feedback(self):
        spec = tickets.build()
        client = FakeClient(reply('{"name": "hack", "arguments": {}}'), reply("Böyle bir araç yok."))
        res = run_agent(client, spec, [], "x")
        self.assertFalse(res.steps[0]["result"]["ok"])
        self.assertIn("araç yok", res.steps[0]["result"]["error"])
        self.assertEqual(res.answer, "Böyle bir araç yok.")


class SupervisorTests(TempEnv):
    def agents(self):
        return {"bilgi": AgentSpec("bilgi", "s", [], {}), "talep": tickets.build(), "rapor": reports.build()}

    def test_routes_to_agent(self):
        client = FakeClient(reply(json.dumps({"route": "bilgi", "reason": "izin sorusu"})), reply("14 gün."))
        turn = handle(client, self.agents(), [], "Yıllık iznim kaç gün?")
        self.assertEqual((turn.route, turn.answer), ("bilgi", "14 gün."))
        self.assertIn("format", client.requests[0])  # structured output requested

    def test_bad_router_output_falls_back_to_clarification(self):
        for bad in ("json değil", json.dumps({"route": "uçuş", "reason": ""}), None):
            turn = handle(FakeClient(reply(bad)), self.agents(), [], "asdf")
            self.assertEqual((turn.route, turn.answer), ("belirsiz", CLARIFY))

    def test_empty_message_and_service_down(self):
        self.assertEqual(handle(FakeClient(), self.agents(), [], "   ").route, "belirsiz")
        turn = handle(FakeClient(ConnectionError("x")), self.agents(), [], "merhaba")
        self.assertTrue(turn.error)


if __name__ == "__main__":
    unittest.main()
