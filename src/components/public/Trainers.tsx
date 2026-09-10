import Image from "next/image";
import { TRAINER_PROFILES } from "@/lib/public-content";
import { SectionHeader } from "./SectionHeader";
import { BrandMark } from "./BrandMark";

export function Trainers() {
  return (
    <section id="coaching" className="pub-section pub-trainers">
      <div className="pub-wrap">
        <SectionHeader
          index="07"
          eyebrow="Coaching"
          title="The coaching team."
          body="Coach profiles and credentials will be published when our team is confirmed."
        />

        {TRAINER_PROFILES.length > 0 ? (
          <div className="pub-trainers-grid">
            {TRAINER_PROFILES.map((t) => (
              <article key={t.id} className="pub-trainer-card">
                {t.photo ? (
                  <div className="pub-trainer-photo">
                    <Image
                      src={t.photo}
                      alt={t.name}
                      fill
                      sizes="(max-width: 800px) 100vw, 33vw"
                      className="pub-gallery-photo"
                    />
                  </div>
                ) : (
                  <div className="pub-trainer-photo pub-trainer-photo-empty">
                    <BrandMark size={48} />
                  </div>
                )}
                <div className="pub-trainer-body">
                  <h3>{t.name}</h3>
                  <p className="pub-trainer-role">{t.role}</p>
                  {t.bio ? <p className="pub-trainer-bio">{t.bio}</p> : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="pub-coming-panel">
            <BrandMark size={56} />
            <h3>Profiles to be announced</h3>
            <p>
              Interested in personal training? Register your interest and we
              will connect you with the right coach when the team is confirmed.
            </p>
            <a href="#access" className="pub-btn pub-btn-outline">
              Enquire about coaching
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
