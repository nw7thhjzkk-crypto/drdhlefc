"use client";

import { useId, useState } from "react";
import { SectionHeader } from "./SectionHeader";
import { site } from "@/lib/site";

const ITEMS = [
  {
    q: "What is Dr DHL Elite Fitness Club?",
    a: "A premium fitness club in Bhuj, Gujarat. We are preparing a focused training environment for strength, conditioning, and personal guidance.",
  },
  {
    q: "Where is the gym located?",
    a: `${site.address.lines.join(", ")}.`,
  },
  {
    q: "How can I register my interest?",
    a: "Use Get Early Access on this website. That sends your details to our team as an enquiry — it does not create a membership or an account.",
  },
  {
    q: "When will membership details be available?",
    a: "Soon. Prices, packages, and benefits have not been published yet. We will contact people who register interest when they are ready.",
  },
  {
    q: "When does the club open?",
    a: "The club is coming soon. An opening date has not been announced.",
  },
  {
    q: "How can I contact the gym?",
    a: `Email ${site.email}. You can also follow ${site.instagramHandle} on Instagram.`,
  },
  {
    q: "Can I follow the gym on Instagram?",
    a: `Yes — ${site.instagramHandle} at instagram.com/drdhlefc.`,
  },
];

export function FAQ() {
  return (
    <section id="faq" className="pub-section">
      <div className="pub-wrap pub-faq-grid">
        <SectionHeader
          index="08"
          eyebrow="Questions"
          title="Straightforward answers."
        />
        <div className="pub-faq-list">
          {ITEMS.map((item) => (
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
          {question}
          <span aria-hidden="true">{open ? "–" : "+"}</span>
        </button>
      </h3>
      <div id={panelId} hidden={!open}>
        <p>{answer}</p>
      </div>
    </div>
  );
}
