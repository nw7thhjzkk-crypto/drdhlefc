import { SectionHeader } from "./SectionHeader";
import { site } from "@/lib/site";

export function Location() {
  return (
    <section id="visit" className="pub-section pub-location">
      <div className="pub-wrap pub-location-grid">
        <SectionHeader
          index="11"
          eyebrow="Location"
          title="Find us in Bhuj."
          body="Bhagwati Heritage, near Sanskar Nagar. Come when the club is open — until then, the address is here so you know exactly where we are."
        />
        <div className="pub-location-card">
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
      </div>
    </section>
  );
}
