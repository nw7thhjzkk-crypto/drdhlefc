import Image from "next/image";
import { GALLERY_SLOTS } from "@/lib/site";
import { BrandMark } from "./BrandMark";
import { SectionHeader } from "./SectionHeader";

export function Gallery() {
  return (
    <section id="gallery" className="pub-section pub-gallery-section">
      <div className="pub-wrap">
        <SectionHeader
          index="09"
          eyebrow="Gallery"
          title="Photography is being prepared."
          body="The gallery opens with real photography of the club — the floor, the work, the people. When it is ready, it will live here."
        />
        <div className="pub-gallery">
          {GALLERY_SLOTS.map((slot) => (
            <figure key={slot.id} className="pub-gallery-frame">
              {slot.src ? (
                <Image
                  src={slot.src}
                  alt={slot.label}
                  fill
                  sizes="(max-width: 800px) 100vw, 33vw"
                  className="pub-gallery-photo"
                />
              ) : (
                <>
                  <BrandMark size={64} />
                  <figcaption>
                    <span>{slot.label}</span>
                    <span className="pub-gallery-status">To be published</span>
                  </figcaption>
                </>
              )}
              {slot.src ? (
                <figcaption>
                  <span>{slot.label}</span>
                </figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
