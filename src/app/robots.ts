import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const origin = siteOrigin();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/owner/", "/trainer/", "/member/", "/auth/"],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
