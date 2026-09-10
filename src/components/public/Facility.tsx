import { FACILITY_HIGHLIGHTS } from "@/lib/public-content";
import { SectionHeader } from "./SectionHeader";
import { site } from "@/lib/site";

export function Facility() {
  return (
    <section id="facility" className="pub-section pub-facility">
      <div className="pub-wrap">
        <div className="pub-facility-grid">
          <SectionHeader
            index="08"
            eyebrow="The space"
            title="A club you will want to walk into."
            body="Photography of the finished floor will be published here. Until then, this is where you will find us."
          />
          <div className="pub-facility-panel">
            <p className="pub-eyebrow">Bhuj, Gujarat</p>
            <p className="pub-facility-address">
              {site.address.lines.map((line) => (
                <span key={line}>
                  {line}
                  <br />
                </span>
              ))}
            </p>
            <a
              href={site.mapsSearchUrl}
              className="pub-btn pub-btn-outline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open in Maps
            </a>
          </div>
        </div>

        {FACILITY_HIGHLIGHTS.length > 0 ? (
          <div className="pub-facility-highlights">
            {FACILITY_HIGHLIGHTS.map((f) => (
              <article key={f.id} className="pub-facility-highlight">
                <h3>{f.title}</h3>
                {f.description ? <p>{f.description}</p> : null}
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
