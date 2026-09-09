"use client";

import Link from "next/link";
import {
  Clock,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Share2,
  Tag,
  BookOpen,
  ArrowLeft,
} from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { ShoppableArticleProducts } from "@/features/blog/components/shoppable-article-products";
import { RichArticleRenderer } from "@/components/blog/rich-article-renderer";

interface BlogPostClientProps {
  post: any;
  shoppableProducts: any[];
  relatedPosts: any[];
}

export function BlogPostClient({
  post,
  shoppableProducts,
  relatedPosts,
}: BlogPostClientProps) {
  const { language, toBn } = useLanguage();
  const isBn = language === "bn";

  return (
    <div className="container-main py-4 sm:py-8 md:py-10 space-y-6 sm:space-y-8 max-w-4xl px-3 sm:px-6 lg:px-8">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-text-muted overflow-x-auto no-scrollbar py-1">
        <Link href="/" className="hover:text-text shrink-0 transition-colors">
          {isBn ? "হোম" : "Home"}
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0 text-zinc-400" />
        <Link href="/blog" className="hover:text-text shrink-0 transition-colors">
          {isBn ? "বিউটি জার্নাল" : "Beauty Journal"}
        </Link>
        {post.category && (
          <>
            <ChevronRight className="h-3 w-3 shrink-0 text-zinc-400" />
            <Link
              href={`/blog?category=${post.category.slug}`}
              className="hover:text-text shrink-0 transition-colors whitespace-nowrap"
            >
              {post.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3 w-3 shrink-0 text-zinc-400" />
        <span className="text-text font-bold truncate max-w-36 sm:max-w-xs md:max-w-md">
          {post.title}
        </span>
      </nav>

      {/* Article Header */}
      <header className="space-y-3.5 sm:space-y-4">
        {post.category && (
          <span className="inline-block bg-pink-50 text-[#e91e63] font-bold text-xs px-3 py-1 rounded-full border border-pink-200">
            {post.category.name}
          </span>
        )}

        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-black text-text tracking-tight leading-snug sm:leading-tight break-words">
          {post.title}
        </h1>

        <p className="text-sm sm:text-base md:text-lg text-text-secondary leading-relaxed font-normal break-words">
          {post.excerpt}
        </p>

        {/* Author Byline Strip (E-E-A-T Indicator) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4.5 rounded-2xl bg-surface-secondary/60 border border-border/80">
          {post.author ? (
            <Link
              href={`/author/${post.author.slug}`}
              className="flex items-center gap-3 group hover:opacity-90 transition-opacity"
            >
              {post.author.avatar_url ? (
                <img
                  src={post.author.avatar_url}
                  alt={post.author.name}
                  className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover border-2 border-pink-200 shrink-0"
                />
              ) : (
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-pink-100 flex items-center justify-center text-[#e91e63] font-bold text-sm shrink-0">
                  {post.author.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm sm:text-base font-bold text-text group-hover:text-primary-600 transition-colors">
                    {post.author.name}
                  </span>
                  {post.author.is_verified_expert && (
                    <span className="inline-flex items-center gap-0.5 text-[11px] sm:text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> {isBn ? "ভেরিফায়েড বিশেষজ্ঞ" : "Verified Expert"}
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-text-muted truncate max-w-60 sm:max-w-xs">{post.author.job_title}</p>
              </div>
            </Link>
          ) : (
            <span className="text-xs sm:text-sm text-text-muted">
              {isBn ? "ব্লাশ অ্যান্ড বাজেট বিউটি টিম" : "By Blush & Budget Beauty Team"}
            </span>
          )}

          <div className="flex items-center gap-3 text-xs sm:text-sm text-text-muted pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4 shrink-0" />
              {isBn ? `${toBn(post.reading_time_minutes || 4)} মিনিট পাঠ` : `${post.reading_time_minutes || 4} min read`}
            </span>
            <span>•</span>
            <span>
              {new Date(post.published_at || post.created_at).toLocaleDateString(isBn ? "bn-BD" : "en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </header>

      {/* Featured Banner Image */}
      {post.featured_image && (
        <div className="rounded-2xl sm:rounded-3xl overflow-hidden border border-border shadow-card bg-zinc-100 aspect-video relative max-w-full">
          <img
            src={post.featured_image}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Article Body Content with Rich UI/UX Markdown Rendering */}
      <article className="space-y-4 sm:space-y-6 pt-1 max-w-full overflow-hidden">
        <RichArticleRenderer content={post.content} />
      </article>

      {/* Tags Strip */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-4 pb-2 border-t border-border">
          <span className="text-xs font-bold text-text-muted flex items-center gap-1">
            <Tag className="h-3.5 w-3.5 text-pink-600" />
            {isBn ? "ট্যাগসমূহ:" : "Tags:"}
          </span>
          {post.tags.map((tag: string, idx: number) => (
            <Link
              key={idx}
              href={`/blog?tag=${encodeURIComponent(tag)}`}
              className="rounded-lg bg-surface-secondary hover:bg-pink-50 hover:text-[#e91e63] border border-border px-2.5 py-1 text-xs font-semibold text-text-secondary transition-all"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {/* Shoppable Products Mentioned In-Article */}
      {shoppableProducts && shoppableProducts.length > 0 && (
        <ShoppableArticleProducts
          products={shoppableProducts}
          articleTitle={post.title}
        />
      )}

      {/* Author Bio Box (E-E-A-T Authority Box) */}
      {post.author && (
        <div className="rounded-2xl sm:rounded-3xl border border-border bg-white p-5 sm:p-8 shadow-card flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          {post.author.avatar_url ? (
            <img
              src={post.author.avatar_url}
              alt={post.author.name}
              className="h-14 w-14 sm:h-20 sm:w-20 rounded-2xl object-cover border-2 border-pink-200 shrink-0"
            />
          ) : (
            <div className="h-14 w-14 sm:h-20 sm:w-20 rounded-2xl bg-pink-100 flex items-center justify-center text-[#e91e63] font-black text-xl shrink-0">
              {post.author.name.charAt(0)}
            </div>
          )}
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm text-text-muted uppercase font-bold tracking-wide">
                {isBn ? "লেখক" : "Written By"}
              </span>
              <span className="text-xs font-bold text-text">•</span>
              <Link
                href={`/author/${post.author.slug}`}
                className="text-base sm:text-lg font-bold text-text hover:text-primary-600 transition-colors"
              >
                {post.author.name}
              </Link>
            </div>
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">{post.author.bio}</p>
            <Link
              href={`/author/${post.author.slug}`}
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#e91e63] hover:underline pt-1"
            >
              {isBn ? "লেখকের প্রোফাইল ও সকল আর্টিকেল দেখুন →" : "View Author Profile & All Articles →"}
            </Link>
          </div>
        </div>
      )}

      {/* Related Articles Strip */}
      {relatedPosts && relatedPosts.length > 0 && (
        <div className="space-y-4 pt-8 border-t border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-text flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#e91e63]" />
              {isBn ? "সম্পর্কিত অন্যান্য ব্লগ গাইড" : "More Guides You May Like"}
            </h3>
            <Link
              href="/blog"
              className="text-xs font-bold text-[#e91e63] hover:underline"
            >
              {isBn ? "সব ব্লগ দেখুন →" : "View All Blogs →"}
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {relatedPosts.map((rp) => (
              <Link
                key={rp.id}
                href={`/blog/${rp.slug}`}
                className="rounded-2xl border border-border/80 bg-white p-3.5 sm:p-4 shadow-card hover:shadow-lg hover:border-pink-200 transition-all flex items-center gap-3.5 group overflow-hidden"
              >
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl overflow-hidden shrink-0 bg-pink-50 border border-pink-100 relative shadow-2xs">
                  {rp.featured_image ? (
                    <img
                      src={rp.featured_image}
                      alt={rp.title}
                      className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-[#e91e63]">
                      <BookOpen className="h-7 w-7" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold text-[#e91e63]">
                    <span className="bg-pink-50 border border-pink-100 px-2 py-0.5 rounded-full truncate">
                      {rp.category?.name || "Skincare"}
                    </span>
                    {rp.reading_time_minutes && (
                      <span className="text-text-muted font-normal">
                        • {isBn ? `${toBn(rp.reading_time_minutes)} মিনিট` : `${rp.reading_time_minutes} min`}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-text group-hover:text-[#e91e63] transition-colors line-clamp-2 leading-snug">
                    {rp.title}
                  </h4>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
