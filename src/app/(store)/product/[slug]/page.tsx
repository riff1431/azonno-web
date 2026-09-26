"use client";

import React, { useState, useMemo, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import {
  Heart,
  ShoppingBag,
  Truck,
  RefreshCw,
  ShieldCheck,
  ChevronRight,
  Star,
  Check,
  Ruler,
  Share2,
} from "lucide-react";
import { AZONNO_PRODUCTS, ClothingProduct, ClothingColor } from "@/data/clothing-catalog";
import { AzonnoProductCard } from "@/components/storefront/azonno-product-card";
import { useCart } from "@/context/cart-context";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const router = useRouter();

  const product = useMemo(() => {
    return AZONNO_PRODUCTS.find((p) => p.slug === slug) || null;
  }, [slug]);

  if (!product) {
    notFound();
  }

  const [activeImage, setActiveImage] = useState(product.primaryImage);
  const [selectedColor, setSelectedColor] = useState<ClothingColor>(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "sizing" | "delivery">("details");

  const { addItem, openCart } = useCart();

  const handleAddToCart = () => {
    addItem(
      {
        id: `${product.id}-${selectedSize}-${selectedColor?.name || "default"}`,
        product_id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        regular_price: product.regularPrice,
        image_url: activeImage,
        sku: product.sku,
        variant_label: `${selectedColor?.name ? selectedColor.name + " / " : ""}${selectedSize}`,
      },
      quantity
    );

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      openCart();
    }, 400);
  };

  const handleBuyNow = () => {
    addItem(
      {
        id: `${product.id}-${selectedSize}-${selectedColor?.name || "default"}`,
        product_id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        regular_price: product.regularPrice,
        image_url: activeImage,
        sku: product.sku,
        variant_label: `${selectedColor?.name ? selectedColor.name + " / " : ""}${selectedSize}`,
      },
      quantity
    );

    router.push("/checkout");
  };

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    // 1st priority: same category and exact same gender
    const sameCat = AZONNO_PRODUCTS.filter(
      (p) =>
        p.id !== product.id &&
        p.gender === product.gender &&
        (p.categorySlug === product.categorySlug || p.subCategory === product.subCategory)
    );
    if (sameCat.length >= 4) return sameCat.slice(0, 4);

    // 2nd priority: other products of the EXACT SAME GENDER (NEVER show opposite gender)
    const sameGender = AZONNO_PRODUCTS.filter(
      (p) => p.id !== product.id && p.gender === product.gender && !sameCat.some((sc) => sc.id === p.id)
    );
    return [...sameCat, ...sameGender].slice(0, 4);
  }, [product]);

  return (
    <main className="min-h-screen bg-[#FDFDFD] pb-20">
      {/* Breadcrumb */}
      <div className="bg-slate-50 border-b border-slate-200 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link href="/" className="hover:text-[#1D6474]">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link
              href={product.gender === "women" ? "/category/women-coords" : "/shop"}
              className="hover:text-[#1D6474]"
            >
              {product.category || (product.gender === "women" ? "Women" : "Men")}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link
              href={`/category/${product.categorySlug || product.subCategory.toLowerCase().replace(/\s+/g, "-")}`}
              className="hover:text-[#1D6474]"
            >
              {product.subCategory}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[#1D6474] font-bold truncate max-w-[200px]">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      {/* Main Product Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left: Gallery (5 cols) */}
          <div className="lg:col-span-6 flex flex-col-reverse sm:flex-row gap-4">
            {/* Thumbnail selector */}
            <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto max-h-[520px]">
              {product.galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`relative w-16 h-20 sm:w-20 sm:h-24 rounded-md overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    activeImage === img ? "border-[#1D6474] shadow-md scale-102" : "border-slate-200 opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image src={img} alt={`${product.name} thumb ${idx + 1}`} fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>

            {/* Main Stage Image */}
            <div className="relative aspect-[3/4] flex-1 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
              <Image
                src={activeImage}
                alt={product.name}
                fill
                priority
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />

              {product.discountPercentage && (
                <div className="absolute top-3 left-3 bg-[#D97706] text-white text-xs font-bold px-2.5 py-1 rounded shadow-sm">
                  SAVE {product.discountPercentage}%
                </div>
              )}
            </div>
          </div>

          {/* Right: Product Info & Purchase (7 cols) */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            <div>
              {/* Category & SKU */}
              <div className="flex items-center justify-between gap-2 text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
                <span className="text-[#1D6474] font-extrabold">{product.subCategory}</span>
                <span className="font-mono text-slate-400">SKU: {product.sku}</span>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight mb-3">
                {product.name}
              </h1>

              {/* Rating & Reviews */}
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-200 flex-wrap">
                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4.5 h-4.5 ${i < Math.floor(product.rating) ? "fill-amber-400" : "fill-slate-200"}`}
                    />
                  ))}
                  <span className="ml-2 text-sm font-extrabold text-slate-800">{product.rating}</span>
                </div>
                <span className="text-slate-300">•</span>
                <span className="text-xs sm:text-sm text-slate-600 font-medium">
                  {product.reviewsCount} verified reviews
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md">
                  In Stock ({product.stockCount} available)
                </span>
              </div>

              {/* Price Container */}
              <div className="flex items-baseline gap-3.5 mb-6">
                <span className="text-3xl sm:text-4xl font-black text-[#1D6474]">
                  ৳ {product.price.toLocaleString("en-BD")}
                </span>
                {product.regularPrice > product.price && (
                  <span className="text-lg sm:text-xl text-slate-400 line-through font-medium">
                    ৳ {product.regularPrice.toLocaleString("en-BD")}
                  </span>
                )}
              </div>

              {/* Color Selector */}
              <div className="mb-6">
                <label className="block text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-800 mb-2.5">
                  Color: <span className="text-[#1D6474] normal-case font-bold">{selectedColor.name}</span>
                </label>
                <div className="flex items-center gap-3 flex-wrap">
                  {product.colors.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                        selectedColor.name === color.name
                          ? "border-[#1D6474] bg-teal-50/70 text-[#1D6474] ring-2 ring-[#1D6474]"
                          : "border-slate-300 text-slate-700 hover:border-slate-500"
                      }`}
                    >
                      <span
                        className="w-4.5 h-4.5 rounded-full border border-slate-300 shadow-xs"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span>{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selector with Size Guide */}
              <div className="mb-7">
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-800">
                    Select Size: <span className="text-[#1D6474]">{selectedSize}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveTab("sizing")}
                    className="flex items-center gap-1.5 text-xs sm:text-sm text-[#1D6474] font-bold hover:underline cursor-pointer"
                  >
                    <Ruler className="w-4 h-4" /> Size Chart (Inches)
                  </button>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {product.sizes.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`w-14 h-12 rounded-lg text-sm font-black border transition-all cursor-pointer ${
                        selectedSize === sz
                          ? "bg-[#1D6474] text-white border-[#1D6474] shadow-md ring-2 ring-[#1D6474]/40"
                          : "bg-white text-slate-800 border-slate-300 hover:border-[#1D6474]"
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity & CTA Buttons */}
              <div className="space-y-3.5 mb-8">
                <div className="flex items-center gap-3.5">
                  {/* Quantity Counter */}
                  <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-4 py-3 text-slate-700 hover:bg-slate-200 font-black text-sm cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-4 py-3 text-sm font-black text-slate-900 min-w-[3rem] text-center">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="px-4 py-3 text-slate-700 hover:bg-slate-200 font-black text-sm cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  {/* Add to Cart */}
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className={`flex-1 py-3.5 px-6 rounded-lg font-black uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-md transition-all cursor-pointer ${
                      isAdded ? "bg-emerald-600 text-white" : "bg-[#1D6474] hover:bg-[#15515E] text-white"
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-5 h-5" /> Added to Shopping Bag
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-5 h-5" /> Add to Bag • ৳ {(product.price * quantity).toLocaleString("en-BD")}
                      </>
                    )}
                  </button>

                  {/* Wishlist toggle */}
                  <button
                    type="button"
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className={`p-3.5 rounded-lg border transition-colors cursor-pointer ${
                      isWishlisted
                        ? "bg-rose-50 border-rose-200 text-rose-600"
                        : "border-slate-300 text-slate-600 hover:border-slate-500"
                    }`}
                    title="Add to Wishlist"
                  >
                    <Heart className={`w-5 h-5 ${isWishlisted ? "fill-rose-500" : ""}`} />
                  </button>
                </div>

                {/* Direct Buy Now Button */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="w-full py-3.5 px-6 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-wider text-xs sm:text-sm rounded-lg shadow-lg transition-colors cursor-pointer"
                >
                  Instant Checkout (Cash on Delivery)
                </button>
              </div>

              {/* Delivery and Exchange Perks */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center gap-2.5">
                  <Truck className="w-4 h-4 text-[#1D6474] shrink-0" />
                  <span>
                    <strong>Inside Dhaka:</strong> ৳60 (24-48 Hours) • <strong>Outside Dhaka:</strong> ৳120 (2-4 Days)
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <RefreshCw className="w-4 h-4 text-[#1D6474] shrink-0" />
                  <span>7-Day Easy Exchange if size doesn&apos;t fit perfectly</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#1D6474] shrink-0" />
                  <span>100% Genuine Bangladeshi Brand • Checked Before Dispatch</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Tabs (Description, Sizing, Delivery) */}
        <div className="mt-14 pt-8 border-t border-slate-200">
          <div className="flex items-center gap-6 border-b border-slate-200 mb-6">
            <button
              onClick={() => setActiveTab("details")}
              className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "details"
                  ? "border-b-2 border-[#1D6474] text-[#1D6474]"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              Fabric & Details
            </button>
            <button
              onClick={() => setActiveTab("sizing")}
              className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "sizing"
                  ? "border-b-2 border-[#1D6474] text-[#1D6474]"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              Size Chart & Fit Guide
            </button>
            <button
              onClick={() => setActiveTab("delivery")}
              className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "delivery"
                  ? "border-b-2 border-[#1D6474] text-[#1D6474]"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              Delivery & Returns
            </button>
          </div>

          <div className="max-w-3xl text-sm text-slate-700 leading-relaxed">
            {activeTab === "details" && (
              <div className="space-y-4">
                <p>{product.description}</p>
                <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400">Fabric:</span>{" "}
                    <strong className="text-slate-800">{product.fabric}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Fit:</span>{" "}
                    <strong className="text-slate-800">{product.fit}</strong>
                  </div>
                </div>
                <ul className="space-y-1.5 list-disc list-inside text-xs text-slate-600">
                  {product.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            )}

            {activeTab === "sizing" && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  All measurements are given in inches. For a regular fit, order your usual size.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border border-slate-200">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase">
                      <tr>
                        <th className="p-2.5 border">Size</th>
                        <th className="p-2.5 border">Chest (Inch)</th>
                        <th className="p-2.5 border">Length (Inch)</th>
                        <th className="p-2.5 border">Sleeve (Inch)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="p-2.5 font-bold border">S</td>
                        <td className="p-2.5 border">38&quot;</td>
                        <td className="p-2.5 border">28&quot;</td>
                        <td className="p-2.5 border">24.5&quot;</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold border">M</td>
                        <td className="p-2.5 border">40&quot;</td>
                        <td className="p-2.5 border">29&quot;</td>
                        <td className="p-2.5 border">25&quot;</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold border">L</td>
                        <td className="p-2.5 border">42&quot;</td>
                        <td className="p-2.5 border">30&quot;</td>
                        <td className="p-2.5 border">25.5&quot;</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold border">XL</td>
                        <td className="p-2.5 border">44&quot;</td>
                        <td className="p-2.5 border">31&quot;</td>
                        <td className="p-2.5 border">26&quot;</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold border">XXL</td>
                        <td className="p-2.5 border">46&quot;</td>
                        <td className="p-2.5 border">32&quot;</td>
                        <td className="p-2.5 border">26.5&quot;</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "delivery" && (
              <div className="space-y-3 text-xs">
                <p>
                  <strong>Dhaka City:</strong> Delivery within 24 to 48 hours via Steadfast / Pathao Express.
                </p>
                <p>
                  <strong>All Bangladesh Districts:</strong> 2 to 4 working days with doorstep tracking.
                </p>
                <p>
                  <strong>Cash on Delivery (COD):</strong> Available for all 64 districts in Bangladesh.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Related Products Carousel */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-10 border-t border-slate-200">
            <h2 className="text-xl font-bold uppercase tracking-tight text-slate-900 mb-6">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {relatedProducts.map((p) => (
                <AzonnoProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
