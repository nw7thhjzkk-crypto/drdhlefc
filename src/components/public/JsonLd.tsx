import { site, siteOrigin } from "@/lib/site";

export function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "HealthClub",
    name: site.name,
    description: `${site.name} — ${site.tagline}. ${site.launchText}.`,
    url: siteOrigin(),
    email: site.email,
    image: `${siteOrigin()}${site.brand.fullLogo}`,
    logo: `${siteOrigin()}${site.brand.monogram}`,
    sameAs: [site.instagramUrl],
    address: {
      "@type": "PostalAddress",
      streetAddress: "Shop No. 201–204, Bhagwati Heritage, Near Sanskar Nagar",
      addressLocality: site.address.locality,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country,
    },
    areaServed: {
      "@type": "City",
      name: "Bhuj",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
