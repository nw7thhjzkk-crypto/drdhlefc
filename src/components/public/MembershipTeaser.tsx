import { SectionHeader } from "./SectionHeader";

export function MembershipTeaser() {
  return (
    <section id="memberships" className="pub-section pub-membership">
      <div className="pub-wrap pub-membership-inner">
        <SectionHeader
          index="05"
          eyebrow="Memberships"
          title="Details are coming soon."
          body="We will not publish prices, package names, or invented benefits before they are set. Register your interest and we will contact you when memberships open."
          align="center"
        />
        <a href="#access" className="pub-btn pub-btn-gold pub-btn-lg">
          Get Early Access
        </a>
      </div>
    </section>
  );
}
