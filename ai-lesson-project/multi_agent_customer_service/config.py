"""
Bu dosyada projede kullanılacak LLM ve embedding modelleri tanımlanır.
"""

from langchain_ollama import ChatOllama, OllamaEmbeddings

LLM_MODEL = "gemma4:31b"
EMBEDDING_MODEL = "nomic-embed-text:latest"

llm = ChatOllama(model=LLM_MODEL, temperature=0)
embeddings = OllamaEmbeddings(model=EMBEDDING_MODEL)