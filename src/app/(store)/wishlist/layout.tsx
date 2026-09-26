import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Wishlist | Azonno",
  description: "View and save your favorite skincare and cosmetics items.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
