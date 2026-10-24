"""Central configuration. Values are read from .env (never hardcoded)."""
import os
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

# Ollama server endpoint and model names.
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
LLM_MODEL = os.getenv("LLM_MODEL", "qwen2.5-coder:14b")
EMBED_MODEL = os.getenv("EMBED_MODEL", "bge-m3")

# RAG tuning: number of chunks retrieved and the max allowed similarity distance.
TOP_K = int(os.getenv("RAG_TOP_K", "4"))
MAX_DISTANCE = float(os.getenv("RAG_MAX_DISTANCE", "0.6"))
# Agent loop cap: prevents infinite tool-calling loops.
MAX_AGENT_STEPS = int(os.getenv("MAX_AGENT_STEPS", "6"))
HISTORY_WINDOW = 6  # messages passed to an agent (short-term memory)

# Filesystem locations for data and generated outputs.
DOCS_DIR = ROOT / "data" / "docs"
SALES_CSV = ROOT / "data" / "satis.csv"
DB_PATH = ROOT / "data" / "tickets.db"
CHROMA_DIR = ROOT / "data" / "chroma"
OUTPUT_DIR = ROOT / "outputs"
