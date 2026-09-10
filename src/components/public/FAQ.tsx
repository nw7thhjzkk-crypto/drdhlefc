"use client";

import { useId, useState } from "react";
import { SectionHeader } from "./SectionHeader";
import { FAQ_ITEMS } from "@/lib/public-content";

export function FAQ() {
  return (
    <section id="faq" className="pub-section">
      <div className="pub-wrap pub-faq-grid">
        <SectionHeader
          index="10"
          eyebrow="Questions"
          title="Straightforward answers."
        />
        <div className="pub-faq-list">
          {FAQ_ITEMS.map((item) => (
            <FaqItem key={item.q} question={item.q} answer={item.a} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className={`pub-faq-item${open ? " is-open" : ""}`}>
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          <span>{question}</span>
          <span className="pub-faq-icon" aria-hidden="true">
            <svg
              viewBox="0 0 16 16"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path className="pub-faq-icon-v" d="M8 3v10" />
              <path d="M3 8h10" />
            </svg>
          </span>
        </button>
      </h3>
      <div id={panelId} hidden={!open}>
        <p>{answer}</p>
      </div>
    </div>
  );
}
