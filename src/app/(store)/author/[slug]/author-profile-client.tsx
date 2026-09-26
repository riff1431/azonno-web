"use client";

import Link from "next/link";
import {
  ShieldCheck,
  Globe,
  Clock,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { useLanguage } from "@/context/language-context";

interface AuthorProfileClientProps {
  author: any;
  authorPosts: any[];
}

export function AuthorProfileClient({ author, authorPosts }: AuthorProfileClientProps) {
  const { language, toBn } = useLanguage();
  const isBn = language === "bn";
  const socialLinks = (author.social_links || {}) as Record<string, string | undefined>;

  return (
    <div className="container-main py-6 sm:py-10 space-y-8">
      {/* Breadcrumb Bar */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-text-muted">
        <Link href="/" className="hover:text-text transition-colors">
          {isBn ? "" : "Home"}
        </Link>
        <ChevronRight className="h-3 w-3 text-zinc-400" />
        <Link href="/blog" className="hover:text-text transition-colors">
          {isBn ? "items " : "Editorial Journal"}
        </Link>
        <ChevronRight className="h-3 w-3 text-zinc-400" />
        <span className="text-text font-bold">{author.name}</span>
      </nav>

      {/* Author Profile Bio Card */}
      <div className="rounded-3xl border border-border bg-white p-6 sm:p-10 shadow-card flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
        {author.avatar_url ? (
          <img
            src={author.avatar_url}
            alt={author.name}
            className="h-24 w-24 sm:h-32 sm:w-32 rounded-3xl object-cover border-4 border-primary-100 shadow-md shrink-0"
          />
        ) : (
          <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-3xl bg-primary-100 flex items-center justify-center text-primary-600 font-black text-3xl shrink-0">
            {author.name.charAt(0)}
          </div>
        )}

        <div className="space-y-3 flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-text">{author.name}</h1>
            {author.is_verified_expert && (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                {isBn ? " items " : "Verified Beauty Expert"}
              </span>
            )}
          </div>

          <p className="text-sm sm:text-base font-semibold text-[#1D6474]">{author.job_title}</p>

          <p className="text-sm sm:text-base md:text-[17px] text-text-secondary leading-relaxed max-w-2xl">
            {author.bio}
          </p>

          {/* Social Links */}
          {author.social_links && (
            <div className="flex items-center justify-center sm:justify-start gap-3 pt-2">
              {socialLinks.instagram && (
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 w-9 rounded-full bg-teal-50/60 text-[#1D6474] flex items-center justify-center hover:bg-teal-100/70 transition-colors font-bold text-xs"
                  aria-label="Instagram"
                >
                  <span>IG</span>
                </a>
              )}
              {socialLinks.linkedin && (
                <a
                  href={socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 w-9 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center hover:bg-blue-100 transition-colors font-bold text-xs"
                  aria-label="LinkedIn"
                >
                  <span>IN</span>
                </a>
              )}
              {socialLinks.website && (
                <a
                  href={socialLinks.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 w-9 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center hover:bg-gray-200 transition-colors"
                  aria-label="Website"
                >
                  <Globe className="h-4 w-4" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Author's Published Articles */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-text">
            {isBn ? `${author.name}-  items (${toBn(authorPosts.length)})` : `Articles by ${author.name} (${authorPosts.length})`}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {authorPosts.map((post) => (
            <article
              key={post.id}
              className="rounded-3xl border border-border bg-white overflow-hidden shadow-card hover:shadow-lg transition-all flex flex-col group"
            >
              {post.featured_image && (
                <Link
                  href={`/blog/${post.slug}`}
                  className="relative h-48 w-full overflow-hidden bg-zinc-100 block"
                >
                  <img
                    src={post.featured_image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {post.category && (
                    <span className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full">
                      {post.category.name}
                    </span>
                  )}
                </Link>
              )}

              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-3.5">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{isBn ? `${toBn(post.reading_time_minutes)}  ` : `${post.reading_time_minutes} min read`}</span>
                  </div>

                  <Link href={`/blog/${post.slug}`}>
                    <h3 className="text-base sm:text-lg font-bold text-text group-hover:text-primary-600 transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </h3>
                  </Link>

                  <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>

                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#1D6474] pt-2"
                >
                  {isBn ? "itemsitems " : "Read Article"} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
