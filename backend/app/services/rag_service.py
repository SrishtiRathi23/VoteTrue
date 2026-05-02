import asyncio
import hashlib
from typing import Any

from app.config import GEMINI_EMBEDDING_MODEL, get_settings
from app.data.eci_seed import ECI_SEED_CHUNKS
from app.models.response_models import RetrievedChunk
from app.services.vector_store import get_vector_collection
from app.utils.logger import get_logger

settings = get_settings()
logger = get_logger(__name__)

try:
    from google.api_core.exceptions import GoogleAPIError
    import google.generativeai as genai
except ImportError:
    GoogleAPIError = RuntimeError
    genai = None

if settings.gemini_api_key and genai is not None:
    genai.configure(api_key=settings.gemini_api_key)


collection = get_vector_collection()


class RAGService:
    """Dependency-injected retrieval service for ECI document grounding."""

    def __init__(self, vector_collection: Any = collection) -> None:
        """
        Initialize the retrieval service.

        Args:
            vector_collection: ChromaDB-compatible collection implementation.

        Returns:
            None.

        Raises:
            None.
        """
        self.collection = vector_collection

    async def query_documents(
        self,
        query: str,
        n_results: int = 5,
    ) -> list[RetrievedChunk]:
        """
        Retrieve relevant ECI document chunks.

        Args:
            query: User question or extracted claim.
            n_results: Maximum number of chunks to return.

        Returns:
            Relevant ECI document chunks or source-backed seed fallback chunks.

        Raises:
            None.
        """
        return await _query_documents_impl(query, n_results, self.collection)


async def embed_text(text: str) -> list[float]:
    """
    Generates a vector embedding for a text string using Gemini
    text-embedding-004.

    Args:
        text: Text to embed.

    Returns:
        List of floats representing the embedding.

    Raises:
        GoogleAPIError: Propagates Gemini embedding failures after logging.
        RuntimeError: Raised when the local SDK call fails unexpectedly.
    """

    def _embed() -> list[float]:
        """
        Generate the embedding inside a worker thread.

        Args:
            None.

        Returns:
            Gemini embedding values, or a deterministic local surrogate.

        Raises:
            GoogleAPIError: Propagates Gemini embedding failures to the caller.
            RuntimeError: Raised when local embedding generation fails unexpectedly.
        """
        if genai is None or not settings.gemini_api_key:
            digest = hashlib.sha256(text.encode()).digest()
            return [byte / 255 for byte in digest[:16]] + [text.lower()]
        result = genai.embed_content(
            model=GEMINI_EMBEDDING_MODEL,
            content=text,
        )
        embedding = result["embedding"]
        return [float(value) for value in embedding]

    try:
        return await asyncio.to_thread(_embed)
    except (GoogleAPIError, RuntimeError, ValueError, KeyError, TypeError) as exc:
        logger.error("embedding_failed error=%s", str(exc))
        raise


def _metadata_value(metadata: dict[str, Any], *keys: str) -> Any:
    """
    Return the first present metadata value from a list of keys.

    Args:
        metadata: Metadata mapping from ChromaDB or local fallback storage.
        *keys: Candidate metadata keys in preferred order.

    Returns:
        First matching metadata value, or None.

    Raises:
        None.
    """
    for key in keys:
        if key in metadata:
            return metadata[key]
    return None


def _query_terms(text: str) -> set[str]:
    """
    Normalize user text into simple retrieval terms.

    Args:
        text: User query or extracted claim.

    Returns:
        Lowercase retrieval terms with selected synonyms.

    Raises:
        None.
    """
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
    """
    Return source-backed seed chunks when vector retrieval is unavailable.

    Args:
        query: User query or extracted claim.
        n_results: Maximum number of chunks to return.

    Returns:
        RetrievedChunk objects sourced from built-in ECI seed content.

    Raises:
        None.
    """
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


async def _query_documents_impl(
    query: str,
    n_results: int = 5,
    vector_collection: Any = collection,
) -> list[RetrievedChunk]:
    """
    Retrieves the top-n most relevant ECI document chunks for a given query using
    cosine similarity search.

    Args:
        query: The question or claim to search for.
        n_results: Number of chunks to retrieve.

    Returns:
        Relevant ECI document chunks. Dependency failures return matching
        built-in ECI seed chunks where keywords support a grounded fallback.

    Raises:
        None.
    """
    try:
        query_embedding = await embed_text(query)

        results = await asyncio.to_thread(
            vector_collection.query,
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

    except (
        asyncio.TimeoutError,
        GoogleAPIError,
        RuntimeError,
        OSError,
        ValueError,
        TypeError,
        KeyError,
    ) as exc:
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

    Returns:
        None.

    Raises:
        Exception: Propagates embedding or collection write failures to the
            ingestion caller.
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
