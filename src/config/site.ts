// Site-wide configuration constants

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "Azonno Ecommerce Website",
  url: process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "",
  description: "Azonno Ecommerce Website in Bangladesh",
  defaultCurrency: "BDT",
  defaultLocale: "en-BD",
  defaultTimezone: "Asia/Dhaka",
} as const;

// Bangladesh divisions, districts, areas for checkout
export const divisions = [
  "Dhaka",
  "Chattogram",
  "Rajshahi",
  "Khulna",
  "Barishal",
  "Sylhet",
  "Rangpur",
  "Mymensingh",
] as const;

// Admin sidebar navigation structure
export const adminNavItems = [
  { title: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
  {
    title: "Orders",
    icon: "ShoppingBag",
    children: [
      { title: "All Orders", href: "/admin/orders" },
      { title: "Invoice & Thermal", href: "/admin/settings/invoice" },
      { title: "Incomplete Orders", href: "/admin/orders/incomplete" },
      { title: "Fraud & Blocklist", href: "/admin/orders/fraud" },
      { title: "Order Tracking", href: "/admin/orders/tracking" },
      { title: "Returns & RTO", href: "/admin/returns" },
      { title: "Order Settings", href: "/admin/orders/settings" },
    ],
  },
  {
    title: "Products",
    icon: "Package",
    children: [
      { title: "All Products", href: "/admin/products" },
      { title: "Add Product", href: "/admin/products/create" },
      { title: "Categories", href: "/admin/categories" },
      { title: "Brands", href: "/admin/brands" },
      { title: "Attributes", href: "/admin/attributes" },
      { title: "Inventory", href: "/admin/inventory" },
      { title: "Reviews", href: "/admin/reviews" },
      { title: "Q&A", href: "/admin/qa" },
      { title: "Product Settings", href: "/admin/products/settings" },
    ],
  },
  {
    title: "Blog & Editorial",
    icon: "BookOpen",
    children: [
      { title: "All Articles", href: "/admin/blog" },
      { title: "Write Article", href: "/admin/blog/create" },
      { title: "Authors & Experts", href: "/admin/blog/authors" },
      { title: "Blog Categories", href: "/admin/blog/categories" },
    ],
  },
  {
    title: "Customers",
    icon: "Users",
    children: [
      { title: "All Customers", href: "/admin/customers" },
      { title: "Fraud Checker", href: "/admin/fraud" },
      { title: "Customer Settings", href: "/admin/customers/settings" },
    ],
  },
  {
    title: "Marketing",
    icon: "Megaphone",
    children: [
      { title: "Storefront Sections", href: "/admin/marketing/homepage" },
      { title: "Coupons", href: "/admin/coupons" },
      { title: "SMS Marketing", href: "/admin/marketing/sms" },
      { title: "Tracking", href: "/admin/marketing/meta" },
      { title: "Catalog Feeds", href: "/admin/marketing/catalog" },
      { title: "Header & Footer Scripts", href: "/admin/settings/custom-scripts" },
      { title: "Search Analytics", href: "/admin/marketing/search" },
      { title: "Marketing Settings", href: "/admin/marketing/settings" },
    ],
  },
  {
    title: "Shipping & Courier",
    icon: "Truck",
    children: [
      { title: "Delivery Partners", href: "/admin/shipping" },
      { title: "SteadFast", href: "/admin/shipping/steadfast" },
      { title: "Pathao", href: "/admin/shipping/pathao" },
      { title: "Shipping Zones", href: "/admin/shipping/zones" },
    ],
  },
  {
    title: "Payments",
    icon: "CreditCard",
    children: [
      { title: "Payment Methods", href: "/admin/payments" },
      { title: "Cash on Delivery", href: "/admin/payments/cod" },
      { title: "bKash", href: "/admin/payments/bkash" },
      { title: "Nagad", href: "/admin/payments/nagad" },
      { title: "SSLCommerz", href: "/admin/payments/sslcommerz" },
      { title: "Stripe", href: "/admin/payments/stripe" },
      { title: "PayPal", href: "/admin/payments/paypal" },
      { title: "Custom Payments", href: "/admin/payments/custom" },
      { title: "Payment Verification", href: "/admin/payments/logs" },
    ],
  },
  {
    title: "Communication",
    icon: "MessageSquare",
    children: [
      { title: "Notification Settings", href: "/admin/communication/notifications" },
      { title: "WhatsApp Templates", href: "/admin/communication/whatsapp" },
      { title: "SMS Providers", href: "/admin/communication/sms" },
      { title: "SMS Templates", href: "/admin/communication/sms/templates" },
      { title: "Email Settings", href: "/admin/communication/email" },
    ],
  },
  {
    title: "Media",
    icon: "Image",
    children: [
      { title: "Media Library", href: "/admin/media" },
      { title: "Cloudinary Settings", href: "/admin/media/cloudinary" },
      { title: "Media Settings", href: "/admin/media/settings" },
    ],
  },
  {
    title: "Finance",
    icon: "DollarSign",
    children: [
      { title: "Sales Reports", href: "/admin/finance/sales" },
      { title: "Profit & Loss", href: "/admin/finance/pnl" },
      { title: "Costs", href: "/admin/finance/costs" },
      { title: "Accounting", href: "/admin/finance/accounting" },
      { title: "Suppliers", href: "/admin/finance/suppliers" },
      { title: "Due Manager", href: "/admin/finance/dues" },
      { title: "Investors", href: "/admin/finance/investors" },
    ],
  },
  {
    title: "Content",
    icon: "FileText",
    children: [
      { title: "Blog Posts", href: "/admin/blog" },
      { title: "Blog Authors", href: "/admin/blog/authors" },
      { title: "Blog Categories", href: "/admin/blog/categories" },
      { title: "Pages", href: "/admin/pages" },
      { title: "Theme Customizer", href: "/admin/settings/theme" },
    ],
  },
  {
    title: "Users & Access",
    icon: "Shield",
    children: [
      { title: "Admin Users", href: "/admin/users" },
      { title: "Activity Logs", href: "/admin/activity" },
    ],
  },
  {
    title: "System",
    icon: "Settings",
    children: [
      { title: "Feature Modules", href: "/admin/settings/modules" },
      { title: "Feature Flags", href: "/admin/settings/features" },
      { title: "Store Settings", href: "/admin/settings/store" },
      { title: "Invoice & Thermal", href: "/admin/settings/invoice" },
      { title: "Checkout Settings", href: "/admin/settings/checkout" },
      { title: "SEO Settings", href: "/admin/settings/seo" },
      { title: "Custom Scripts & Verification", href: "/admin/settings/custom-scripts" },
      { title: "System Health", href: "/admin/settings/system-health" },
      { title: "Maintenance", href: "/admin/settings/maintenance" },
    ],
  },
] as const;

// Customer dashboard navigation
export const customerNavItems = [
  { title: "Overview", href: "/account", icon: "LayoutDashboard" },
  { title: "Orders", href: "/account/orders", icon: "ShoppingBag" },
  { title: "Track Orders", href: "/account/track", icon: "MapPin" },
  { title: "Wishlist", href: "/account/wishlist", icon: "Heart" },
  { title: "Addresses", href: "/account/addresses", icon: "MapPin" },
  { title: "Reviews", href: "/account/reviews", icon: "Star" },
  { title: "Returns", href: "/account/returns", icon: "RotateCcw" },
  { title: "Points", href: "/account/points", icon: "Award" },
  { title: "Vouchers", href: "/account/vouchers", icon: "Ticket" },
  { title: "Notifications", href: "/account/notifications", icon: "Bell" },
  { title: "Profile", href: "/account/profile", icon: "User" },
  { title: "Security", href: "/account/security", icon: "Lock" },
] as const;

// Cloudinary folder structure
export const cloudinaryFolders = {
  products: "ecommerce/products",
  categories: "ecommerce/categories",
  brands: "ecommerce/brands",
  banners: "ecommerce/banners",
  reviews: "ecommerce/reviews",
  users: "ecommerce/users",
  pages: "ecommerce/pages",
} as const;

// Cloudinary transformation presets
export const cloudinaryPresets = {
  thumbnail: { width: 150, height: 150, crop: "fill", quality: "auto", format: "auto" },
  productCard: { width: 400, height: 400, crop: "fill", quality: "auto", format: "auto" },
  productDetail: { width: 800, height: 800, crop: "fill", quality: "auto", format: "auto" },
  productZoom: { width: 1600, height: 1600, crop: "fill", quality: "auto", format: "auto" },
  mobileBanner: { width: 768, crop: "scale", quality: "auto", format: "auto" },
  desktopBanner: { width: 1440, crop: "scale", quality: "auto", format: "auto" },
} as const;

// Order status configuration
export const orderStatusConfig: Record<string, { label: string; color: string; nextStatuses: string[] }> = {
  pending: { label: "Pending", color: "yellow", nextStatuses: ["confirmed", "cancelled"] },
  confirmed: { label: "Confirmed", color: "blue", nextStatuses: ["processing", "cancelled"] },
  processing: { label: "Processing", color: "blue", nextStatuses: ["packed", "cancelled"] },
  packed: { label: "Packed", color: "indigo", nextStatuses: ["ready_for_pickup", "cancelled"] },
  ready_for_pickup: { label: "Ready for Pickup", color: "indigo", nextStatuses: ["shipped"] },
  shipped: { label: "Shipped", color: "purple", nextStatuses: ["in_transit"] },
  in_transit: { label: "In Transit", color: "purple", nextStatuses: ["out_for_delivery"] },
  out_for_delivery: { label: "Out for Delivery", color: "orange", nextStatuses: ["delivered", "failed"] },
  delivered: { label: "Delivered", color: "green", nextStatuses: ["return_requested"] },
  cancelled: { label: "Cancelled", color: "red", nextStatuses: [] },
  failed: { label: "Failed", color: "red", nextStatuses: ["confirmed"] },
  return_requested: { label: "Return Requested", color: "amber", nextStatuses: ["returned"] },
  returned: { label: "Returned", color: "gray", nextStatuses: ["refunded"] },
  refunded: { label: "Refunded", color: "gray", nextStatuses: [] },
};
