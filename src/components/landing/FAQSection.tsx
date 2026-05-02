"use client";

import { useState } from "react";
import SourceChip from "@/components/ui/SourceChip";

const faqs = [
  {
    question: "What ID documents can I use to vote?",
    answer:
      "You can use any of 12 approved photo IDs including Voter ID card, Aadhaar, Passport, Driving License, PAN card, and more as notified by the ECI.",
    source: "ECI Voter Guide 2024, Page 7",
  },
  {
    question: "What is the last date to register as a voter?",
    answer:
      "The last date varies by election. Typically it is 30 days before the polling date. Check the ECI website for the current election schedule.",
    source: "ECI Notification 464/INST/2024",
  },
  {
    question: "Are EVMs reliable and tamper-proof?",
    answer:
      "Yes. EVMs are standalone devices with no network connectivity. They are manufactured by ECIL and BEL under strict government oversight.",
    source: "ECI EVM Factsheet 2024",
  },
  {
    question: "How do I find my polling booth?",
    answer:
      "Visit electoralsearch.eci.gov.in or use the VoterHelpline app. You can search by name, EPIC number, or mobile number.",
    source: "ECI Voter Services Portal",
  },
  {
    question: "How long does the ink mark last?",
    answer:
      "The indelible ink mark lasts for 3-5 days. It is applied to the left index finger to prevent double voting.",
    source: "ECI Voter Guide 2024, Page 12",
  },
  {
    question: "What is VVPAT and how does it work?",
    answer:
      "VVPAT (Voter Verifiable Paper Audit Trail) prints a slip showing your vote for 7 seconds after you press the EVM button, allowing you to verify your choice.",
    source: "ECI VVPAT Guidelines 2024",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="section" style={{ background: "#FFFFFF" }}>
      <div className="container">
        <p className="section-label">FREQUENTLY ASKED QUESTIONS</p>
        <h2
          style={{
            color: "#0D0D0D",
            fontSize: 36,
            fontWeight: 600,
            marginTop: 12,
            maxWidth: 720,
          }}
        >
          Frequently asked questions
        </h2>

        <div style={{ marginTop: 48 }}>
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={faq.question}
                style={{
                  borderTop: "1px solid #E8E8E4",
                  borderBottom: index === faqs.length - 1 ? "1px solid #E8E8E4" : 0,
                }}
              >
                <button
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  type="button"
                  style={{
                    alignItems: "center",
                    background: "transparent",
                    border: 0,
                    color: "#0D0D0D",
                    cursor: "pointer",
                    display: "flex",
                    fontSize: 16,
                    fontWeight: 500,
                    justifyContent: "space-between",
                    padding: "20px 0",
                    textAlign: "left",
                    width: "100%",
                  }}
                >
                  {faq.question}
                  <span aria-hidden="true" style={{ color: "#6B6B6B", fontSize: 20 }}>
                    {isOpen ? "−" : "+"}
                  </span>
                </button>

                {isOpen ? (
                  <div style={{ paddingBottom: 16, paddingTop: 12 }}>
                    <p style={{ color: "#6B6B6B", fontSize: 14, lineHeight: 1.7 }}>{faq.answer}</p>
                    <div style={{ marginTop: 12 }}>
                      <SourceChip text={faq.source} />
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
