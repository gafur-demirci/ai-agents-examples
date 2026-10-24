"""Merkezi yapılandırma. Değerler .env dosyasından okunur (koda gömülmez)."""
import os
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
LLM_MODEL = os.getenv("LLM_MODEL", "qwen2.5-coder:14b")
EMBED_MODEL = os.getenv("EMBED_MODEL", "bge-m3")

TOP_K = int(os.getenv("RAG_TOP_K", "4"))
MAX_DISTANCE = float(os.getenv("RAG_MAX_DISTANCE", "0.6"))
MAX_AGENT_STEPS = int(os.getenv("MAX_AGENT_STEPS", "6"))
HISTORY_WINDOW = 6  # ajana verilen son mesaj sayısı (kısa süreli hafıza)

DOCS_DIR = ROOT / "data" / "docs"
SALES_CSV = ROOT / "data" / "satis.csv"
DB_PATH = ROOT / "data" / "tickets.db"
CHROMA_DIR = ROOT / "data" / "chroma"
OUTPUT_DIR = ROOT / "outputs"
