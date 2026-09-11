import { FAQ_ITEMS } from "@/lib/public-content";
import { site } from "@/lib/site";

export function Location() {
  return (
    <section id="visit" className="pub-section pub-visit">
      <div className="pub-wrap pub-visit-grid">
        <div>
          <p className="pub-eyebrow">
            <span className="pub-rule" aria-hidden="true" />
            Visit
          </p>
          <h2 className="pub-h2">Find us in Bhuj.</h2>
          <p className="pub-lede">
            Bhagwati Heritage, near Sanskar Nagar. Come when the club is open —
            until then, the address is here so you know exactly where we are.
          </p>

          <dl className="pub-location-list">
            <div className="pub-location-row">
              <dt className="pub-label">Address</dt>
              <dd>
                <address>
                  {site.address.lines.map((line) => (
                    <span key={line}>
                      {line}
                      <br />
                    </span>
                  ))}
                </address>
              </dd>
            </div>
            <div className="pub-location-row">
              <dt className="pub-label">Email</dt>
              <dd>
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </dd>
            </div>
            <div className="pub-location-row">
              <dt className="pub-label">Instagram</dt>
              <dd>
                <a
                  href={site.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @{site.instagramHandle.toLowerCase()}
                </a>
              </dd>
            </div>
            <div className="pub-location-row">
              <dt className="pub-label">Facebook</dt>
              <dd className="pub-plain">{site.facebookName}</dd>
            </div>
          </dl>

          <a
            href={site.mapsSearchUrl}
            className="pub-btn pub-btn-gold"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in Maps
          </a>
        </div>

        <div className="pub-faq">
          <p className="pub-label">Questions</p>
          {FAQ_ITEMS.map((item) => (
            <details key={item.q} className="pub-faq-item">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
