export type Language = "bn" | "en";

export interface Translations {
  header: {
    announcementBadge: string;
    announcementText: string;
    routineFinder: string;
    trackOrder: string;
    authenticGuarantee: string;
    brands: string;
    topBrands: string;
    viewAll: string;
    searchPlaceholder: string;
    wishlist: string;
    account: string;
    login: string;
    admin: string;
    cart: string;
    noResults: string;
    viewAllResults: string;
    categories: string;
    concerns: string;
    actives: string;
    products: string;
    menu: string;
  };
  home: {
    heroDiscountBadge: string;
    trendingTitle: string;
    trendingSubtitle: string;
    trendingViewAll: string;
    dealsTitle: string;
    dealsSubtitle: string;
    topBrandsTitle: string;
    topBrandsSubtitle: string;
    shopByCategoryTitle: string;
    shopByCategorySubtitle: string;
    limitedOffersTitle: string;
    limitedOffersSubtitle: string;
    authenticProducts: string;
    authenticDesc: string;
    fastDelivery: string;
    fastDeliveryDesc: string;
    codAvailable: string;
    codDesc: string;
    easyReturns: string;
    easyReturnsDesc: string;
    consultation: string;
    consultationDesc: string;
    viewAll: string;
    beforeAfterTitle: string;
    beforeAfterSubtitle: string;
  };
  footer: {
    authenticTitle: string;
    authenticDesc: string;
    deliveryTitle: string;
    deliveryDesc: string;
    returnTitle: string;
    returnDesc: string;
    codTitle: string;
    codDesc: string;
    aboutTitle: string;
    quickLinks: string;
    customerCare: string;
    policies: string;
    stayConnected: string;
    newsletterDesc: string;
    subscribe: string;
    subscribed: string;
    emailPlaceholder: string;
    helpline: string;
    supportEmail: string;
    rightsReserved: string;
  };
  product: {
    freeShipping: string;
    inStock: string;
    outOfStock: string;
    addToCart: string;
    orderNow: string;
    buyNow: string;
    addedToCart: string;
    off: string;
    reviews: string;
    itemCode: string;
    quickView: string;
  };
  productDetail: {
    sku: string;
    brand: string;
    category: string;
    rating: string;
    basedOn: string;
    reviews: string;
    quantity: string;
    addToCart: string;
    orderNow: string;
    added: string;
    inStock: string;
    outOfStock: string;
    freeShipping: string;
    authenticGuarantee: string;
    cashOnDelivery: string;
    easyExchange: string;
    tabDescription: string;
    tabBenefits: string;
    tabUsage: string;
    tabIngredients: string;
    tabAuthenticity: string;
    tabReviews: string;
    frequentlyBoughtTogether: string;
    bundleSave: string;
    addBundleToCart: string;
    shareProduct: string;
    linkCopied: string;
    originCountry: string;
    routineStep: string;
    keyActives: string;
    skinType: string;
    skinConcern: string;
  };
  cart: {
    title: string;
    emptyTitle: string;
    emptySubtitle: string;
    shopNow: string;
    subtotal: string;
    delivery: string;
    checkout: string;
    freeDeliveryUnlocked: string;
    addMoreForFreeDelivery: string;
    item: string;
    items: string;
    couponPlaceholder: string;
    apply: string;
    discount: string;
    total: string;
  };
  cartPage: {
    pageTitle: string;
    productCol: string;
    priceCol: string;
    quantityCol: string;
    subtotalCol: string;
    emptyStateTitle: string;
    emptyStateDesc: string;
    continueShopping: string;
    clearCart: string;
    orderSummary: string;
    estimatedDelivery: string;
    promoCode: string;
    applyPromo: string;
    proceedToCheckout: string;
    safeCheckoutBadge: string;
    freeShippingNotice: string;
  };
  checkout: {
    pageTitle: string;
    expressCheckout: string;
    contactInfo: string;
    deliveryAddress: string;
    fullName: string;
    fullNamePlaceholder: string;
    phone: string;
    phonePlaceholder: string;
    altPhone: string;
    altPhonePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    division: string;
    district: string;
    thana: string;
    streetAddress: string;
    streetAddressPlaceholder: string;
    notes: string;
    notesPlaceholder: string;
    fastCitySelect: string;
    shippingMethod: string;
    insideDhaka: string;
    outsideDhaka: string;
    freeDelivery: string;
    deliveryTimeDhaka: string;
    deliveryTimeOutside: string;
    paymentMethod: string;
    cod: string;
    codDesc: string;
    bkash: string;
    bkashDesc: string;
    nagad: string;
    nagadDesc: string;
    orderSummary: string;
    subtotal: string;
    deliveryFee: string;
    discount: string;
    totalPayable: string;
    placeOrder: string;
    placingOrder: string;
    secureNotice: string;
    otpTitle: string;
    otpPrompt: string;
    enterOtp: string;
    verifyOtp: string;
    resendOtp: string;
    otpVerifying: string;
  };
  catalog: {
    pageTitle: string;
    filterBy: string;
    resetFilters: string;
    categories: string;
    brands: string;
    priceRange: string;
    skinConcern: string;
    skinType: string;
    keyActives: string;
    origin: string;
    availability: string;
    inStockOnly: string;
    allPrices: string;
    sortBy: string;
    sortDefault: string;
    sortPriceAsc: string;
    sortPriceDesc: string;
    sortNewest: string;
    productsFound: string;
    noProductsFound: string;
    noProductsDesc: string;
    viewAllProducts: string;
    tags: string;
    activeFilters: string;
    searchTags: string;
  };
  orders: {
    confirmationTitle: string;
    thankYou: string;
    receivedMsg: string;
    orderNumber: string;
    downloadInvoice: string;
    orderDetails: string;
    shippingAddress: string;
    paymentSummary: string;
    itemDetails: string;
    statusPending: string;
    statusConfirmed: string;
    statusProcessing: string;
    statusShipped: string;
    statusDelivered: string;
    statusCancelled: string;
    trackOrderTitle: string;
    enterOrderNumber: string;
    enterPhone: string;
    trackButton: string;
    trackingResults: string;
    courierName: string;
    consignmentId: string;
  };
  account: {
    myAccount: string;
    portalSubtitle: string;
    navDashboard: string;
    navOrders: string;
    navAddresses: string;
    navWishlist: string;
    navReviews: string;
    navReturns: string;
    navPoints: string;
    navVouchers: string;
    navNotifications: string;
    navSecurity: string;
    navTrack: string;
    logout: string;
    welcomeBack: string;
    recentOrders: string;
    viewAllOrders: string;
  };
  quiz: {
    title: string;
    subtitle: string;
    startQuiz: string;
    step: string;
    of: string;
    selectSkinType: string;
    selectConcerns: string;
    seeRoutine: string;
    recommendedRoutine: string;
    routineSubtitle: string;
    cleanser: string;
    treatment: string;
    moisturizer: string;
    addFullRoutine: string;
    restartQuiz: string;
  };
  wishlist: {
    title: string;
    subtitle: string;
    emptyTitle: string;
    emptySubtitle: string;
    exploreProducts: string;
    addToCart: string;
    remove: string;
  };
  auth: {
    signInTitle: string;
    signInSubtitle: string;
    signUpTitle: string;
    signUpSubtitle: string;
    emailOrPhone: string;
    password: string;
    forgotPassword: string;
    signInBtn: string;
    signUpBtn: string;
    noAccount: string;
    haveAccount: string;
    createAccount: string;
    loginHere: string;
  };
  blog: {
    title: string;
    subtitle: string;
    readArticle: string;
    minRead: string;
    writtenBy: string;
    shoppableProducts: string;
    addRoutineToCart: string;
  };
  brandsAndCategories: {
    allBrands: string;
    allCategories: string;
    exploreBrands: string;
    exploreCategories: string;
    productsCount: string;
  };
  mobileNav: {
    home: string;
    categories: string;
    wishlist: string;
    cart: string;
    account: string;
  };
  tagsPage: {
    pageTitle: string;
    subtitle: string;
    productsCount: string;
    noProducts: string;
    noProductsDesc: string;
    backToCatalog: string;
  };
  common: {
    bangla: string;
    english: string;
    language: string;
  };
}

const enTranslations: Translations = {
  header: {
      announcementBadge: "FREE DELIVERY",
      announcementText: "Free nationwide delivery on orders over ৳2,000",
      routineFinder: "Routine Finder",
      trackOrder: "Track Order",
      authenticGuarantee: "100% Authentic Products",
      brands: "Brands",
      topBrands: "Top Brands",
      viewAll: "View All",
      searchPlaceholder: "Search products, brands, or ingredients...",
      wishlist: "WISHLIST",
      account: "ACCOUNT",
      login: "LOGIN",
      admin: "ADMIN",
      cart: "CART",
      noResults: "No products found",
      viewAllResults: "See all results",
      categories: "Categories",
      concerns: "Skin Concerns",
      actives: "Key Ingredients",
      products: "Products",
      menu: "Menu",
    },
    home: {
      heroDiscountBadge: "SPECIAL OFFER",
      trendingTitle: "Popular Right Now",
      trendingSubtitle: "Customer favorites for everyday beauty routines",
      trendingViewAll: "View All",
      dealsTitle: "Offers You'll Love",
      dealsSubtitle: "Great prices on everyday beauty essentials",
      topBrandsTitle: "Featured Brands",
      topBrandsSubtitle: "Trusted Korean and global beauty brands",
      shopByCategoryTitle: "Shop by Category",
      shopByCategorySubtitle: "Find simple products for your daily routine",
      limitedOffersTitle: "Limited Time Offers",
      limitedOffersSubtitle: "Special prices available while stocks last",
      authenticProducts: "100% Genuine Products",
      authenticDesc: "Directly sourced from authorized brand distributors",
      fastDelivery: "Fast Nationwide Delivery",
      fastDeliveryDesc: "24–48 hours in Dhaka, fast delivery across Bangladesh",
      codAvailable: "Cash on Delivery",
      codDesc: "Inspect your parcel at your doorstep before payment",
      easyReturns: "7-Day Easy Exchange",
      easyReturnsDesc: "Simple returns if an item arrives damaged or incorrect",
      consultation: "Friendly Customer Support",
      consultationDesc: "Here to help you find the right everyday routine",
      viewAll: "View All",
      beforeAfterTitle: "See the Difference",
      beforeAfterSubtitle: "Simple everyday skincare for fresh, comfortable skin",
    },
    footer: {
      authenticTitle: "100% Genuine Products",
      authenticDesc: "Direct from official brand partners",
      deliveryTitle: "Fast Delivery",
      deliveryDesc: "24–48h in Dhaka, 3–5 days nationwide",
      returnTitle: "7-Day Easy Return",
      returnDesc: "Hassle-free replacement for damaged or wrong items",
      codTitle: "Cash on Delivery",
      codDesc: "Pay cash upon receiving your parcel",
      aboutTitle: "About Us",
      quickLinks: "Quick Links",
      customerCare: "Customer Care",
      policies: "Policies",
      stayConnected: "Stay in Touch",
      newsletterDesc: "Get updates on new arrivals, offers, and beauty tips:",
      subscribe: "Subscribe",
      subscribed: "Thank you for subscribing!",
      emailPlaceholder: "Enter your email address...",
      helpline: "Customer Care",
      supportEmail: "Support Email",
      rightsReserved: "All rights reserved. 100% Authentic Beauty Products.",
    },
    product: {
      freeShipping: "FREE DELIVERY",
      inStock: "In Stock",
      outOfStock: "Out of Stock",
      addToCart: "Add to Cart",
      orderNow: "Order Now",
      buyNow: "Buy Now",
      addedToCart: "Added!",
      off: "OFF",
      reviews: "Reviews",
      itemCode: "Item Code / SKU",
      quickView: "Quick View",
    },
    productDetail: {
      sku: "SKU",
      brand: "Brand",
      category: "Category",
      rating: "Rating",
      basedOn: "based on",
      reviews: "reviews",
      quantity: "Quantity",
      addToCart: "Add to Cart",
      orderNow: "Order Now (Cash on Delivery)",
      added: "Added to Cart!",
      inStock: "In Stock",
      outOfStock: "Out of Stock",
      freeShipping: "Free Delivery Eligible",
      authenticGuarantee: "100% Authentic Guarantee",
      cashOnDelivery: "Cash on Delivery Available",
      easyExchange: "7-Day Easy Return",
      tabDescription: "Description",
      tabBenefits: "Why You'll Like It",
      tabUsage: "How to Use",
      tabIngredients: "Key Ingredients & Specs",
      tabAuthenticity: "Authenticity",
      tabReviews: "Customer Reviews",
      frequentlyBoughtTogether: "Frequently Bought Together",
      bundleSave: "Bundle Savings",
      addBundleToCart: "Add Bundle to Cart",
      shareProduct: "Share",
      linkCopied: "Link copied to clipboard!",
      originCountry: "Country of Origin",
      routineStep: "Routine Step",
      keyActives: "Key Ingredients",
      skinType: "Skin Type",
      skinConcern: "Routine Focus",
    },
    cart: {
      title: "Your Cart",
      emptyTitle: "Your Cart is Empty",
      emptySubtitle: "Add your favorite beauty products to get started",
      shopNow: "Start Shopping",
      subtotal: "Subtotal",
      delivery: "Delivery Fee",
      checkout: "Proceed to Checkout",
      freeDeliveryUnlocked: "Great news! You unlocked FREE delivery 🎉",
      addMoreForFreeDelivery: "Add more for free delivery",
      item: "item",
      items: "items",
      couponPlaceholder: "Enter coupon code",
      apply: "Apply",
      discount: "Discount",
      total: "Total",
    },
    cartPage: {
      pageTitle: "Shopping Cart",
      productCol: "Product",
      priceCol: "Price",
      quantityCol: "Quantity",
      subtotalCol: "Subtotal",
      emptyStateTitle: "Your Shopping Cart is Empty",
      emptyStateDesc: "Looks like you haven't added anything yet. Browse our collection to get started.",
      continueShopping: "Continue Shopping",
      clearCart: "Clear Cart",
      orderSummary: "Order Summary",
      estimatedDelivery: "Estimated Delivery",
      promoCode: "Promo / Discount Code",
      applyPromo: "Apply",
      proceedToCheckout: "Proceed to Checkout",
      safeCheckoutBadge: "Simple & Secure Checkout",
      freeShippingNotice: "Free nationwide delivery on orders over ৳2,000!",
    },
    checkout: {
      pageTitle: "Checkout",
      expressCheckout: "Quick Checkout",
      contactInfo: "Contact Details",
      deliveryAddress: "Delivery Address",
      fullName: "Full Name",
      fullNamePlaceholder: "Enter your full name...",
      phone: "Phone Number",
      phonePlaceholder: "017XXXXXXXX",
      altPhone: "Alternate Phone (Optional)",
      altPhonePlaceholder: "For delivery updates...",
      email: "Email Address (Optional)",
      emailPlaceholder: "Enter your email...",
      division: "Division",
      district: "District",
      thana: "Thana / Upazila",
      streetAddress: "Delivery Address",
      streetAddressPlaceholder: "House, road, area, or landmarks...",
      notes: "Delivery Notes (Optional)",
      notesPlaceholder: "e.g. Please call before arrival...",
      fastCitySelect: "Select City",
      shippingMethod: "Delivery Option",
      insideDhaka: "Inside Dhaka",
      outsideDhaka: "Outside Dhaka",
      freeDelivery: "Free Delivery",
      deliveryTimeDhaka: "Delivery within 24–48 hours",
      deliveryTimeOutside: "Delivery within 2–4 business days",
      paymentMethod: "Payment Method",
      cod: "Cash on Delivery",
      codDesc: "Pay when your parcel arrives at your doorstep.",
      bkash: "bKash",
      bkashDesc: "Pay instantly via your bKash account.",
      nagad: "Nagad",
      nagadDesc: "Pay conveniently using Nagad.",
      orderSummary: "Order Summary",
      subtotal: "Subtotal",
      deliveryFee: "Delivery",
      discount: "Discount",
      totalPayable: "Total Amount",
      placeOrder: "Confirm Order",
      placingOrder: "Placing your order...",
      secureNotice: "Your order information is safe and private.",
      otpTitle: "Phone Verification (OTP)",
      otpPrompt: "We sent a 4-digit verification code to:",
      enterOtp: "Enter OTP Code",
      verifyOtp: "Verify & Confirm Order",
      resendOtp: "Resend Code",
      otpVerifying: "Verifying...",
    },
    catalog: {
      pageTitle: "Beauty & Skincare Collection",
      filterBy: "Filters",
      resetFilters: "Reset Filters",
      categories: "Categories",
      brands: "Brands",
      priceRange: "Price",
      skinConcern: "Routine Focus",
      skinType: "Skin Type",
      keyActives: "Ingredients",
      origin: "Country of Origin",
      availability: "Availability",
      inStockOnly: "In Stock Only",
      allPrices: "All Prices",
      sortBy: "Sort By",
      sortDefault: "Popular",
      sortPriceAsc: "Price: Low to High",
      sortPriceDesc: "Price: High to Low",
      sortNewest: "New Arrivals",
      productsFound: "products",
      noProductsFound: "No products found",
      noProductsDesc: "Try clearing some filters to see more products.",
      viewAllProducts: "View All Products",
      tags: "Tags",
      activeFilters: "Active Filters:",
      searchTags: "Search tags...",
    },
    orders: {
      confirmationTitle: "Order Confirmed!",
      thankYou: "Thank You For Your Order!",
      receivedMsg: "We have received your order and will dispatch your package shortly.",
      orderNumber: "Order Number",
      downloadInvoice: "Download Invoice",
      orderDetails: "Order Details",
      shippingAddress: "Delivery Address",
      paymentSummary: "Payment Summary",
      itemDetails: "Ordered Items",
      statusPending: "Pending",
      statusConfirmed: "Confirmed",
      statusProcessing: "Processing",
      statusShipped: "Shipped",
      statusDelivered: "Delivered",
      statusCancelled: "Cancelled",
      trackOrderTitle: "Track Your Order",
      enterOrderNumber: "Enter Order Number...",
      enterPhone: "Enter Mobile Number...",
      trackButton: "Track Order",
      trackingResults: "Tracking Details",
      courierName: "Courier Partner",
      consignmentId: "Consignment ID",
    },
    account: {
      myAccount: "My Account",
      portalSubtitle: "Account Settings & Order History",
      navDashboard: "Dashboard",
      navOrders: "Order History",
      navAddresses: "Addresses",
      navWishlist: "Wishlist",
      navReviews: "My Reviews",
      navReturns: "Returns & Exchange",
      navPoints: "Reward Points",
      navVouchers: "Coupons & Vouchers",
      navNotifications: "Notifications",
      navSecurity: "Security Settings",
      navTrack: "Track Order",
      logout: "Logout",
      welcomeBack: "Welcome back",
      recentOrders: "Recent Orders",
      viewAllOrders: "View All Orders",
    },
    quiz: {
      title: "Routine Finder",
      subtitle: "Answer a few simple questions to find products that fit your everyday routine",
      startQuiz: "Start Routine Finder",
      step: "Step",
      of: "of",
      selectSkinType: "What is your skin type?",
      selectConcerns: "What would you like to focus on?",
      seeRoutine: "See Recommended Routine",
      recommendedRoutine: "Your Daily Skincare Routine",
      routineSubtitle: "Simple 3-step routine designed for everyday comfort and hydration",
      cleanser: "Step 1: Gentle Cleanser",
      treatment: "Step 2: Lightweight Serum or Essence",
      moisturizer: "Step 3: Moisturizer & Sunscreen",
      addFullRoutine: "Add Routine to Cart",
      restartQuiz: "Retake Quiz",
    },
    wishlist: {
      title: "My Wishlist",
      subtitle: "Keep track of your favorite beauty items",
      emptyTitle: "Your Wishlist is Empty",
      emptySubtitle: "Explore our collection and click the heart icon to save products here.",
      exploreProducts: "Explore Products",
      addToCart: "Add to Cart",
      remove: "Remove",
    },
    auth: {
      signInTitle: "Sign In",
      signInSubtitle: "Log in to your account for fast checkout and order tracking",
      signUpTitle: "Create an Account",
      signUpSubtitle: "Join Azonno for easy shopping and order updates",
      emailOrPhone: "Email or Phone Number",
      password: "Password",
      forgotPassword: "Forgot Password?",
      signInBtn: "Sign In",
      signUpBtn: "Sign Up",
      noAccount: "Don't have an account?",
      haveAccount: "Already have an account?",
      createAccount: "Create Account",
      loginHere: "Log In",
    },
    blog: {
      title: "Beauty Journal & Guides",
      subtitle: "Simple beauty tips, ingredient guides, and everyday skincare ideas",
      readArticle: "Read Article",
      minRead: "min read",
      writtenBy: "By",
      shoppableProducts: "Products in this Guide",
      addRoutineToCart: "Shop this Routine",
    },
    brandsAndCategories: {
      allBrands: "All Brands",
      allCategories: "All Categories",
      exploreBrands: "Explore authentic global & Korean skincare brands",
      exploreCategories: "Find products tailored to your routine and care",
      productsCount: "Products",
    },
    mobileNav: {
      home: "Home",
      categories: "Categories",
      wishlist: "Wishlist",
      cart: "Cart",
      account: "Account",
    },
    tagsPage: {
      pageTitle: "Tag Collection",
      subtitle: "Browse all authentic products under this tag",
      productsCount: "products",
      noProducts: "No products found",
      noProductsDesc: "There are currently no products under this tag. Please explore our full collection.",
      backToCatalog: "Browse All Products",
    },
    common: {
      bangla: "English",
      english: "English",
      language: "Language",
    },
};

export const translations: Record<Language, Translations> = {
  en: enTranslations,
  bn: enTranslations,
};

/**
 * Convert numbers (including integers, decimals, formatted strings) to Bengali numerals (0-9).
 */
export function toBengaliNumber(val: string | number): string {
  const banglaDigits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  return String(val).replace(/[0-9]/g, (digit) => banglaDigits[Number(digit)] || digit);
}
