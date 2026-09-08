import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { CmsPageClient } from "./cms-page-client";

const CMS_PAGES: Record<
  string,
  { title: string; subtitle: string; lastUpdated: string; content: React.ReactNode }
> = {
  about: {
    title: "About Blush & Budget",
    subtitle: "Simple, trusted beauty and skincare for your daily routine",
    lastUpdated: "September 2026",
    content: (
      <div className="space-y-6 text-sm text-text-secondary leading-relaxed">
        <p>
          Founded in Dhaka, <strong>Blush &amp; Budget</strong> makes it easy to find authentic skincare and beauty products from trusted global brands. We focus on gentle, reliable products that fit naturally into your everyday beauty routine.
        </p>
        <h3 className="text-lg font-bold text-text pt-2">Direct &amp; Authentic Sourcing</h3>
        <p>
          Every cleanser, serum, sunscreen, and moisturizer in our collection is sourced directly from authorized brand distributors. We keep our supply chain direct to ensure 100% genuine products with fresh batch dates.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="rounded-2xl border border-border bg-white p-5 shadow-card">
            <h4 className="font-bold text-text text-base">100% Genuine</h4>
            <p className="text-xs text-text-muted mt-1">Authentic products from trusted beauty brands.</p>
          </div>
          <div className="rounded-2xl border border-border bg-white p-5 shadow-card">
            <h4 className="font-bold text-text text-base">Fast 24–48h Delivery</h4>
            <p className="text-xs text-text-muted mt-1">Doorstep delivery across Dhaka and all 64 districts.</p>
          </div>
          <div className="rounded-2xl border border-border bg-white p-5 shadow-card">
            <h4 className="font-bold text-text text-base">Cash on Delivery</h4>
            <p className="text-xs text-text-muted mt-1">Check your package upon delivery before paying.</p>
          </div>
        </div>
      </div>
    ),
  },
  authenticity: {
    title: "100% Authenticity Guarantee",
    subtitle: "Our commitment to genuine beauty products",
    lastUpdated: "September 2026",
    content: (
      <div className="space-y-6 text-sm text-text-secondary leading-relaxed">
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-6 flex items-start gap-4">
          <ShieldCheck className="h-8 w-8 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-emerald-800 text-base">Our Authenticity Promise</h3>
            <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
              We source directly from official brand partners and authorized distributors. If you ever receive an item that is not 100% authentic, we will provide a full refund right away and take care of the return shipping.
            </p>
          </div>
        </div>

        <h3 className="text-lg font-bold text-text pt-2">How to Verify Your Product:</h3>
        <ul className="list-disc pl-5 space-y-2 text-xs text-text-secondary">
          <li><strong>Batch Code:</strong> Every box includes a verifiable batch code.</li>
          <li><strong>Brand Seals:</strong> Korean and global products feature genuine brand security seals.</li>
          <li><strong>Sealed Packaging:</strong> Untampered protective packaging on every product.</li>
        </ul>
      </div>
    ),
  },
  returns: {
    title: "7-Day Return & Replacement Policy",
    subtitle: "Simple and hassle-free returns",
    lastUpdated: "September 2026",
    content: (
      <div className="space-y-6 text-sm text-text-secondary leading-relaxed">
        <p>
          If you received a damaged product or an incorrect item, we offer an easy <strong>7-day replacement or return</strong>.
        </p>
        <h3 className="text-lg font-bold text-text pt-2">Return Guidelines</h3>
        <ul className="list-disc pl-5 space-y-2 text-xs text-text-secondary">
          <li>Items should be unused and in original packaging with seals intact.</li>
          <li>Let us know within 7 days of delivery with an unboxing video.</li>
          <li>Our courier partner will pick up the parcel directly from your doorstep.</li>
        </ul>
      </div>
    ),
  },
  privacy: {
    title: "Privacy Policy",
    subtitle: "How we protect your personal information",
    lastUpdated: "September 2026",
    content: (
      <div className="space-y-4 text-sm text-text-secondary leading-relaxed">
        <p>
          We respect your privacy. Your name, phone number, and delivery address are strictly used to deliver your orders and send order tracking updates.
        </p>
        <p>
          We never share, rent, or sell your personal details to third parties.
        </p>
      </div>
    ),
  },
  terms: {
    title: "Terms & Conditions",
    subtitle: "Shopping and service terms",
    lastUpdated: "September 2026",
    content: (
      <div className="space-y-4 text-sm text-text-secondary leading-relaxed">
        <p>
          By placing an order on Blush &amp; Budget, you agree to inspect your parcel upon delivery and pay the agreed Cash on Delivery amount.
        </p>
        <p>
          All pricing is listed in Bangladeshi Taka (BDT ৳) inclusive of applicable taxes.
        </p>
      </div>
    ),
  },
  faq: {
    title: "Frequently Asked Questions (FAQ)",
    subtitle: "Quick answers about ordering, delivery, and authenticity",
    lastUpdated: "September 2026",
    content: (
      <div className="space-y-6 text-sm text-text-secondary leading-relaxed">
        <div className="rounded-2xl border border-border bg-white p-5 shadow-xs">
          <h4 className="font-bold text-text text-base">১. আপনাদের পণ্য কি ১০০% আসল?</h4>
          <p className="text-xs text-text-muted mt-2 leading-relaxed">
            হ্যাঁ, আমাদের প্রতিটি পণ্য সরাসরি ব্র্যান্ড ও অনুমোদিত ডিস্ট্রিবিউটর থেকে সংগৃহীত। আমরা শুধুমাত্র খাঁটি ও জেনুইন বিউটি প্রডাক্ট সরবরাহ করি।
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-xs">
          <h4 className="font-bold text-text text-base">২. ডেলিভারি পেতে কত সময় লাগে?</h4>
          <p className="text-xs text-text-muted mt-2 leading-relaxed">
            ঢাকায় ২৪ থেকে ৪৮ ঘণ্টার মধ্যে এবং ঢাকার বাইরে ২ থেকে ৪ কার্যদিবসের মধ্যে হোম ডেলিভারি সম্পন্ন হয়।
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-xs">
          <h4 className="font-bold text-text text-base">৩. ডেলিভারির সময় কি চেক করে নেওয়া যাবে?</h4>
          <p className="text-xs text-text-muted mt-2 leading-relaxed">
            হ্যাঁ, ক্যাশ অন ডেলিভারিতে পার্সেল চেক করে নিশ্চিত হয়ে মূল্য পরিশোধ করতে পারবেন।
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-xs">
          <h4 className="font-bold text-text text-base">৪. কোনো সমস্যা হলে রিটার্ন কীভাবে করব?</h4>
          <p className="text-xs text-text-muted mt-2 leading-relaxed">
            ডেলিভারি পাওয়ার ৭ দিনের মধ্যে আমাদের কাস্টমার সাপোর্টে যোগাযোগ করুন। আমাদের টিম দ্রুত রিটার্ন ও রিপ্লেসমেন্টের ব্যবস্থা করবে।
          </p>
        </div>
      </div>
    ),
  },
  contact: {
    title: "Contact & Customer Care",
    subtitle: "We are here to assist you 7 days a week",
    lastUpdated: "August 2026",
    content: (
      <div className="space-y-6 text-sm text-text-secondary leading-relaxed">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-border bg-white p-5 text-center shadow-xs">
            <h4 className="font-bold text-text text-base">Hotline</h4>
            <p className="text-xs text-text-muted mt-1">+880 1700-000000</p>
            <p className="text-[11px] text-text-muted mt-0.5">10:00 AM - 10:00 PM</p>
          </div>
          <div className="rounded-2xl border border-border bg-white p-5 text-center shadow-xs">
            <h4 className="font-bold text-text text-base">Email Support</h4>
            <p className="text-xs text-text-muted mt-1">support@example.com</p>
            <p className="text-[11px] text-text-muted mt-0.5">Response within 2 hours</p>
          </div>
          <div className="rounded-2xl border border-border bg-white p-5 text-center shadow-xs">
            <h4 className="font-bold text-text text-base">Headquarters</h4>
            <p className="text-xs text-text-muted mt-1">Gulshan, Dhaka, Bangladesh</p>
            <p className="text-[11px] text-text-muted mt-0.5">Nationwide Express Delivery</p>
          </div>
        </div>
      </div>
    ),
  },
};

const SLUG_ALIASES: Record<string, string> = {
  "return-policy": "returns",
  "returns-policy": "returns",
  "returns-refunds": "returns",
  "authenticity-guarantee": "authenticity",
  "privacy-policy": "privacy",
  "terms-and-conditions": "terms",
  "terms-conditions": "terms",
  "about-us": "about",
  "contact-us": "contact",
  "help": "faq",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resolvedSlug = SLUG_ALIASES[slug] || slug;
  const page = CMS_PAGES[resolvedSlug];
  if (!page) return { title: "Page Not Found" };
  return {
    title: `${page.title} — Blush & Budget`,
    description: page.subtitle,
  };
}

export default async function CmsPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resolvedSlug = SLUG_ALIASES[slug] || slug;
  const page = CMS_PAGES[resolvedSlug];

  if (!page) {
    notFound();
  }

  return (
    <CmsPageClient
      slug={slug}
      title={page.title}
      subtitle={page.subtitle}
      lastUpdated={page.lastUpdated}
    >
      {page.content}
    </CmsPageClient>
  );
}
