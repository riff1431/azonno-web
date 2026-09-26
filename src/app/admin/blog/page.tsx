import Link from "next/link";
import { Plus, BookOpen, Clock, Eye, Edit, Trash2, ExternalLink, ShieldCheck } from "lucide-react";
import { getBlogPosts } from "@/features/blog/actions";
import { Button } from "@/components/shared/ui/button";

export default async function AdminBlogListPage() {
  const posts = await getBlogPosts({ status: undefined }); // all statuses

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4 bg-white p-6 rounded-3xl shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#1D6474] animate-pulse" />
            <span className="text-[11px] font-bold text-[#164E63] bg-teal-50/60 px-2.5 py-0.5 rounded-full border border-teal-200 uppercase">
              Content &amp; E-E-A-T Engine
            </span>
          </div>
          <h1 className="text-2xl font-bold text-text mt-1 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-[#1D6474]" />
            Blog Articles &amp; Skincare Guides
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Manage expert articles, routine guides, author credentials, and in-article shoppable product embeds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/blog" target="_blank">
            <Button variant="outline" size="sm" className="text-xs font-bold rounded-xl">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> View Blog
            </Button>
          </Link>
          <Link href="/admin/blog/create">
            <Button size="sm" className="bg-[#1D6474] hover:bg-[#164E63] text-white font-bold text-xs rounded-xl shadow-xs">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Write New Article
            </Button>
          </Link>
        </div>
      </div>

      {/* Posts Table */}
      <div className="rounded-3xl border border-border bg-white shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-secondary/70 border-b border-border text-text-muted font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Article</th>
                <th className="p-4">Category</th>
                <th className="p-4">Author</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Views</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-surface-secondary/40 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {post.featured_image ? (
                        <img
                          src={post.featured_image}
                          alt={post.title}
                          className="h-12 w-16 rounded-xl object-cover border border-border shrink-0"
                        />
                      ) : (
                        <div className="h-12 w-16 rounded-xl bg-surface-secondary flex items-center justify-center text-text-muted shrink-0">
                          <BookOpen className="h-5 w-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="font-bold text-text hover:text-primary-600 line-clamp-1 flex items-center gap-1"
                        >
                          {post.title}
                          <ExternalLink className="h-3 w-3 text-text-muted shrink-0" />
                        </Link>
                        <p className="text-[11px] text-text-muted truncate max-w-sm">
                          {post.excerpt}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="p-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-md bg-surface-secondary text-text-secondary font-semibold text-[11px] border border-border">
                      {post.category?.name || "Uncategorized"}
                    </span>
                  </td>

                  <td className="p-4 whitespace-nowrap">
                    {post.author ? (
                      <div className="flex items-center gap-2">
                        {post.author.avatar_url && (
                          <img
                            src={post.author.avatar_url}
                            alt={post.author.name}
                            className="h-6 w-6 rounded-full object-cover"
                          />
                        )}
                        <span className="font-semibold text-text">{post.author.name}</span>
                      </div>
                    ) : (
                      <span className="text-text-muted">Staff Editor</span>
                    )}
                  </td>

                  <td className="p-4 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                        post.status === "published"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {post.status}
                    </span>
                  </td>

                  <td className="p-4 text-center whitespace-nowrap">
                    <span className="font-mono font-bold text-text flex items-center justify-center gap-1">
                      <Eye className="h-3.5 w-3.5 text-text-muted" /> {post.view_count || 0}
                    </span>
                  </td>

                  <td className="p-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link href={`/blog/${post.slug}`} target="_blank">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4 text-text-secondary" />
                        </Button>
                      </Link>
                      <Link href={`/admin/blog/create?edit=${post.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4 text-primary-600" />
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
