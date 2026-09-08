"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Printer,
  Download,
  ArrowLeft,
  FileText,
  Tag,
  Languages,
  Loader2,
  Check,
  Copy,
  Building,
  Mail,
  Phone,
  Globe,
} from "lucide-react";
import { formatPrice, formatShortProductId } from "@/lib/utils";
import { Button } from "@/components/shared/ui/button";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { InvoiceSettings } from "@/features/settings/actions";

export default function InvoicePrintClient({
  order,
  config,
  invoiceSettings,
}: {
  order: any;
  config: any;
  invoiceSettings?: InvoiceSettings;
}) {
  const [printMode, setPrintMode] = useState<"invoice" | "thermal">(
    invoiceSettings?.default_print_mode || "invoice"
  );
  const [lang, setLang] = useState<"en" | "bn">(
    invoiceSettings?.default_language || "en"
  );
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [logoDataUrl, setLogoDataUrl] = useState<string>("");
  const [invoiceBarcodeDataUrl, setInvoiceBarcodeDataUrl] = useState<string>("");
  const [thermalPrimaryBarcodeDataUrl, setThermalPrimaryBarcodeDataUrl] = useState<string>("");
  const [thermalRoutingBarcodeDataUrl, setThermalRoutingBarcodeDataUrl] = useState<string>("");
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(800);

  const printRef = useRef<HTMLDivElement>(null);
  const exportA4Ref = useRef<HTMLDivElement>(null);
  const exportThermalRef = useRef<HTMLDivElement>(null);

  const address = order.shipping_address_snapshot || {};
  const items = order.order_items || [];

  // Track window resize to scale authentic A4 and 4x6 paper proportionally across all devices
  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const a4Scale = Math.min(1, Math.max(0.32, (viewportWidth - 24) / 794));
  const thermalScale = Math.min(1, Math.max(0.45, (viewportWidth - 24) / 378));

  // Dynamic branding from Admin Settings
  const brandName =
    invoiceSettings?.invoice_brand_name ||
    config?.headerConfig?.logoText ||
    "Blush & Budget";
  const logoSrc =
    invoiceSettings?.invoice_logo_url ||
    config?.headerConfig?.logoImageUrl ||
    "/images/blush-logo.png";
  const accentColor = invoiceSettings?.invoice_accent_color || "#e91e63";

  const totalQuantity = items.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0);
  const hasAssignedCourier = Boolean(order.courier_name);
  const courier = order.courier_name || "Standard Delivery";
  const consignmentCode = order.consignment_id || order.order_number;
  
  // Dynamic payment verification
  const isPaidOnline = order.payment_status === "paid";
  const isCod = !isPaidOnline && (order.payment_method === "cod" || !order.payment_method);
  const isBkash = order.payment_method === "bkash" || Boolean(order.public_note?.toLowerCase().includes("bkash"));
  
  // Extract TrxID
  const trxMatch =
    order.public_note?.match(/TrxID:\s*([A-Za-z0-9]+)/i) ||
    (order.order_status_history || [])
      .map((h: any) => h.note?.match(/TrxID:\s*([A-Za-z0-9]+)/i))
      .find(Boolean);
  const trxId = trxMatch ? trxMatch[1] : null;

  const dueAmount = isPaidOnline ? 0 : (order.amount_to_collect !== undefined ? order.amount_to_collect : order.total);

  const baseUrl =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "";
  const trackingUrl = `${baseUrl}/account/track?order=${order.order_number}`;

  const thermalHeaderTitle =
    invoiceSettings?.thermal_header_title ||
    (hasAssignedCourier
      ? `${courier.toUpperCase()} EXPRESS`
      : `${brandName.toUpperCase()} • PARCEL DELIVERY`);

  const thermalRoutingTitle = hasAssignedCourier
    ? `${courier.toUpperCase()} ROUTING & SORTING`
    : `PARCEL ROUTING & DELIVERY`;

  // Bengali Numeral Converter helper
  const toBn = (val: string | number) => {
    if (lang === "en") return String(val);
    const bnNums = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(val).replace(/[0-9]/g, (w) => bnNums[+w]);
  };

  const formatCurrency = (amount: number) => {
    if (lang === "bn") {
      return `৳${toBn(amount.toLocaleString("en-IN"))}`;
    }
    return formatPrice(amount);
  };

  // Pre-convert remote logo to Base64 to eliminate any CORS canvas taint during PDF generation
  useEffect(() => {
    if (!logoSrc) return;
    if (logoSrc.startsWith("data:")) {
      setLogoDataUrl(logoSrc);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width || 200;
        canvas.height = img.naturalHeight || img.height || 60;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          setLogoDataUrl(canvas.toDataURL("image/png"));
        }
      } catch {
        setLogoDataUrl(logoSrc);
      }
    };
    img.onerror = () => setLogoDataUrl(logoSrc);
    img.src = logoSrc;
  }, [logoSrc]);

  // Generate Real Vector QR Code DataURL on mount
  useEffect(() => {
    QRCode.toDataURL(trackingUrl, {
      margin: 1,
      width: 256,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error("QR Code Generation Error:", err));
  }, [trackingUrl]);

  // Generate 100% Valid, Scannable Code-128 Barcodes on mount
  useEffect(() => {
    if (typeof document === "undefined") return;
    try {
      // 1. A4 Invoice Barcode (Code 128)
      const canvas1 = document.createElement("canvas");
      JsBarcode(canvas1, order.order_number, {
        format: "CODE128",
        displayValue: false,
        margin: 0,
        width: 1.8,
        height: 28,
        lineColor: "#000000",
      });
      setInvoiceBarcodeDataUrl(canvas1.toDataURL("image/png"));

      // 2. Thermal Primary Tracking Barcode (Code 128)
      const canvas2 = document.createElement("canvas");
      JsBarcode(canvas2, consignmentCode, {
        format: "CODE128",
        displayValue: false,
        margin: 0,
        width: 2.2,
        height: 48,
        lineColor: "#000000",
      });
      setThermalPrimaryBarcodeDataUrl(canvas2.toDataURL("image/png"));

      // 3. Thermal Carrier Routing Barcode (Code 128)
      const canvas3 = document.createElement("canvas");
      JsBarcode(canvas3, order.order_number, {
        format: "CODE128",
        displayValue: false,
        margin: 0,
        width: 1.8,
        height: 32,
        lineColor: "#000000",
      });
      setThermalRoutingBarcodeDataUrl(canvas3.toDataURL("image/png"));
    } catch (err) {
      console.error("JsBarcode generation error:", err);
    }
  }, [consignmentCode, order.order_number]);

  // Direct Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Smart Back / Close Handler (Works in direct tabs, popups, and history navigation)
  const handleBack = () => {
    if (typeof window === "undefined") return;

    // If opened in a new tab with no internal referrer or history, navigate to order page
    const isAdminRoute = window.location.pathname.startsWith("/admin");
    const fallbackUrl = isAdminRoute ? `/admin/orders/${order.id}` : `/account/orders`;

    if (window.history.length > 1 && document.referrer && document.referrer.includes(window.location.host)) {
      window.history.back();
    } else if (window.opener) {
      window.close();
    } else {
      window.location.href = fallbackUrl;
    }
  };

  // Infallible Direct Vector jsPDF Fallback Generator (with QR code, Logo, and Scannable Barcodes)
  const generateVectorPdfFallback = () => {
    const isThermal = printMode === "thermal";

    if (isThermal) {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [100, 150],
      });

      // 1. Header: Brand Logo & Info (Left), QR Code (Right)
      if (logoDataUrl) {
        try {
          doc.addImage(logoDataUrl, "PNG", 6, 5, 30, 9);
        } catch {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.text(brandName.toUpperCase(), 6, 11);
        }
      } else {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(brandName.toUpperCase(), 6, 11);
      }

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(60, 60, 60);
      doc.text(thermalHeaderTitle, 6, 18);

      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(`DATE: ${new Date(order.created_at).toLocaleDateString("en-GB")}`, 6, 22);

      // Thermal QR Code (Isolated on the right without overlapping text)
      if (qrCodeDataUrl) {
        try {
          doc.addImage(qrCodeDataUrl, "PNG", 74, 5, 20, 20);
        } catch (e) {
          console.error("QR embed error:", e);
        }
      }

      // Divider Line 1
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.6);
      doc.line(6, 26, 94, 26);

      // 2. Tracking Number & Primary Scannable Barcode
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(t.thermalTrackingNo.toUpperCase(), 50, 30, { align: "center" });

      doc.setFontSize(12);
      doc.text(consignmentCode, 50, 35.5, { align: "center" });

      // Embed Real Code-128 Scannable Barcode Image
      if (thermalPrimaryBarcodeDataUrl) {
        try {
          doc.addImage(thermalPrimaryBarcodeDataUrl, "PNG", 12, 38, 76, 10);
        } catch (e) {
          console.error("Primary barcode embed error:", e);
        }
      }

      // COD Box
      doc.rect(20, 50, 60, 8.5);
      doc.setFontSize(10.5);
      doc.text(isCod ? `COD : BDT ${order.total}` : "NON-COD (PAID)", 50, 56, { align: "center" });

      // Divider Line 2
      doc.line(6, 61, 94, 61);

      // 3. Deliver To & Sender Address Grid
      doc.setFontSize(7.5);
      doc.setFillColor(0, 0, 0);
      doc.setTextColor(255, 255, 255);
      doc.rect(6, 63, 24, 4, "F");
      doc.text(t.thermalDeliverTo, 7, 66);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(address.name || order.guest_name || "Customer", 6, 72);
      doc.setFontSize(8.5);
      doc.text(address.phone || order.guest_phone || "", 6, 76.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text(doc.splitTextToSize(address.address || "Address on record", 42), 6, 81);
      doc.setFont("helvetica", "bold");
      doc.text(`${address.thana ? address.thana + ", " : ""}${address.district || "DHAKA"}`, 6, 91);

      // Vertical Divider between addresses
      doc.setLineWidth(0.4);
      doc.line(50, 63, 50, 93);

      // Sender (Store / Merchant)
      doc.setFillColor(220, 220, 220);
      doc.setTextColor(0, 0, 0);
      doc.rect(53, 63, 24, 4, "F");
      doc.setFontSize(7.5);
      doc.text(t.thermalSender, 54, 66);

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(brandName, 53, 72);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text(invoiceSettings?.thermal_return_address || "House 42, Road 11, Banani", 53, 77);
      doc.text("Dhaka, Bangladesh", 53, 81.5);
      doc.text(`Phone: ${invoiceSettings?.thermal_sender_phone || "+880 1700-000000"}`, 53, 86);

      // Divider Line 3
      doc.setLineWidth(0.6);
      doc.line(6, 95, 94, 95);

      // 4. Items Summary & Weight
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(`TOTAL ITEMS: ${totalQuantity}`, 6, 100);
      doc.text(`WEIGHT: 0.5 KG`, 94, 100, { align: "right" });

      let itemY = 105;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      items.slice(0, 3).forEach((it: any) => {
        doc.text(`• ${it.product_name_snapshot?.substring(0, 42)}`, 6, itemY);
        doc.text(`x${it.quantity}`, 94, itemY, { align: "right" });
        itemY += 4.5;
      });

      // Divider Line 4
      doc.line(6, 122, 94, 122);

      // 5. Carrier Routing & Bottom Barcode
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text(thermalRoutingTitle, 50, 126, { align: "center" });

      // Draw Routing Barcode
      if (thermalRoutingBarcodeDataUrl) {
        try {
          doc.addImage(thermalRoutingBarcodeDataUrl, "PNG", 18, 128, 64, 8);
        } catch (e) {
          console.error("Routing barcode embed error:", e);
        }
      }

      doc.setFontSize(8);
      doc.text(order.order_number, 50, 139, { align: "center" });

      doc.setFontSize(6.5);
      doc.setTextColor(80, 80, 80);
      doc.text(invoiceSettings?.thermal_instructions || "DO NOT SHIP IF DAMAGED • RETURN TO HUB", 50, 143, { align: "center" });

      doc.save(`${order.order_number}_4x6_Thermal_Label.pdf`);
      return;
    }

    // Direct Exact A4 Tax Invoice
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Top Brand Logo / Header
    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, "PNG", 15, 12, 36, 12);
      } catch {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(20, 20, 20);
        doc.text(brandName, 15, 20);
      }
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(20, 20, 20);
      doc.text(brandName, 15, 20);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    doc.text(invoiceSettings?.invoice_tagline || "Authentic Skincare & Beauty Imports", 15, 27);
    doc.text(invoiceSettings?.invoice_address || "House 42, Road 11, Banani, Dhaka-1213", 15, 32);

    // Right Title & Order No
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(233, 30, 99);
    doc.text("TAX INVOICE", 195, 20, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(70, 70, 70);
    doc.text(order.order_number, 195, 26, { align: "right" });

    // Header Barcode
    if (invoiceBarcodeDataUrl) {
      try {
        doc.addImage(invoiceBarcodeDataUrl, "PNG", 160, 29, 35, 6);
      } catch (e) {
        console.error("Invoice barcode embed error:", e);
      }
    }

    // Metadata Gray Box
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(15, 38, 180, 28, 3, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text("INVOICE TO:", 20, 44);
    doc.setFontSize(9.5);
    doc.setTextColor(20, 20, 20);
    doc.text(address.name || order.guest_name || "Valued Customer", 20, 50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(`${address.address || ""}, ${address.district || "Dhaka"}`, 20, 55);
    doc.text(`Phone: ${address.phone || order.guest_phone || ""}`, 20, 60);

    // Date & Courier
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${new Date(order.created_at).toLocaleDateString("en-GB")}`, 100, 47, { align: "center" });
    doc.text(`Invoice No: ${order.order_number}`, 100, 53, { align: "center" });
    doc.text(`Courier: ${courier}`, 100, 59, { align: "center" });

    // Total Due Box & Vector QR Code
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(isPaidOnline ? "PAYMENT STATUS:" : "TOTAL DUE:", 166, 47, { align: "right" });
    doc.setFontSize(11);
    if (isPaidOnline) {
      doc.setTextColor(5, 150, 105);
      doc.text("BDT 0 (PAID)", 166, 56, { align: "right" });
    } else {
      doc.setTextColor(233, 30, 99);
      doc.text(`BDT ${dueAmount}`, 166, 56, { align: "right" });
    }

    // A4 QR Code
    if (qrCodeDataUrl) {
      try {
        doc.addImage(qrCodeDataUrl, "PNG", 170, 42, 20, 20);
      } catch (e) {
        console.error("A4 QR embed error:", e);
      }
    }

    // Table Header
    doc.setFillColor(233, 30, 99);
    doc.rect(15, 70, 180, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("DESCRIPTION", 20, 75.5);
    doc.text("QTY", 125, 75.5, { align: "center" });
    doc.text("PRICE", 155, 75.5, { align: "right" });
    doc.text("TOTAL", 190, 75.5, { align: "right" });

    // Table Rows
    let y = 84;
    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "normal");
    items.forEach((it: any, idx: number) => {
      if (idx % 2 === 1) {
        doc.setFillColor(249, 250, 251);
        doc.rect(15, y - 5.5, 180, 8, "F");
      }
      doc.text(it.product_name_snapshot?.substring(0, 50) || "Product Item", 20, y);
      doc.text(String(it.quantity || 1), 125, y, { align: "center" });
      doc.text(`BDT ${it.unit_price}`, 155, y, { align: "right" });
      doc.text(`BDT ${it.total}`, 190, y, { align: "right" });
      y += 9;
    });

    // Divider
    doc.setDrawColor(220, 220, 220);
    doc.line(15, y + 2, 195, y + 2);

    // Financial Totals
    const totalY = y + 10;
    doc.setFontSize(9);
    doc.text("Sub Total:", 145, totalY);
    doc.text(`BDT ${order.subtotal || order.total}`, 190, totalY, { align: "right" });

    doc.text("Delivery Charge:", 145, totalY + 6);
    doc.text(`BDT ${order.shipping_amount || 0}`, 190, totalY + 6, { align: "right" });

    // Grand Total / Amount to Collect Box
    if (isPaidOnline) {
      doc.setFillColor(5, 150, 105);
      doc.roundedRect(135, totalY + 11, 60, 9, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("COLLECT AT DELIVERY", 137, totalY + 17);
      doc.text("BDT 0 (PAID)", 192, totalY + 17, { align: "right" });
    } else {
      doc.setFillColor(233, 30, 99);
      doc.roundedRect(140, totalY + 11, 55, 9, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("GRAND TOTAL", 144, totalY + 17);
      doc.text(`BDT ${dueAmount}`, 192, totalY + 17, { align: "right" });
    }

    // Footer & Authorized Signature
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(8);
    const pdfPaymentMethod = isPaidOnline
      ? (isBkash ? "bKash Online Payment (PAID)" : "Online Payment (PAID)")
      : "Cash on Delivery (COD)";
    doc.text("Payment Method: " + pdfPaymentMethod, 15, totalY + 10);
    if (trxId) {
      doc.text("TrxID: " + trxId, 15, totalY + 15);
    }
    doc.text("Support: " + (invoiceSettings?.invoice_email || ""), 15, totalY + (trxId ? 20 : 16));

    doc.setFont("helvetica", "bold");
    doc.setTextColor(80, 80, 80);
    doc.text(invoiceSettings?.invoice_authorized_signatory_text || "Authorized Signature", 190, totalY + 35, { align: "right" });
    doc.setDrawColor(150, 150, 150);
    doc.line(150, totalY + 31, 195, totalY + 31);

    doc.save(`${order.order_number}_A4_Tax_Invoice.pdf`);
  };

  // 1-Click Guaranteed Direct PDF File Download Handler
  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    setDownloadingPdf(true);

    const isThermal = printMode === "thermal";
    const target = printRef.current;
    const prevTransform = target.style.transform;
    const prevPosition = target.style.position;
    const prevTop = target.style.top;
    const prevLeft = target.style.left;

    try {
      const targetWidth = isThermal ? 378 : 794;
      const targetHeight = isThermal ? 567 : 1123;

      // Temporarily remove transform so html2canvas renders exact 1:1 on-screen visual pixels
      target.style.transform = "none";
      target.style.position = "static";

      const canvas = await html2canvas(target, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
        width: targetWidth,
        height: targetHeight,
        windowWidth: targetWidth,
        windowHeight: targetHeight,
      });

      // Restore position & transform immediately
      target.style.transform = prevTransform;
      target.style.position = prevPosition;
      target.style.top = prevTop;
      target.style.left = prevLeft;

      const imgData = canvas.toDataURL("image/jpeg", 0.98);

      if (isThermal) {
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: [100, 150],
          compress: true,
        });
        pdf.addImage(imgData, "JPEG", 0, 0, 100, 150, undefined, "FAST");
        pdf.save(`${order.order_number}_4x6_Thermal_Label.pdf`);
      } else {
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
          compress: true,
        });
        pdf.addImage(imgData, "JPEG", 0, 0, 210, 297, undefined, "FAST");
        pdf.save(`${order.order_number}_A4_Tax_Invoice.pdf`);
      }
    } catch (err: any) {
      console.warn("Falling back to direct vector jsPDF generator:", err);
      target.style.transform = prevTransform;
      target.style.position = prevPosition;
      target.style.top = prevTop;
      target.style.left = prevLeft;
      generateVectorPdfFallback();
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Translations dictionary for full Bangla / English
  const t = {
    en: {
      invoiceTitle: invoiceSettings?.invoice_title || "TAX INVOICE",
      invoiceTo: "INVOICE TO:",
      date: "Date:",
      invoiceNo: "Invoice No:",
      courier: "Courier:",
      totalDue: "TOTAL DUE :",
      description: "Description",
      qty: "Qty",
      price: "Price",
      total: "Total",
      subtotal: "Sub Total",
      discount: "Discount",
      deliveryCharge: "Delivery Charge",
      grandTotal: "Grand Total",
      paymentMethod: "Payment Method:",
      mode: "Mode:",
      status: "Status:",
      doorstepNotice:
        invoiceSettings?.invoice_footer_notes ||
        "* Please inspect items at doorstep before completing COD payment.",
      contactSupport: "Contact Support:",
      authSignature: invoiceSettings?.invoice_authorized_signatory_text || "Authorized Signature",
      tagline: invoiceSettings?.invoice_tagline || "Authentic Skincare & Beauty Imports",
      addressText:
        invoiceSettings?.invoice_address || "House 42, Road 11, Banani, Dhaka-1213, Bangladesh",
      free: "FREE",
      thermalTrackingNo: "Tracking Number:",
      thermalDeliverTo: "DELIVER TO:",
      thermalSender: "FROM / STORE:",
      weight: "WEIGHT:",
      totalItems: "TOTAL ITEMS:",
      routing: "ROUTING & SORTING",
      doNotShip: "FRAGILE • PLEASE INSPECT PARCEL BEFORE ACCEPTING",
      scanToTrack: "Scan to track parcel",
      orderDate: "ORDER DATE:",
      tabA4: "A4 Tax Invoice",
      tabThermal: "4×6 Thermal Label",
      downloadPdf: "Download PDF",
      printA4Btn: "Print A4 Invoice",
      printThermalBtn: "Print 4×6 Label",
      closeWindow: "Close Window",
    },
    bn: {
      invoiceTitle: invoiceSettings?.invoice_title ? invoiceSettings.invoice_title : "ট্যাক্স ইনভয়েস",
      invoiceTo: "প্রাপক / কাস্টমার:",
      date: "তারিখ:",
      invoiceNo: "ইনভয়েস নং:",
      courier: "কুরিয়ার:",
      totalDue: "সর্বমোট প্রদেয় :",
      description: "পণ্যের বিবরণ",
      qty: "পরিমাণ",
      price: "একক মূল্য",
      total: "মোট",
      subtotal: "সাবটোটাল",
      discount: "ডিসকাউন্ট",
      deliveryCharge: "ডেলিভারি চার্জ",
      grandTotal: "সর্বমোট বিল",
      paymentMethod: "পেমেন্ট মাধ্যম:",
      mode: "মাধ্যম:",
      status: "স্ট্যাটাস:",
      doorstepNotice:
        invoiceSettings?.invoice_footer_notes ||
        "* অনুগ্রহ করে ডেলিভারি রাইডারের সামনে পার্সেলটি চেক করে মূল্য পরিশোধ করুন।",
      contactSupport: "কাস্টমার সাপোর্ট:",
      authSignature: invoiceSettings?.invoice_authorized_signatory_text || "কর্তৃপক্ষের স্বাক্ষর",
      tagline: invoiceSettings?.invoice_tagline || "১০০% অথেনটিক স্কিনকেয়ার ও বিউটি ইম্পোর্টস",
      addressText:
        invoiceSettings?.invoice_address || "হাউজ ৪২, রোড ১১, বনানী, ঢাকা-১২১৩, বাংলাদেশ",
      free: "ফ্রি (০৳)",
      thermalTrackingNo: "ট্র্যাকিং নম্বর:",
      thermalDeliverTo: "ডেলিভারি ঠিকানা (প্রাপক):",
      thermalSender: "প্রেরক (শপ / স্টোর):",
      weight: "ওজন:",
      totalItems: "মোট পণ্য:",
      routing: "কুরিয়ার রাউটিং ও শর্টিং",
      doNotShip: "সাবধানে হ্যান্ডেল করুন • ডেলিভারির সময় চেক করুন",
      scanToTrack: "পার্সেল ট্র্যাক করতে স্ক্যান করুন",
      orderDate: "অর্ডার তারিখ:",
      tabA4: "A4 ট্যাক্স ইনভয়েস",
      tabThermal: "৪×৬ থার্মাল লেবেল",
      downloadPdf: "পিডিএফ ডাউনলোড",
      printA4Btn: "ইনভয়েস প্রিন্ট",
      printThermalBtn: "লেবেল প্রিন্ট",
      closeWindow: "উইন্ডো বন্ধ করুন",
    },
  }[lang];

  // Reusable A4 Tax Invoice Content
  const renderA4Content = () => (
    <>
      <div className="space-y-6">
        {/* Top Brand & Title Bar */}
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="space-y-1">
            {logoSrc ? (
              <img
                src={logoDataUrl || logoSrc}
                alt={brandName}
                crossOrigin="anonymous"
                className="h-14 w-auto object-contain mb-0.5"
              />
            ) : (
              <span className="text-2xl font-black text-gray-900 uppercase tracking-wider block">
                {brandName}
              </span>
            )}
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              {t.tagline}
            </p>
            <p className="text-[10px] text-gray-500">{t.addressText}</p>
            {invoiceSettings?.invoice_tax_id_or_bin && (
              <p className="text-[9.5px] font-bold text-gray-600 font-mono">
                {invoiceSettings.invoice_tax_id_or_bin}
              </p>
            )}
          </div>

          <div className="text-right">
            <h1
              className="text-3xl font-black uppercase tracking-wider"
              style={{ color: accentColor }}
            >
              {t.invoiceTitle}
            </h1>
            <p className="text-xs font-mono font-bold text-gray-600 mt-0.5">
              {order.order_number}
            </p>
            {invoiceSettings?.invoice_show_barcode !== false && invoiceBarcodeDataUrl && (
              <div className="pt-1 flex justify-end">
                <img
                  src={invoiceBarcodeDataUrl}
                  alt="Barcode"
                  crossOrigin="anonymous"
                  className="h-6 w-auto max-w-35 object-contain"
                />
              </div>
            )}
          </div>
        </div>

        {/* 3-Column Tinted Grey Metadata Banner */}
        <div className="bg-gray-100/90 rounded-xl p-4 grid grid-cols-3 gap-4 text-xs border border-gray-200">
          {/* INVOICE TO (Customer) */}
          <div className="space-y-1">
            <span className="font-bold text-[10px] uppercase text-gray-500 tracking-wider block">
              {t.invoiceTo}
            </span>
            <p className="font-black text-sm text-gray-900 uppercase">
              {address.name || order.guest_name || "VALUED CUSTOMER"}
            </p>
            <p className="text-gray-600 font-medium text-[11px] leading-tight">
              {address.address || "Address on record"}
              {address.thana ? `, ${address.thana}` : ""}
              {address.district ? `, ${address.district}` : ""}
            </p>
            <p className="font-mono font-bold text-gray-800 text-[11px]">
              {toBn(address.phone || order.guest_phone || "")}
            </p>
          </div>

          {/* Date & Invoice No */}
          <div className="space-y-1 text-center text-[11px] border-x border-gray-200 px-2">
            <div>
              <span className="text-gray-500 font-medium">{t.date} </span>
              <span className="font-bold text-gray-900 font-mono">
                {toBn(
                  new Date(order.created_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                )}
              </span>
            </div>
            <div>
              <span className="text-gray-500 font-medium">{t.invoiceNo} </span>
              <span className="font-bold text-gray-900 font-mono">{order.order_number}</span>
            </div>
            <div>
              <span className="text-gray-500 font-medium">{t.courier} </span>
              <span className="font-bold text-emerald-700">{courier}</span>
            </div>
          </div>

          {/* TOTAL DUE Box with Offline Vector QR Code */}
          <div className="flex items-center justify-end gap-3 text-right">
            <div>
              <span className="font-bold text-[10px] uppercase text-gray-500 tracking-wider block">
                {isPaidOnline ? (lang === "bn" ? "পেমেন্ট স্ট্যাটাস:" : "PAYMENT STATUS:") : t.totalDue}
              </span>
              <span
                className={`text-xl font-black font-mono ${isPaidOnline ? "text-emerald-700" : ""}`}
                style={!isPaidOnline ? { color: accentColor } : undefined}
              >
                {isPaidOnline ? (lang === "bn" ? "পরিশোধিত (৳০ বকেয়া)" : "PAID (৳0 DUE)") : formatCurrency(dueAmount)}
              </span>
            </div>
            {isPaidOnline ? (
              <div className="border-2 border-emerald-600 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1 shrink-0">
                <span>✓ {lang === "bn" ? "বিকাশে পরিশোধিত" : "PAID ONLINE"}</span>
              </div>
            ) : invoiceSettings?.invoice_show_qr_code !== false && qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt="Order QR Code"
                crossOrigin="anonymous"
                className="h-13 w-13 rounded-lg border border-gray-300 bg-white p-0.5 shrink-0"
                title={t.scanToTrack}
              />
            ) : null}
          </div>
        </div>

        {/* Line Items Table with Custom Accent Header */}
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead
              className="text-white uppercase font-black text-[10px] tracking-wider"
              style={{ backgroundColor: accentColor }}
            >
              <tr>
                <th className="px-4 py-2.5">{t.description}</th>
                <th className="px-4 py-2.5 text-center w-16">{t.qty}</th>
                <th className="px-4 py-2.5 text-right w-24">{t.price}</th>
                <th className="px-4 py-2.5 text-right w-28">{t.total}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-[11px]">
              {items.map((item: any, idx: number) => (
                <tr
                  key={item.id || idx}
                  className={idx % 2 === 1 ? "bg-gray-50/70" : "bg-white"}
                >
                  <td className="px-4 py-3">
                    <span className="font-bold text-gray-900 block">
                      {item.product_name_snapshot}
                    </span>
                    {item.sku_snapshot && (
                      <span className="font-mono text-[9px] text-gray-400">
                        SKU: {formatShortProductId(item.sku_snapshot)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center font-black text-gray-800">
                    {toBn(item.quantity)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-700 font-mono">
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td className="px-4 py-3 text-right font-black text-gray-900 font-mono">
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subtotal, Discount & Grand Total & Signature Block */}
      <div className="pt-4 border-t border-gray-200 space-y-4">
        <div className="flex justify-between items-start gap-6">
          {/* Payment Method & Contact */}
          <div className="space-y-3 text-[11px] max-w-sm">
            <div className="space-y-0.5">
              <span className="font-black text-gray-900 text-xs block uppercase tracking-wider">
                {t.paymentMethod}
              </span>
              <p className="text-gray-700 font-bold">
                {t.mode}{" "}
                <span className="uppercase font-black" style={{ color: isPaidOnline ? "#059669" : accentColor }}>
                  {isPaidOnline
                    ? (isBkash
                        ? (lang === "bn" ? "বিকাশ ইনস্ট্যান্ট পেমেন্ট (পরিশোধিত)" : "bKash Online Payment (PAID)")
                        : (lang === "bn" ? "অনলাইন পেমেন্ট (পরিশোধিত)" : "Online Payment (PAID)"))
                    : (lang === "bn" ? "ক্যাশ অন ডেলিভারি (বকেয়া)" : "Cash on Delivery (COD)")}
                </span>
              </p>
              {trxId && (
                <p className="text-emerald-800 font-mono font-bold text-[10.5px]">
                  Transaction ID (TrxID): <span className="font-black">{trxId}</span>
                </p>
              )}
              <p className="text-gray-500 text-[10px]">
                {t.status}{" "}
                <strong className={`uppercase font-black ${isPaidOnline ? "text-emerald-700" : "text-amber-700"}`}>
                  {isPaidOnline ? (lang === "bn" ? "পরিশোধিত (PAID ONLINE)" : "PAID ONLINE") : order.payment_status}
                </strong>
              </p>
              <p className="text-gray-400 text-[10px] italic leading-tight">
                {isPaidOnline
                  ? (lang === "bn"
                      ? "* এই অর্ডারের সম্পূর্ণ মূল্য অনলাইনে বিকাশ এর মাধ্যমে পরিশোধ করা হয়েছে। ডেলিভারিতে কোন টাকা নেয়া যাবে না।"
                      : "* This order is fully paid online. Do not collect any money upon delivery.")
                  : t.doorstepNotice}
              </p>
            </div>

            <div className="space-y-0.5 pt-2 border-t border-gray-200 text-[10px] text-gray-600">
              <span className="font-black text-gray-900 block uppercase tracking-wider">
                {t.contactSupport}
              </span>
              <p>
                {invoiceSettings?.invoice_email ? `${invoiceSettings.invoice_email} • ` : ""}
                {invoiceSettings?.invoice_phone || ""}
              </p>
              {invoiceSettings?.invoice_website && <p>{invoiceSettings.invoice_website}</p>}
            </div>
          </div>

          {/* Financial Totals */}
          <div className="w-64 space-y-1.5 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-100 text-gray-600 font-medium">
              <span>{t.subtotal}</span>
              <span className="font-bold text-gray-900 font-mono">
                {formatCurrency(order.subtotal || order.total)}
              </span>
            </div>

            {order.discount_amount > 0 && (
              <div className="flex justify-between py-1 border-b border-gray-100 text-emerald-600 font-bold">
                <span>{t.discount}</span>
                <span className="font-mono">-{formatCurrency(order.discount_amount)}</span>
              </div>
            )}

            <div className="flex justify-between py-1 border-b border-gray-100 text-gray-600 font-medium">
              <span>{t.deliveryCharge}</span>
              <span className="font-bold text-gray-900 font-mono">
                {order.shipping_amount === 0 ? t.free : formatCurrency(order.shipping_amount)}
              </span>
            </div>

            {Number(order.advance_paid) > 0 && (
              <div className="flex justify-between py-1 border-b border-gray-100 text-emerald-600 font-bold">
                <span>{lang === "bn" ? "পরিশোধিত অগ্রিম:" : "Advance Paid:"}</span>
                <span className="font-mono">-{formatCurrency(order.advance_paid)}</span>
              </div>
            )}

            {/* Grand Total Solid Box */}
            <div
              className={`text-white p-2.5 rounded-xl flex justify-between items-center text-sm font-black shadow-xs mt-1 ${
                isPaidOnline ? "bg-emerald-600" : ""
              }`}
              style={!isPaidOnline ? { backgroundColor: accentColor } : undefined}
            >
              <span className="uppercase tracking-wider">
                {isPaidOnline
                  ? (lang === "bn" ? "ডেলিভারিতে প্রদেয় (COD বিল)" : "Due at Delivery (COD)")
                  : Number(order.advance_paid) > 0
                  ? (lang === "bn" ? "বকেয়া / COD বিল" : "Net COD Due")
                  : t.grandTotal}
              </span>
              <span className="text-base font-mono font-black">
                {isPaidOnline
                  ? (lang === "bn" ? "০৳ (পরিশোধিত)" : "৳0 (PAID)")
                  : formatCurrency(dueAmount)}
              </span>
            </div>

            {/* Authorised Signature Line */}
            <div className="pt-5 text-right space-y-0.5">
              {invoiceSettings?.invoice_signature_image_url ? (
                <img
                  src={invoiceSettings.invoice_signature_image_url}
                  alt="Signature"
                  crossOrigin="anonymous"
                  className="h-8 w-auto ml-auto object-contain mb-0.5"
                />
              ) : (
                <p className="font-serif italic text-base text-gray-800">{brandName}</p>
              )}
              <div className="w-36 ml-auto border-t border-gray-400 pt-0.5 text-[9px] font-bold text-gray-500 uppercase tracking-widest text-center">
                {t.authSignature}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // Reusable 4x6 Thermal Label Content (with 100% Scannable Code-128 Barcodes)
  const renderThermalContent = () => (
    <>
      <div className="space-y-2">
        {/* Header Row with Logo, Hub & Offline Vector QR Code */}
        <div className="border-b-2 border-black pb-2 flex items-center justify-between">
          <div className="space-y-0.5">
            {invoiceSettings?.thermal_logo_url || logoSrc ? (
              <img
                src={logoDataUrl || invoiceSettings?.thermal_logo_url || logoSrc}
                alt={brandName}
                crossOrigin="anonymous"
                className="h-9 w-auto object-contain"
              />
            ) : (
              <span className="font-black text-sm uppercase tracking-wider block">
                {brandName}
              </span>
            )}
            <span className="text-[9px] font-bold text-gray-700 block uppercase font-mono">
              {thermalHeaderTitle}
            </span>
          </div>

          <div className="text-right space-y-0.5">
            <span className="text-[8px] font-black uppercase text-gray-600 block">
              {t.orderDate} {toBn(new Date(order.created_at).toLocaleDateString("en-GB"))}
            </span>
            {invoiceSettings?.invoice_show_qr_code !== false && qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt="QR Code"
                crossOrigin="anonymous"
                className="h-11 w-11 border border-black p-0.5 ml-auto bg-white"
              />
            ) : null}
          </div>
        </div>

        {/* Primary Tracking Barcode Block (Scannable Code 128) */}
        <div className="text-center py-0.5 border-b-2 border-black space-y-0.5">
          <span className="text-[9px] font-bold text-gray-600 uppercase block font-mono">
            {t.thermalTrackingNo}
          </span>
          <p className="font-mono text-sm font-black tracking-wider text-black">
            {consignmentCode}
          </p>

          {/* Valid, Scannable Code 128 Barcode */}
          {thermalPrimaryBarcodeDataUrl && (
            <div className="py-0.5 flex justify-center">
              <img
                src={thermalPrimaryBarcodeDataUrl}
                alt="Tracking Barcode"
                crossOrigin="anonymous"
                className="h-10 w-auto max-w-60 object-contain"
              />
            </div>
          )}

            {/* Prominent COD or PAID Online Badge */}
          <div>
            <span
              className={`inline-block border-2 px-3 py-1 font-black text-xs uppercase font-mono rounded ${
                isPaidOnline ? "border-black bg-black text-white" : "border-black bg-white text-black"
              }`}
            >
              {isPaidOnline
                ? lang === "bn"
                  ? "★ পেইড (৳০ প্রদেয়) • টাকা নিবেন না ★"
                  : "★ NON-COD (PAID ৳0) • DO NOT COLLECT ★"
                : `COD : ${formatCurrency(dueAmount)}`}
            </span>
            {isPaidOnline ? (
              <span className="block text-[8.5px] font-mono font-bold text-gray-900 mt-0.5 uppercase">
                Paid Online via {isBkash ? "bKash" : "PGW"} {trxId ? `• TrxID: ${trxId}` : ""}
              </span>
            ) : Number(order.advance_paid) > 0 ? (
              <span className="block text-[8px] font-mono font-bold text-gray-700 mt-0.5">
                (৳{order.advance_paid} Advance Paid)
              </span>
            ) : null}
          </div>
        </div>

        {/* 2-Column Delivery & Shipper Address Grid */}
        <div className="grid grid-cols-2 gap-2 text-[9px] border-b-2 border-black pb-2">
          {/* Receiver (Deliver To) */}
          <div className="border-r-2 border-black pr-1.5 space-y-0.5">
            <span className="font-black uppercase tracking-wider block bg-black text-white px-1 py-0.2 rounded text-[7px] w-fit">
              {t.thermalDeliverTo}
            </span>
            <p className="font-black text-[11px] text-black">{address.name || order.guest_name}</p>
            <p className="font-black text-[11px] font-mono text-black">
              {toBn(address.phone || order.guest_phone || "")}
            </p>
            <p className="font-medium text-gray-900 leading-tight">{address.address}</p>
            <p className="font-black uppercase text-[9px] pt-0.5">
              {address.thana ? `${address.thana}, ` : ""}
              {address.district || "DHAKA"}
            </p>
          </div>

          {/* Sender (Store / Merchant) */}
          <div className="space-y-0.5 pl-0.5">
            <span className="font-black uppercase tracking-wider block bg-gray-200 text-black px-1 py-0.2 rounded text-[7px] w-fit">
              {t.thermalSender}
            </span>
            <p className="font-black text-[11px] text-black">{brandName}</p>
            <p className="text-gray-800 leading-tight">
              {invoiceSettings?.thermal_return_address || "House 42, Road 11, Banani"}
            </p>
            <p className="font-bold text-black">Dhaka, Bangladesh</p>
            <p className="font-mono text-[8px] text-gray-700">
              Phone: {invoiceSettings?.thermal_sender_phone || "+880 1700-000000"}
            </p>
          </div>
        </div>

        {/* Package Breakdown & Weight */}
        {invoiceSettings?.thermal_show_item_breakdown !== false && (
          <div className="border-b-2 border-black pb-1.5 text-[9px] space-y-1">
            <div className="flex justify-between font-bold">
              <span>{t.weight} {toBn("0.5")} KG</span>
              <span>{t.totalItems} {toBn(totalQuantity)}</span>
            </div>
            <div className="space-y-1">
              {items.map((it: any) => (
                <div key={it.id} className="flex justify-between items-start text-gray-900 font-medium gap-2">
                  <span className="leading-tight wrap-break-word flex-1">• {it.product_name_snapshot}</span>
                  <span className="font-mono font-bold shrink-0">x{toBn(it.quantity)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Secondary Carrier Routing Barcode & Instructions */}
      <div className="text-center pt-1 space-y-0.5">
        <span className="text-[8px] font-black uppercase text-gray-600 block font-mono">
          {thermalRoutingTitle}
        </span>

        {/* Scannable Routing Barcode */}
        {thermalRoutingBarcodeDataUrl && (
          <div className="py-0.5 flex justify-center">
            <img
              src={thermalRoutingBarcodeDataUrl}
              alt="Routing Barcode"
              crossOrigin="anonymous"
              className="h-7 w-auto max-w-50 object-contain"
            />
          </div>
        )}

        <p className="font-mono text-[9px] font-black uppercase">{order.order_number}</p>
        <p className="text-[7px] font-black uppercase tracking-widest text-gray-600">
          {invoiceSettings?.thermal_instructions || t.doNotShip}
        </p>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-2 sm:p-6 lg:p-8 print:p-0 print:m-0 print:bg-white text-gray-900 font-sans">
      {/* Global Print Isolation CSS */}
      <style jsx global>{`
        body {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        @media print {
          @page {
            size: ${printMode === "thermal" ? "100mm 150mm" : "A4 portrait"};
            margin: 0mm !important;
          }

          body, html {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          header, footer, nav, aside, .no-print, [role="navigation"] {
            display: none !important;
          }

          .print-area-invoice {
            transform: none !important;
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-width: 210mm !important;
            max-height: 297mm !important;
            margin: 0 !important;
            padding: 10mm 12mm !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
          }

          .print-area-thermal {
            transform: none !important;
            width: 100mm !important;
            height: 150mm !important;
            min-height: 150mm !important;
            max-width: 100mm !important;
            max-height: 150mm !important;
            margin: 0 !important;
            padding: 3mm !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
          }
        }
      `}</style>

      {/* Top Floating Action Toolbar (Fully Responsive on Mobile, Tablet & Desktop) */}
      <div className="no-print mx-auto max-w-4xl mb-4 sm:mb-6 bg-white rounded-2xl p-3 sm:p-4 shadow-lg border border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors shrink-0"
            title={t.closeWindow}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-black text-gray-900 flex items-center gap-1.5 flex-wrap">
              <span className="truncate">{order.order_number}</span>
              <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${
                isPaidOnline
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "bg-pink-100 text-sg-pink"
              }`}>
                {isPaidOnline ? (isBkash ? "bKash Online (PAID)" : "Online Paid") : "Cash on Delivery"}
              </span>
            </h2>
            <p className="text-[11px] text-gray-500 truncate">
              {address.name || order.guest_name} • {address.phone || order.guest_phone}
            </p>
          </div>
        </div>

        {/* Action Controls: Format Switcher, Lang Toggle, Download & Print */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
          {/* Format Toggle Pill */}
          <div className="col-span-2 sm:col-auto bg-gray-100 p-1 rounded-xl flex items-center justify-center gap-1 border border-gray-200">
            <button
              type="button"
              onClick={() => setPrintMode("invoice")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                printMode === "invoice"
                  ? "bg-white text-sg-pink shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>{t.tabA4}</span>
            </button>
            <button
              type="button"
              onClick={() => setPrintMode("thermal")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                printMode === "thermal"
                  ? "bg-white text-sg-pink shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Tag className="h-3.5 w-3.5" />
              <span>{t.tabThermal}</span>
            </button>
          </div>

          {/* Language Switcher */}
          <button
            type="button"
            onClick={() => setLang(lang === "en" ? "bn" : "en")}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs"
            title="Toggle Bangla / English"
          >
            <Languages className="h-3.5 w-3.5 text-sg-pink" />
            <span>{lang === "en" ? "বাংলা" : "English"}</span>
          </button>

          {/* 1-Click Direct PDF Download Button */}
          <Button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50 font-bold text-xs px-3.5 py-2 rounded-xl shadow-2xs justify-center"
          >
            {downloadingPdf ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin text-sg-pink" />
            ) : (
              <Download className="h-4 w-4 mr-1.5 text-gray-700" />
            )}
            {t.downloadPdf}
          </Button>

          {/* Print Button */}
          <Button
            onClick={handlePrint}
            style={{ backgroundColor: accentColor }}
            className="col-span-2 sm:col-auto text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-md transition-all hover:opacity-95 justify-center"
          >
            <Printer className="h-4 w-4 mr-1.5" />
            {printMode === "invoice" ? t.printA4Btn : t.printThermalBtn}
          </Button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. AUTHENTIC A4 TAX INVOICE (Exact Proportional Scale View)  */}
      {/* ============================================================ */}
      {printMode === "invoice" && (
        <div className="flex flex-col items-center justify-center w-full pb-12 overflow-x-hidden">
          {/* Scaled A4 Document Viewport */}
          <div
            className="relative mx-auto print:w-auto print:h-auto print:static"
            style={{
              width: `${794 * a4Scale}px`,
              height: `${1123 * a4Scale}px`,
            }}
          >
            <div
              ref={printRef}
              style={{
                width: "794px",
                minWidth: "794px",
                maxWidth: "794px",
                minHeight: "1123px",
                height: "1123px",
                transform: `scale(${a4Scale})`,
                transformOrigin: "top left",
                position: "absolute",
                top: 0,
                left: 0,
              }}
              className="print-area-invoice bg-white p-[36px_44px] border border-gray-300 shadow-2xl print:shadow-none print:border-none text-gray-900 relative overflow-hidden flex flex-col justify-between"
            >
              {renderA4Content()}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. AUTHENTIC 4×6 POS THERMAL SHIPPING LABEL                  */}
      {/* ============================================================ */}
      {printMode === "thermal" && (
        <div className="flex flex-col items-center justify-center w-full pb-12 overflow-x-hidden">
          {/* Scaled 4x6 Thermal Document Viewport */}
          <div
            className="relative mx-auto print:w-auto print:h-auto print:static"
            style={{
              width: `${378 * thermalScale}px`,
              height: `${567 * thermalScale}px`,
            }}
          >
            <div
              ref={printRef}
              style={{
                width: "378px",
                minWidth: "378px",
                maxWidth: "378px",
                minHeight: "567px",
                height: "567px",
                transform: `scale(${thermalScale})`,
                transformOrigin: "top left",
                position: "absolute",
                top: 0,
                left: 0,
              }}
              className="print-area-thermal bg-white p-4 border-2 border-dashed border-gray-400 shadow-xl print:shadow-none print:border-none text-gray-900 space-y-2.5 font-sans relative overflow-hidden flex flex-col justify-between"
            >
              {renderThermalContent()}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. DEDICATED OFF-SCREEN UNTRANSFORMED PDF EXPORT NODES       */}
      {/* ============================================================ */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          left: "-9999px",
          top: "0",
          width: "850px",
          zIndex: -9999,
          pointerEvents: "none",
        }}
      >
        {/* Unscaled 1:1 A4 Export Node */}
        <div
          ref={exportA4Ref}
          style={{
            width: "794px",
            minHeight: "1123px",
            height: "1123px",
            backgroundColor: "#ffffff",
            padding: "36px 44px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
          className="text-gray-900"
        >
          {renderA4Content()}
        </div>

        {/* Unscaled 1:1 Thermal Export Node */}
        <div
          ref={exportThermalRef}
          style={{
            width: "378px",
            minHeight: "567px",
            height: "567px",
            backgroundColor: "#ffffff",
            padding: "16px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
          className="text-gray-900 space-y-2.5 font-sans"
        >
          {renderThermalContent()}
        </div>
      </div>
    </div>
  );
}
