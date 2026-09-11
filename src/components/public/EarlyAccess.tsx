import { LeadForm } from "./LeadForm";

export function EarlyAccess() {
  return (
    <section id="access" className="pub-section pub-access">
      <div className="pub-wrap pub-access-grid">
        <div>
          <p className="pub-eyebrow">
            <span className="pub-rule" aria-hidden="true" />
            Early Access
          </p>
          <h2 className="pub-h2">Register your interest.</h2>
          <p className="pub-lede">
            Tell us who you are and how you want to train. We will follow up.
            This is not a membership, a trial booking, or an account.
          </p>
        </div>
        <LeadForm />
      </div>
    </section>
  );
}
