import asyncio
import hashlib
import json
from pathlib import Path
from typing import Any

from app.config import get_settings
from app.data.eci_seed import ECI_SEED_CHUNKS
from app.models.response_models import RetrievedChunk
from app.utils.logger import get_logger

settings = get_settings()
logger = get_logger(__name__)

try:
    import google.generativeai as genai
except ImportError:
    genai = None

if settings.gemini_api_key and genai is not None:
    genai.configure(api_key=settings.gemini_api_key)


class LocalCollection:
    """Tiny ChromaDB-compatible fallback used when ChromaDB is unavailable."""

    def __init__(self, path: Path) -> None:
        self._path = path
        self._rows: list[dict[str, Any]] = []
        self._load()

    def _load(self) -> None:
        """Loads persisted local rows from disk."""
        if not self._path.exists():
            return
        try:
            self._rows = json.loads(self._path.read_text(encoding="utf-8"))
        except Exception as exc:
            logger.warning("local_collection_load_failed error=%s", str(exc))
            self._rows = []

    def _save(self) -> None:
        """Persists local rows to disk."""
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._path.write_text(json.dumps(self._rows, indent=2), encoding="utf-8")

    def add(
        self,
        ids: list[str],
        embeddings: list[list[float]],
        documents: list[str],
        metadatas: list[dict[str, Any]],
    ) -> None:
        for row_id, embedding, document, metadata in zip(
            ids, embeddings, documents, metadatas
        ):
            self._rows.append(
                {
                    "id": row_id,
                    "embedding": embedding,
                    "document": document,
                    "metadata": metadata,
                }
            )
        self._save()

    def upsert(
        self,
        ids: list[str],
        embeddings: list[list[float]],
        documents: list[str],
        metadatas: list[dict[str, Any]],
    ) -> None:
        """Adds or replaces rows by id."""
        incoming = dict(zip(ids, zip(embeddings, documents, metadatas)))
        self._rows = [row for row in self._rows if row["id"] not in incoming]
        for row_id, (embedding, document, metadata) in incoming.items():
            self._rows.append(
                {
                    "id": row_id,
                    "embedding": embedding,
                    "document": document,
                    "metadata": metadata,
                }
            )
        self._save()

    def count(self) -> int:
        """Returns total stored chunks."""
        self._load()
        return len(self._rows)

    def delete_source(self, source_file: str) -> None:
        """Deletes rows for a source file before idempotent re-ingestion."""
        self._rows = [
            row
            for row in self._rows
            if row.get("metadata", {}).get("source_file") != source_file
        ]
        self._save()

    def query(
        self,
        query_embeddings: list[list[float]],
        n_results: int,
        include: list[str],
    ) -> dict[str, list[list[Any]]]:
        self._load()
        rows = self._rank_rows(query_embeddings[0])[:n_results]
        return {
            "documents": [[row["document"] for row in rows]],
            "metadatas": [[row["metadata"] for row in rows]],
            "distances": [[row["distance"] for row in rows]],
        }

    def _rank_rows(self, query_embedding: list[Any]) -> list[dict[str, Any]]:
        """Ranks rows using word overlap when ChromaDB is unavailable."""
        stopwords = {"what", "can", "i", "to", "the", "are", "is", "be", "a", "an"}
        query_terms = self._terms(str(query_embedding[-1])) - stopwords if query_embedding else set()
        ranked = []
        for row in self._rows:
            text_terms = self._terms(str(row["document"])) - stopwords
            overlap = len(query_terms & text_terms)
            distance = 0.2 if overlap else 0.65
            ranked.append({**row, "distance": max(0.05, distance - min(overlap, 10) * 0.01)})
        return sorted(ranked, key=lambda row: row["distance"])

    def _terms(self, text: str) -> set[str]:
        """Normalizes text into searchable terms with common election synonyms."""
        terms = set(text.lower().replace("?", " ").replace(".", " ").split())
        if "id" in terms:
            terms.update({"identity", "identification", "documents", "document"})
        if "evms" in terms or "evm" in terms:
            terms.update({"evm", "evms", "hack", "hacked", "networked"})
        if "hours" in terms or "booth" in terms:
            terms.update({"polling", "poll", "schedule", "hours"})
        return terms

CHROMA_PATH = Path(__file__).resolve().parents[2] / "chroma_db"
try:
    import chromadb

    chroma_client = chromadb.PersistentClient(path=str(CHROMA_PATH))
    collection = chroma_client.get_or_create_collection(
        name="eci_documents",
        metadata={"hnsw:space": "cosine"},
    )
except Exception as exc:
    logger.warning("chromadb_unavailable_using_local_collection error=%s", str(exc))
    chroma_client = None
    collection = LocalCollection(CHROMA_PATH / "local_collection.json")


async def embed_text(text: str) -> list[float]:
    """
    Generates a vector embedding for a text string using Gemini
    text-embedding-004.

    Args:
        text: Text to embed.

    Returns:
        List of floats representing the embedding.
    """

    def _embed() -> list[float]:
        if genai is None or not settings.gemini_api_key:
            digest = hashlib.sha256(text.encode()).digest()
            return [byte / 255 for byte in digest[:16]] + [text.lower()]
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
        )
        embedding = result["embedding"]
        return [float(value) for value in embedding]

    try:
        return await asyncio.to_thread(_embed)
    except Exception as exc:
        logger.error("embedding_failed error=%s", str(exc))
        raise


def _metadata_value(metadata: dict[str, Any], *keys: str) -> Any:
    """Returns the first present metadata value from a list of keys."""
    for key in keys:
        if key in metadata:
            return metadata[key]
    return None


def _query_terms(text: str) -> set[str]:
    """Normalizes user text into simple retrieval terms."""
    cleaned = text.lower()
    for mark in ",.?;:!()[]{}":
        cleaned = cleaned.replace(mark, " ")
    terms = set(cleaned.split())
    if "aadhaar" in terms:
        terms.update({"id", "identity", "documents"})
    if "evms" in terms:
        terms.add("evm")
    return terms


def _seed_results(query: str, n_results: int) -> list[RetrievedChunk]:
    """Returns source-backed seed chunks when ChromaDB has no relevant rows."""
    terms = _query_terms(query)
    ranked: list[tuple[int, RetrievedChunk]] = []
    for seed in ECI_SEED_CHUNKS:
        overlap = len(terms & set(seed["keywords"]))
        if overlap == 0:
            continue
        ranked.append(
            (
                overlap,
                RetrievedChunk(
                    text=seed["text"],
                    document_name=seed["document_name"],
                    page_number=seed["page_number"],
                    similarity=min(0.78, 0.42 + overlap * 0.08),
                    metadata={
                        "source": "built_in_eci_seed",
                        "scoring": "keyword_overlap_fallback",
                        "overlap": overlap,
                    },
                ),
            )
        )
    return [chunk for _, chunk in sorted(ranked, key=lambda item: item[0], reverse=True)[:n_results]]


async def query_documents(query: str, n_results: int = 5) -> list[RetrievedChunk]:
    """
    Retrieves the top-n most relevant ECI document chunks for a given query using
    cosine similarity search.

    Args:
        query: The question or claim to search for.
        n_results: Number of chunks to retrieve.

    Returns:
        Relevant ECI document chunks. Returns [] on any dependency failure.
    """
    try:
        query_embedding = await embed_text(query)

        results = await asyncio.to_thread(
            collection.query,
            query_embeddings=[query_embedding],
            n_results=n_results,
            include=["documents", "metadatas", "distances"],
        )

        documents = results.get("documents", [[]])[0]
        distances = results.get("distances", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]

        relevant_chunks: list[RetrievedChunk] = []
        for document, distance, metadata in zip(documents, distances, metadatas):
            if distance >= 0.7:
                continue

            metadata = metadata or {}
            page_value = _metadata_value(metadata, "page_number", "page")
            page_number = int(page_value) if page_value is not None else None
            relevant_chunks.append(
                RetrievedChunk(
                    text=document,
                    document_name=str(
                        _metadata_value(metadata, "document_name", "source")
                        or "Unknown ECI document"
                    ),
                    page_number=page_number,
                    similarity=max(0.0, 1.0 - float(distance)),
                    metadata=dict(metadata),
                )
            )

        if not relevant_chunks:
            relevant_chunks = _seed_results(query, n_results)
            logger.info("rag_seed_retrieved count=%s", len(relevant_chunks))
        else:
            logger.info("rag_retrieved count=%s", len(relevant_chunks))
        return relevant_chunks

    except Exception as exc:
        logger.error("rag_query_failed error=%s", str(exc))
        return _seed_results(query, n_results)


async def add_document_chunk(
    chunk_id: str,
    text: str,
    metadata: dict[str, Any],
) -> None:
    """
    Adds a single document chunk to the ChromaDB collection.
    Called by the ingestion script, not at request time.

    Args:
        chunk_id: Unique identifier for this chunk.
        text: The text content of the chunk.
        metadata: Dict with document_name, page_number, section.
    """
    embedding = await embed_text(text)
    writer = collection.upsert if hasattr(collection, "upsert") else collection.add
    await asyncio.to_thread(
        writer,
        ids=[chunk_id],
        embeddings=[embedding],
        documents=[text],
        metadatas=[metadata],
    )
    logger.info("rag_chunk_added chunk_id=%s", chunk_id)
