import Image from "next/image";
import { GALLERY_SLOTS } from "@/lib/site";
import { BrandMark } from "./BrandMark";
import { SectionHeader } from "./SectionHeader";

export function Gallery() {
  return (
    <section id="gallery" className="pub-section">
      <div className="pub-wrap">
        <SectionHeader
          index="07"
          eyebrow="Gallery"
          title="Photography is being prepared."
          body="We will not fill this page with generic gym images and present them as Dr DHL. When club photography is ready, it will live here."
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
                <BrandMark size={72} />
              )}
              <figcaption>
                <span>{slot.label}</span>
                {slot.src ? null : <span>Coming soon</span>}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
