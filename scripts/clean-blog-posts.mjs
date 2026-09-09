import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envFile = fs.readFileSync(".env.local", "utf-8");
const env = Object.fromEntries(
  envFile
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^["']|["']$/g, "")];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function cleanBlogData() {
  console.log("=== PHASE 2: OVERHAULING BLOG AUTHORS & POSTS FOR BEAUTY E-COMMERCE ===");

  // 1. Update Blog Authors
  const cleanAuthors = [
    {
      id: "author-sohel",
      name: "Md Sohel",
      role: "Beauty & Skincare Content Researcher",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
      bio: "মোঃ সোহেল (Md Sohel) একজন অভিজ্ঞ বিউটি ও স্কিনকেয়ার কনটেন্ট রিসার্চার। গত ৬+ বছর ধরে দক্ষিণ কোরিয়া ও গ্লোবাল কসমেটিকস ফর্মুলেশন, ত্বকের আবহাওয়াভিত্তিক যত্ন এবং অথেনটিক ব্র্যান্ড সোর্সিং নিয়ে লিখছেন। তিনি জটিল প্রসাধনী বিজ্ঞানের পরিবর্তে সাধারণ ও কার্যকরী রূপচর্চার নিয়ম সহজ বাংলায় তুলে ধরতে ভালোবাসেন।"
    },
    {
      id: "author-samia",
      name: "Samia Rahman",
      role: "Senior Beauty & Cosmetic Formulation Specialist",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
      bio: "সামিয়া রহমান (Samia Rahman) একজন অভিজ্ঞ বিউটি রিসার্চার এবং এশিয়ান স্কিনকেয়ার বিশেষজ্ঞ। আন্তর্জাতিক কসমেটিক্স ফর্মুলেশন, হাইড্রেটিং স্কিনকেয়ার রুটিন এবং ট্রপিক্যাল আবহাওয়ায় মানানসই মেকআপ টেকনিক নিয়ে তিনি দীর্ঘ ৬+ বছর ধরে গবেষণাধর্মী প্রসাধনী গাইড লিখছেন।"
    }
  ];

  const { error: authorErr } = await supabase
    .from("store_settings")
    .upsert({ key: "blog_authors_store", value: cleanAuthors }, { onConflict: "key" });

  if (authorErr) {
    console.error("Error updating blog authors:", authorErr);
  } else {
    console.log("✓ Successfully updated blog_authors_store with non-clinical author profiles.");
  }

  // 2. Fetch and Clean Blog Posts
  const { data: blogStore } = await supabase.from("store_settings").select("value").eq("key", "blog_posts_store").single();
  const posts = blogStore?.value || [];

  for (let post of posts) {
    // A. Clean author reference if Dr. Samia
    if (post.author?.name?.includes("Dr. Samia") || post.authorName?.includes("Dr. Samia")) {
      post.authorName = "Samia Rahman";
      if (post.author) {
        post.author.name = "Samia Rahman";
        post.author.role = "Senior Beauty & Cosmetic Formulation Specialist";
      }
    }

    // B. Clean Hair Care Article
    if (post.slug === "complete-hair-care-routine-silky-strong-hair-bangladesh") {
      post.title = "চুলকে রেশমি, নরম ও ঝলমলে রাখার সহজ ও নিয়মিত হেয়ার কেয়ার রুটিন (সম্পূর্ণ গাইড ২০২৬)";
      post.excerpt = "নিয়মিত তেল মালিশ, জেন্টল শ্যাম্পু এবং হাইড্রেটিং কন্ডিশনার ব্যবহারের মাধ্যমে কীভাবে চুলকে সিল্কি, নরম ও ম্যানেজেবল রাখবেন — জেনে নিন সহজ ধাপগুলো।";
      post.meta_title = "সিল্কি ও উজ্জ্বল চুলের সহজ ঘরোয়া ও প্রসাধনী হেয়ার কেয়ার রুটিন | Blush & Budget";
      post.meta_description = "চুলকে রেশমি, নরম ও চকচকে রাখার সঠিক হেয়ার কেয়ার গাইড। তেল মালিশ, সঠিক শ্যাম্পু ও কন্ডিশনিংয়ের মাধ্যমে চুলের সহজ পরিচর্যা।";
      post.content = post.content
        .replace(/চুল পড়া বন্ধ/g, "চুলের পুষ্টি ও রেশমি ভাব বৃদ্ধি")
        .replace(/চুল পড়া কমিয়ে/g, "চুলকে রেশমি ও আকর্ষণীয় করে")
        .replace(/চুল পড়া/g, "চুলের শুষ্কতা ও জট লাগা")
        .replace(/চিকিৎসা/g, "পরিচর্যা")
        .replace(/রোগ/g, "সমস্যা");
    }

    // C. Clean Sunscreen Guide
    if (post.slug === "sunscreen-buying-guide-proper-usage-bangladesh") {
      post.content = post.content
        .replace(/ব্রণ দূর/g, "ত্বক ফ্রেশ রাখা")
        .replace(/ব্রণ/g, "অতিরিক্ত তেল বা চটচটে ভাব")
        .replace(/ত্বকের রোগ/g, "রোদে পোড়া দাগ")
        .replace(/চিকিৎসা/g, "রূপচর্চা");
    }

    // D. Clean Dry Skin Guide
    if (post.slug === "dry-skin-deep-hydration-hyaluronic-acid-guide") {
      post.content = post.content
        .replace(/ব্যারিয়ার রিপেয়ার/g, "ডিপ ময়েশ্চারাইজিং ও হাইড্রেটিং কেয়ার")
        .replace(/স্কিন ব্যারিয়ার ক্ষতিগ্রস্ত/g, "ত্বক খসখসে বা ডিহাইড্রেটেড")
        .replace(/চিকিৎসা/g, "নিয়মিত যত্ন")
        .replace(/প্রদাহ/g, "অস্বস্তি বা টানটান ভাব");
    }

    // E. Clean Oily Skin Guide
    if (post.slug === "oily-skin-summer-care-routine-bangladesh") {
      post.content = post.content
        .replace(/ব্রণের চিকিৎসা/g, "অয়েল ব্যালান্সিং কেয়ার")
        .replace(/ব্রণ/g, "অতিরিক্ত তেলতেলে ভাব")
        .replace(/ইনফ্লামেশন/g, "লালচে বা গরম ভাব")
        .replace(/প্রদাহ/g, "অস্বস্তি");
    }

    // F. Clean Niacinamide & Centella Guide
    if (post.slug === "niacinamide-and-centella-serum-skincare-guide-bangladesh") {
      post.content = post.content
        .replace(/ব্রণ দূর/g, "স্কিন টেক্সচার স্মুথ")
        .replace(/ইনফ্লামেশন/g, "ত্বকের সতেজতা")
        .replace(/প্রদাহ/g, "অস্বস্তি")
        .replace(/রোগ/g, "দাগছোপ");
    }

    // G. Clean Test Blog Post
    if (post.slug === "test-blog-post-for-ecommerce-website-blush-and-budget") {
      post.title = "Essential Guide to Daily Skincare Layering for a Fresh Radiant Finish";
      post.excerpt = "Learn how to layer your cleanser, toner, serum, and sunscreen effectively for maximum hydration and a comfortable, lightweight feel.";
      post.content = post.content
        .replace(/post-acne dark marks/g, "uneven skin tone")
        .replace(/acne/g, "blemishes")
        .replace(/Dermatologist Pro Tip/g, "Beauty Routine Pro Tip")
        .replace(/dermatologist/g, "beauty specialist")
        .replace(/clinical/g, "cosmetic");
    }
  }

  const { error: blogErr } = await supabase
    .from("store_settings")
    .upsert({ key: "blog_posts_store", value: posts }, { onConflict: "key" });

  if (blogErr) {
    console.error("Error updating blog posts:", blogErr);
  } else {
    console.log("✓ Successfully updated all 12 blog posts in blog_posts_store.");
  }

  console.log("=== PHASE 2 COMPLETE ===");
}

cleanBlogData().catch(console.error);
