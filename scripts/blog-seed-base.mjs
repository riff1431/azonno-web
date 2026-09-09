import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Parse .env.local if present
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase URL or Key");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 1. Author Details: Md Sohel
const authorMdSohel = {
  id: "author-md-sohel",
  name: "Md Sohel",
  slug: "md-sohel",
  job_title: "Senior Beauty Editor & Skincare Specialist",
  bio: "মোঃ সোহেল (Md Sohel) একজন অভিজ্ঞ বিউটি ও স্কিনকেয়ার কনটেন্ট রিসার্চার। গত ৬+ বছর ধরে দক্ষিণ কোরিয়া ও গ্লোবাল কসমেটিকস ফর্মুলেশন, ত্বকের আবহাওয়াভিত্তিক যত্ন এবং অথেনটিক ব্র্যান্ড সোর্সিং নিয়ে লিখছেন। তিনি জটিল প্রসাধনী বিজ্ঞানের পরিবর্তে সাধারণ ও কার্যকরী রূপচর্চার নিয়ম সহজ বাংলায় তুলে ধরতে ভালোবাসেন।",
  avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
  social_links: {
    facebook: "https://facebook.com",
    instagram: "https://instagram.com",
    linkedin: "https://linkedin.com",
  },
  website_url: "https://blushandbudget.com",
  is_verified_expert: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// 2. Categories
const categories = [
  {
    id: "cat-k-beauty",
    name: "কোরিয়ান স্কিনকেয়ার (K-Beauty)",
    slug: "k-beauty",
    description: "কোরিয়ান স্কিনকেয়ার রুটিন, গ্লাস স্কিন টিপস এবং আসল কে-বিউটি প্রডাক্ট গাইড।",
    icon: "Sparkles",
    position: 1,
  },
  {
    id: "cat-skincare-routine",
    name: "ত্বকের যত্ন ও রুটিন (Skincare Routine)",
    slug: "skincare-routine",
    description: "আবহাওয়া অনুযায়ী ত্বকের যত্ন, সানস্ক্রিন, ময়েশ্চারাইজার ও সিরাম ব্যবহারের সঠিক নিয়ম।",
    icon: "Heart",
    position: 2,
  },
  {
    id: "cat-buying-guide",
    name: "বায়িং গাইড ও অথেনটিসিটি (Buying Guide)",
    slug: "buying-guide",
    description: "আসল বনাম নকল প্রডাক্ট চেনার উপায়, ব্যাচ কোড চেক এবং সেফ শপিং গাইড।",
    icon: "ShieldCheck",
    position: 3,
  },
  {
    id: "cat-makeup-beauty",
    name: "মেকআপ ও রূপচর্চা (Makeup & Beauty)",
    slug: "makeup-beauty",
    description: "দৈনন্দিন নো-মেকআপ লুক, লং লাস্টিং লিপস্টিক ও সহজে সাজের সিক্রেট টিপস।",
    icon: "Palette",
    position: 4,
  },
  {
    id: "cat-hair-body",
    name: "হেয়ার ও বডি কেয়ার (Hair & Body Care)",
    slug: "hair-body-care",
    description: "সিল্কি চুলের যত্ন, লং লাস্টিং বডি মিস্ট ও পারফিউম লেয়ারিং গাইড।",
    icon: "Sparkle",
    position: 5,
  },
];

export { authorMdSohel, categories, supabase };
