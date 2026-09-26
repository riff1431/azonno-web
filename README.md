# Blush & Budget (ecomXbd)

A modern, high-performance E-Commerce platform built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase (PostgreSQL, Auth, RLS)**, engineered specifically for the Bangladesh market.

---

## ✨ Features

- **Storefront**: Ultra-fast catalog browsing, brand mega-menu, instant search, filters, wishlist, and dynamic routine finder.
- **Cart & Fast Checkout**: Streamlined checkout with Cash on Delivery (COD), order notes, and SMS notifications.
- **A4 & 4×6 Thermal Invoicing**: Dedicated isolated print engine for 1-page A4 Tax Invoices and 4×6 POS thermal shipping labels.
- **Admin Control Center**:
  - Live **Invoice & Thermal Label Customizer** (branding, colors, barcode, QR code, signatory).
  - Product, inventory, category, and brand management.
  - Order workflows, courier consignment generation, and fraud prevention.
  - Dynamic store, checkout, and SEO settings.
- **Logistics Integration**: Integrated with SteadFast and Pathao Courier APIs.
- **Authentication & Security**: Supabase Auth with server-action rate-limit bypass, pre-confirmed registration, and strict Row-Level Security (RLS).

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Lucide Icons
- **Database & Auth**: Supabase (PostgreSQL with RLS)
- **Media**: Cloudinary & Supabase Storage
- **PDF & Barcodes**: jsPDF, html2canvas, qrcode

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Key Routes

| Route | Description |
|---|---|
| `/` | Storefront Homepage |
| `/products` | Catalog & Product Browsing |
| `/login` / `/register` | Customer Authentication |
| `/account` | Customer Dashboard & Orders |
| `/orders/[id]/invoice` | Dedicated A4 & Thermal Print Page |
| `/admin` | Admin Dashboard |
| `/admin/settings/invoice` | Invoice & Thermal Customizer |

---

## 📜 License
Private & Proprietary. All rights reserved.
