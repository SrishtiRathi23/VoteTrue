import pytest


@pytest.mark.asyncio
async def test_query_returns_empty_list_on_failure(monkeypatch: pytest.MonkeyPatch) -> None:
    """RAG must return empty list on failure, never raise to caller."""
    from app.services import rag_service

    async def fail_embed(_: str) -> list[float]:
        raise Exception("API down")

    monkeypatch.setattr(rag_service, "embed_text", fail_embed)
    result = await rag_service.query_documents("test query")
    assert result == []


@pytest.mark.asyncio
async def test_query_filters_low_relevance_chunks(monkeypatch: pytest.MonkeyPatch) -> None:
    """RAG must filter out chunks with cosine distance above 0.7."""
    from app.services import rag_service

    async def fake_embed(_: str) -> list[float]:
        return [0.1, 0.2, 0.3]

    def fake_query(**_: object) -> dict[str, list[list[object]]]:
        return {
            "documents": [["relevant chunk", "irrelevant chunk"]],
            "distances": [[0.2, 0.9]],
            "metadatas": [[{"document_name": "ECI Doc", "page_number": 2}, {}]],
        }

    monkeypatch.setattr(rag_service, "embed_text", fake_embed)
    monkeypatch.setattr(rag_service.collection, "query", fake_query)

    result = await rag_service.query_documents("polling hours")
    assert len(result) == 1
    assert result[0].text == "relevant chunk"
    assert result[0].document_name == "ECI Doc"


@pytest.mark.asyncio
async def test_query_uses_seed_corpus_when_collection_is_empty(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """RAG must stay source-backed when production ChromaDB starts empty."""
    from app.services import rag_service

    async def fake_embed(_: str) -> list[float]:
        return [0.1, 0.2, 0.3]

    def empty_query(**_: object) -> dict[str, list[list[object]]]:
        return {"documents": [[]], "distances": [[]], "metadatas": [[]]}

    monkeypatch.setattr(rag_service, "embed_text", fake_embed)
    monkeypatch.setattr(rag_service.collection, "query", empty_query)

    result = await rag_service.query_documents("What ID can I use to vote?")

    assert result
    assert result[0].document_name.startswith("ECI")
    assert 0.0 < result[0].similarity <= 0.78


@pytest.mark.asyncio
async def test_add_document_chunk_calls_collection(monkeypatch: pytest.MonkeyPatch) -> None:
    """Ingestion helper must add embedded chunks to ChromaDB."""
    from app.services import rag_service

    calls: dict[str, object] = {}

    async def fake_embed(_: str) -> list[float]:
        return [0.4, 0.5]

    def fake_upsert(**kwargs: object) -> None:
        calls.update(kwargs)

    monkeypatch.setattr(rag_service, "embed_text", fake_embed)
    # add_document_chunk prefers .upsert when available; monkeypatch both
    monkeypatch.setattr(rag_service.collection, "upsert", fake_upsert, raising=False)
    monkeypatch.setattr(rag_service.collection, "add", fake_upsert, raising=False)

    await rag_service.add_document_chunk("id-1", "chunk text", {"document_name": "Doc"})

    assert calls["ids"] == ["id-1"]
    assert calls["documents"] == ["chunk text"]
