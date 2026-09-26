import { Metadata } from "next";
import { AzonnoHomepage } from "@/components/storefront/azonno-homepage";

export const metadata: Metadata = {
  title: "Azonno — Everything within Reach | Premium Clothing Brand in Bangladesh",
  description:
    "Discover premium menswear, casual oxford shirts, festive panjabis, polo t-shirts, women's embroidered kurtis and linen co-ord sets with Cash on Delivery nationwide in Bangladesh.",
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return <AzonnoHomepage />;
}
