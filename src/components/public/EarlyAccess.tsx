import { LeadForm } from "./LeadForm";
import { SectionHeader } from "./SectionHeader";

export function EarlyAccess() {
  return (
    <section id="access" className="pub-section pub-access">
      <div className="pub-wrap pub-access-grid">
        <SectionHeader
          index="10"
          eyebrow="Get Early Access"
          title="Register your interest."
          body="Tell us who you are and how you want to train. We will follow up. This is not a membership, a trial booking, or an account."
        />
        <LeadForm />
      </div>
    </section>
  );
}
