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

export const translations: Record<Language, Translations> = {
  bn: {
    header: {
      announcementBadge: "ফ্রি ডেলিভারি",
      announcementText: "২,০০০ টাকার অর্ডারে সারা দেশে ফ্রি ডেলিভারি",
      routineFinder: "রুটিন ফাইন্ডার",
      trackOrder: "অর্ডার ট্র্যাক",
      authenticGuarantee: "১০০% আসল পণ্যের নিশ্চয়তা",
      brands: "ব্র্যান্ডসমূহ",
      topBrands: "জনপ্রিয় ব্র্যান্ড",
      viewAll: "সব দেখুন",
      searchPlaceholder: "পণ্য, ব্র্যান্ড বা উপাদান খুঁজুন...",
      wishlist: "উইশলিস্ট",
      account: "অ্যাকাউন্ট",
      login: "লগইন",
      admin: "অ্যাডমিন",
      cart: "কার্ট",
      noResults: "কোনো পণ্য পাওয়া যায়নি",
      viewAllResults: "সব ফলাফল দেখুন",
      categories: "ক্যাটাগরি",
      concerns: "স্কিন কনসার্ন",
      actives: "উপাদানসমূহ",
      products: "পণ্যসমূহ",
      menu: "মেনু",
    },
    home: {
      heroDiscountBadge: "বিশেষ অফার",
      trendingTitle: "জনপ্রিয় কালেকশন",
      trendingSubtitle: "প্রতিদিনের রূপচর্চায় সবার পছন্দের আসল প্রসাধনী",
      trendingViewAll: "সব দেখুন",
      dealsTitle: "সেরা অফার ও ডিল",
      dealsSubtitle: "প্রতিদিনের প্রয়োজনীয় পণ্যে দারুণ ছাড়",
      topBrandsTitle: "জনপ্রিয় ব্র্যান্ডসমূহ",
      topBrandsSubtitle: "বিশ্বখ্যাত কোরিয়ান ও আন্তর্জাতিক আসল ব্র্যান্ড",
      shopByCategoryTitle: "ক্যাটাগরি অনুযায়ী খুঁজুন",
      shopByCategorySubtitle: "আপনার প্রতিদিনের রুটিনের জন্য প্রয়োজনীয় পণ্য বেছে নিন",
      limitedOffersTitle: "সীমিত সময়ের অফার",
      limitedOffersSubtitle: "স্টক শেষ হওয়ার আগেই লুফে নিন পছন্দের পণ্য",
      authenticProducts: "১০০% আসল পণ্য",
      authenticDesc: "সরাসরি অনুমোদিত ব্র্যান্ড ডিস্ট্রিবিউটর থেকে সংগৃহীত",
      fastDelivery: "দ্রুত হোম ডেলিভারি",
      fastDeliveryDesc: "ঢাকায় ২৪-৪৮ ঘণ্টা ও সারা দেশে দ্রুত ডেলিভারি",
      codAvailable: "ক্যাশ অন ডেলিভারি",
      codDesc: "ডেলিভারিম্যানের সামনে পার্সেল দেখে নিশ্চিন্তে মূল্য দিন",
      easyReturns: "৭ দিনের সহজ রিটার্ন",
      easyReturnsDesc: "ভুল বা ক্ষতিগ্রস্ত পণ্যে সহজ রিটার্ন ও পরিবর্তন সুবিধা",
      consultation: "কাস্টমার সাপোর্ট",
      consultationDesc: "পছন্দের পণ্য বেছে নিতে যেকোনো সহায়তায় পাশে আছি",
      viewAll: "সব দেখুন",
      beforeAfterTitle: "সহজ স্কিনকেয়ারের পার্থক্য",
      beforeAfterSubtitle: "প্রতিদিনের সহজ পরিচর্যায় সতেজ ও কোমল ত্বকের অনুভূতি",
    },
    footer: {
      authenticTitle: "১০০% আসল পণ্য",
      authenticDesc: "সরাসরি অফিসিয়াল ব্র্যান্ড ও ডিস্ট্রিবিউটর থেকে সংগৃহীত",
      deliveryTitle: "দ্রুত ডেলিভারি",
      deliveryDesc: "ঢাকায় ২৪-৪৮ ঘণ্টা ও সারা দেশে ৩-৫ দিনে ডেলিভারি",
      returnTitle: "৭ দিনের সহজ রিটার্ন",
      returnDesc: "কোনো সমস্যা হলে দ্রুত রিপ্লেসমেন্ট সুবিধা",
      codTitle: "ক্যাশ অন ডেলিভারি",
      codDesc: "পার্সেল হাতে পেয়ে নিশ্চিন্তে মূল্য পরিশোধ করুন",
      aboutTitle: "আমাদের সম্পর্কে",
      quickLinks: "প্রয়োজনীয় লিংক",
      customerCare: "কাস্টমার কেয়ার",
      policies: "শর্তাবলী ও পলিসি",
      stayConnected: "যুক্ত থাকুন",
      newsletterDesc: "নতুন প্রোডাক্ট ও বিশেষ অফারের আপডেট পেতে ইমেইল দিন:",
      subscribe: "সাবস্ক্রাইব করুন",
      subscribed: "ধন্যবাদ! সাবস্ক্রিপশন সম্পন্ন হয়েছে।",
      emailPlaceholder: "আপনার ইমেইল ঠিকানা লিখুন...",
      helpline: "হেল্পলাইন",
      supportEmail: "সাপোর্ট ইমেইল",
      rightsReserved: "সর্বস্বত্ব সংরক্ষিত। ১০০% আসল বিউটি প্রসাধনী।",
    },
    product: {
      freeShipping: "ফ্রি ডেলিভারি",
      inStock: "স্টকে আছে",
      outOfStock: "স্টক শেষ",
      addToCart: "কার্টে যোগ করুন",
      orderNow: "অর্ডার করুন",
      buyNow: "এখনই কিনুন",
      addedToCart: "যোগ হয়েছে!",
      off: "ছাড়",
      reviews: "রিভিউ",
      itemCode: "প্রোডাক্ট আইডি / এসকেইউ",
      quickView: "একনজরে দেখুন",
    },
    productDetail: {
      sku: "এসকেইউ",
      brand: "ব্র্যান্ড",
      category: "ক্যাটাগরি",
      rating: "রেটিং",
      basedOn: "মোট রিভিউ",
      reviews: "রিভিউ",
      quantity: "পরিমাণ",
      addToCart: "কার্টে যোগ করুন",
      orderNow: "ক্যাশ অন ডেলিভারিতে অর্ডার করুন",
      added: "কার্টে যোগ হয়েছে!",
      inStock: "স্টকে আছে",
      outOfStock: "স্টক শেষ",
      freeShipping: "ফ্রি ডেলিভারি সুবিধা",
      authenticGuarantee: "১০০% আসল পণ্যের নিশ্চয়তা",
      cashOnDelivery: "ক্যাশ অন ডেলিভারি প্রযোজ্য",
      easyExchange: "৭ দিনের সহজ রিটার্ন",
      tabDescription: "বিবরণ",
      tabBenefits: "উপকারিতা ও সুবিধা",
      tabUsage: "ব্যবহারবিধি",
      tabIngredients: "উপাদান ও স্পেসিফিকেশন",
      tabAuthenticity: "আসল পণ্যের নিশ্চয়তা",
      tabReviews: "গ্রাহক রিভিউ",
      frequentlyBoughtTogether: "একসাথে কিনুন দারুণ ছাড়ে",
      bundleSave: "বান্ডেল সেভিংস",
      addBundleToCart: "সম্পূর্ণ বান্ডেল কার্টে যোগ করুন",
      shareProduct: "শেয়ার করুন",
      linkCopied: "লিংক কপি হয়েছে!",
      originCountry: "উৎপাদনকারী দেশ",
      routineStep: "রুটিনের ধাপ",
      keyActives: "প্রধান উপাদান",
      skinType: "ত্বকের ধরণ",
      skinConcern: "রুটিনের ধরণ",
    },
    cart: {
      title: "আপনার কার্ট",
      emptyTitle: "আপনার কার্ট খালি",
      emptySubtitle: "কেনাকাটা শুরু করতে পছন্দের পণ্য কার্টে যোগ করুন",
      shopNow: "কেনাকাটা করুন",
      subtotal: "সাবটোটাল",
      delivery: "ডেলিভারি চার্জ",
      checkout: "চেকআউট করুন",
      freeDeliveryUnlocked: "অভিনন্দন! আপনি ফ্রি ডেলিভারি পেয়েছেন 🎉",
      addMoreForFreeDelivery: "ফ্রি ডেলিভারির জন্য আরও যোগ করুন",
      item: "আইটেম",
      items: "টি পণ্য",
      couponPlaceholder: "কুপন কোড লিখুন",
      apply: "প্রয়োগ",
      discount: "ছাড়",
      total: "সর্বমোট",
    },
    cartPage: {
      pageTitle: "শপিং কার্ট",
      productCol: "পণ্য",
      priceCol: "মূল্য",
      quantityCol: "পরিমাণ",
      subtotalCol: "সাবটোটাল",
      emptyStateTitle: "আপনার শপিং কার্ট খালি",
      emptyStateDesc: "আপনার কার্টে এখনও কোনো পণ্য যোগ করা হয়নি। কেনাকাটা শুরু করতে কালেকশন ঘুরে দেখুন।",
      continueShopping: "কেনাকাটা চালিয়ে যান",
      clearCart: "কার্ট খালি করুন",
      orderSummary: "অর্ডার সারসংক্ষেপ",
      estimatedDelivery: "আনুমানিক ডেলিভারি",
      promoCode: "ডিসকাউন্ট বা প্রমো কোড",
      applyPromo: "প্রয়োগ করুন",
      proceedToCheckout: "চেকআউটে এগিয়ে যান",
      safeCheckoutBadge: "নিরাপদ ও সহজ অর্ডার প্রক্রিয়া",
      freeShippingNotice: "২,০০০ টাকার কেনাকাটায় সারা দেশে ফ্রি ডেলিভারি!",
    },
    checkout: {
      pageTitle: "নিরাপদ চেকআউট",
      expressCheckout: "দ্রুত চেকআউট",
      contactInfo: "যোগাযোগের তথ্য",
      deliveryAddress: "ডেলিভারি ঠিকানা",
      fullName: "আপনার পুরো নাম",
      fullNamePlaceholder: "পুরো নাম লিখুন...",
      phone: "মোবাইল নম্বর",
      phonePlaceholder: "০১৭১XXXXXXXX",
      altPhone: "বিকল্প নম্বর (ঐচ্ছিক)",
      altPhonePlaceholder: "জরুরি যোগাযোগের জন্য...",
      email: "ইমেইল (ঐচ্ছিক)",
      emailPlaceholder: "আপনার ইমেইল লিখুন...",
      division: "বিভাগ",
      district: "জেলা",
      thana: "থানা / উপজেলা",
      streetAddress: "সম্পূর্ণ ঠিকানা",
      streetAddressPlaceholder: "বাসা নং, রোড নং, এলাকা বা চেনার উপায়...",
      notes: "ডেলিভারি সংক্রান্ত নির্দেশনা (ঐচ্ছিক)",
      notesPlaceholder: "যেমন: বিকেলে ডেলিভারি দিন, কল করে আসুন...",
      fastCitySelect: "দ্রুত শহর নির্বাচন করুন",
      shippingMethod: "ডেলিভারি পদ্ধতি",
      insideDhaka: "ঢাকার ভেতরে",
      outsideDhaka: "ঢাকার বাইরে",
      freeDelivery: "ফ্রি ডেলিভারি",
      deliveryTimeDhaka: "২৪–৪৮ ঘণ্টার মধ্যে ডেলিভারি",
      deliveryTimeOutside: "২–৪ দিনের মধ্যে দ্রুত ডেলিভারি",
      paymentMethod: "পেমেন্ট মাধ্যম বেছে নিন",
      cod: "ক্যাশ অন ডেলিভারি (পণ্য হাতে পেয়ে পেমেন্ট)",
      codDesc: "পণ্য হাতে পেয়ে দেখে মূল্য পরিশোধ করুন।",
      bkash: "বিকাশ পেমেন্ট",
      bkashDesc: "বিকাশের মাধ্যমে সরাসরি ইনস্ট্যান্ট পেমেন্ট।",
      nagad: "নগদ পেমেন্ট",
      nagadDesc: "নগদ একাউন্ট থেকে সহজে পেমেন্ট করুন।",
      orderSummary: "অর্ডারের বিবরণ",
      subtotal: "পণ্যের মূল্য",
      deliveryFee: "ডেলিভারি চার্জ",
      discount: "ছাড় / কুপন",
      totalPayable: "সর্বমোট প্রদেয়",
      placeOrder: "অর্ডার কনফার্ম করুন",
      placingOrder: "অর্ডার সম্পন্ন হচ্ছে...",
      secureNotice: "আপনার ব্যক্তিগত তথ্য সম্পূর্ণ নিরাপদ ও সুরক্ষিত।",
      otpTitle: "মোবাইল নম্বর যাচাইকরণ",
      otpPrompt: "আপনার নম্বরে ৪ ডিজিটের ভেরিফিকেশন কোড পাঠানো হয়েছে:",
      enterOtp: "ওটিপি কোড লিখুন",
      verifyOtp: "যাচাই করে অর্ডার করুন",
      resendOtp: "পুনরায় কোড পাঠান",
      otpVerifying: "যাচাই করা হচ্ছে...",
    },
    catalog: {
      pageTitle: "অথেনটিক স্কিনকেয়ার ও বিউটি কালেকশন",
      filterBy: "ফিল্টার করুন",
      resetFilters: "সকল ফিল্টার মুছুন",
      categories: "ক্যাটাগরি",
      brands: "ব্র্যান্ডসমূহ",
      priceRange: "মূল্যের সীমা",
      skinConcern: "রুটিনের ধরণ",
      skinType: "ত্বকের ধরণ",
      keyActives: "মূল উপাদানসমূহ",
      origin: "উৎপাদনকারী দেশ",
      availability: "লভ্যতা",
      inStockOnly: "শুধুমাত্র স্টকে আছে",
      allPrices: "সকল মূল্য",
      sortBy: "সাজান",
      sortDefault: "জনপ্রিয়তা অনুযায়ী",
      sortPriceAsc: "মূল্য: কম থেকে বেশি",
      sortPriceDesc: "মূল্য: বেশি থেকে কম",
      sortNewest: "নতুন সংযোজন",
      productsFound: "টি পণ্য পাওয়া গেছে",
      noProductsFound: "কোনো পণ্য পাওয়া যায়নি",
      noProductsDesc: "অন্য কোনো ফিল্টার নির্বাচন করে চেষ্টা করুন।",
      viewAllProducts: "সকল পণ্য দেখুন",
      tags: "ট্যাগস",
      activeFilters: "সক্রিয় ফিল্টারসমূহ:",
      searchTags: "ট্যাগ খুঁজুন...",
    },
    orders: {
      confirmationTitle: "অর্ডার নিশ্চিত হয়েছে!",
      thankYou: "আপনার অর্ডারের জন্য ধন্যবাদ!",
      receivedMsg: "আমরা আপনার অর্ডারটি পেয়েছি। খুব শীঘ্রই পার্সেলটি পাঠিয়ে দেওয়া হবে।",
      orderNumber: "অর্ডার নম্বর",
      downloadInvoice: "ইনভয়েস ডাউনলোড করুন",
      orderDetails: "অর্ডারের বিস্তারিত",
      shippingAddress: "ডেলিভারি ঠিকানা",
      paymentSummary: "পেমেন্ট বিবরণ",
      itemDetails: "অর্ডারকৃত পণ্যসমূহ",
      statusPending: "পেন্ডিং",
      statusConfirmed: "নিশ্চিত হয়েছে",
      statusProcessing: "প্রসেসিং",
      statusShipped: "ডেলিভারিতে আছে",
      statusDelivered: "ডেলিভারি সম্পন্ন",
      statusCancelled: "বাতিলকৃত",
      trackOrderTitle: "অর্ডার ট্র্যাকিং",
      enterOrderNumber: "অর্ডার নম্বর লিখুন...",
      enterPhone: "মোবাইল নম্বর লিখুন...",
      trackButton: "অর্ডার ট্র্যাক করুন",
      trackingResults: "ট্র্যাকিং আপডেট",
      courierName: "কুরিয়ার সার্ভিস",
      consignmentId: "কনসাইনমেন্ট আইডি",
    },
    account: {
      myAccount: "আমার অ্যাকাউন্ট",
      portalSubtitle: "অ্যাকাউন্ট সেটিংস ও অর্ডার হিস্ট্রি",
      navDashboard: "ড্যাশবোর্ড",
      navOrders: "অর্ডার হিস্ট্রি",
      navAddresses: "ঠিকানা সমূহ",
      navWishlist: "উইশলিস্ট",
      navReviews: "আমার রিভিউ",
      navReturns: "রিটার্ন ও এক্সচেঞ্জ",
      navPoints: "রিওয়ার্ড পয়েন্ট",
      navVouchers: "ভাউচার ও কুপন",
      navNotifications: "নোটিফিকেশন",
      navSecurity: "সিকিউরিটি সেটিংস",
      navTrack: "অর্ডার ট্র্যাক",
      logout: "লগআউট",
      welcomeBack: "স্বাগতম",
      recentOrders: "সাম্প্রতিক অর্ডার",
      viewAllOrders: "সব অর্ডার দেখুন",
    },
    quiz: {
      title: "স্কিনকেয়ার রুটিন ফাইন্ডার",
      subtitle: "কয়েকটি সহজ প্রশ্নের উত্তরে খুঁজে নিন আপনার পছন্দের স্কিনকেয়ার রুটিন",
      startQuiz: "রুটিন ফাইন্ডার শুরু করুন",
      step: "ধাপ",
      of: "এর",
      selectSkinType: "আপনার ত্বকের ধরণ কোনটি?",
      selectConcerns: "আপনার স্কিনকেয়ার রুটিনে কোন বিষয়ে গুরুত্ব দিতে চান?",
      seeRoutine: "রুটিন দেখুন",
      recommendedRoutine: "আপনার প্রতিদিনের স্কিনকেয়ার রুটিন",
      routineSubtitle: "সহজ ৩ ধাপের স্কিনকেয়ার রুটিন যা ত্বককে রাখবে সতেজ ও কোমল",
      cleanser: "১. ক্লিনজার",
      treatment: "২. সিরাম বা এসেন্স",
      moisturizer: "৩. ময়েশ্চারাইজার ও সানস্ক্রিন",
      addFullRoutine: "সম্পূর্ণ রুটিন কার্টে যোগ করুন",
      restartQuiz: "আবার শুরু করুন",
    },
    wishlist: {
      title: "আমার পছন্দের তালিকা",
      subtitle: "আপনার পছন্দের প্রসাধনীসমূহ সংরক্ষণ করে রাখুন",
      emptyTitle: "পছন্দের তালিকা খালি",
      emptySubtitle: "আপনার পছন্দের কোনো পণ্য তালিকায় যুক্ত করা হয়নি।",
      exploreProducts: "পণ্য ব্রাউজ করুন",
      addToCart: "কার্টে যোগ করুন",
      remove: "সরিয়ে নিন",
    },
    auth: {
      signInTitle: "লগইন করুন",
      signInSubtitle: "সহজে কেনাকাটা ও অর্ডার ট্র্যাক করতে লগইন করুন",
      signUpTitle: "নতুন অ্যাকাউন্ট তৈরি করুন",
      signUpSubtitle: "আমাদের সাথে যুক্ত হয়ে সহজ কেনাকাটার অভিজ্ঞতা উপভোগ করুন",
      emailOrPhone: "ইমেইল বা মোবাইল নম্বর",
      password: "পাসওয়ার্ড",
      forgotPassword: "পাসওয়ার্ড ভুলে গেছেন?",
      signInBtn: "লগইন",
      signUpBtn: "রেজিস্ট্রেশন করুন",
      noAccount: "অ্যাকাউন্ট নেই?",
      haveAccount: "ইতিমধ্যে অ্যাকাউন্ট আছে?",
      createAccount: "নতুন অ্যাকাউন্ট খুলুন",
      loginHere: "লগইন করুন",
    },
    blog: {
      title: "বিউটি জার্নাল ও স্কিনকেয়ার গাইড",
      subtitle: "সহজ বিউটি টিপস, উপাদান পরিচিতি ও প্রতিদিনের স্কিনকেয়ার গাইড",
      readArticle: "পড়ুন",
      minRead: "মিনিট পড়ার সময়",
      writtenBy: "লেখক:",
      shoppableProducts: "আর্টিকেলে উল্লেখিত পণ্যসমূহ",
      addRoutineToCart: "রুটিনটি কিনুন",
    },
    brandsAndCategories: {
      allBrands: "সকল ব্র্যান্ডসমূহ",
      allCategories: "সকল ক্যাটাগরিসমূহ",
      exploreBrands: "অথেনটিক গ্লোবাল ও কোরিয়ান ব্র্যান্ডসমূহ ঘুরে দেখুন",
      exploreCategories: "আপনার প্রয়োজন অনুযায়ী পণ্য খুঁজে নিন",
      productsCount: "টি পণ্য",
    },
    mobileNav: {
      home: "হোম",
      categories: "ক্যাটাগরি",
      wishlist: "উইশলিস্ট",
      cart: "কার্ট",
      account: "অ্যাকাউন্ট",
    },
    tagsPage: {
      pageTitle: "ট্যাগ কালেকশন",
      subtitle: "নির্বাচিত ট্যাগের সকল আসল প্রসাধনী",
      productsCount: "টি পণ্য পাওয়া গেছে",
      noProducts: "এই ট্যাগে কোনো পণ্য নেই",
      noProductsDesc: "আপাতত এই ট্যাগে কোনো পণ্য নেই। ক্যাটালগ থেকে অন্যান্য পণ্য দেখুন।",
      backToCatalog: "সকল পণ্য ব্রাউজ করুন",
    },
    common: {
      bangla: "বাংলা",
      english: "English",
      language: "ভাষা",
    },
  },
  en: {
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
      signUpSubtitle: "Join Blush & Budget for easy shopping and order updates",
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
      bangla: "বাংলা",
      english: "English",
      language: "Language",
    },
  },
};

/**
 * Convert numbers (including integers, decimals, formatted strings) to Bengali numerals (০-৯).
 */
export function toBengaliNumber(val: string | number): string {
  const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(val).replace(/[0-9]/g, (digit) => banglaDigits[Number(digit)] || digit);
}
