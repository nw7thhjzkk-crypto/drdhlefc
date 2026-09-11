import { About } from "./About";
import { EarlyAccess } from "./EarlyAccess";
import { Footer } from "./Footer";
import { Hero } from "./Hero";
import { JsonLd } from "./JsonLd";
import { Location } from "./Location";
import { Membership } from "./Membership";
import { PublicNavbar } from "./PublicNavbar";
import { Space } from "./Space";
import { Training } from "./Training";

export function PublicWebsite() {
  return (
    <div className="public-site">
      <JsonLd />
      <a href="#main" className="pub-skip">
        Skip to content
      </a>
      <PublicNavbar />
      <main id="main">
        <Hero />
        <About />
        <Training />
        <Space />
        <Membership />
        <Location />
        <EarlyAccess />
      </main>
      <Footer />
    </div>
  );
}
