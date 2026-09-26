import { Metadata } from "next";
import { getAbandonedLeadById } from "@/features/fraud/actions";
import { CartRecoveryClient } from "./recovery-client";

export const metadata: Metadata = {
  title: "Cart Recovery | Azonno",
  description: "Your saved cart and checkout are being prepared...",
  robots: {
    index: false,
    follow: false,
  },
};

interface CartRecoveryPageProps {
  params: Promise<{ id: string }>;
}

export default async function CartRecoveryPage(props: CartRecoveryPageProps) {
  const params = await props.params;
  const lead = await getAbandonedLeadById(params.id);

  return <CartRecoveryClient lead={lead} />;
}
