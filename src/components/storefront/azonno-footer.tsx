"use client";

import React from "react";
import Link from "next/link";
import {
  Truck,
  RotateCcw,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
} from "lucide-react";
import { AzonnoHeaderLogo } from "@/components/ui/azonno-logo";

export function AzonnoFooter() {
  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 pb-20 lg:pb-0">
      {/* 1. Value Badges Bar */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 py-6 sm:py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#1D6474]/20 border border-[#1D6474]/40 flex items-center justify-center text-[#2DD4BF] shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">Fast Delivery</h4>
              <p className="text-[10px] sm:text-xs text-slate-400">24-48h in Dhaka • Nationwide COD</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#1D6474]/20 border border-[#1D6474]/40 flex items-center justify-center text-[#2DD4BF] shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">7-Day Exchanges</h4>
              <p className="text-[10px] sm:text-xs text-slate-400">Hassle-free size and style exchange</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#1D6474]/20 border border-[#1D6474]/40 flex items-center justify-center text-[#2DD4BF] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">100% Authentic</h4>
              <p className="text-[10px] sm:text-xs text-slate-400">Combed cotton, linen & rich silk</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#1D6474]/20 border border-[#1D6474]/40 flex items-center justify-center text-[#2DD4BF] shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">Cash on Delivery</h4>
              <p className="text-[10px] sm:text-xs text-slate-400">Available across all 64 districts</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10">
          {/* Brand Col (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="inline-block bg-white p-2.5 rounded-xl shadow-xs">
              <AzonnoHeaderLogo />
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              Azonno is Bangladesh's contemporary apparel label, delivering tailored menswear and graceful women's silhouettes crafted from premium natural cotton, linen, and silk.
            </p>

            <div className="pt-2 flex items-center gap-3 text-slate-400">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-[#1D6474] hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-[#1D6474] hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Men's Links */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white mb-4 border-b border-slate-800 pb-2">
              Men's Apparel
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="/category/casual-shirt" className="hover:text-[#2DD4BF] transition-colors">
                  Casual Oxford Shirts
                </Link>
              </li>
              <li>
                <Link href="/category/panjabi" className="hover:text-[#2DD4BF] transition-colors">
                  Festive Jacquard Panjabi
                </Link>
              </li>
              <li>
                <Link href="/category/polo-t-shirts" className="hover:text-[#2DD4BF] transition-colors">
                  Piqué Cotton Polos
                </Link>
              </li>
              <li>
                <Link href="/category/t-shirts" className="hover:text-[#2DD4BF] transition-colors">
                  Heavyweight Street Tees
                </Link>
              </li>
              <li>
                <Link href="/category/denim-jeans" className="hover:text-[#2DD4BF] transition-colors">
                  Selvedge Denim & Chinos
                </Link>
              </li>
            </ul>
          </div>

          {/* Women's Links */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white mb-4 border-b border-slate-800 pb-2">
              Women & Girls
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="/category/women-coords" className="hover:text-[#2DD4BF] transition-colors">
                  Two-Piece Co-ord Sets
                </Link>
              </li>
              <li>
                <Link href="/category/women-kurtis" className="hover:text-[#2DD4BF] transition-colors">
                  Embroidered Lawn Kurtis
                </Link>
              </li>
              <li>
                <Link href="/category/salwar-kameez" className="hover:text-[#2DD4BF] transition-colors">
                  Festive 3-Piece Salwar Suits
                </Link>
              </li>
              <li>
                <Link href="/category/women-tops" className="hover:text-[#2DD4BF] transition-colors">
                  Draped Fusion Tops & Tunics
                </Link>
              </li>
              <li>
                <Link href="/category/women-bottoms" className="hover:text-[#2DD4BF] transition-colors">
                  Linen Trousers & Culottes
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care & Help */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white mb-4 border-b border-slate-800 pb-2">
              Customer Help
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="/track-order" className="hover:text-[#2DD4BF] transition-colors">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-[#2DD4BF] transition-colors">
                  My Profile & Orders
                </Link>
              </li>
              <li>
                <Link href="/pages/shipping-policy" className="hover:text-[#2DD4BF] transition-colors">
                  Shipping Rates & Timelines
                </Link>
              </li>
              <li>
                <Link href="/pages/return-policy" className="hover:text-[#2DD4BF] transition-colors">
                  7-Day Return Policy
                </Link>
              </li>
              <li>
                <Link href="/pages/size-guide" className="hover:text-[#2DD4BF] transition-colors">
                  Size Guide & Measurements
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 3. Bottom Legal & Payment Bar */}
      <div className="border-t border-slate-900 bg-black/40 py-6 px-4 sm:px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Azonno Bangladesh. All rights reserved. Premium Clothing Label.</p>
          <div className="flex items-center gap-3 text-slate-400 font-semibold text-[11px]">
            <span>Cash on Delivery</span>
            <span>•</span>
            <span>bKash</span>
            <span>•</span>
            <span>Nagad</span>
            <span>•</span>
            <span>Visa / MasterCard</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
