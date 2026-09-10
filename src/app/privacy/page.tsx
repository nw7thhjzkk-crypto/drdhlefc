import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/public/Footer";
import { PublicNavbar } from "@/components/public/PublicNavbar";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${site.name} collects and uses enquiries from this website.`,
};

export default function PrivacyPage() {
  return (
    <div className="public-site">
      <PublicNavbar />
      <main className="pub-legal">
        <div className="pub-wrap">
          <p className="pub-eyebrow">Legal</p>
          <h1 className="pub-h1">Privacy Policy</h1>
          <p className="pub-lede">
            This page explains what we collect when you use the public website
            of {site.name}. It is not a substitute for later legal advice.
          </p>

          <h2>Who we are</h2>
          <p>
            {site.name}, {site.address.lines.join(", ")}. Email{" "}
            <a href={`mailto:${site.email}`}>{site.email}</a>.
          </p>

          <h2>What we collect</h2>
          <p>
            If you submit Get Early Access, we collect your name, mobile
            number, optional email, fitness goal, interest, and any message you
            write. We store that as a CRM enquiry so the club can follow up.
          </p>
          <p>Submitting the form does not create a member login or an account.</p>

          <h2>What we do not collect here</h2>
          <p>
            We do not ask for payment details on this website. Phone and
            WhatsApp contact are not configured yet, so we do not process those
            channels from this page.
          </p>

          <h2>How we use it</h2>
          <p>
            Enquiries are used to contact you about the club, memberships, and
            opening information. We do not sell this information.
          </p>

          <h2>Contact</h2>
          <p>
            For a privacy request, email{" "}
            <a href={`mailto:${site.email}`}>{site.email}</a>.
          </p>

          <p>
            <Link href="/">Back to the club</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
