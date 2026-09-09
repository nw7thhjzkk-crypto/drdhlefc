import { SectionHeader } from "./SectionHeader";
import { site } from "@/lib/site";

export function Facility() {
  return (
    <section id="facility" className="pub-section pub-facility">
      <div className="pub-wrap pub-facility-grid">
        <SectionHeader
          index="06"
          eyebrow="The space"
          title="A club you will want to walk into."
          body="Photography of the finished floor will be published here. Until then, this is the address — not a catalogue of machines we have not confirmed."
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
    </section>
  );
}
