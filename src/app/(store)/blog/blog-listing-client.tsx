"use client";

import Link from "next/link";
import { Clock, User, BookOpen, ArrowRight } from "lucide-react";
import { useLanguage } from "@/context/language-context";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  featured_image?: string | null;
  reading_time_minutes?: number | null;
  category?: { name: string; slug: string } | null;
  author?: { name: string; slug: string; job_title?: string | null; avatar_url?: string | null } | null;
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

interface BlogListingClientProps {
  posts: BlogPost[];
  categories: BlogCategory[];
  activeCategory?: string;
}

export function BlogListingClient({
  posts,
  categories,
  activeCategory,
}: BlogListingClientProps) {
  const { language, t, toBn } = useLanguage();

  const featuredPost = posts[0];
  const remainingPosts = posts.slice(1);

  return (
    <div className="container-main py-6 sm:py-10 space-y-10">
      {/* Header Banner */}
      <div className="rounded-3xl bg-linear-to-r from-zinc-900 via-purple-950 to-zinc-900 text-white p-8 sm:p-12 shadow-xl border border-zinc-800 space-y-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#e91e63] animate-pulse" />
          <span className="text-[11px] font-bold text-pink-300 bg-pink-500/20 px-3 py-1 rounded-full border border-pink-500/30 uppercase tracking-wider">
            {language === "bn" ? "ভেরিফাইড স্কিনকেয়ার সায়েন্স ও বিউটি গাইড" : "Verified Skincare Science & Beauty Guides"}
          </span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
          {t("blog", "title")}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
          {t("blog", "subtitle")}
        </p>

        {/* Category Pills Strip */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-4">
          <Link
            href="/blog"
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
              !activeCategory
                ? "bg-[#e91e63] text-white shadow-md"
                : "bg-white/10 text-zinc-200 hover:bg-white/20"
            }`}
          >
            {language === "bn" ? "সকল আর্টিকেল" : "All Articles"}
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/blog?category=${cat.slug}`}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
                activeCategory === cat.slug
                  ? "bg-[#e91e63] text-white shadow-md"
                  : "bg-white/10 text-zinc-200 hover:bg-white/20"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Hero Featured Article */}
      {featuredPost && (
        <div className="rounded-3xl border border-border bg-white overflow-hidden shadow-card hover:shadow-xl transition-all group">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            <div className="lg:col-span-7 relative min-h-75 sm:min-h-100 overflow-hidden bg-zinc-100">
              {featuredPost.featured_image ? (
                <img
                  src={featuredPost.featured_image}
                  alt={featuredPost.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-muted">
                  <BookOpen className="h-16 w-16" />
                </div>
              )}
              <span className="absolute top-4 left-4 bg-black/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                {language === "bn" ? "ফিচার্ড গাইড" : "Featured Guide"}
              </span>
            </div>

            <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-xs text-text-muted">
                  <span className="font-bold text-[#e91e63]">
                    {featuredPost.category?.name || "Skincare"}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {toBn(featuredPost.reading_time_minutes || 3)} {t("blog", "minRead")}
                  </span>
                </div>

                <Link href={`/blog/${featuredPost.slug}`}>
                  <h2 className="text-xl sm:text-2xl font-black text-text group-hover:text-[#e91e63] transition-colors leading-snug">
                    {featuredPost.title}
                  </h2>
                </Link>

                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed line-clamp-3">
                  {featuredPost.excerpt}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                {featuredPost.author && (
                  <Link
                    href={`/author/${featuredPost.author.slug}`}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  >
                    {featuredPost.author.avatar_url ? (
                      <img
                        src={featuredPost.author.avatar_url}
                        alt={featuredPost.author.name}
                        className="h-10 w-10 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xs">
                        {featuredPost.author.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-text">{featuredPost.author.name}</p>
                      <p className="text-[10px] text-text-muted truncate max-w-37.5">
                        {featuredPost.author.job_title}
                      </p>
                    </div>
                  </Link>
                )}

                <Link
                  href={`/blog/${featuredPost.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#e91e63] group-hover:translate-x-1 transition-transform"
                >
                  {t("blog", "readArticle")} <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Remaining Articles */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-text">
            {language === "bn" ? "সাম্প্রতিক আর্টিকেল ও গাইড" : "Latest Articles & Guides"}
          </h2>
          <span className="text-xs text-text-muted">
            {toBn(posts.length)} {language === "bn" ? "টি আর্টিকেল রয়েছে" : "articles available"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {remainingPosts.map((post) => (
            <article
              key={post.id}
              className="rounded-3xl border border-border bg-white overflow-hidden shadow-card hover:shadow-lg transition-all flex flex-col group"
            >
              <Link
                href={`/blog/${post.slug}`}
                className="relative h-48 w-full overflow-hidden bg-zinc-100 block"
              >
                {post.featured_image ? (
                  <img
                    src={post.featured_image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-muted">
                    <BookOpen className="h-10 w-10" />
                  </div>
                )}
                {post.category && (
                  <span className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    {post.category.name}
                  </span>
                )}
              </Link>

              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{toBn(post.reading_time_minutes || 3)} {t("blog", "minRead")}</span>
                  </div>

                  <Link href={`/blog/${post.slug}`}>
                    <h3 className="text-base sm:text-lg font-bold text-text group-hover:text-[#e91e63] transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </h3>
                  </Link>

                  <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>

                <div className="pt-3.5 border-t border-border flex items-center justify-between text-xs sm:text-sm">
                  {post.author ? (
                    <Link
                      href={`/author/${post.author.slug}`}
                      className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-text-secondary hover:text-text truncate"
                    >
                      <User className="h-4 w-4 text-text-muted shrink-0" />
                      <span className="truncate">{post.author.name}</span>
                    </Link>
                  ) : null}

                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-xs sm:text-sm font-bold text-[#e91e63] shrink-0"
                  >
                    {t("blog", "readArticle")} &rarr;
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {posts.length === 0 && (
        <div className="rounded-3xl border border-dashed border-border bg-white p-12 sm:p-16 text-center space-y-4 shadow-card">
          <BookOpen className="h-12 w-12 text-[#e91e63] mx-auto opacity-70" />
          <h3 className="text-base font-bold text-text">
            {language === "bn" ? "কোনো আর্টিকেল প্রকাশিত হয়নি" : "No articles published yet"}
          </h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
            {language === "bn"
              ? "আমাদের বিউটি এডিটোরিয়াল টিম নতুন নতুন স্কিনকেয়ার গাইড তৈরি করছে। শীঘ্রই আবার চেক করুন!"
              : "Our beauty editorial team is crafting expert skincare guides, ingredient breakdowns, and routine advice. Check back soon!"}
          </p>
        </div>
      )}
    </div>
  );
}
