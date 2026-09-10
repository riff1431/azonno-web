export interface DataClearableFeature {
  id: string;
  nameBn: string;
  nameEn: string;
  category: string;
  descriptionBn: string;
  descriptionEn: string;
  impactWarning: string;
  severity: "high" | "medium" | "low" | "critical";
}

export const CLEARABLE_FEATURES: DataClearableFeature[] = [
  {
    id: "pixels_tracking",
    nameBn: "মেটা পিক্সেল ও টিকটক পিক্সেল ট্র্যাকিং ডেটা (Meta / TikTok Pixel & CAPI)",
    nameEn: "Meta Pixel, TikTok Pixel & CAPI Tracking Data",
    category: "Marketing",
    descriptionBn: "সব মেটা পিক্সেল আইডি, টিকটক পিক্সেল আইডি, কনভার্সন API টোকেন এবং টেস্ট ইভেন্ট কোড মুছে ফেলবে।",
    descriptionEn: "Resets Meta Pixel ID, TikTok Pixel ID, Conversion API access tokens, and test event codes.",
    impactWarning: "স্টোরফ্রন্টের সব বিজ্ঞাপন ট্র্যাকিং সাময়িকভাবে বন্ধ হবে।",
    severity: "medium",
  },
  {
    id: "marketing_logs",
    nameBn: "মার্কেটিং ও কনভার্সন ইভেন্ট লগ (Marketing & Event Logs)",
    nameEn: "Marketing & Conversion Event Logs",
    category: "Marketing",
    descriptionBn: "সব পিক্সেল ফায়ার লগ, সার্ভার-সাইড CAPI ইভেন্ট হিস্ট্রি এবং অডিট লগ ডিলিট করবে।",
    descriptionEn: "Purges integration logs, CAPI event history, and diagnostic server records.",
    impactWarning: "বিগত মার্কেটিং ট্র্যাকিং অডিট হিস্ট্রি আর দেখা যাবে না।",
    severity: "low",
  },
  {
    id: "abandoned_checkouts",
    nameBn: "অসম্পূর্ণ চেকআউট ও লিড ডেটা (Abandoned Checkouts & Incomplete Leads)",
    nameEn: "Abandoned Checkouts & Incomplete Leads",
    category: "Fraud & Leads",
    descriptionBn: "সব ক্যাপচার করা ফোন নম্বর, কাস্টমার ড্রাফট অর্ডার এবং পরিত্যক্ত চেকআউট ডেটা মুছে ফেলবে।",
    descriptionEn: "Permanently purges all captured lead phone numbers and abandoned checkout records.",
    impactWarning: "অসম্পূর্ণ অর্ডারের তালিকা সম্পূর্ণ খালি হয়ে যাবে।",
    severity: "medium",
  },
  {
    id: "orders_transactions",
    nameBn: "অর্ডার ও পেমেন্ট হিস্ট্রি (Orders & Transactions Data)",
    nameEn: "Orders, Order Items & Transaction History",
    category: "Orders",
    descriptionBn: "সব কাস্টমার অর্ডার, আইটেম স্ন্যাপশট, পেমেন্ট লগ এবং স্ট্যাটাস হিস্ট্রি মুছে সম্পূর্ণ নতুন করে শুরু করবে।",
    descriptionEn: "Permanently deletes all orders, order line items, status histories, and payment logs.",
    impactWarning: "সব অর্ডার হিস্ট্রি মুছে যাবে এবং সেলস কাউন্ট শূন্য হয়ে যাবে!",
    severity: "critical",
  },
  {
    id: "reviews_qa",
    nameBn: "গ্রাহক রিভিউ ও প্রশ্ন-উত্তর (Customer Reviews & Q&A)",
    nameEn: "Customer Reviews & Product Q&A",
    category: "Storefront",
    descriptionBn: "প্রোডাক্টে দেওয়া সব কাস্টমার রিভিউ, রেটিং, ছবি এবং প্রোডাক্ট প্রশ্ন-উত্তর ডিলিট করবে।",
    descriptionEn: "Deletes all customer reviews, ratings, user photos, and answered/pending questions.",
    impactWarning: "পণ্যসমূহের সব রিভিউ ও রেটিং মুছে শূন্য হয়ে যাবে।",
    severity: "high",
  },
  {
    id: "coupons_vouchers",
    nameBn: "কুপন কোড ও ভাউচার ব্যবহার রেকর্ড (Coupons & Usage Logs)",
    nameEn: "Coupons, Promos & Usage Logs",
    category: "Promotions",
    descriptionBn: "সব সক্রিয় ও নিষ্ক্রিয় কুপন কোড এবং কোন ইউজার কুপন ব্যবহার করেছে তার রেকর্ড মুছে ফেলবে।",
    descriptionEn: "Deletes all discount codes, promo campaigns, and user redemption histories.",
    impactWarning: "গ্রাহকরা আগের কোনো কুপন দিয়ে ডিসকাউন্ট পাবে না।",
    severity: "medium",
  },
  {
    id: "finance_expenses_dues",
    nameBn: "অপারেশনাল খরচ ও বকেয়া রেকর্ড (Expenses & Dues Ledger)",
    nameEn: "Expenses, Costs & Dues Ledger",
    category: "Finance",
    descriptionBn: "রেকর্ডকৃত সব প্যাকেজিং, কাস্টমস, এসএমএস খরচ এবং বকেয়া কুরিয়ার হিসেব রিসেট করবে।",
    descriptionEn: "Clears all logged operating costs, expense records, and pending dues entries.",
    impactWarning: "খরচের হিসাব শূন্য হয়ে যাবে কিন্তু আসল অর্ডার ডেটা সংরক্ষিত থাকবে।",
    severity: "high",
  },
  {
    id: "system_cache",
    nameBn: "সিস্টেম ক্যাশ ও কনফিগ স্টোর (System Cache & Redis Store)",
    nameEn: "System Cache & Config Cache Store",
    category: "System",
    descriptionBn: "সার্ভারের সব ইন-মেমোরি ক্যাশ, মডিউল স্ট্যাটাস ক্যাশ ও সেটিংস রিফ্রেশ করবে।",
    descriptionEn: "Flushes in-memory cache, revalidates all paths, and syncs live database state.",
    impactWarning: "কোনো ডেটা ডিলিট হবে না, শুধু ক্যাশ রিফ্রেশ হবে।",
    severity: "low",
  },
];
