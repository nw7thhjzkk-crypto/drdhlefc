import { SectionHeader } from "./SectionHeader";
import { site } from "@/lib/site";

export function Location() {
  return (
    <section id="visit" className="pub-section pub-location">
      <div className="pub-wrap pub-location-grid">
        <SectionHeader
          index="09"
          eyebrow="Location"
          title="Find us in Bhuj."
          body="Bhagwati Heritage, near Sanskar Nagar. Come when the club is open — until then, the address is here so you know exactly where we are."
        />
        <div className="pub-location-card">
          <p className="pub-label">Address</p>
          <address>
            {site.address.lines.map((line) => (
              <span key={line}>
                {line}
                <br />
              </span>
            ))}
          </address>
          <p className="pub-label">Email</p>
          <a href={`mailto:${site.email}`}>{site.email}</a>
          <p className="pub-label">Instagram</p>
          <a
            href={site.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            @{site.instagramHandle.toLowerCase()}
          </a>
          <p className="pub-label">Facebook</p>
          <p className="pub-plain">{site.facebookName}</p>
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
