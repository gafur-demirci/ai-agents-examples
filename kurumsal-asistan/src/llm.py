"""LLM layer: Ollama client and the tool-calling (ReAct) agent loop."""
import json
from dataclasses import dataclass, field
from typing import Callable

from . import config


@dataclass
class AgentSpec:
    """Declarative agent definition: system prompt + tool schemas + implementations."""
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
    """Is Ollama reachable and are the required models pulled?"""
    try:
        names = [m.model for m in client.list().models]
    except Exception as exc:
        return False, f"Ollama'ya ulaşılamadı ({config.OLLAMA_HOST}). `ollama serve` çalışıyor mu? ({exc})"
    missing = [m for m in (config.LLM_MODEL, config.EMBED_MODEL)
               if not any(n == m or n.startswith(m + ":") for n in names)]
    if missing:
        return False, "Eksik model: " + ", ".join(f"`ollama pull {m}`" for m in missing)
    return True, f"Hazır: {config.LLM_MODEL} + {config.EMBED_MODEL}"


def _parse_tool_json(content: str) -> list[tuple[str, dict]]:
    """Salvage tool calls embedded as plain JSON in the message content.

    Some models (e.g. qwen2.5-coder) emit calls into `content` instead of the
    structured `tool_calls` field; Ollama cannot convert that on its own. Extracts
    every top-level {'name': ..., 'arguments': {...}} object, so multi-call messages
    (e.g. one search per topic) are handled too. Returns [] when nothing matches.
    """
    text = (content or "").strip()
    if "{" not in text:
        return []
    decoder, calls, i = json.JSONDecoder(), [], text.find("{")
    while i != -1:
        try:
            obj, end = decoder.raw_decode(text, i)
        except json.JSONDecodeError:
            i = text.find("{", i + 1)
            continue
        if isinstance(obj, dict) and isinstance(obj.get("name"), str):
            args = obj.get("arguments")
            if args is None:
                args = {}
            if isinstance(args, dict):
                calls.append((obj["name"], args))
        i = text.find("{", end)
    return calls


def execute_tool(spec: AgentSpec, name: str, args: dict) -> dict:
    """Run a tool safely. Never raises; errors are fed back to the model so it can retry."""
    func = spec.funcs.get(name)
    if func is None:
        return {"ok": False, "error": f"'{name}' adında bir araç yok. Kullanılabilir: {', '.join(spec.funcs)}"}
    try:
        result = func(**args)
    except ValueError as exc:       # expected validation errors
        return {"ok": False, "error": str(exc)}
    except TypeError as exc:        # model sent wrong/missing arguments
        return {"ok": False, "error": f"Geçersiz argümanlar: {exc}"}
    except Exception as exc:        # unexpected tool failure
        return {"ok": False, "error": f"Araç hatası: {type(exc).__name__}: {exc}"}
    result.setdefault("ok", True)
    return result


def run_agent(client, spec: AgentSpec, history: list[dict], user_message: str) -> AgentResult:
    """ReAct-style loop: model requests a tool -> tool runs -> result fed back -> final answer."""
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

        # Normalize structured tool calls; fall back to JSON salvaged from content.
        msg = resp.message
        calls = [(c.function.name, dict(c.function.arguments)) for c in (msg.tool_calls or [])]
        salvaged = False
        if not calls:
            calls = _parse_tool_json(msg.content)
            salvaged = bool(calls)

        # No tool call -> whatever the model said is the final answer.
        if not calls:
            answer = (msg.content or "").strip()
            if not answer:
                return AgentResult("Model boş yanıt döndürdü, lütfen tekrar deneyin.", steps, error=True)
            return AgentResult(answer, steps)

        messages.append({
            "role": "assistant", "content": "" if salvaged else (msg.content or ""),
            "tool_calls": [{"function": {"name": name, "arguments": args}} for name, args in calls],
        })
        for name, args in calls:
            result = execute_tool(spec, name, args)
            steps.append({"tool": name, "args": args, "result": result})
            messages.append({"role": "tool", "tool_name": name,
                             "content": json.dumps(result, ensure_ascii=False, default=str)})

    # Step budget exhausted: stop instead of looping forever.
    return AgentResult("İşlem çok fazla adım gerektirdi ve durduruldu. Talebinizi daha dar tanımlayabilir misiniz?",
                       steps, error=True)
