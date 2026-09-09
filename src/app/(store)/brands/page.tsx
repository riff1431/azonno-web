import { getStorefrontBrands } from "@/features/brands/actions";
import { BrandsClient } from "./brands-client";

export const metadata = {
  title: "All Brands — 100% Authentic Korean & Global Beauty Brands | Blush & Budget",
  description: "Explore 100% authentic international skincare, K-beauty, and cosmetics brands in Bangladesh at Blush & Budget. COSRX, The Ordinary, CeraVe, Beauty of Joseon, and more.",
  alternates: {
    canonical: "/brands",
  },
};

export default async function BrandsIndexPage() {
  const brands = await getStorefrontBrands();
  return <BrandsClient brands={brands || []} />;
}

