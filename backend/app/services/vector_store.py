import json
from pathlib import Path
from typing import Any

from app.utils.logger import get_logger

logger = get_logger(__name__)
CHROMA_PATH = Path(__file__).resolve().parents[2] / "chroma_db"


class LocalCollection:
    """Tiny ChromaDB-compatible fallback used when ChromaDB is unavailable."""

    def __init__(self, path: Path) -> None:
        """
        Initialize local collection storage.

        Args:
            path: JSON file path used for persisted fallback rows.

        Returns:
            None.

        Raises:
            None.
        """
        self._path = path
        self._rows: list[dict[str, Any]] = []
        self._load()

    def _load(self) -> None:
        """
        Load persisted local rows from disk.

        Args:
            None.

        Returns:
            None.

        Raises:
            None. Invalid local data is logged and ignored.
        """
        if not self._path.exists():
            return
        try:
            self._rows = json.loads(self._path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError, TypeError, ValueError) as exc:
            logger.warning("local_collection_load_failed error=%s", str(exc))
            self._rows = []

    def _save(self) -> None:
        """
        Persist local rows to disk.

        Args:
            None.

        Returns:
            None.

        Raises:
            OSError: If the local fallback file cannot be written.
        """
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._path.write_text(json.dumps(self._rows, indent=2), encoding="utf-8")

    def add(
        self,
        ids: list[str],
        embeddings: list[list[float]],
        documents: list[str],
        metadatas: list[dict[str, Any]],
    ) -> None:
        """
        Append rows to the local collection.

        Args:
            ids: Unique row identifiers.
            embeddings: Embedding vectors or deterministic local surrogates.
            documents: Source document chunk text.
            metadatas: Per-chunk source metadata.

        Returns:
            None.

        Raises:
            OSError: If rows cannot be persisted.
        """
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
        """
        Add or replace rows by identifier.

        Args:
            ids: Unique row identifiers.
            embeddings: Embedding vectors or deterministic local surrogates.
            documents: Source document chunk text.
            metadatas: Per-chunk source metadata.

        Returns:
            None.

        Raises:
            OSError: If rows cannot be persisted.
        """
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
        """
        Return total stored chunks.

        Args:
            None.

        Returns:
            Number of rows currently stored.

        Raises:
            None.
        """
        self._load()
        return len(self._rows)

    def delete_source(self, source_file: str) -> None:
        """
        Delete rows for a source file before idempotent re-ingestion.

        Args:
            source_file: Source file name to remove from metadata.

        Returns:
            None.

        Raises:
            OSError: If rows cannot be persisted after deletion.
        """
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
        """
        Query local rows with a ChromaDB-compatible response shape.

        Args:
            query_embeddings: Query embedding list. The local fallback stores the
                normalized query text in the final slot.
            n_results: Maximum number of rows to return.
            include: ChromaDB include fields; accepted for API compatibility.

        Returns:
            Dict containing documents, metadatas, and distances.

        Raises:
            None.
        """
        self._load()
        rows = self._rank_rows(query_embeddings[0])[:n_results]
        return {
            "documents": [[row["document"] for row in rows]],
            "metadatas": [[row["metadata"] for row in rows]],
            "distances": [[row["distance"] for row in rows]],
        }

    def _rank_rows(self, query_embedding: list[Any]) -> list[dict[str, Any]]:
        """
        Rank rows using word overlap when ChromaDB is unavailable.

        Args:
            query_embedding: Local embedding surrogate with query text appended.

        Returns:
            Rows sorted by ascending distance.

        Raises:
            None.
        """
        stopwords = {"what", "can", "i", "to", "the", "are", "is", "be", "a", "an"}
        query_terms = (
            self._terms(str(query_embedding[-1])) - stopwords
            if query_embedding
            else set()
        )
        ranked = []
        for row in self._rows:
            text_terms = self._terms(str(row["document"])) - stopwords
            overlap = len(query_terms & text_terms)
            distance = 0.2 if overlap else 0.65
            ranked.append(
                {**row, "distance": max(0.05, distance - min(overlap, 10) * 0.01)}
            )
        return sorted(ranked, key=lambda row: row["distance"])

    def _terms(self, text: str) -> set[str]:
        """
        Normalize text into searchable terms with common election synonyms.

        Args:
            text: Raw text to tokenize.

        Returns:
            Search terms expanded with election-domain synonyms.

        Raises:
            None.
        """
        terms = set(text.lower().replace("?", " ").replace(".", " ").split())
        if "id" in terms:
            terms.update({"identity", "identification", "documents", "document"})
        if "evms" in terms or "evm" in terms:
            terms.update({"evm", "evms", "hack", "hacked", "networked"})
        if "hours" in terms or "booth" in terms:
            terms.update({"polling", "poll", "schedule", "hours"})
        return terms


def get_vector_collection() -> Any:
    """
    Build the configured vector collection.

    Args:
        None.

    Returns:
        ChromaDB collection when available, otherwise LocalCollection.

    Raises:
        None. ChromaDB startup failures are logged and use the local fallback.
    """
    try:
        import chromadb

        chroma_client = chromadb.PersistentClient(path=str(CHROMA_PATH))
        return chroma_client.get_or_create_collection(
            name="eci_documents",
            metadata={"hnsw:space": "cosine"},
        )
    except (ImportError, AttributeError, RuntimeError, OSError, ValueError) as exc:
        logger.warning("chromadb_unavailable_using_local_collection error=%s", str(exc))
        return LocalCollection(CHROMA_PATH / "local_collection.json")
