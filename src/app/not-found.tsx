import Link from "next/link";
import { Search, Home, ShoppingBag, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/shared/ui/button";

export const metadata = {
  title: "404 - Page Not Found | Azonno",
  description: "The page you are looking for does not exist or has been moved. Explore 100% authentic skincare and beauty products at Azonno.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFoundPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="max-w-xl w-full text-center space-y-6">
        {/* Visual Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-black tracking-wide uppercase">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Page Not Found (404 Error)</span>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
            Oops! Page Not Found
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto leading-relaxed">
            The page you are looking for may have been moved or removed or the link is broken. Please use the search bar below. box use  your desired Authentic Casual Wear  Apparel Products Search।
          </p>
        </div>

        {/* Search Input Bar */}
        <form action="/products" method="GET" className="max-w-md mx-auto">
          <div className="relative flex items-center">
            <input
              type="text"
              name="search"
              placeholder="Products  Brand Name   ..."
              className="w-full h-12 pl-11 pr-24 rounded-2xl border-2 border-teal-200 focus:border-teal-500 focus:outline-none text-xs sm:text-sm font-medium transition-all shadow-sm"
            />
            <Search className="absolute left-3.5 h-4 w-4 text-gray-400" />
            <button
              type="submit"
              className="absolute right-1.5 h-9 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
               
            </button>
          </div>
        </form>

        {/* Quick Category Navigation Pills */}
        <div className="space-y-2 pt-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Popular Categories
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/categories/skincare"
              className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-teal-50 hover:text-teal-700 text-gray-700 text-xs font-bold transition-colors"
            >
              ✨ Casual Wear (Skincare)
            </Link>
            <Link
              href="/categories/sunscreen"
              className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-teal-50 hover:text-teal-700 text-gray-700 text-xs font-bold transition-colors"
            >
              ☀️ Panjabi (Sunscreen)
            </Link>
            <Link
              href="/categories/haircare"
              className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-teal-50 hover:text-teal-700 text-gray-700 text-xs font-bold transition-colors"
            >
              💇‍♀️   (Haircare)
            </Link>
            <Link
              href="/categories/makeup"
              className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-teal-50 hover:text-teal-700 text-gray-700 text-xs font-bold transition-colors"
            >
              💄 Apparel (Makeup)
            </Link>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link href="/" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto h-11 px-6 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold flex items-center justify-center gap-2">
              <Home className="h-4 w-4" />
              <span>Back to Homepage</span>
            </Button>
          </Link>
          <Link href="/products" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto h-11 px-6 rounded-xl border-teal-300 text-teal-700 hover:bg-teal-50 text-xs font-bold flex items-center justify-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span>All Products  </span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
