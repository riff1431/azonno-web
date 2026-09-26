export interface ImageBannerItem {
  id: string;
  title: string;
  href: string;
  image: string;
}

export interface WavyOfferCard {
  id: string;
  ribbonText: string;
  mainText: string;
  href: string;
}

export interface CategoryCardItem {
  id: string;
  name: string;
  slug: string;
  image: string;
}

export interface TrustPillarItem {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
  imageUrl?: string;
}

export interface CampaignPillItem {
  id: string;
  label: string;
  href: string;
  bgClass: string;
}

export interface ProductCardConfig {
  freeShippingText: string;
  addToCartText: string;
  orderNowText: string;
  showDiscountBadge: boolean;
  showWishlistButton: boolean;
  showFreeShippingStrip: boolean;
  showRating: boolean;
  showSizeBadge: boolean;
}

export interface HeaderNavSubcategory {
  name: string;
  href: string;
}

export interface HeaderNavCategory {
  id: string;
  name: string;
  slug: string;
  href: string;
  subcategories: HeaderNavSubcategory[];
  featuredBrands: string[];
  promoBanner?: {
    title: string;
    subtitle: string;
    image: string;
    href: string;
  };
}

export interface HeaderConfig {
  logoText: string;
  logoImageUrl: string;
  logoLink: string;
  mobileLogoText?: string;
  mobileLogoImageUrl?: string;
  drawerLogoText?: string;
  drawerLogoImageUrl?: string;
  adminLogoImageUrl?: string;
  searchPlaceholders: string[];
  navCategories: HeaderNavCategory[];
}

export interface BeforeAfterConfig {
  enabled?: boolean;
  title: string;
  subtitle: string;
  beforeImage: string;
  afterImage: string;
  beforeLabel: string;
  afterLabel: string;
  imageFit?: "cover" | "contain" | "top";
  aspectRatio?: "4/3" | "16/10" | "1/1" | "auto";
  eyebrowBadge?: string;
  heading: string;
  description: string;
  metric1?: string;
  metric2?: string;
  metric3?: string;
  buttonText: string;
  buttonHref: string;
}

export interface HomepageFaqItem {
  id: string;
  question: string;
  questionBn?: string;
  answer: string;
  answerBn?: string;
  category?: string;
}

export interface HomepageFaqSectionConfig {
  enabled: boolean;
  heading: string;
  headingBn?: string;
  subtitle: string;
  subtitleBn?: string;
  seoDescriptionHtml?: string;
  seoDescriptionHtmlBn?: string;
  faqs: HomepageFaqItem[];
  // WhatsApp Banner Assistance Controls
  showWhatsappCard?: boolean;
  whatsappTitle?: string;
  whatsappTitleBn?: string;
  whatsappSubtitle?: string;
  whatsappSubtitleBn?: string;
  whatsappButtonText?: string;
  whatsappButtonTextBn?: string;
  whatsappNumber?: string;
}

export interface FooterLinkItem {
  label: string;
  labelBn?: string;
  href: string;
  badge?: string;
  isHighlight?: boolean;
}

export interface CustomPaymentBadgeItem {
  id: string;
  name: string;
  imageUrl: string;
  enabled?: boolean;
}

export interface FooterConfig {
  brandText?: string;
  logoImageUrl?: string;
  aboutText?: string;
  aboutTextBn?: string;
  copyrightText?: string;
  supportPhone?: string;
  supportEmail?: string;
  supportAddress?: string;
  supportAddressBn?: string;
  supportWhatsapp?: string;
  newsletterTitle?: string;
  newsletterTitleBn?: string;
  newsletterSubtitle?: string;
  newsletterSubtitleBn?: string;
  showTrustPillars?: boolean;
  showNewsletter?: boolean;
  showPaymentBadges?: boolean;
  showSocialLinks?: boolean;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    whatsapp?: string;
  };
  paymentBadgeStyle?: "icons_only" | "badges_with_text";
  acceptedPaymentMethods?: {
    bkash?: boolean;
    nagad?: boolean;
    visa?: boolean;
    mastercard?: boolean;
    cod?: boolean;
    amex?: boolean;
  };
  paymentBadgeImages?: {
    bkash?: string;
    nagad?: string;
    visa?: string;
    mastercard?: string;
    cod?: string;
    amex?: string;
    [key: string]: string | undefined;
  };
  customPaymentBadges?: CustomPaymentBadgeItem[];
  categoryLinks?: FooterLinkItem[];
  customerCareLinks?: FooterLinkItem[];
}

export interface HomepageFullConfig {
  headerConfig: HeaderConfig;
  announcementBadgeText: string;
  announcementText: string;
  freeDeliveryThreshold: number;
  routineFinderText: string;
  routineFinderHref: string;
  trackOrderText: string;
  trackOrderHref: string;
  authenticGuaranteeText: string;
  supportPhone: string;
  supportEmail?: string;
  campaignPills: CampaignPillItem[];
  heroSlides: ImageBannerItem[];
  stripBanner: ImageBannerItem;
  dealsYouCannotMiss: ImageBannerItem[];
  topBrandsAndOffers: ImageBannerItem[];
  limitedTimeOffers: WavyOfferCard[];
  shopByCategories: CategoryCardItem[];
  beforeAfterSection?: BeforeAfterConfig;
  trendingTitle: string;
  trendingSubtitle: string;
  trendingViewAllText: string;
  cardSettings: ProductCardConfig;
  trustPillars: TrustPillarItem[];
  faqSection?: HomepageFaqSectionConfig;
  footerConfig?: FooterConfig;
  footerBrandText?: string;
  footerLogoImageUrl?: string;
  footerAboutText?: string;
  footerCopyright: string;
}

export const DEFAULT_HOMEPAGE_CONFIG: HomepageFullConfig = {
  // 0. Header & Mega-Menu Configuration
  headerConfig: {
    logoText: "Azonno",
    logoImageUrl: "",
    logoLink: "/",
    mobileLogoText: "Azonno",
    mobileLogoImageUrl: "",
    drawerLogoText: "Azonno",
    drawerLogoImageUrl: "",
    adminLogoImageUrl: "",
    searchPlaceholders: [
      "The Ordinary",
      "COSRX Snail Mucin",
      "CeraVe Cleanser",
      "Beauty of Joseon Sunscreen",
      "Niacinamide Serum",
      "Shampoo & Hair Care",
    ],
    navCategories: [
      {
        id: "nav-makeup",
        name: "Makeup",
        slug: "makeup",
        href: "/products?category=makeup",
        subcategories: [
          { name: "Foundations & BB Creams", href: "/products?category=makeup&type=foundation" },
          { name: "Lipsticks & Lip Tints", href: "/products?category=makeup&type=lipstick" },
          { name: "Eyeshadows & Mascaras", href: "/products?category=makeup&type=eyes" },
          { name: "Eyeliners & Kajal", href: "/products?category=makeup&type=eyeliner" },
          { name: "Setting Sprays & Powders", href: "/products?category=makeup&type=powder" },
          { name: "Blushes & Highlighters", href: "/products?category=makeup&type=blush" },
        ],
        featuredBrands: ["L'Oréal Paris", "Maybelline", "MAC", "Revolution"],
        promoBanner: {
          title: "Makeup Collection",
          subtitle: "100% Original Cosmetics for Everyday Looks",
          image: "/categories/cat_makeup.jpg",
          href: "/products?category=makeup",
        },
      },
      {
        id: "nav-skin",
        name: "Skin",
        slug: "skin-care",
        href: "/products?category=skin-care",
        subcategories: [
          { name: "Cleansers & Facewash", href: "/products?category=skin-care&type=cleanser" },
          { name: "Toners & Mists", href: "/products?category=skin-care&type=toner" },
          { name: "Serums & Essences", href: "/products?category=skin-care&type=serum" },
          { name: "Moisturizers & Creams", href: "/products?category=skin-care&type=moisturizer" },
          { name: "Daily Sunscreen & SPF", href: "/products?category=skin-care&type=sunscreen" },
          { name: "Eye & Lip Care", href: "/products?category=skin-care&type=eye-lip" },
        ],
        featuredBrands: ["COSRX", "The Ordinary", "CeraVe", "Beauty of Joseon"],
        promoBanner: {
          title: "Everyday Skincare Essentials",
          subtitle: "Gentle K-Beauty & Global Brands",
          image: "/categories/cat_k_beauty.jpg",
          href: "/products?category=skin-care",
        },
      },
      {
        id: "nav-hair",
        name: "Hair",
        slug: "hair-care",
        href: "/products?category=hair-care",
        subcategories: [
          { name: "Shampoos & Cleansers", href: "/products?category=hair-care&type=shampoo" },
          { name: "Conditioners & Hair Masks", href: "/products?category=hair-care&type=conditioner" },
          { name: "Hair Oils & Serums", href: "/products?category=hair-care&type=oil" },
          { name: "Scalp Care & Scrubs", href: "/products?category=hair-care&type=scalp" },
          { name: "Hair Styling & Colors", href: "/products?category=hair-care&type=styling" },
        ],
        featuredBrands: ["Vatika", "L'Oréal", "Himalaya", "Tresemme"],
        promoBanner: {
          title: "Fresh Scalp & Hair Care",
          subtitle: "Shampoos, Oils & Conditioners for Daily Care",
          image: "/categories/cat_hair_care.jpg",
          href: "/products?category=hair-care",
        },
      },
      {
        id: "nav-body",
        name: "Personal care",
        slug: "body-care",
        href: "/products?category=body-care",
        subcategories: [
          { name: "Body Lotions & Creams", href: "/products?category=body-care&type=lotion" },
          { name: "Shower Gels & Body Wash", href: "/products?category=body-care&type=wash" },
          { name: "Body Scrubs", href: "/products?category=body-care&type=scrub" },
          { name: "Hand & Foot Care", href: "/products?category=body-care&type=hand-foot" },
        ],
        featuredBrands: ["Nivea", "Vaseline", "Cetaphil", "Meril"],
        promoBanner: {
          title: "Daily Body Care",
          subtitle: "Gentle Lotions & Body Washes for Soft Skin",
          image: "/categories/cat_mom_baby.jpg",
          href: "/products?category=body-care",
        },
      },
      {
        id: "nav-mom-baby",
        name: "Mom & Baby",
        slug: "mom-baby",
        href: "/products?category=mom-baby",
        subcategories: [
          { name: "Baby Lotions & Creams", href: "/products?category=mom-baby&type=lotion" },
          { name: "Baby Shampoos & Wash", href: "/products?category=mom-baby&type=wash" },
          { name: "Diaper Care", href: "/products?category=mom-baby&type=diaper" },
          { name: "Mom Care Essentials", href: "/products?category=mom-baby&type=maternity" },
        ],
        featuredBrands: ["Aveeno Baby", "Johnson's", "Cetaphil Baby", "Sebamed"],
        promoBanner: {
          title: "Gentle Baby Care",
          subtitle: "Mild & Gentle Products for Little Ones",
          image: "/categories/cat_mom_baby.jpg",
          href: "/products?category=mom-baby",
        },
      },
      {
        id: "nav-fragrance",
        name: "Fragrance",
        slug: "fragrance",
        href: "/products?category=fragrance",
        subcategories: [
          { name: "Women's Perfumes", href: "/products?category=fragrance&type=women" },
          { name: "Men's Cologne & EDT", href: "/products?category=fragrance&type=men" },
          { name: "Body Mists & Sprays", href: "/products?category=fragrance&type=mist" },
          { name: "Attars & Perfume Oils", href: "/products?category=fragrance&type=attar" },
        ],
        featuredBrands: ["Chanel", "Dior", "Victoria's Secret", "Armaf"],
        promoBanner: {
          title: "Everyday Fragrances",
          subtitle: "Fresh Perfumes, Colognes & Body Mists",
          image: "/categories/cat_fragrance.jpg",
          href: "/products?category=fragrance",
        },
      },
    ],
  },

  announcementBadgeText: "FREE DELIVERY",
  announcementText: "Free nationwide delivery on orders over ৳2,000",
  freeDeliveryThreshold: 2000,
  routineFinderText: "Routine Finder",
  routineFinderHref: "/quiz",
  trackOrderText: "Track Order",
  trackOrderHref: "/track-order",
  authenticGuaranteeText: "100% Authentic Products",
  supportPhone: "+880 1700-000000",

  // Top Subnavigation Campaign Badges
  campaignPills: [
    { id: "pill-blog", label: "BEAUTY BLOG", href: "/blog", bgClass: "bg-[#e11d48]" },
    { id: "pill-1", label: "UNDERGARMENTS", href: "/products?category=body-care", bgClass: "bg-[#2563eb]" },
    { id: "pill-2", label: "COMBO", href: "/products?category=combo", bgClass: "bg-[#c026d3]" },
    { id: "pill-3", label: "JEWELLERY", href: "/products?category=jewellery", bgClass: "bg-[#9333ea]" },
    { id: "pill-4", label: "CLEARANCE SALE", href: "/products?discount=true", bgClass: "bg-[#0284c7]" },
    { id: "pill-5", label: "MEN", href: "/products?category=skin-care", bgClass: "bg-[#059669]" },
  ],

  // 1. Hero Carousel Banners
  heroSlides: [
    {
      id: "hero-1",
      title: "Himalaya Skincare & Haircare Special Offers",
      href: "/products?search=himalaya",
      image: "/banners/hero_himalaya.jpg",
    },
    {
      id: "hero-2",
      title: "The Ordinary Everyday Serums",
      href: "/products?search=the%20ordinary",
      image: "/banners/hero_ordinary.svg",
    },
    {
      id: "hero-3",
      title: "COSRX K-Beauty Favorites",
      href: "/products?search=cosrx",
      image: "/banners/hero_cosrx.svg",
    },
    {
      id: "hero-4",
      title: "Vatika Hair Oils & Shampoos",
      href: "/products?category=hair-care",
      image: "/banners/hero_vatika.svg",
    },
  ],

  // 2. Secondary Strip Banner
  stripBanner: {
    id: "strip-ponds",
    title: "Pond's Hydra Light Gel & Daily Creams",
    href: "/products?search=ponds",
    image: "/banners/strip_ponds.svg",
  },

  // 3. DEALS YOU CANNOT MISS
  dealsYouCannotMiss: [
    {
      id: "deal-1",
      title: "Special Offers with Free Nationwide Delivery",
      href: "/products?discount=true",
      image: "/banners/deal_mega_offers.jpg",
    },
    {
      id: "deal-2",
      title: "Fresh & Healthy Scalp Care Essentials",
      href: "/products?category=hair-care",
      image: "/banners/deal_anti_dandruff.jpg",
    },
    {
      id: "deal-3",
      title: "Meril Perfumed Shower Gels",
      href: "/products?category=body-care",
      image: "/banners/deal_shower_gel.svg",
    },
    {
      id: "deal-4",
      title: "Everyday Jewelry & Accessories New Arrivals",
      href: "/products?category=jewellery",
      image: "/banners/deal_jewellery.svg",
    },
  ],

  // 4. TOP BRANDS & OFFERS
  topBrandsAndOffers: [
    {
      id: "brand-1",
      title: "Everyday Grooming Trimmers",
      href: "/products?search=trimmer",
      image: "/banners/brand_trimmer.svg",
    },
    {
      id: "brand-2",
      title: "Daily Sun Protection & SPF Essentials",
      href: "/products?search=sunscreen",
      image: "/banners/brand_skino.svg",
    },
    {
      id: "brand-3",
      title: "Vatika Naturals Hair Care",
      href: "/products?category=hair-care",
      image: "/banners/brand_vatika.svg",
    },
    {
      id: "brand-4",
      title: "Gentle Skincare Favorites",
      href: "/products?discount=true",
      image: "/banners/brand_glow.svg",
    },
    {
      id: "brand-5",
      title: "The Ordinary Skincare",
      href: "/products?search=the%20ordinary",
      image: "/banners/brand_ordinary.svg",
    },
    {
      id: "brand-6",
      title: "Daily Body Care & Softening Lotions",
      href: "/products?category=body-care",
      image: "/banners/brand_softskin.svg",
    },
  ],

  // 5. LIMITED TIME OFFERS
  limitedTimeOffers: [
    {
      id: "bogo",
      ribbonText: "SPECIAL DEAL",
      mainText: "BOGO",
      href: "/products?discount=true",
    },
    {
      id: "combo",
      ribbonText: "ROUTINE PACK",
      mainText: "COMBO",
      href: "/products?category=combo",
    },
    {
      id: "offers",
      ribbonText: "SPECIAL",
      mainText: "OFFERS",
      href: "/products?discount=true",
    },
    {
      id: "clearance",
      ribbonText: "SEASONAL",
      mainText: "SALE",
      href: "/products?discount=true",
    },
  ],

  // 6. SHOP BEAUTY PRODUCTS BY CATEGORY
  shopByCategories: [
    { id: "cat-1", name: "MAKEUP", slug: "makeup", image: "/categories/cat_makeup.jpg" },
    { id: "cat-2", name: "K-BEAUTY", slug: "skin-care", image: "/categories/cat_k_beauty.jpg" },
    { id: "cat-3", name: "HAIR CARE", slug: "hair-care", image: "/categories/cat_hair_care.jpg" },
    { id: "cat-4", name: "MOM & BABY", slug: "mom-baby", image: "/categories/cat_mom_baby.jpg" },
    { id: "cat-5", name: "SKIN CARE", slug: "skin-care", image: "/categories/cat_skin_care.jpg" },
    { id: "cat-6", name: "FRAGRANCE", slug: "fragrance", image: "/categories/cat_fragrance.jpg" },
  ],

  // 6.5. Before & After Slider
  beforeAfterSection: {
    enabled: true,
    title: "SEE THE DIFFERENCE",
    subtitle: "Simple Everyday Skincare Routine",
    beforeImage: "/banners/before_skin.jpg",
    afterImage: "/banners/after_skin.jpg",
    beforeLabel: "BEFORE • DRY & DULL",
    afterLabel: "AFTER • FRESH & HYDRATED",
    imageFit: "top",
    aspectRatio: "4/3",
    eyebrowBadge: "EVERYDAY ROUTINE",
    heading: "Simple 3-Step Daily Routine",
    description: "Lightweight products that leave skin feeling fresh, soft, and comfortable throughout the day.",
    metric1: "Leaves skin feeling calm and refreshed",
    metric2: "Lightweight and non-greasy all day",
    metric3: "100% Direct Certified Authentic Imports",
    buttonText: "SHOP THE ROUTINE",
    buttonHref: "/products?category=skin-care",
  },

  // 7. Trending Products Showcase Section Titles & Card Controls
  trendingTitle: "POPULAR PRODUCTS",
  trendingSubtitle: "100% Certified Authentic Imports",
  trendingViewAllText: "View All →",
  cardSettings: {
    freeShippingText: "FREE DELIVERY",
    addToCartText: "ADD TO CART",
    orderNowText: "ORDER NOW",
    showDiscountBadge: true,
    showWishlistButton: true,
    showFreeShippingStrip: true,
    showRating: true,
    showSizeBadge: true,
  },

  // 8. Trust Pillars
  trustPillars: [
    { id: "tp-1", title: "100% Authentic", subtitle: "Direct from Brands", iconName: "shield" },
    { id: "tp-2", title: "Fast Delivery", subtitle: "24-48h in Dhaka", iconName: "truck" },
    { id: "tp-3", title: "Cash on Delivery", subtitle: "Pay upon parcel delivery", iconName: "zap" },
    { id: "tp-4", title: "Easy Returns", subtitle: "7-Day Return Policy", iconName: "rotate" },
  ],

  // 9. SEO & Humanized FAQ Section
  faqSection: {
    enabled: true,
    heading: "Authentic Cosmetics Shop in Bangladesh: Your Beauty Destination",
    headingBn: "EnglishPremium Men's & Women's Clothing in Bangladesh Trusted Destination",
    subtitle:
      "Shop 100% genuine skincare, makeup, and hair care with nationwide Cash on Delivery, doorstep parcel inspection, and friendly support.",
    subtitleBn:
      "100% Authentic Premium Casual Wear  Apparel  —   Cash  Delivery,       Customers ।",
    seoDescriptionHtml: `<div class="space-y-4 text-zinc-700 leading-relaxed text-sm sm:text-base">
  <p>
    Finding a trustworthy <strong>cosmetics shop in Bangladesh</strong> should be simple and reliable. At <strong>Blush &amp; Budget</strong>, we bring you 100% genuine skincare, makeup, and hair care directly from authorized distributors in South Korea, the UK, the US, and Japan. We believe shopping for beauty should feel easy, honest, and comfortable.
  </p>

  <h3 class="text-base sm:text-lg font-bold text-zinc-900 mt-5 mb-1.5 flex items-center gap-2">
    <span class="h-2 w-2 rounded-full bg-[#1D6474] inline-block"></span>
    100% Authentic Products with Verified Batch Codes
  </h3>
  <p>
    We source every item directly from official brand partners and authorized distributors. Every serum, cleanser, sunscreen, and lipstick comes with its manufacturer batch code, tamper-evident hygiene seals, and guaranteed freshness.
  </p>

  <h3 class="text-base sm:text-lg font-bold text-zinc-900 mt-5 mb-1.5 flex items-center gap-2">
    <span class="h-2 w-2 rounded-full bg-[#1D6474] inline-block"></span>
    Skincare Made for Everyday Humid Weather
  </h3>
  <p>
    In warm and humid weather, heavy creams can feel uncomfortable. We focus on lightweight, non-sticky essentials that feel fresh on the skin. Explore our <a href="/products?category=skin-care" class="text-[#1D6474] font-semibold underline decoration-pink-300 underline-offset-2 hover:text-[#164E63]">Skincare Collection</a> to find gentle cleansers, hydrating toners, lightweight serums, and daily sunscreens that blend easily without leaving a white cast.
  </p>

  <h3 class="text-base sm:text-lg font-bold text-zinc-900 mt-5 mb-1.5 flex items-center gap-2">
    <span class="h-2 w-2 rounded-full bg-[#1D6474] inline-block"></span>
    Everyday Makeup for Work, Study &amp; Events
  </h3>
  <p>
    Whether you like a natural everyday look or a festive makeup finish, our <a href="/products?category=makeup" class="text-[#1D6474] font-semibold underline decoration-pink-300 underline-offset-2 hover:text-[#164E63]">Makeup Collection</a> is curated for long-lasting comfort. From smooth lip tints and cushion compacts to smudge-proof eyeliners and lightweight powders, find shades that suit you best.
  </p>

  <h3 class="text-base sm:text-lg font-bold text-zinc-900 mt-5 mb-1.5 flex items-center gap-2">
    <span class="h-2 w-2 rounded-full bg-[#1D6474] inline-block"></span>
    Korean &amp; Global Beauty Favorites
  </h3>
  <p>
    K-Beauty is loved around the world for its focus on gentle hydration and natural glow. Ingredients like snail mucin, centella, rice water, and hyaluronic acid help keep skin feeling soft and refreshed. Browse our <a href="/brands" class="text-[#1D6474] font-semibold underline decoration-pink-300 underline-offset-2 hover:text-[#164E63]">Brand Directory</a> to explore top authentic names like COSRX, The Ordinary, CeraVe, and Beauty of Joseon.
  </p>

  <h3 class="text-base sm:text-lg font-bold text-zinc-900 mt-5 mb-1.5 flex items-center gap-2">
    <span class="h-2 w-2 rounded-full bg-[#1D6474] inline-block"></span>
    Nationwide Cash on Delivery with Doorstep Inspection
  </h3>
  <p>
    We want you to shop with complete peace of mind. Blush &amp; Budget offers nationwide Cash on Delivery across all 64 districts of Bangladesh. You can <strong>inspect your parcel at your doorstep</strong> before paying the delivery rider. With our 7-day easy replacement policy and helpful customer support, shopping online is simple and worry-free.
  </p>
</div>`,
    seoDescriptionHtmlBn: `<div class="space-y-4 text-zinc-700 leading-relaxed text-sm sm:text-base">
  <p>
    English items Add <strong> items </strong> from desired Products   more । <strong>Blush &amp; Budget (  )</strong>- We   , added, added   100% Authentic , Apparel    ।
  </p>

  <h3 class="text-base sm:text-lg font-bold text-zinc-900 mt-5 mb-1.5 flex items-center gap-2">
    <span class="h-2 w-2 rounded-full bg-[#1D6474] inline-block"></span>
    100% Authentic Products  items 
  </h3>
  <p>
    We  Add  from Products  ।  items Products   Brand    from । items Products  Authentic   Code   ।
  </p>

  <h3 class="text-base sm:text-lg font-bold text-zinc-900 mt-5 mb-1.5 flex items-center gap-2">
    <span class="h-2 w-2 rounded-full bg-[#1D6474] inline-block"></span>
      Add  
  </h3>
  <p>
              Products use  ।  <a href="/products?category=skin-care" class="text-[#1D6474] font-semibold underline decoration-pink-300 underline-offset-2 hover:text-[#164E63]"> </a>-   , items ,  Oxford Shirt  - Panjabi  Cotton    ।
  </p>

  <h3 class="text-base sm:text-lg font-bold text-zinc-900 mt-5 mb-1.5 flex items-center gap-2">
    <span class="h-2 w-2 rounded-full bg-[#1D6474] inline-block"></span>
    Enter   Apparel 
  </h3>
  <p>
      items       Apparel— <a href="/products?category=makeup" class="text-[#1D6474] font-semibold underline decoration-pink-300 underline-offset-2 hover:text-[#164E63]">Apparel </a>  successfully    use Add Products ।  items,      Confirmed items।
  </p>

  <h3 class="text-base sm:text-lg font-bold text-zinc-900 mt-5 mb-1.5 flex items-center gap-2">
    <span class="h-2 w-2 rounded-full bg-[#1D6474] inline-block"></span>
        Brand
  </h3>
  <p>
     ,       Cotton    ।  Popular Brand Products     <a href="/brands" class="text-[#1D6474] font-semibold underline decoration-pink-300 underline-offset-2 hover:text-[#164E63]"> Brand </a>।
  </p>

  <h3 class="text-base sm:text-lg font-bold text-zinc-900 mt-5 mb-1.5 flex items-center gap-2">
    <span class="h-2 w-2 rounded-full bg-[#1D6474] inline-block"></span>
    64 District Cash  Delivery     
  </h3>
  <p>
    English 64items District  Cash  Delivery ।    <strong>Delivery  </strong> Price   ।  7-Day Easy Return Policy  Customers ।
  </p>
</div>`,
    faqs: [
      {
        id: "faq-1",
        category: "Authenticity & Sourcing",
        question: "How do I know the products on Azonno are 100% genuine?",
        questionBn: " Products  100% Authentic  Original,  permanently Confirmed ?",
        answer:
          "Every product on Azonno is imported directly from official brand partners or authorized distribution hubs in South Korea, the UK, the US, and Japan. Each item comes with its original manufacturer batch code and packaging seal.",
        answerBn:
          "Azonno- items Products  , ,   -    from   । items Products Authentic  Code   ।",
      },
      {
        id: "faq-2",
        category: "Doorstep Inspection",
        question: "Can I check the parcel before paying the delivery rider?",
        questionBn: "Delivery  items      ?",
        answer:
          "Yes. We encourage you to check the outer packaging and product condition in front of the delivery rider before completing your payment.",
        answerBn:
          ", । Delivery  items    Products  Confirmed  Price   ।",
      },
      {
        id: "faq-3",
        category: "Delivery & Courier",
        question: "How long does delivery take across Bangladesh?",
        questionBn: "Delivery   Enter   and    Cash  Delivery ?",
        answer:
          "Delivery within Dhaka City takes 24 to 48 hours. Deliveries outside Dhaka typically arrive within 2 to 4 business days. We provide nationwide Cash on Delivery via Steadfast and Pathao Courier.",
        answerBn:
          " items  24 from 48 Hours  and   2 from 4   Delivery   ।   Cash  Delivery  ।",
      },
      {
        id: "faq-4",
        category: "Skincare Routines",
        question: "How do I choose products for hot and humid weather?",
        questionBn: "       Products   ?",
        answer:
          "In humid weather, lightweight products work best. We recommend a gentle cleanser, a light hydrating toner or serum, an oil-free moisturizer, and a non-greasy daily sunscreen.",
        answerBn:
          "      :00- Products use  ।  ,    Oxford Shirt,   and - Panjabi  ।",
      },
      {
        id: "faq-5",
        category: "Returns & Exchanges",
        question: "What is your return policy if an item arrives damaged or incorrect?",
        questionBn: "Products    Invalid  Return    ?",
        answer:
          "We offer a 7-day replacement policy. If an item arrives damaged or incorrect, contact our customer care within 7 days with your order ID and a photo/unboxing video. We will arrange a free courier pickup from your address and send a replacement.",
        answerBn:
          "  7 Enter   ।   Invalid   Products  7 Enter       । We Address from items    Products  ।",
      },
      {
        id: "faq-6",
        category: "Skincare Advisory",
        question: "Can I get help choosing the right products before ordering?",
        questionBn: "Order    Products     ?",
        answer:
          "Yes! If you need help choosing the right cleanser, serum, or moisturizer for your everyday routine, message us on WhatsApp daily from 10 AM to 10 PM.",
        answerBn:
          "! your items for added Products   Enter  10:00 from PM 10:00 till       ।",
      },
      {
        id: "faq-7",
        category: "Payment & Pricing",
        question: "Do I need to pay any advance for Cash on Delivery orders?",
        questionBn: "Cash  Delivery Order     :00  ?",
        answer:
          "For regular orders, you pay the full amount directly to the courier rider upon delivery. No advance payment is needed.",
        answerBn:
          " Order    OFF Complete Price Products   Delivery    ।",
      },
      {
        id: "faq-8",
        category: "Product Safety",
        question: "Are your beauty products safe and authentic?",
        questionBn: " Products    Authentic?",
        answer:
          "Yes. We only carry genuine products from reputable international brands that follow strict safety and quality standards.",
        answerBn:
          "। We  Premium Completed Authentic Brand     ।",
      },
    ],
    showWhatsappCard: true,
    whatsappTitle: "Need help choosing the right beauty products?",
    whatsappTitleBn: "Need help finding the right fit or size??",
    whatsappSubtitle:
      "Chat directly with our team on WhatsApp daily 10 AM to 10 PM.",
    whatsappSubtitleBn:
      " Customers  Enter  10:00 from PM 10:00 till   ।",
    whatsappButtonText: "Chat on WhatsApp",
    whatsappButtonTextBn: "  Enter",
    whatsappNumber: "+880 1700-000000",
  },

  // 10. Footer Comprehensive Configuration
  footerConfig: {
    brandText: "Azonno",
    logoImageUrl: "",
    aboutText:
      "Your trusted beauty store in Bangladesh for 100% authentic international skincare, hair care, and cosmetics with nationwide Cash on Delivery.",
    aboutTextBn:
      "EnglishBangladesh's Premier Clothing Brand। 100% Authentic Premium Casual Wear, Apparel       Cash  Delivery    ।",
    copyrightText: "© 2026 Azonno. All rights reserved. 100% Authentic Products.",
    supportPhone: "+880 1700-000000",
    supportEmail: "support@example.com",
    supportAddress: "Gulshan, Dhaka, Bangladesh",
    supportAddressBn: ", , English",
    supportWhatsapp: "+880 1700-000000",
    newsletterTitle: "Get Special Offers & Beauty Tips",
    newsletterTitleBn: "   items items ",
    newsletterSubtitle: "Subscribe for new arrivals, discounts, and simple skincare guides.",
    newsletterSubtitleBn: " Products, Discount   Casual Wear     ।",
    showTrustPillars: true,
    showNewsletter: true,
    showPaymentBadges: true,
    paymentBadgeStyle: "icons_only",
    showSocialLinks: true,
    socialLinks: {
      facebook: "https://facebook.com",
      instagram: "https://instagram.com",
      youtube: "https://youtube.com",
      tiktok: "https://tiktok.com",
      whatsapp: "https://wa.me/8801700000000",
    },
    acceptedPaymentMethods: {
      bkash: true,
      nagad: true,
      visa: true,
      mastercard: true,
      cod: true,
      amex: true,
    },
    paymentBadgeImages: {
      bkash: "",
      nagad: "",
      visa: "",
      mastercard: "",
      cod: "",
      amex: "",
    },
    customPaymentBadges: [],
    categoryLinks: [
      { label: "Skin Care", labelBn: " ", href: "/products?category=skin-care" },
      { label: "Hair Care", labelBn: " ", href: "/products?category=hair-care" },
      { label: "Makeup", labelBn: "Apparel", href: "/products?category=makeup" },
      { label: "Body Care", labelBn: " ", href: "/products?category=body-care" },
      { label: "Top Brands", labelBn: " Brand", href: "/brands" },
      { label: "Beauty Journal & Guides", labelBn: "items   ", href: "/blog", isHighlight: true },
      { label: "Special Offers", labelBn: " ", href: "/products?discount=true", isHighlight: true },
    ],
    customerCareLinks: [
      { label: "My Account", labelBn: " ", href: "/account" },
      { label: "Track Order", labelBn: "Order ", href: "/track-order", isHighlight: true },
      { label: "Routine Finder (Quiz)", labelBn: "items  ()", href: "/quiz", isHighlight: true },
      { label: "Wishlist", labelBn: "", href: "/wishlist" },
      { label: "Return Policy", labelBn: "Return Policy", href: "/page/returns" },
      { label: "Terms & Conditions", labelBn: "  Rules", href: "/page/terms" },
      { label: "Privacy Policy", labelBn: " ", href: "/page/privacy" },
      { label: "FAQ & Help Center", labelBn: "Q&A   :00", href: "/page/faq" },
    ],
  },

  footerBrandText: "Azonno",
  footerLogoImageUrl: "",
  footerAboutText:
    "Your trusted beauty store in Bangladesh for 100% authentic international skincare, hair care, and cosmetics with nationwide Cash on Delivery.",
  footerCopyright: "© 2026 Azonno. All rights reserved. 100% Authentic Products.",
};
