import { Metadata } from "next";
import { getAbandonedLeadById } from "@/features/fraud/actions";
import { CartRecoveryClient } from "./recovery-client";

export const metadata: Metadata = {
  title: "কার্ট রিকভারি | Blush & Budget",
  description: "আপনার সংরক্ষিত কার্ট এবং চেকআউট প্রস্তুত করা হচ্ছে...",
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
