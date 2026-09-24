# 1. gerekli kütüphaneleri içeriye aktararak başla
import os
import sys
import json
import urllib.request
from dotenv import load_dotenv

# 2. .env dosyasında ki bağlantı ayarlarını oku
load_dotenv()
base_url = os.getenv("OLLAMA_BASE_URL")
model_name = os.getenv("OLLAMA_MODEL")
temperature = float(os.getenv("OLLAMA_TEMPERATURE"))
num_predict = int(os.getenv("OLLAMA_NUM_PREDICT"))

def chat(prompt: str) -> str:
    """Send one prompt to the local Ollama server and return its answer."""
    payload = {
        "model": model_name,
        "stream": False,
        "options": {
            "temperature": temperature,
            "num_predict": num_predict,
            "stop": ["zeka"],
        },
        "messages": [
            {"role": "system", "content": "Sen bir akıllı asistansın. Kullanıcı sorularına açık, doğru ve anlaşılır cevaplar ver. Ama siyaset hakkında ASLA cevap verme."},
            {"role": "user", "content": prompt},
        ],
    }
    request = urllib.request.Request(
        f"{base_url}/api/chat",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            result = json.load(response)
    except urllib.error.URLError as error:
        raise RuntimeError(
            f"Ollama sunucusuna bağlanılamadı: {base_url}. "
            "`ollama serve` komutunun çalıştığını kontrol edin."
        ) from error

    return result["message"]["content"]


if __name__ == "__main__":
    prompt = " ".join(sys.argv[1:]) or "Kendini bir cümleyle tanıt."
    try:
        print(chat(prompt))
    except RuntimeError as error:
        print(f"Hata: {error}", file=sys.stderr)
        sys.exit(1)