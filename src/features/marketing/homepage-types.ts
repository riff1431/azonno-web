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
    logoText: "Blush & Budget",
    logoImageUrl: "",
    logoLink: "/",
    mobileLogoText: "Blush & Budget",
    mobileLogoImageUrl: "",
    drawerLogoText: "Blush & Budget",
    drawerLogoImageUrl: "",
    adminLogoImageUrl: "",
    searchPlaceholders: [
      "Ordinary",
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
          title: "Makeup Fest Up to 40% Off",
          subtitle: "100% Original Global Cosmetics",
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
          { name: "Serums & Ampoules", href: "/products?category=skin-care&type=serum" },
          { name: "Moisturizers & Creams", href: "/products?category=skin-care&type=moisturizer" },
          { name: "Sunscreen & SPF 50", href: "/products?category=skin-care&type=sunscreen" },
          { name: "Eye & Lip Care", href: "/products?category=skin-care&type=eye-lip" },
        ],
        featuredBrands: ["COSRX", "The Ordinary", "CeraVe", "Beauty of Joseon"],
        promoBanner: {
          title: "Glass Skin Glow Routine",
          subtitle: "Top Korean & US Formulations",
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
          { name: "Anti-Dandruff & Scalp Care", href: "/products?category=hair-care&type=scalp" },
          { name: "Hair Styling & Colors", href: "/products?category=hair-care&type=styling" },
        ],
        featuredBrands: ["Vatika", "L'Oréal", "Himalaya", "Tresemme"],
        promoBanner: {
          title: "Zero Dandruff Festival",
          subtitle: "Fresh & Healthy Scalp Care Routine",
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
          { name: "Body Lotions & Butters", href: "/products?category=body-care&type=lotion" },
          { name: "Shower Gels & Body Wash", href: "/products?category=body-care&type=wash" },
          { name: "Body Scrubs & Exfoliators", href: "/products?category=body-care&type=scrub" },
          { name: "Hand & Foot Care", href: "/products?category=body-care&type=hand-foot" },
        ],
        featuredBrands: ["Nivea", "Vaseline", "Cetaphil", "Meril"],
        promoBanner: {
          title: "Luxury Body Hydration",
          subtitle: "Smooth, velvety soft skin 24h",
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
          { name: "Diaper Rash Care", href: "/products?category=mom-baby&type=diaper" },
          { name: "Maternity Skincare", href: "/products?category=mom-baby&type=maternity" },
        ],
        featuredBrands: ["Aveeno Baby", "Johnson's", "Cetaphil Baby", "Sebamed"],
        promoBanner: {
          title: "Gentle Pure Baby Care",
          subtitle: "100% Tear-Free & Pediatrician Approved",
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
          { name: "Attars & Oils", href: "/products?category=fragrance&type=attar" },
        ],
        featuredBrands: ["Chanel", "Dior", "Victoria's Secret", "Armaf"],
        promoBanner: {
          title: "Signature Global Scents",
          subtitle: "Long-lasting luxury notes",
          image: "/categories/cat_fragrance.jpg",
          href: "/products?category=fragrance",
        },
      },
    ],
  },

  announcementBadgeText: "FREE DELIVERY",
  announcementText: "Free nationwide delivery on orders over ৳2,000!",
  freeDeliveryThreshold: 2000,
  routineFinderText: "Routine Finder",
  routineFinderHref: "/products?category=skin-care",
  trackOrderText: "Track Order",
  trackOrderHref: "/account/orders",
  authenticGuaranteeText: "100% Authentic Guarantee",
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

  // 1. Hero Carousel Banners (Formatted in 1920x650 Wide Ratio)
  heroSlides: [
    {
      id: "hero-1",
      title: "Himalaya Skincare & Haircare Up to 50% Off",
      href: "/products?search=himalaya",
      image: "/banners/hero_himalaya.jpg",
    },
    {
      id: "hero-2",
      title: "The Ordinary Clinical Serums 33% Off",
      href: "/products?search=the%20ordinary",
      image: "/banners/hero_ordinary.svg",
    },
    {
      id: "hero-3",
      title: "COSRX K-Beauty Festival Up to 41% Off",
      href: "/products?search=cosrx",
      image: "/banners/hero_cosrx.svg",
    },
    {
      id: "hero-4",
      title: "Vatika Naturals Hair Care Festival",
      href: "/products?category=hair-care",
      image: "/banners/hero_vatika.svg",
    },
  ],

  // 2. Secondary Strip Banner (Pond's Miracle Me)
  stripBanner: {
    id: "strip-ponds",
    title: "POND'S MIRACLE ME UP TO 25% OFF",
    href: "/products?search=ponds",
    image: "/banners/strip_ponds.svg",
  },

  // 3. DEALS YOU CANNOT MISS (Exact 4 100% Unbreakable Local Banners)
  dealsYouCannotMiss: [
    {
      id: "deal-1",
      title: "MEGA OFFERS 50% OFF - Free Delivery",
      href: "/products?discount=true",
      image: "/banners/deal_mega_offers.jpg",
    },
    {
      id: "deal-2",
      title: "SAY GOODBYE TO DANDRUFF IN 7 DAYS",
      href: "/products?category=hair-care",
      image: "/banners/deal_anti_dandruff.jpg",
    },
    {
      id: "deal-3",
      title: "Meril Perfumed Shower Gel 51 TK OFF",
      href: "/products?category=body-care",
      image: "/banners/deal_shower_gel.svg",
    },
    {
      id: "deal-4",
      title: "JEWELLERY & ACCESSORIES BLUSH & BUDGET NEW ARRIVALS",
      href: "/products?category=jewellery",
      image: "/banners/deal_jewellery.svg",
    },
  ],

  // 4. TOP BRANDS & OFFERS (Exact 6 100% Unbreakable Local Banners)
  topBrandsAndOffers: [
    {
      id: "brand-1",
      title: "the only trimmer you'll ever need",
      href: "/products?search=trimmer",
      image: "/banners/brand_trimmer.svg",
    },
    {
      id: "brand-2",
      title: "skino Summer Protection UP TO 50% OFF",
      href: "/products?search=sunscreen",
      image: "/banners/brand_skino.svg",
    },
    {
      id: "brand-3",
      title: "INTRODUCING Vatika Naturals",
      href: "/products?category=hair-care",
      image: "/banners/brand_vatika.svg",
    },
    {
      id: "brand-4",
      title: "Treasure of Glow - UP TO 35% OFF + FREE DELIVERY",
      href: "/products?discount=true",
      image: "/banners/brand_glow.svg",
    },
    {
      id: "brand-5",
      title: "The Ordinary. UP TO 33% OFF",
      href: "/products?search=the%20ordinary",
      image: "/banners/brand_ordinary.svg",
    },
    {
      id: "brand-6",
      title: "Soft skin - Luxury Daily Body Care",
      href: "/products?category=body-care",
      image: "/banners/brand_softskin.svg",
    },
  ],

  // 5. LIMITED TIME OFFERS
  limitedTimeOffers: [
    {
      id: "bogo",
      ribbonText: "DOUBLE THE FUN WITH",
      mainText: "BOGO",
      href: "/products?discount=true",
    },
    {
      id: "combo",
      ribbonText: "PERFECT MATCH",
      mainText: "COMBO",
      href: "/products?category=combo",
    },
    {
      id: "offers",
      ribbonText: "EXCLUSIVE",
      mainText: "OFFERS",
      href: "/products?discount=true",
    },
    {
      id: "clearance",
      ribbonText: "CLEARANCE",
      mainText: "SALE",
      href: "/products?discount=true",
    },
  ],

  // 6. SHOP BEAUTY PRODUCTS BY CATEGORY (Girl Model Cards with Name)
  shopByCategories: [
    { id: "cat-1", name: "MAKEUP", slug: "makeup", image: "/categories/cat_makeup.jpg" },
    { id: "cat-2", name: "K-BEAUTY", slug: "skin-care", image: "/categories/cat_k_beauty.jpg" },
    { id: "cat-3", name: "HAIR CARE", slug: "hair-care", image: "/categories/cat_hair_care.jpg" },
    { id: "cat-4", name: "MOM & BABY", slug: "mom-baby", image: "/categories/cat_mom_baby.jpg" },
    { id: "cat-5", name: "SKIN CARE", slug: "skin-care", image: "/categories/cat_skin_care.jpg" },
    { id: "cat-6", name: "FRAGRANCE", slug: "fragrance", image: "/categories/cat_fragrance.jpg" },
  ],

  // 6.5. Before & After Beauty Tech Slider
  beforeAfterSection: {
    enabled: true,
    title: "SEE REAL SKIN RESULTS",
    subtitle: "Interactive 7-Day Skincare Transformation",
    beforeImage: "/banners/before_skin.jpg",
    afterImage: "/banners/after_skin.jpg",
    beforeLabel: "DAY 1 • DULL & DEHYDRATED",
    afterLabel: "DAY 7 • RADIANT GLASS SKIN",
    imageFit: "top",
    aspectRatio: "4/3",
    eyebrowBadge: "CLINICALLY FORMULATED",
    heading: "Restore Skin Barrier in 7 Days",
    description: "Target hyperpigmentation, uneven skin tone, and deep dehydration using our certified 3-step routine.",
    metric1: "96% Noticeable reduction in redness and irritation",
    metric2: "24h Non-greasy moisture barrier protection",
    metric3: "100% Direct Certified Authentic Global Imports",
    buttonText: "SHOP THE TRANSFORMATION ROUTINE",
    buttonHref: "/products?category=skin-care",
  },

  // 7. Trending Products Showcase Section Titles & Card Controls
  trendingTitle: "TRENDING PRODUCTS",
  trendingSubtitle: "100% Certified Direct Imports",
  trendingViewAllText: "View All →",
  cardSettings: {
    freeShippingText: "FREE SHIPPING",
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
    { id: "tp-2", title: "Fast Delivery", subtitle: "24-48h Nationwide", iconName: "truck" },
    { id: "tp-3", title: "Cash on Delivery", subtitle: "Pay on parcel delivery", iconName: "zap" },
    { id: "tp-4", title: "Easy Returns", subtitle: "7-Day Return Policy", iconName: "rotate" },
  ],

  // 9. SEO & Humanized FAQ Section (Inspired by Beauty Booth & Ogerio)
  faqSection: {
    enabled: true,
    heading: "Authentic Cosmetics Shop in Bangladesh: Your Beauty Destination",
    headingBn: "বাংলাদেশে আসল কসমেটিকস ও স্কিনকেয়ারের বিশ্বস্ত গন্তব্য",
    subtitle:
      "Explore 100% genuine skincare, makeup & haircare with nationwide Cash on Delivery, doorstep inspection, and expert beauty guidance.",
    subtitleBn:
      "১০০% খাঁটি আন্তর্জাতিক স্কিনকেয়ার ও মেকআপ কালেকশন — সারা দেশে ক্যাশ অন ডেলিভারি, পার্সেল চেক করার সুবিধা ও ফ্রি বিউটি পরামর্শ।",
    seoDescriptionHtml: `<div class="space-y-4 text-zinc-700 leading-relaxed text-sm sm:text-base">
  <p>
    Finding a trustworthy <strong>cosmetics shop in Bangladesh</strong> is no longer just about hunting for a low price or picking a random bottle off a shelf. When it comes to your skin, face, and hair, authenticity is everything. At <strong>Blush &amp; Budget</strong>, we started with a clear mission: every beauty lover in Bangladesh deserves 100% genuine, certified gentle skincare and makeup without paying inflated prices or worrying about counterfeit products. We believe shopping for beauty should feel transparent, comforting, and inspiring.
  </p>

  <h3 class="text-base sm:text-lg font-bold text-zinc-900 mt-5 mb-1.5 flex items-center gap-2">
    <span class="h-2 w-2 rounded-full bg-pink-500 inline-block"></span>
    Why Genuine Cosmetics Matter for Your Skin Health
  </h3>
  <p>
    Counterfeit cosmetics are unfortunately widespread in local markets. Applying unverified replicas can lead to persistent breakouts, unwanted irritation, and compromised skin wellness. That is why at Blush &amp; Budget, we strictly avoid secondary resellers or unofficial intermediaries. We source our inventory directly from verified brand hubs and authorized global distributors in Seoul, Tokyo, London, and New York. Every serum, moisturizer, sunscreen, and lipstick comes with its manufacturer batch code, verifiable tamper-evident seals, and guaranteed shelf freshness.
  </p>

  <h3 class="text-base sm:text-lg font-bold text-zinc-900 mt-5 mb-1.5 flex items-center gap-2">
    <span class="h-2 w-2 rounded-full bg-pink-500 inline-block"></span>
    Skincare Designed for Bangladesh’s Humid Tropical Weather
  </h3>
  <p>
    Skincare is deeply personal, especially in our climate. Between intense monsoon humidity, scorching summer heat, and urban dust in cities like Dhaka and Chittagong, heavy occlusive creams often clog pores. That is why we curate lightweight, non-comedogenic essentials that actually suit South Asian skin types. Explore our <a href="/products?category=skin-care" class="text-pink-600 font-semibold underline decoration-pink-300 underline-offset-2 hover:text-pink-700">Skincare Products in Bangladesh</a> to discover gentle low-pH cleansers, soothing centella toners, hydrating hyaluronic acid essences, and oil-free daily sunscreens that leave zero white cast.
  </p>

  <h3 class="text-base sm:text-lg font-bold text-zinc-900 mt-5 mb-1.5 flex items-center gap-2">
    <span class="h-2 w-2 rounded-full bg-pink-500 inline-block"></span>
    Wearable, Long-Lasting Makeup for Every Occasion
  </h3>
  <p>
    Whether you prefer a soft, dewy "no-makeup" look for university or office wear, or vibrant, high-pigment glamour for festive weddings and celebrations, our <a href="/products?category=makeup" class="text-pink-600 font-semibold underline decoration-pink-300 underline-offset-2 hover:text-pink-700">Makeup Collection</a> is handpicked for sweat resistance and all-day comfort. From velvety lip tints and cushion compacts to smudge-proof eyeliners and lightweight setting powders, we bring you formulas that flatter warm undertones effortlessly.
  </p>

  <h3 class="text-base sm:text-lg font-bold text-zinc-900 mt-5 mb-1.5 flex items-center gap-2">
    <span class="h-2 w-2 rounded-full bg-pink-500 inline-block"></span>
    The Korean &amp; Japanese Beauty Revolution
  </h3>
  <p>
    K-Beauty and J-Beauty have transformed how we think about self-care. Rather than masking skin problems with thick layers, gentle botanical ingredients like snail mucin, heartleaf, propolis, rice water, and fermented galactomyces nourish and protect your skin barrier. Discover cult-favorite products from top global names on our <a href="/brands" class="text-pink-600 font-semibold underline decoration-pink-300 underline-offset-2 hover:text-pink-700">Official Brand Directory</a>, where you can browse authentic formulations loved by millions worldwide.
  </p>

  <h3 class="text-base sm:text-lg font-bold text-zinc-900 mt-5 mb-1.5 flex items-center gap-2">
    <span class="h-2 w-2 rounded-full bg-pink-500 inline-block"></span>
    Nourishing Hair &amp; Scalp Care for Daily Pollution Protection
  </h3>
  <p>
    Hard water, dust, and humid weather frequently cause scalp buildup, frizz, and excessive hair breakage. We offer targeted solutions in our <a href="/products?category=hair-care" class="text-pink-600 font-semibold underline decoration-pink-300 underline-offset-2 hover:text-pink-700">Hair Care Collection</a>, featuring clarifying scalps scrubs, peptide-infused strengthening shampoos, and botanical hair oils that restore vitality and shine from root to tip.
  </p>

  <h3 class="text-base sm:text-lg font-bold text-zinc-900 mt-5 mb-1.5 flex items-center gap-2">
    <span class="h-2 w-2 rounded-full bg-pink-500 inline-block"></span>
    Shop with Complete Peace of Mind: 64-District Cash on Delivery
  </h3>
  <p>
    We believe you should feel 100% confident every time you order. That is why Blush &amp; Budget offers nationwide Cash on Delivery across all 64 districts of Bangladesh. More importantly, we encourage our customers to <strong>inspect their parcels at their doorstep</strong> before completing payment. Combined with our 7-day hassle-free replacement policy and free skincare guidance on WhatsApp, we are here to make your online beauty shopping enjoyable, honest, and truly risk-free.
  </p>
</div>`,
    seoDescriptionHtmlBn: `<div class="space-y-4 text-zinc-700 leading-relaxed text-sm sm:text-base">
  <p>
    বাংলাদেশে একটি নির্ভরযোগ্য <strong>অনলাইন কসমেটিকস শপ</strong> খুঁজে পাওয়া এখন আর কেবল কম দামে পণ্য কেনার বিষয় নয়। আপনার ত্বক, মুখ ও চুলের যত্ন নেওয়ার জন্য পণ্যের আসল ও খাঁটি হওয়া সবচেয়ে জরুরি। <strong>Blush &amp; Budget (ব্লাশ অ্যান্ড বাজেট)</strong> তৈরি হয়েছে এই বিশ্বাস থেকেই—বাংলাদেশের প্রতিটি বিউটি প্রেমী যেন কোনো নকলের ভয় বা অতিরিক্ত দাম ছাড়া ১০০% অথেনটিক ও ব্র্যান্ড-প্রত্যয়িত রূপচর্চা সামগ্রী কিনতে পারেন।
  </p>

  <h3 class="text-base sm:text-lg font-bold text-zinc-900 mt-5 mb-1.5 flex items-center gap-2">
    <span class="h-2 w-2 rounded-full bg-pink-500 inline-block"></span>
    আসল ও সার্টিফাইড কসমেটিকস কেন ত্বকের জন্য অত্যন্ত জরুরি?
  </h3>
  <p>
    লোকাল মার্কেটে নকল ও ভেজাল বিউটি প্রোডাক্টের ছড়াছড়ি ত্বকের স্বাভাবিক সুস্থতার জন্য ঝুঁকিপূর্ণ। অরিজিনাল নয় এমন রেপ্লিকা ব্যবহারের ফলে ত্বকে ব্রণের উপদ্রব বা অস্বস্তির সৃষ্টি হতে পারে। তাই Blush &amp; Budget-এ আমরা কোনো থার্ড পার্টি বা অনির্ভরযোগ্য সোর্স থেকে পণ্য নিই না। আমাদের প্রতিটি প্রোডাক্ট সরাসরি সিউল (দক্ষিণ কোরিয়া), টোকিও, লন্ডন ও ইউএসএ-এর অফিশিয়াল ব্র্যান্ড ও অনুমোদিত ডিস্ট্রিবিউটর থেকে আমদানি করা। প্রতিটি পণ্যে রয়েছে আসল ম্যানুফ্যাকচারার ব্যাচ কোড ও ইনট্যাক্ট হাইজিন সিল।
  </p>

  <h3 class="text-base sm:text-lg font-bold text-zinc-900 mt-5 mb-1.5 flex items-center gap-2">
    <span class="h-2 w-2 rounded-full bg-pink-500 inline-block"></span>
    আমাদের দেশের আবহাওয়ার উপযোগী স্কিনকেয়ার সলিউশন
  </h3>
  <p>
    বাংলাদেশের গরম, অতিরিক্ত আর্দ্রতা ও ধুলাবালির কারণে সবার ত্বকে ভারী ক্রিম বা অয়েলি লোশন মানানসই হয় না। তৈলাক্ত ও ব্রনপ্রবণ ত্বকের জন্য দরকার হালকা ও জেল-বেসড প্রোডাক্ট। আমাদের <a href="/products?category=skin-care" class="text-pink-600 font-semibold underline decoration-pink-300 underline-offset-2 hover:text-pink-700">স্কিনকেয়ার কালেকশন</a>-এ রয়েছে লো-পিএইচ ফেসওয়াশ, সেন্টেলা ও নিয়াসিনামাইড সিরাম, লাইটওয়েট ময়েশ্চারাইজার এবং হোয়াইট কাস্ট-হীন সানস্ক্রিন যা চিটচিটে না হয়ে ত্বকে গভীর সুরক্ষা দেয়।
  </p>

  <h3 class="text-base sm:text-lg font-bold text-zinc-900 mt-5 mb-1.5 flex items-center gap-2">
    <span class="h-2 w-2 rounded-full bg-pink-500 inline-block"></span>
    আকর্ষণীয় ও দীর্ঘস্থায়ী মেকআপ কালেকশন
  </h3>
  <p>
    দৈনন্দিন অফিস ও ভার্সিটি লুকের জন্য নো-মেকআপ গ্লো হোক কিংবা বিয়ে ও উৎসবের জমকালো সাজ—আমাদের <a href="/products?category=makeup" class="text-pink-600 font-semibold underline decoration-pink-300 underline-offset-2 hover:text-pink-700">মেকআপ কালেকশন</a> সাজানো হয়েছে দীর্ঘস্থায়ী ও ঘাম-প্রতিরোধী প্রোডাক্ট দিয়ে। লিপ টিন্ট, কুশন ফাউন্ডেশন, ওয়াটারপ্রুফ আইলাইনার থেকে শুরু করে ফিক্সিং স্প্রে—সবই পাবেন নিশ্চিত কোয়ালিটিতে।
  </p>

  <h3 class="text-base sm:text-lg font-bold text-zinc-900 mt-5 mb-1.5 flex items-center gap-2">
    <span class="h-2 w-2 rounded-full bg-pink-500 inline-block"></span>
    কোরিয়ান ও জাপানিজ স্কিনকেয়ার ট্রেন্ড
  </h3>
  <p>
    কোরিয়ান গ্লাস স্কিন রুটিন এখন শুধু ট্রেন্ড নয়, বরং স্বাস্থ্যকর ত্বকের নির্ভরযোগ্য সমাধান। স্নেল মিউসিন, হার্টলিফ, রাইস ওয়াটার এবং প্রোবায়োটিকসের মতো প্রাকৃতিক উপাদান ত্বকের গভীর থেকে জেল্লা ফিরিয়ে আনে। বিশ্বের সেরা ব্র্যান্ডগুলোর কালেকশন এক্সপ্লোর করতে ভিজিট করুন আমাদের <a href="/brands" class="text-pink-600 font-semibold underline decoration-pink-300 underline-offset-2 hover:text-pink-700">টপ ব্র্যান্ডস পেজ</a>।
  </p>

  <h3 class="text-base sm:text-lg font-bold text-zinc-900 mt-5 mb-1.5 flex items-center gap-2">
    <span class="h-2 w-2 rounded-full bg-pink-500 inline-block"></span>
    চুল ও স্ক্যাল্পের বিশেষ যত্ন
  </h3>
  <p>
    কঠিন পানি ও ধুলাবালির কারণে চুলের রুক্ষতা ও ড্যামেজ প্রতিরোধে আমাদের <a href="/products?category=hair-care" class="text-pink-600 font-semibold underline decoration-pink-300 underline-offset-2 hover:text-pink-700">হেয়ার কেয়ার ক্যাটাগরি</a>-তে রয়েছে সালফেট-মুক্ত শ্যাম্পু, স্ক্যাল্প স্কেলার এবং নারিশিং হেয়ার সিরাম।
  </p>

  <h3 class="text-base sm:text-lg font-bold text-zinc-900 mt-5 mb-1.5 flex items-center gap-2">
    <span class="h-2 w-2 rounded-full bg-pink-500 inline-block"></span>
    ৬৪ জেলায় ক্যাশ অন ডেলিভারি ও পার্সেল চেক করার স্বাধীনতা
  </h3>
  <p>
    আপনার শপিং অভিজ্ঞতাকে শতভাগ নিরাপদ করতে Blush &amp; Budget দিচ্ছে সমগ্র বাংলাদেশের ৬৪টি জেলায় ক্যাশ অন ডেলিভারি সুবিধা। পার্সেল হাতে পেয়ে <strong>ডেলিভারিম্যানের সামনে খুলে চেক করে</strong> মূল্য পরিশোধ করার সম্পূর্ণ স্বাধীনতা রয়েছে। সাথে ৭ দিনের রিপ্লেসমেন্ট গ্যারান্টি এবং হোয়াটসঅ্যাপে অভিজ্ঞ বিউটি কনসালট্যান্টদের ফ্রি পরামর্শ।
  </p>
</div>`,
    faqs: [
      {
        id: "faq-1",
        category: "Authenticity & Sourcing",
        question: "How can I be 100% sure that the products on Blush & Budget are genuine and authentic?",
        questionBn: "আপনাদের প্রোডাক্টগুলো যে ১০০% আসল ও অরিজিনাল, তা কীভাবে নিশ্চিত হব?",
        answer:
          "We understand that buying beauty products online can feel stressful due to counterfeit copies in the market. Every item on Blush & Budget is imported directly from official brand partners or authorized distribution hubs in South Korea, the UK, the US, and Japan. Every product includes its original manufacturer batch code (verifiable on global batch checkers like CheckFresh), security seal, and barcode. If any item is ever shown to be counterfeit, we provide an unconditional 100% money-back guarantee.",
        answerBn:
          "অনলাইনে কসমেটিকস কেনার সময় নকলের ভয় থাকা অত্যন্ত স্বাভাবিক। Blush & Budget-এর প্রতিটি প্রোডাক্ট সরাসরি সিউল, লন্ডন, টোকিও ও ইউএসএ-এর অনুমোদিত ডিস্ট্রিবিউশন হাব থেকে সরাসরি আনা হয়। প্রতিটি বক্সে আসল ম্যানুফ্যাকচারার ব্যাচ কোড ও সিল থাকে যা CheckFresh বা সংশ্লিষ্ট ব্র্যান্ড পোর্টালে সহজেই ভেরিফাই করা যায়। কোনো পণ্য নকল প্রমাণিত হলে আমরা নিঃশর্ত ১০০% মানিব্যাক গ্যারান্টি প্রদান করি।",
      },
      {
        id: "faq-2",
        category: "Doorstep Inspection",
        question: "Can I inspect the parcel and check the product before paying the courier rider?",
        questionBn: "ডেলিভারিম্যানের সামনে পার্সেলটি কি খুলে চেক করে নেওয়া যাবে?",
        answer:
          "Yes, absolutely! We want you to feel completely confident with your purchase. We actively encourage all our customers to inspect the outer packaging, hygiene seals, and product condition in front of the delivery rider before completing payment. You pay with total confidence.",
        answerBn:
          "হ্যাঁ, অবশ্যই! আমাদের সম্মানিত গ্রাহকদের সম্পূর্ণ সন্তুষ্টির জন্য আমরা ডেলিভারিম্যানের সামনেই পার্সেলটি ভালো করে চেক করে নেওয়ার পরামর্শ দিই। পণ্যের প্যাকেজিং ও সিল ঠিক রয়েছে কিনা তা নিশ্চিত হয়ে তবেই পেমেন্ট করুন।",
      },
      {
        id: "faq-3",
        category: "Delivery & Courier",
        question: "How fast is delivery, and do you deliver across all 64 districts in Bangladesh?",
        questionBn: "ডেলিভারি পেতে কত দিন সময় লাগে এবং সারা বাংলাদেশে কি ক্যাশ অন ডেলিভারি আছে?",
        answer:
          "We offer nationwide Cash on Delivery (COD) across all 64 districts, thanas, and upazilas in Bangladesh via Steadfast and Pathao Courier. Delivery within Dhaka City takes 24 to 48 hours, while deliveries outside Dhaka typically arrive within 2 to 4 business days. You will receive live SMS updates with tracking details as soon as your parcel is dispatched.",
        answerBn:
          "হ্যাঁ! সমগ্র বাংলাদেশের ৬৪টি জেলা ও থানা পর্যায়ে Steadfast এবং Pathao কুরিয়ারের মাধ্যমে ক্যাশ অন ডেলিভারি (COD) সুবিধা রয়েছে। ঢাকা সিটির মধ্যে মাত্র ২৪ থেকে ৪৮ ঘণ্টা এবং ঢাকার বাইরে সাধারণত ২ থেকে ৪ কার্যদিবসের মধ্যে হোম ডেলিভারি পৌঁছে দেওয়া হয়। পার্সেল পাঠানোর সাথে সাথে আপনি ট্র্যাকিং লিংক সহ এসএমএস নোটিফিকেশন পাবেন।",
      },
      {
        id: "faq-4",
        category: "Skincare Routines",
        question: "How do I choose the best skincare routine for Bangladesh's humid weather and oily/acne-prone skin?",
        questionBn: "আমাদের দেশের গরম ও অতিরিক্ত আর্দ্র আবহাওয়ায় তৈলাক্ত বা ব্রনপ্রবণ ত্বকের জন্য কেমন রুটিন বেছে নেওয়া উচিত?",
        answer:
          "In hot and humid weather, the golden rule is lightweight layering without clogging pores. We recommend starting with a low-pH gentle cleanser, balancing with a soothing Centella or Heartleaf toner, targeting sebum and pores with a Niacinamide serum, locking hydration with an oil-free water gel cream, and finishing daily with a non-greasy, zero-white-cast SPF 50+ sunscreen.",
        answerBn:
          "আমাদের আর্দ্র আবহাওয়ায় ত্বকের লোমকূপ বন্ধ না করে হালকা ওয়াটার-বেসড প্রোডাক্ট বেছে নেওয়া সেরা উপায়। প্রথমে একটি মাইল্ড লো-পিএইচ ফেসওয়াশ দিয়ে মুখ ধুয়ে নিন, সেন্টেলা বা হার্টলিফ টোনার দিয়ে ত্বক শান্ত করুন, অতিরিক্ত তেল ও ব্রণের দাগের জন্য নিয়াসিনামাইড সিরাম দিন, জেল-বেসড ময়েশ্চারাইজার লাগান এবং দিনের বেলা অবশ্যই নন-গ্রীসি SPF 50+ সানস্ক্রিন ব্যবহার করুন।",
      },
      {
        id: "faq-5",
        category: "Returns & Exchanges",
        question: "What is your return or replacement policy if a product arrives damaged or incorrect?",
        questionBn: "প্রোডাক্টে কোনো সমস্যা বা ভুল হলে রিটার্ন বা পরিবর্তনের নিয়ম কী?",
        answer:
          "We provide a hassle-free 7-day replacement guarantee. If an item arrives damaged, leaked, or incorrect, simply reach out to our WhatsApp support or customer care hotline with your order ID and a quick photo/unboxing video within 7 days. We will schedule a free courier pickup directly from your doorstep and dispatch a brand-new replacement immediately at zero extra cost.",
        answerBn:
          "আমাদের রয়েছে ঝামেলাহীন ৭ দিনের রিপ্লেসমেন্ট সুবিধা। কোনো কারণে ক্ষতিগ্রস্ত পার্সেল বা ভুল প্রোডাক্ট পৌঁছালে আনবক্সিংয়ের সময় তোলা ছবি বা ভিডিও সহ আমাদের হোয়াটসঅ্যাপ সাপোর্ট বা হটলাইনে জানান। আমাদের কুরিয়ার প্রতিনিধি সরাসরি আপনার ঠিকানা থেকে পার্সেলটি সম্পূর্ণ ফ্রিতে সংগ্রহ করবে এবং সাথে সাথে নতুন প্রোডাক্ট পাঠানো হবে।",
      },
      {
        id: "faq-6",
        category: "Skincare Advisory",
        question: "Can I get personalized product recommendations for my skin routine before buying?",
        questionBn: "অর্ডার করার আগে কি আমার ত্বকের ধরন অনুযায়ী ফ্রি পরামর্শ পেতে পারি?",
        answer:
          "Yes, completely free! If you are unsure which serum, moisturizer, or routine matches your skin goals (blemishes, dark spots, sun tan, uneven tone, or dullness), our certified beauty advisors are available on WhatsApp and live chat daily from 10 AM to 10 PM. We listen to your concerns and recommend only what your skin genuinely needs.",
        answerBn:
          "অবশ্যই এবং সম্পূর্ণ বিনামূল্যে! আপনার ত্বকের চাহিদা (যেমন: ব্রণের দাগ, রোদে পোড়া ভাব, আনইভেন স্কিন টোন বা শুষ্কতা) অনুযায়ী কোন পণ্যটি উপযুক্ত হবে তা জানতে আমাদের বিউটি এক্সপার্টরা প্রতিদিন সকাল ১০টা থেকে রাত ১০টা পর্যন্ত হোয়াটসঅ্যাপ ও লাইভ সাপোর্টে পরামর্শ দিতে প্রস্তুত থাকেন।",
      },
      {
        id: "faq-7",
        category: "Payment & Pricing",
        question: "Do I need to pay any advance deposit for Cash on Delivery orders?",
        questionBn: "ক্যাশ অন ডেলিভারিতে অর্ডার করতে কি কোনো অগ্রিম টাকা দিতে হয়?",
        answer:
          "For regular orders, you pay 100% of your bill directly to the courier rider upon delivery with zero advance payment. For certain remote upazila deliveries or high-value multi-item packages, a nominal courier confirmation deposit may be requested to protect against fraudulent bookings, which is fully adjusted against your final invoice.",
        answerBn:
          "স্বাভাবিক অর্ডারের ক্ষেত্রে কোনো অগ্রিম ছাড়াই সম্পূর্ণ মূল্য ডেলিভারিম্যানের কাছে ক্যাশ অন ডেলিভারিতে পরিশোধ করতে পারবেন। কেবল দূরবর্তী থানা এলাকা বা বড় অর্ডারের ক্ষেত্রে ফেক অর্ডার এড়াতে নামমাত্র কুরিয়ার ফি অগ্রিম গ্রহণ করা হতে পারে, যা আপনার মূল বিলের সাথে সম্পূর্ণ অ্যাডজাস্ট করা হয়।",
      },
      {
        id: "faq-8",
        category: "Product Safety",
        question: "Are your skincare and makeup products certified safe and free from toxic additives?",
        questionBn: "আপনাদের পণ্যগুলো কি ত্বকের জন্য নিরাপদ ও ক্ষতিকর উপাদানমুক্ত?",
        answer:
          "100% safe and tested. We strictly reject harsh bleaching agents, toxic additives, or unverified chemical compounds. Every brand we carry complies with strict international cosmetic safety standards (such as Korean MFDS, EU Cosmetic Safety Regulations, and US FDA compliance) focused on gentle barrier restoration, natural radiance, and long-term cosmetic safety and skin wellness.",
        answerBn:
          "শতভাগ নিরাপদ ও সার্টিফাইড। আমরা ক্ষতিকর ব্লিচিং এজেন্ট, বিষাক্ত কেমিক্যাল বা অনুমোদনহীন উপাদানযুক্ত কোনো পণ্য বিক্রি করি না। আমাদের প্রতিটি ব্র্যান্ড আন্তর্জাতিক কসমেটিক নিরাপত্তা মানদণ্ড (যেমন কোরিয়ান MFDS, ইউরোপীয় ইউনিয়ন ও ইউএস এফডিএ) মেনে প্রস্তুত, যা ত্বকের ক্ষতি না করে ভেতর থেকে প্রাকৃতিক সুস্থতা ও গ্লো বজায় রাখে।",
      },
    ],
    showWhatsappCard: true,
    whatsappTitle: "Need help choosing the right beauty products?",
    whatsappTitleBn: "সঠিক প্রোডাক্ট নির্বাচনে সাহায্য প্রয়োজন?",
    whatsappSubtitle:
      "Chat directly with our certified beauty advisors on WhatsApp daily 10 AM to 10 PM.",
    whatsappSubtitleBn:
      "আমাদের বিউটি এক্সপার্টরা প্রতিদিন সকাল ১০টা থেকে রাত ১০টা পর্যন্ত হোয়াটসঅ্যাপে সক্রিয় আছেন।",
    whatsappButtonText: "Chat on WhatsApp",
    whatsappButtonTextBn: "হোয়াটসঅ্যাপে ফ্রি পরামর্শ নিন",
    whatsappNumber: "+880 1700-000000",
  },

  // 10. Footer Comprehensive Configuration
  footerConfig: {
    brandText: "Blush & Budget",
    logoImageUrl: "",
    aboutText:
      "Bangladesh's most trusted beauty and personal care destination for 100% authentic international skincare, hair care, and cosmetics with nationwide Cash on Delivery.",
    aboutTextBn:
      "বাংলাদেশের সবচেয়ে নির্ভরযোগ্য বিউটি ও স্কিনকেয়ার গন্তব্য। ১০০% অরিজিনাল কোরিয়ান ও ওয়েস্টার্ন কসমেটিকস সারা দেশে ক্যাশ অন ডেলিভারিতে দ্রুত পৌঁছানো হয়।",
    copyrightText: "© 2026 Blush & Budget. All rights reserved. 100% Genuine Certified Cosmetics.",
    supportPhone: "+880 1700-000000",
    supportEmail: "support@example.com",
    supportAddress: "Gulshan, Dhaka, Bangladesh",
    supportAddressBn: "গুলশান, ঢাকা, বাংলাদেশ",
    supportWhatsapp: "+880 1700-000000",
    newsletterTitle: "Get Exclusive Deals & Beauty Tips",
    newsletterTitleBn: "এক্সক্লুসিভ অফার ও বিউটি টিপস পান",
    newsletterSubtitle: "Subscribe for new arrivals, flash sale coupons & skincare routine guides.",
    newsletterSubtitleBn: "নতুন প্রোডাক্ট রিলিজ, ডিসকাউন্ট ভাউচার ও স্কিনকেয়ার গাইড পেতে সাবস্ক্রাইব করুন।",
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
      { label: "Skin Care", labelBn: "স্কিন কেয়ার", href: "/products?category=skin-care" },
      { label: "Hair Care", labelBn: "হেয়ার কেয়ার", href: "/products?category=hair-care" },
      { label: "Makeup", labelBn: "মেকআপ", href: "/products?category=makeup" },
      { label: "Body Care", labelBn: "বডি কেয়ার", href: "/products?category=body-care" },
      { label: "Top Brands", labelBn: "শীর্ষ ব্র্যান্ডসমূহ", href: "/brands" },
      { label: "Beauty Journal & Guides", labelBn: "বিউটি জার্নাল ও গাইড", href: "/blog", isHighlight: true },
      { label: "Special Offers", labelBn: "স্পেশাল অফার", href: "/products?discount=true", isHighlight: true },
    ],
    customerCareLinks: [
      { label: "My Account", labelBn: "আমার অ্যাকাউন্ট", href: "/account" },
      { label: "Track Order", labelBn: "অর্ডার ট্র্যাক", href: "/track-order", isHighlight: true },
      { label: "Wishlist", labelBn: "উইশলিস্ট", href: "/wishlist" },
      { label: "Return Policy", labelBn: "রিটার্ন পলিসি", href: "/page/returns" },
      { label: "Terms & Conditions", labelBn: "শর্তাবলী ও নিয়মাবলী", href: "/page/terms" },
      { label: "Privacy Policy", labelBn: "গোপনীয়তা নীতি", href: "/page/privacy" },
      { label: "FAQ & Help Center", labelBn: "প্রশ্নোত্তর ও হেল্প সেন্টার", href: "/page/faq" },
    ],
  },

  footerBrandText: "Blush & Budget",
  footerLogoImageUrl: "",
  footerAboutText:
    "Bangladesh's most trusted beauty and personal care destination for 100% authentic international skincare, hair care, and cosmetics with nationwide Cash on Delivery.",
  footerCopyright: "© 2026 Blush & Budget. All rights reserved. 100% Genuine Certified Cosmetics.",
};
