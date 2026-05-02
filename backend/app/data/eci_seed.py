"""Official ECI seed chunks used when the vector store is empty.

These short chunks are not a replacement for full document ingestion. They are
a production safety net so VoteTrue never fabricates answers during a Cloud Run
cold start or an empty ChromaDB deployment.
"""

from typing import TypedDict


class SeedChunk(TypedDict):
    """Shape of a source-backed fallback RAG chunk."""

    text: str
    document_name: str
    page_number: int
    keywords: tuple[str, ...]


ECI_SEED_CHUNKS: tuple[SeedChunk, ...] = (
    {
        "document_name": "ECI Voter Guide - Identification of Electors",
        "page_number": 7,
        "keywords": ("id", "identity", "aadhaar", "epic", "passport", "pan", "driving"),
        "text": (
            "The identity of electors at the polling station is established through "
            "EPIC or alternative photo identity documents prescribed by the Election "
            "Commission. Accepted alternatives include Aadhaar Card, Driving License, "
            "PAN Card, passbook with photograph, Indian Passport, service identity "
            "card, Smart Card under NPR, MNREGA job card, health insurance smart "
            "card, pension document with photograph, official identity card issued "
            "to MPs/MLAs/MLCs, and Unique Disability ID card."
        ),
    },
    {
        "document_name": "ECI Election Instructions - Polling Hours",
        "page_number": 3,
        "keywords": ("polling", "hours", "booth", "close", "closing", "time"),
        "text": (
            "Polling hours are notified for each election by the Election Commission "
            "of India and the Returning Officer. Voters should rely on official ECI "
            "notifications, voter information slips, the Voter Helpline app, or ECI "
            "voter services for the current polling schedule. A forwarded message "
            "claiming a different closing time is unverified unless it matches an "
            "official ECI notification."
        ),
    },
    {
        "document_name": "ECI EVM and VVPAT Factsheet",
        "page_number": 2,
        "keywords": ("evm", "evms", "hack", "hacked", "bluetooth", "wifi", "network"),
        "text": (
            "EVMs used by the Election Commission are stand-alone, non-networked "
            "machines. They have no external network connection through wired or "
            "wireless channels and do not have radio-frequency communication "
            "capability such as Bluetooth or Wi-Fi."
        ),
    },
    {
        "document_name": "ECI Voter Services Guide",
        "page_number": 5,
        "keywords": ("roll", "enrolled", "registration", "name", "booth", "designated"),
        "text": (
            "A voter must be enrolled in the electoral roll for the relevant polling "
            "station. Carrying an identity document alone does not allow a person to "
            "vote if their name is not present on the electoral roll. Voters must vote "
            "at their designated polling station."
        ),
    },
    {
        "document_name": "ECI NOTA and Result Reporting Guidance",
        "page_number": 4,
        "keywords": ("nota", "counted", "recorded", "published", "result"),
        "text": (
            "NOTA votes are officially recorded and published in election results and "
            "statistics. A claim that NOTA is not counted or not recorded is misleading."
        ),
    },
    {
        "document_name": "ECI Model Code of Conduct Manual",
        "page_number": 12,
        "keywords": ("campaign", "candidate", "polling day", "48", "silence"),
        "text": (
            "Section 126 of the Representation of the People Act, 1951 prohibits "
            "election-related public meetings and certain election matter display "
            "during the forty-eight hours ending with the hour fixed for close of "
            "poll. This is commonly understood as the campaign silence period."
        ),
    },
)
