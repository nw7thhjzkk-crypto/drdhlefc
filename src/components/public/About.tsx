import { BrandMark } from "./BrandMark";
import { EXPECTATIONS } from "@/lib/public-content";
import { site } from "@/lib/site";

export function About() {
  return (
    <section id="club" className="pub-section pub-club">
      <div className="pub-wrap pub-club-grid">
        <div className="pub-club-copy">
          <p className="pub-eyebrow">
            <span className="pub-rule" aria-hidden="true" />
            The Club
          </p>
          <h2 className="pub-h2">A gym in Bhuj. Built to be used.</h2>
          <p className="pub-lede">
            Open floor. Black equipment. White light. Glass to the outside.
            One mirrored wall. Rooms for changing, steam, and a small store
            by the office.
          </p>
          <p className="pub-body">
            {site.name} is {site.launchText.toLowerCase()}. The visual walk
            below is a conceptual visualisation of the intended club — not a
            photograph of a finished building.
          </p>
        </div>
        <ol className="pub-convictions">
          {EXPECTATIONS.map((item) => (
            <li key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </li>
          ))}
        </ol>
      </div>
      <div className="pub-logo-wall">
        <BrandMark mark="full" size={520} className="pub-full-logo" />
        <p className="pub-logo-note">Reception wall mark</p>
      </div>
    </section>
  );
}
