import { About } from "./About";
import { EarlyAccess } from "./EarlyAccess";
import { Experience } from "./Experience";
import { Expect } from "./Expect";
import { Facility } from "./Facility";
import { FAQ } from "./FAQ";
import { FinalCta } from "./FinalCta";
import { Footer } from "./Footer";
import { Gallery } from "./Gallery";
import { Hero } from "./Hero";
import { Instagram } from "./Instagram";
import { JsonLd } from "./JsonLd";
import { Location } from "./Location";
import { MembershipTeaser } from "./MembershipTeaser";
import { PublicNavbar } from "./PublicNavbar";
import { Training } from "./Training";

export function PublicWebsite() {
  return (
    <div className="public-site">
      <JsonLd />
      <a href="#club" className="pub-skip">
        Skip to content
      </a>
      <PublicNavbar />
      <main>
        <Hero />
        <About />
        <Experience />
        <Training />
        <Expect />
        <MembershipTeaser />
        <Facility />
        <Gallery />
        <FAQ />
        <Location />
        <EarlyAccess />
        <Instagram />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
