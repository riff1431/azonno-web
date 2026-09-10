import { notFound } from "next/navigation";
import { getOrderById } from "@/features/orders/actions";
import { getHomepageConfig } from "@/features/marketing/homepage-actions";
import { getInvoiceSettings } from "@/features/settings/actions";
import InvoicePrintClient from "@/app/admin/orders/[id]/invoice/invoice-print-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invoice & Thermal Label",
  robots: { index: false, follow: false },
};

export default async function DedicatedOrderInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [order, config, invoiceSettings] = await Promise.all([
    getOrderById(id),
    getHomepageConfig(),
    getInvoiceSettings(),
  ]);

  if (!order) notFound();

  return <InvoicePrintClient order={order} config={config} invoiceSettings={invoiceSettings} />;
}
