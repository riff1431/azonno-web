import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shopping Cart | Blush & Budget",
  description: "View and manage your selected beauty items before checkout.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
