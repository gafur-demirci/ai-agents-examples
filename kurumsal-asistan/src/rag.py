"""RAG: split Markdown docs -> embed -> store in ChromaDB -> semantic search."""
from . import config

COLLECTION = "kurumsal_dokumanlar"


def chunk_markdown(text: str, source: str, max_chars: int = 900) -> list[dict]:
    """Split by headings; long sections break at paragraph boundaries.
    Each chunk is prefixed with its heading so it is meaningful on its own."""
    sections, title, buf = [], "Giriş", []
    for line in text.splitlines():
        if line.lstrip().startswith("#"):
            if any(l.strip() for l in buf):
                sections.append((title, "\n".join(buf).strip()))
            title, buf = line.lstrip("# ").strip(), []
        else:
            buf.append(line)
    if any(l.strip() for l in buf):
        sections.append((title, "\n".join(buf).strip()))

    chunks = []
    for title, body in sections:
        current = ""
        for para in [p.strip() for p in body.split("\n\n") if p.strip()]:
            if current and len(current) + len(para) > max_chars:
                chunks.append({"source": source, "section": title, "text": f"{title}\n{current}"})
                current = ""
            current = f"{current}\n\n{para}".strip()
        if current:
            chunks.append({"source": source, "section": title, "text": f"{title}\n{current}"})
    return chunks


class KnowledgeBase:
    def __init__(self, client):
        self.client = client

    def _collection(self, reset: bool = False):
        import chromadb  # lazy import: tests do not require chromadb

        db = chromadb.PersistentClient(path=str(config.CHROMA_DIR))
        if reset:
            try:
                db.delete_collection(COLLECTION)
            except Exception:
                pass  # nothing to delete on first run
        return db.get_or_create_collection(COLLECTION, metadata={"hnsw:space": "cosine"})

    def _embed(self, texts: list[str]) -> list[list[float]]:
        resp = self.client.embed(model=config.EMBED_MODEL, input=texts)
        return [list(e) for e in resp.embeddings]

    def index(self) -> int:
        """Re-index all docs from scratch (idempotent). Returns the chunk count."""
        chunks = []
        for path in sorted(config.DOCS_DIR.glob("*.md")):
            chunks += chunk_markdown(path.read_text(encoding="utf-8"), path.name)
        if not chunks:
            raise ValueError(f"{config.DOCS_DIR} içinde .md doküman bulunamadı.")
        col = self._collection(reset=True)
        col.add(
            ids=[f"c{i}" for i in range(len(chunks))],
            documents=[c["text"] for c in chunks],
            embeddings=self._embed([c["text"] for c in chunks]),
            metadatas=[{"source": c["source"], "section": c["section"]} for c in chunks],
        )
        return len(chunks)

    def search(self, query: str, k: int | None = None) -> list[dict]:
        """Semantic search; auto-indexes on first call. Drops hits beyond MAX_DISTANCE
        so irrelevant results become 'no answer' instead of a hallucination."""
        col = self._collection()
        if col.count() == 0:
            self.index()
            col = self._collection()
        res = col.query(query_embeddings=self._embed([query]), n_results=k or config.TOP_K)
        hits = []
        for doc, meta, dist in zip(res["documents"][0], res["metadatas"][0], res["distances"][0]):
            if dist <= config.MAX_DISTANCE:  # discard unrelated results: prevents guesswork
                hits.append({"source": meta["source"], "section": meta["section"],
                             "text": doc, "distance": round(dist, 3)})
        return hits
