"""ECI document ingestion pipeline for VoteTrue.

The pipeline reads official Election Commission of India source files from
`scripts/eci_docs/`, extracts text from PDF or TXT files, chunks content into
overlapping 400-token segments, generates Gemini `text-embedding-004`
embeddings through the RAG service, and upserts chunks into the
`eci_documents` ChromaDB collection. When ChromaDB or Gemini are unavailable in
local development, the RAG service uses deterministic fail-closed fallbacks so
the ingestion and API flow can still be verified without fabricating answers.
"""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.services import rag_service

DOCS_DIR = Path(__file__).resolve().parent / "eci_docs"
CHUNK_SIZE = 400
CHUNK_OVERLAP = 50


@dataclass(frozen=True)
class DocumentChunk:
    """A chunk of official ECI source text ready for vector storage."""

    chunk_id: str
    text: str
    metadata: dict[str, str | int | None]


def read_txt(path: Path) -> list[tuple[int | None, str]]:
    """Reads a plain text source file."""
    return [(None, path.read_text(encoding="utf-8"))]


def read_pdf(path: Path) -> list[tuple[int | None, str]]:
    """Reads text from a PDF using pypdf if it is installed."""
    try:
        from pypdf import PdfReader
    except ImportError as exc:
        raise RuntimeError("Install pypdf to ingest PDF files") from exc

    reader = PdfReader(str(path))
    pages = []
    for index, page in enumerate(reader.pages, start=1):
        pages.append((index, page.extract_text() or ""))
    return pages


def read_document(path: Path) -> list[tuple[int | None, str]]:
    """Reads a supported document file and returns page text pairs."""
    if path.suffix.lower() == ".txt":
        return read_txt(path)
    if path.suffix.lower() == ".pdf":
        return read_pdf(path)
    return []


def detect_section(text: str) -> str | None:
    """Detects a likely section heading from chunk text."""
    for line in text.splitlines():
        cleaned = line.strip()
        if 6 <= len(cleaned) <= 90 and cleaned.upper() == cleaned:
            return cleaned
    return None


def token_chunks(words: list[str]) -> Iterable[list[str]]:
    """Yields overlapping token windows."""
    step = CHUNK_SIZE - CHUNK_OVERLAP
    for start in range(0, len(words), step):
        yield words[start : start + CHUNK_SIZE]


def chunk_page(path: Path, page_number: int | None, text: str) -> list[DocumentChunk]:
    """Converts one document page into stable chunks."""
    words = strip_source_boilerplate(text).split()
    chunks = []
    for index, chunk_words in enumerate(token_chunks(words)):
        chunk_text = " ".join(chunk_words).strip()
        if len(chunk_text) < 40:
            continue
        chunk_id = stable_chunk_id(path.name, page_number, index, chunk_text)
        chunks.append(
            DocumentChunk(
                chunk_id=chunk_id,
                text=chunk_text,
                metadata={
                    "document_name": path.stem,
                    "page_number": page_number,
                    "section": detect_section(chunk_text),
                    "source_file": path.name,
                },
            )
        )
    return chunks


def strip_source_boilerplate(text: str) -> str:
    """Removes source URL headers before chunking retrieval content."""
    lines = [
        line
        for line in text.splitlines()
        if not line.startswith("Source:") and not line.startswith("Official URL:")
    ]
    return "\n".join(lines)


def stable_chunk_id(
    document_name: str,
    page_number: int | None,
    chunk_index: int,
    text: str,
) -> str:
    """Creates an idempotent chunk id."""
    raw = f"{document_name}:{page_number}:{chunk_index}:{text[:80]}"
    return hashlib.md5(raw.encode()).hexdigest()


def discover_sources() -> list[Path]:
    """Returns all supported source files in the ECI docs directory."""
    if not DOCS_DIR.exists():
        return []
    return sorted(
        path for path in DOCS_DIR.iterdir() if path.suffix.lower() in {".pdf", ".txt"}
    )


def build_chunks(path: Path) -> list[DocumentChunk]:
    """Reads and chunks one source document."""
    chunks: list[DocumentChunk] = []
    for page_number, page_text in read_document(path):
        chunks.extend(chunk_page(path, page_number, page_text))
    return chunks


async def ingest_chunks(chunks: list[DocumentChunk], dry_run: bool) -> None:
    """Writes chunks to the vector store unless dry-run is enabled."""
    if dry_run:
        return
    if chunks and hasattr(rag_service.collection, "delete_source"):
        rag_service.collection.delete_source(str(chunks[0].metadata["source_file"]))
    for chunk in chunks:
        await rag_service.add_document_chunk(
            chunk.chunk_id,
            chunk.text,
            chunk.metadata,
        )


def collection_count() -> int:
    """Returns the current collection count when supported."""
    if hasattr(rag_service.collection, "count"):
        return int(rag_service.collection.count())
    return -1


async def verify_queries() -> bool:
    """Runs smoke-test queries and prints top retrieved chunks."""
    queries = [
        "What ID can I use to vote?",
        "What are the polling booth hours?",
        "Can EVMs be hacked?",
    ]
    all_passed = True
    for query in queries:
        chunks = await rag_service.RAGService().query_documents(query, n_results=1)
        if not chunks or chunks[0].similarity < 0.3:
            all_passed = False
            print(f"VERIFY FAIL: {query}")
            continue
        preview = re.sub(r"\s+", " ", chunks[0].text[:180])
        print(f"VERIFY OK: {query} -> {chunks[0].document_name}: {preview}")
    return all_passed


async def main() -> None:
    """CLI entrypoint for ECI document ingestion."""
    parser = argparse.ArgumentParser(description="Ingest ECI documents into ChromaDB")
    parser.add_argument("--dry-run", action="store_true", help="Process without writing")
    args = parser.parse_args()

    sources = discover_sources()
    if not sources:
        raise SystemExit(f"No PDF or TXT files found in {DOCS_DIR}")

    total = 0
    for source in sources:
        chunks = build_chunks(source)
        await ingest_chunks(chunks, args.dry_run)
        total += len(chunks)
        print(f"{source.name}: {len(chunks)} chunks")

    print(f"Total chunks processed: {total}")
    if not args.dry_run:
        print(f"Collection count: {collection_count()}")
        if not await verify_queries():
            raise SystemExit("Verification queries failed")


if __name__ == "__main__":
    asyncio.run(main())
