import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Secure Checkout | Blush & Budget",
  description: "Complete your order safely with Cash on Delivery or digital payment at Blush & Budget.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
