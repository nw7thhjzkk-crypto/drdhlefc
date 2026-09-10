import { BrandMark } from "./BrandMark";
import { SectionHeader } from "./SectionHeader";
import { site } from "@/lib/site";

export function About() {
  return (
    <section id="club" className="pub-section pub-about">
      <div className="pub-wrap pub-about-grid">
        <div className="pub-logo-panel">
          <BrandMark mark="full" size={420} className="pub-full-logo" />
        </div>
        <div>
          <SectionHeader
            index="01"
            eyebrow="The Club"
            title="Built for training that lasts."
            body="Dr DHL Elite Fitness Club is a premium fitness club in Bhuj — a serious, well-run space for strength, conditioning, and personal guidance."
          />
          <p className="pub-body">
            The club is {site.launchText.toLowerCase()}. Membership details will
            be shared when they are ready. If you want to train here from the
            beginning, register your interest and we will be in touch.
          </p>
        </div>
      </div>
    </section>
  );
}
