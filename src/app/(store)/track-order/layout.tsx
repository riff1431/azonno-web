import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track Order Status | Azonno",
  description: "Check the real-time live status and courier tracking for your order with Azonno.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function TrackOrderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
