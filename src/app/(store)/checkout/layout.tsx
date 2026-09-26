import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Secure Checkout | Azonno",
  description: "Complete your order safely with Cash on Delivery or digital payment at Azonno.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
