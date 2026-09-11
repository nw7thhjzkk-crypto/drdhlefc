import { AMENITIES } from "@/lib/public-content";

export function Amenities() {
  return (
    <section id="amenities" className="pub-section pub-amenities">
      <div className="pub-wrap">
        <header className="pub-amenities-head">
          <p className="pub-eyebrow">
            <span className="pub-rule" aria-hidden="true" />
            Amenities
          </p>
          <h2 className="pub-h2">Rooms beyond the floor.</h2>
          <p className="pub-lede">
            The club is being planned around training first — then the rooms
            that make a session complete. No pool, spa, or café is claimed here.
          </p>
        </header>
        <ul className="pub-amenity-grid">
          {AMENITIES.map((item) => (
            <li key={item.id}>
              <p className="pub-kicker">{item.zone}</p>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
