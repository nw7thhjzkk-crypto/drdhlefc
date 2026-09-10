import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/public/Footer";
import { PublicNavbar } from "@/components/public/PublicNavbar";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms",
  description: `Website terms for ${site.name}.`,
};

export default function TermsPage() {
  return (
    <div className="public-site">
      <PublicNavbar />
      <main className="pub-legal">
        <div className="pub-wrap">
          <p className="pub-eyebrow">Legal</p>
          <h1 className="pub-h1">Terms</h1>
          <p className="pub-lede">
            These terms apply to the public website of {site.name}. They are a
            simple notice, not a complete commercial contract.
          </p>

          <h2>The website</h2>
          <p>
            This site describes a fitness club in Bhuj that is coming soon. It
            does not sell memberships, take payment, or create member accounts.
          </p>

          <h2>Early access</h2>
          <p>
            Get Early Access is an enquiry to the club. It is not a reservation,
            a contract, or a guarantee of membership.
          </p>

          <h2>Login</h2>
          <p>
            Login is for people who already have an authorised account. Accounts
            are issued by the club, not through public registration on this
            website.
          </p>

          <h2>Accuracy</h2>
          <p>
            We do not publish opening dates, prices, or facility inventories
            until they are confirmed. If something here is unclear, email{" "}
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
