import { MEMBERSHIP_PILLARS } from "@/lib/public-content";
import { SectionHeader } from "./SectionHeader";
import { site } from "@/lib/site";

export function Membership() {
  return (
    <section id="memberships" className="pub-section pub-membership">
      <div className="pub-wrap pub-membership-grid">
        <div>
          <SectionHeader
            index="05"
            eyebrow="Memberships"
            title="Built around one clear commitment."
            body="We will not publish prices, package names, or invented benefits before they are set. When memberships open, details will be shared here and with everyone who has registered interest."
          />
          <ul className="pub-membership-pillars">
            {MEMBERSHIP_PILLARS.map((item) => (
              <li key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </li>
            ))}
          </ul>
        </div>

        <aside className="pub-membership-panel" aria-label="Membership pricing status">
          <p className="pub-kicker">{site.launchText}</p>
          <h3>Plans &amp; pricing</h3>
          <p>
            Packages and prices are still being finalised. Register your
            interest and we will contact you the moment memberships open — no
            obligation, just first word.
          </p>
          <a href="#access" className="pub-btn pub-btn-gold pub-btn-lg">
            Get Early Access
          </a>
          <p className="pub-membership-note">
            Not a membership, a trial booking, or an account.
          </p>
        </aside>
      </div>
    </section>
  );
}
