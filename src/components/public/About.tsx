import { EXPECTATIONS } from "@/lib/public-content";
import { site } from "@/lib/site";
import { LogoPlaque } from "./LogoPlaque";

export function About() {
  return (
    <section id="club" className="pub-section pub-club">
      <div className="pub-wrap pub-club-grid">
        <div className="pub-club-copy">
          <p className="pub-eyebrow">
            <span className="pub-rule" aria-hidden="true" />
            The Club
          </p>
          <h2 className="pub-h2">Bhuj. Open floor. Quiet work.</h2>
          <p className="pub-lede">
            One room for training. Glass to the street. A mirrored wall.
            An office at the door. Changing, shower, steam, a small store.
          </p>
          <p className="pub-body">
            {site.name} is {site.launchText.toLowerCase()}. What follows is a
            conceptual walk through the intended building — not a photograph
            of a finished gym.
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
      <div className="pub-wrap pub-office-row">
        <LogoPlaque size={280} caption="Office wall" />
        <p className="pub-office-note">
          The office sits by the entrance. The monogram and the full mark
          belong on the wall — not floating on the page.
        </p>
      </div>
    </section>
  );
}
