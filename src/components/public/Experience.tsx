import { EXPERIENCE_STEPS } from "@/lib/public-content";
import { SectionHeader } from "./SectionHeader";

export function Experience() {
  return (
    <section id="experience" className="pub-section">
      <div className="pub-wrap">
        <SectionHeader
          index="02"
          eyebrow="The experience"
          title="A structured way to train."
          body="This is the standard we are building toward — a serious fitness environment, not a promise that every visitor receives a packaged programme on day one."
        />
        <ol className="pub-steps">
          {EXPERIENCE_STEPS.map((step, i) => (
            <li key={step.title} className="pub-step">
              <span className="pub-step-num">{String(i + 1).padStart(2, "0")}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
