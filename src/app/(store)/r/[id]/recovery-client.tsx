"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart, type CartItem } from "@/context/cart-context";
import type { AbandonedLead } from "@/features/fraud/actions";
import { Loader2, ShoppingBag, CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

interface CartRecoveryClientProps {
  lead: AbandonedLead | null;
}

export function CartRecoveryClient({ lead }: CartRecoveryClientProps) {
  const router = useRouter();
  const { restoreCart } = useCart();
  const [status, setStatus] = useState<"restoring" | "success" | "not_found">("restoring");

  useEffect(() => {
    if (!lead || !lead.cart_items || lead.cart_items.length === 0) {
      setStatus("not_found");
      const timeout = setTimeout(() => {
        router.replace("/checkout");
      }, 1800);
      return () => clearTimeout(timeout);
    }

    try {
      // 1. Format products into valid CartItem objects
      const restoredItems: CartItem[] = lead.cart_items.map((it, idx) => {
        const itemId = String(it.id || it.product_id || `rec-item-${idx}-${Date.now()}`);
        const prodId = String(it.product_id || it.id || itemId);
        const name = it.name || "Selected Product";
        const slug = it.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const price = Number(it.price) || 0;
        const regularPrice = Number(it.regular_price || price);
        const qty = Math.max(1, Number(it.quantity) || 1);
        const img = it.image_url || it.image || null;

        return {
          id: itemId,
          product_id: prodId,
          variant_id: it.variant_id || null,
          sku: null,
          name,
          slug,
          price,
          regular_price: regularPrice,
          image_url: img,
          quantity: qty,
          brand_name: it.brand_name || null,
          variant_label: it.variant_label || it.variant || null,
        };
      });

      // 2. Restore into Cart Context and LocalStorage
      restoreCart(restoredItems);

      // 3. Save customer details for checkout form auto-prefill
      const prefillData = {
        name: lead.customer_name && lead.customer_name !== "Guest Customer" ? lead.customer_name : "",
        phone: lead.customer_phone && lead.customer_phone !== "Not Provided" ? lead.customer_phone : "",
        email: lead.customer_email || "",
        division: lead.division || "Dhaka",
        district: lead.district || "Dhaka City",
        thana: lead.thana || "",
        address: lead.raw_address || lead.address || "",
      };

      try {
        localStorage.setItem("ecomx_checkout_prefill", JSON.stringify(prefillData));
        localStorage.setItem("ecomx_recovered_toast", "true");
      } catch (e) {
        console.warn("Could not save recovery prefill to localStorage", e);
      }

      setStatus("success");

      // 4. Smooth, fast redirect to checkout
      const redirectTimer = setTimeout(() => {
        router.replace("/checkout?recovered=1");
      }, 700);

      return () => clearTimeout(redirectTimer);
    } catch (err) {
      console.error("Error restoring cart:", err);
      router.replace("/checkout");
    }
  }, [lead, restoreCart, router]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-rose-100 p-8 text-center relative overflow-hidden">
        {/* Top Decorative Glow */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-gradient-to-br from-rose-200 to-pink-200 rounded-full blur-2xl opacity-60 pointer-events-none" />

        {status === "restoring" && (
          <div className="space-y-4 relative z-10">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto text-rose-600 shadow-inner">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 font-bengali">আপনার কার্ট লোড করা হচ্ছে...</h2>
            <p className="text-sm text-gray-500 font-bengali">
              সংরক্ষিত প্রোডাক্টগুলো আপনার কার্টে যোগ করে সরাসরি চেকআউট পেজে নিয়ে যাওয়া হচ্ছে।
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4 relative z-10 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              কার্ট রিকভারি সফল!
            </div>
            <h2 className="text-xl font-bold text-gray-900 font-bengali">
              স্বাগতম {lead?.customer_name && lead.customer_name !== "Guest Customer" ? lead.customer_name : ""}! 🌸
            </h2>
            <p className="text-sm text-gray-600 font-bengali">
              আপনার পছন্দের {lead?.cart_items?.length || 1} টি আইটেম কার্টে যোগ করা হয়েছে। চেকআউট পেজে নিয়ে যাওয়া হচ্ছে...
            </p>
            <div className="pt-2">
              <Link
                href="/checkout?recovered=1"
                className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm transition-all shadow-md hover:shadow-lg"
              >
                এখনই চেকআউটে যান <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {status === "not_found" && (
          <div className="space-y-4 relative z-10">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-600">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 font-bengali">চেকআউট পেজে রিডাইরেক্ট করা হচ্ছে...</h2>
            <p className="text-sm text-gray-500 font-bengali">
              লিংকটি মেয়াদোত্তীর্ণ বা ইতোমধ্যেই কনফার্ম করা হয়েছে। আপনাকে চেকআউট পেজে রিডাইরেক্ট করা হচ্ছে।
            </p>
            <div className="pt-2">
              <Link
                href="/checkout"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-medium text-sm transition-all"
              >
                চেকআউট পেজ <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
