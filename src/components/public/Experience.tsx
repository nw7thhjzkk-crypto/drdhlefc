import { SectionHeader } from "./SectionHeader";

const STEPS = [
  { title: "Assessment", body: "Understand where you are before the work begins." },
  { title: "Goal", body: "Set a direction that is specific enough to train toward." },
  { title: "Training", body: "Show up to structured sessions in a focused room." },
  { title: "Progress", body: "Measure what changed — not just how it felt." },
  { title: "Adjustment", body: "Refine the plan when the body and the data ask for it." },
  { title: "Results", body: "Keep the work honest. Keep the standard high." },
];

export function Experience() {
  return (
    <section id="experience" className="pub-section pub-experience">
      <div className="pub-wrap">
        <SectionHeader
          index="02"
          eyebrow="The experience"
          title="A structured way to train."
          body="This is the standard we are building toward — a serious fitness environment, not a promise that every visitor receives a packaged programme on day one."
        />
        <ol className="pub-steps">
          {STEPS.map((step, i) => (
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
