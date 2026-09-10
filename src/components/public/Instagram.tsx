import { site } from "@/lib/site";

export function Instagram() {
  return (
    <section id="instagram" className="pub-section pub-instagram">
      <div className="pub-wrap pub-instagram-inner">
        <p className="pub-eyebrow">Instagram</p>
        <h2 className="pub-h2">Follow the club.</h2>
        <p className="pub-lede">
          Updates from Dr DHL Elite Fitness Club live on Instagram. Follow
          along as the club prepares to open.
        </p>
        <a
          href={site.instagramUrl}
          className="pub-btn pub-btn-outline pub-btn-lg"
          target="_blank"
          rel="noopener noreferrer"
        >
          @{site.instagramHandle.toLowerCase()}
        </a>
      </div>
    </section>
  );
}
