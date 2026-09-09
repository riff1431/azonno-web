import { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl() || "https://blushbudget.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/account/",
          "/cart",
          "/checkout",
          "/api/",
          "/track-order",
          "/wishlist",
          "/*?*search=",
          "/*?*sort=",
          "/*?*min_price=",
          "/*?*max_price=",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

