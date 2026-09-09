import { CategoriesClient } from "./categories-client";

export const metadata = {
  title: "All Categories — Authentic Skincare, Makeup & Beauty | Blush & Budget",
  description: "Browse 100% authentic cosmetics and beauty categories: Korean Skincare, Serums, Sunscreens, Haircare, and Makeup at Blush & Budget.",
  alternates: {
    canonical: "/categories",
  },
};

export default function CategoriesPage() {
  return <CategoriesClient />;
}


