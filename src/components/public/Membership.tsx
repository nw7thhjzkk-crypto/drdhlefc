import { MEMBERSHIP_PILLARS } from "@/lib/public-content";

export function Membership() {
  return (
    <section id="memberships" className="pub-section pub-membership">
      <div className="pub-wrap pub-membership-split">
        <div>
          <p className="pub-eyebrow">
            <span className="pub-rule" aria-hidden="true" />
            Membership
          </p>
          <h2 className="pub-h2">Built around one clear commitment.</h2>
          <p className="pub-lede">
            Prices, package names, and benefits will be published together when
            they are set. When memberships open, details will be shared here —
            and first with everyone who has registered interest.
          </p>
          <ul className="pub-membership-lines">
            {MEMBERSHIP_PILLARS.map((item) => (
              <li key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </li>
            ))}
          </ul>
        </div>

        <aside className="pub-membership-panel" aria-label="Membership pricing status">
          <p className="pub-kicker">Pre-launch</p>
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
