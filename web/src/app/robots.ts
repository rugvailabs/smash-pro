import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin",
        "/account",
        "/dashboard",
        "/cart",
        "/checkout",
        "/orders",
        "/payments",
        "/requests",
        "/supplier",
        "/wishlist",
        "/signin",
      ],
    },
    sitemap: "https://smashpro.in/sitemap.xml",
  };
}
