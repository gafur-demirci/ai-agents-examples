"""LLM katmanı: Ollama istemcisi ve araç çağıran (tool calling) agent döngüsü."""
import json
from dataclasses import dataclass, field
from typing import Callable

from . import config


@dataclass
class AgentSpec:
    name: str
    system: str
    schemas: list[dict]
    funcs: dict[str, Callable]


@dataclass
class AgentResult:
    answer: str
    steps: list[dict] = field(default_factory=list)
    error: bool = False


def make_client():
    import ollama

    return ollama.Client(host=config.OLLAMA_HOST)


def check_models(client) -> tuple[bool, str]:
    """Ollama çalışıyor mu ve gerekli modeller indirilmiş mi?"""
    try:
        names = [m.model for m in client.list().models]
    except Exception as exc:
        return False, f"Ollama'ya ulaşılamadı ({config.OLLAMA_HOST}). `ollama serve` çalışıyor mu? ({exc})"
    missing = [m for m in (config.LLM_MODEL, config.EMBED_MODEL)
               if not any(n == m or n.startswith(m + ":") for n in names)]
    if missing:
        return False, "Eksik model: " + ", ".join(f"`ollama pull {m}`" for m in missing)
    return True, f"Hazır: {config.LLM_MODEL} + {config.EMBED_MODEL}"


def execute_tool(spec: AgentSpec, name: str, args: dict) -> dict:
    """Aracı güvenle çalıştırır. Hata fırlatmaz; hatayı modele geri bildirir ki düzeltip tekrar deneyebilsin."""
    func = spec.funcs.get(name)
    if func is None:
        return {"ok": False, "error": f"'{name}' adında bir araç yok. Kullanılabilir: {', '.join(spec.funcs)}"}
    try:
        result = func(**args)
    except ValueError as exc:       # beklenen doğrulama hataları
        return {"ok": False, "error": str(exc)}
    except TypeError as exc:        # modelin yanlış/eksik argüman göndermesi
        return {"ok": False, "error": f"Geçersiz argümanlar: {exc}"}
    except Exception as exc:        # beklenmeyen araç hatası
        return {"ok": False, "error": f"Araç hatası: {type(exc).__name__}: {exc}"}
    result.setdefault("ok", True)
    return result


def run_agent(client, spec: AgentSpec, history: list[dict], user_message: str) -> AgentResult:
    """ReAct tarzı döngü: model araç ister -> araç çalışır -> sonuç modele döner -> nihai yanıt."""
    messages = [{"role": "system", "content": spec.system}]
    messages += history[-config.HISTORY_WINDOW:]
    messages.append({"role": "user", "content": user_message})
    steps: list[dict] = []

    for _ in range(config.MAX_AGENT_STEPS):
        try:
            resp = client.chat(model=config.LLM_MODEL, messages=messages,
                               tools=spec.schemas, options={"temperature": 0.1})
        except Exception as exc:
            return AgentResult(f"Model servisine ulaşılamadı: {exc}", steps, error=True)

        msg = resp.message
        calls = msg.tool_calls or []
        if not calls:
            answer = (msg.content or "").strip()
            if not answer:
                return AgentResult("Model boş yanıt döndürdü, lütfen tekrar deneyin.", steps, error=True)
            return AgentResult(answer, steps)

        messages.append({
            "role": "assistant", "content": msg.content or "",
            "tool_calls": [{"function": {"name": c.function.name,
                                         "arguments": dict(c.function.arguments)}} for c in calls],
        })
        for c in calls:
            args = dict(c.function.arguments)
            result = execute_tool(spec, c.function.name, args)
            steps.append({"tool": c.function.name, "args": args, "result": result})
            messages.append({"role": "tool", "tool_name": c.function.name,
                             "content": json.dumps(result, ensure_ascii=False, default=str)})

    return AgentResult("İşlem çok fazla adım gerektirdi ve durduruldu. Talebinizi daha dar tanımlayabilir misiniz?",
                       steps, error=True)
