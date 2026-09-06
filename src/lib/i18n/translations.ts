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
      announcementText: "২,০০০ টাকার অর্ডারে সারা দেশে ফ্রি ডেলিভারি!",
      routineFinder: "রুটিন ফাইন্ডার",
      trackOrder: "অর্ডার ট্র্যাক",
      authenticGuarantee: "১০০% অরিজিনাল গ্যারান্টি",
      brands: "ব্র্যান্ডস",
      topBrands: "শীর্ষ ব্র্যান্ডসমূহ",
      viewAll: "সব দেখুন",
      searchPlaceholder: "প্রোডাক্ট, ব্র্যান্ড বা উপাদান খুঁজুন...",
      wishlist: "উইশলিস্ট",
      account: "অ্যাকাউন্ট",
      login: "লগইন",
      admin: "অ্যাডমিন",
      cart: "কার্ট",
      noResults: "কোনো ফলাফল পাওয়া যায়নি",
      viewAllResults: "সকল ফলাফল দেখুন",
      categories: "ক্যাটাগরি",
      concerns: "স্কিন কনসার্ন",
      actives: "উপাদানসমূহ",
      products: "প্রোডাক্টসমূহ",
      menu: "মেনু",
    },
    home: {
      heroDiscountBadge: "বিশেষ অফার",
      trendingTitle: "ট্রেন্ডিং বিউটি কালেকশন",
      trendingSubtitle: "সেরা রেটেড ও সর্বাধিক বিক্রিত খাঁটি প্রসাধনী",
      trendingViewAll: "সব দেখুন",
      dealsTitle: "মিস করবেন না এমন দারুণ ডিল",
      dealsSubtitle: "সেরা ডিসকাউন্টে আপনার পছন্দের বিউটি কেয়ার",
      topBrandsTitle: "শীর্ষ ব্র্যান্ড ও অফার",
      topBrandsSubtitle: "কোরিয়ান ও গ্লোবাল সেরা অথেনটিক ব্র্যান্ডসমূহ",
      shopByCategoryTitle: "ক্যাটাগরি অনুযায়ী কিনুন",
      shopByCategorySubtitle: "আপনার ত্বকের যত্নে প্রয়োজনীয় সঠিক ক্যাটাগরি বেছে নিন",
      limitedOffersTitle: "সীমিত সময়ের অফার",
      limitedOffersSubtitle: "স্টক শেষ হওয়ার আগেই লুফে নিন বিশেষ ছাড়",
      authenticProducts: "১০০% অরিজিনাল প্রসাধনী",
      authenticDesc: "সরাসরি অথরাইজড ডিস্ট্রিবিউটর থেকে আমদানিকৃত",
      fastDelivery: "দ্রুততম ডেলিভারি",
      fastDeliveryDesc: "ঢাকায় ২৪-৪৮ ঘণ্টা ও সারা দেশে দ্রুত হোম ডেলিভারি",
      codAvailable: "ক্যাশ অন ডেলিভারি",
      codDesc: "পণ্য হাতে পেয়ে নিশ্চিন্তে মূল্য পরিশোধ করুন",
      easyReturns: "সহজ রিটার্ন পলিসি",
      easyReturnsDesc: "কোনো সমস্যা হলে ৭ দিনের মধ্যে সহজ এক্সচেঞ্জ",
      consultation: "বিউটি এক্সপার্ট সাপোর্ট",
      consultationDesc: "ত্বকের সঠিক পরামর্শে ২৪/৭ সার্বক্ষণিক সহায়তা",
      viewAll: "সব দেখুন",
      beforeAfterTitle: "আসল পরিবর্তন দেখুন",
      beforeAfterSubtitle: "সঠিক স্কিনকেয়ার রুটিন ব্যবহারের দৃশ্যমান ফলাফল",
    },
    footer: {
      authenticTitle: "১০০% খাঁটি ও অরিজিনাল",
      authenticDesc: "সরাসরি অথরাইজড ব্র্যান্ড ও ডিস্ট্রিবিউটর থেকে সংগৃহীত",
      deliveryTitle: "দ্রুততম ডেলিভারি",
      deliveryDesc: "ঢাকায় ২৪-৪৮ ঘণ্টা ও সারা দেশে ৩-৫ দিনে ডেলিভারি",
      returnTitle: "৭ দিনের সহজ রিটার্ন",
      returnDesc: "কোনো সমস্যা হলে সহজ এক্সচেঞ্জ ও রিটার্ন গ্যারান্টি",
      codTitle: "ক্যাশ অন ডেলিভারি",
      codDesc: "বিকাশ, নগদ ও পণ্য হাতে পেয়ে মূল্য পরিশোধের সুবিধা",
      aboutTitle: "আমাদের সম্পর্কে",
      quickLinks: "কুইক লিংকস",
      customerCare: "কাস্টমার কেয়ার",
      policies: "শর্তাবলী ও পলিসি",
      stayConnected: "যুক্ত থাকুন",
      newsletterDesc: "বিশেষ অফার ও নতুন প্রোডাক্টের আপডেট পেতে ইমেইল দিন:",
      subscribe: "সাবস্ক্রাইব করুন",
      subscribed: "ধন্যবাদ! সাবস্ক্রিপশন সম্পন্ন হয়েছে।",
      emailPlaceholder: "আপনার ইমেইল ঠিকানা লিখুন...",
      helpline: "হেল্পলাইন",
      supportEmail: "সাপোর্ট ইমেইল",
      rightsReserved: "সর্বস্বত্ব সংরক্ষিত। ১০০% সার্টিফাইড কসমেটিকস।",
    },
    product: {
      freeShipping: "ফ্রি ডেলিভারি",
      inStock: "স্টকে আছে",
      outOfStock: "স্টক শেষ",
      addToCart: "কার্ট-এ যোগ করুন",
      orderNow: "অর্ডার করুন",
      buyNow: "এখনই কিনুন",
      addedToCart: "যোগ হয়েছে",
      off: "ছাড়",
      reviews: "রিভিউ",
      itemCode: "প্রোডাক্ট আইডি / এসকেইউ",
      quickView: "একনজরে",
    },
    productDetail: {
      sku: "এসকেইউ",
      brand: "ব্র্যান্ড",
      category: "ক্যাটাগরি",
      rating: "রেটিং",
      basedOn: "মোট রিভিউ",
      reviews: "রিভিউ",
      quantity: "পরিমাণ",
      addToCart: "কার্ট-এ যোগ করুন",
      orderNow: "অর্ডার করুন",
      added: "যোগ হয়েছে!",
      inStock: "স্টকে আছে",
      outOfStock: "স্টক শেষ",
      freeShipping: "ফ্রি ডেলিভারি সুবিধা",
      authenticGuarantee: "১০০% অথেনটিক গ্যারান্টি",
      cashOnDelivery: "ক্যাশ অন ডেলিভারি",
      easyExchange: "৭ দিনের সহজ রিটার্ন",
      tabDescription: "বিবরণ",
      tabBenefits: "উপকারিতা",
      tabUsage: "ব্যবহারের নিয়ম",
      tabIngredients: "উপাদানসমূহ",
      tabAuthenticity: "খাঁটি হওয়ার নিশ্চয়তা",
      tabReviews: "গ্রাহক মতামত",
      frequentlyBoughtTogether: "একসাথে কিনুন দারুণ ছাড়ে",
      bundleSave: "বান্ডেল সেভিং",
      addBundleToCart: "সম্পূর্ণ বান্ডেল কার্টে যোগ করুন",
      shareProduct: "শেয়ার করুন",
      linkCopied: "লিংক কপি হয়েছে!",
      originCountry: "উৎপাদনকারী দেশ",
      routineStep: "রুটিনের ধাপ",
      keyActives: "প্রধান উপাদান",
      skinType: "ত্বকের ধরণ",
      skinConcern: "ত্বকের সমস্যা",
    },
    cart: {
      title: "আপনার কার্ট",
      emptyTitle: "আপনার কার্ট খালি",
      emptySubtitle: "এখনই আপনার পছন্দের বিউটি প্রোডাক্ট কার্টে যোগ করুন",
      shopNow: "কেনাকাটা করুন",
      subtotal: "সাবটোটাল",
      delivery: "ডেলিভারি চার্জ",
      checkout: "অর্ডার কনফার্ম করুন",
      freeDeliveryUnlocked: "অভিনন্দন! আপনি ফ্রি ডেলিভারি পেয়েছেন 🎉",
      addMoreForFreeDelivery: "ফ্রি ডেলিভারির জন্য আরও যোগ করুন",
      item: "আইটেম",
      items: "টি আইটেম",
      couponPlaceholder: "কুপন কোড লিখুন",
      apply: "প্রয়োগ",
      discount: "ছাড়",
      total: "সর্বমোট",
    },
    cartPage: {
      pageTitle: "শপিং কার্ট",
      productCol: "প্রোডাক্ট",
      priceCol: "মূল্য",
      quantityCol: "পরিমাণ",
      subtotalCol: "সাবটোটাল",
      emptyStateTitle: "আপনার শপিং কার্ট খালি",
      emptyStateDesc: "আপনার কার্টে এখনও কোনো পণ্য যোগ করা হয়নি। সেরা প্রসাধনী খুঁজে নিতে ব্রাউজ করুন।",
      continueShopping: "কেনাকাটা চালিয়ে যান",
      clearCart: "কার্ট খালি করুন",
      orderSummary: "অর্ডার সারসংক্ষেপ",
      estimatedDelivery: "আনুমানিক ডেলিভারি",
      promoCode: "ডিসকাউন্ট বা প্রমো কোড",
      applyPromo: "প্রয়োগ করুন",
      proceedToCheckout: "চেকআউট-এ এগিয়ে যান",
      safeCheckoutBadge: "নিরাপদ ও ১০০% সুরক্ষার নিশ্চয়তা",
      freeShippingNotice: "২,৫০০ টাকার কেনাকাটায় সারা দেশে ফ্রি ডেলিভারি!",
    },
    checkout: {
      pageTitle: "নিরাপদ চেকআউট",
      expressCheckout: "দ্রুততম চেকআউট",
      contactInfo: "যোগাযোগের তথ্য",
      deliveryAddress: "ডেলিভারি ঠিকানা",
      fullName: "আপনার নাম",
      fullNamePlaceholder: "পুরো নাম লিখুন...",
      phone: "মোবাইল নম্বর",
      phonePlaceholder: "০১৭১XXXXXXXX",
      altPhone: "বিকল্প মোবাইল নম্বর (ঐচ্ছিক)",
      altPhonePlaceholder: "জরুরি যোগাযোগের জন্য...",
      email: "ইমেইল ঠিকানা (ঐচ্ছিক)",
      emailPlaceholder: "আপনার ইমেইল লিখুন...",
      division: "বিভাগ",
      district: "জেলা",
      thana: "থানা / উপজেলা",
      streetAddress: "সম্পূর্ণ ঠিকানা (বাসা/রোড/এলাকা)",
      streetAddressPlaceholder: "বাসা নং, রোড নং, এলাকা বা চেনার উপায়...",
      notes: "ডেলিভারি সংক্রান্ত নির্দেশনা (ঐচ্ছিক)",
      notesPlaceholder: "যেমন: বিকেলে ডেলিভারি দিন, কল করে আসুন...",
      fastCitySelect: "দ্রুত শহর নির্বাচন করুন",
      shippingMethod: "ডেলিভারি পদ্ধতি",
      insideDhaka: "ঢাকার ভেতরে",
      outsideDhaka: "ঢাকার বাইরে",
      freeDelivery: "ফ্রি ডেলিভারি",
      deliveryTimeDhaka: "২৪–৪৮ ঘণ্টার মধ্যে ডেলিভারি",
      deliveryTimeOutside: "৩–৫ দিনের মধ্যে দ্রুত ডেলিভারি",
      paymentMethod: "পেমেন্ট মাধ্যম বেছে নিন",
      cod: "ক্যাশ অন ডেলিভারি (পণ্য হাতে পেয়ে পেমেন্ট)",
      codDesc: "ডেলিভারি ম্যানের হাতে পণ্য পেয়ে নিশ্চিন্তে টাকা পরিশোধ করুন।",
      bkash: "বিকাশ পেমেন্ট",
      bkashDesc: "বিকাশের মাধ্যমে সরাসরি ইনস্ট্যান্ট ও নিরাপদ পেমেন্ট।",
      nagad: "নগদ পেমেন্ট",
      nagadDesc: "নগদ একাউন্ট থেকে সহজে পেমেন্ট করুন।",
      orderSummary: "অর্ডারের বিবরণ",
      subtotal: "পণ্যের মূল্য",
      deliveryFee: "ডেলিভারি চার্জ",
      discount: "ছাড় / কুপন",
      totalPayable: "সর্বমোট প্রদেয়",
      placeOrder: "অর্ডার কনফার্ম করুন",
      placingOrder: "অর্ডার সম্পন্ন হচ্ছে...",
      secureNotice: "আপনার ব্যক্তিগত তথ্য সম্পূর্ণ নিরাপদ ও এনক্রিপ্টেড।",
      otpTitle: "মোবাইল নম্বর যাচাইকরণ",
      otpPrompt: "আপনার অর্ডারের সুরক্ষার জন্য নম্বরে ৪ ডিজিটের কোড পাঠানো হয়েছে:",
      enterOtp: "ওটিপি কোড লিখুন",
      verifyOtp: "যাচাই করে অর্ডার করুন",
      resendOtp: "পুনরায় কোড পাঠান",
      otpVerifying: "যাচাই করা হচ্ছে...",
    },
    catalog: {
      pageTitle: "অথেনটিক স্কিনকেয়ার ও বিউটি ক্যাটালগ",
      filterBy: "ফিল্টার করুন",
      resetFilters: "সকল ফিল্টার মুছুন",
      categories: "ক্যাটাগরি",
      brands: "ব্র্যান্ডসমূহ",
      priceRange: "মূল্যের সীমা",
      skinConcern: "ত্বকের সমস্যা",
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
      productsFound: "টি প্রোডাক্ট পাওয়া গেছে",
      noProductsFound: "কোনো প্রোডাক্ট পাওয়া যায়নি",
      noProductsDesc: "আপনার নির্বাচিত ফিল্টারে কোনো পণ্য মেলেনি। অন্য ফিল্টার দিয়ে চেষ্টা করুন।",
      viewAllProducts: "সকল প্রোডাক্ট দেখুন",
    },
    orders: {
      confirmationTitle: "অর্ডার নিশ্চিত হয়েছে!",
      thankYou: "আপনার অর্ডারের জন্য ধন্যবাদ!",
      receivedMsg: "আমরা আপনার অর্ডারটি পেয়েছি। আমাদের প্রতিনিধি শীঘ্রই আপনার সাথে যোগাযোগ করবেন।",
      orderNumber: "অর্ডার নম্বর",
      downloadInvoice: "ইনভয়েস প্রিন্ট ও ডাউনলোড করুন",
      orderDetails: "অর্ডারের বিস্তারিত",
      shippingAddress: "ডেলিভারি ঠিকানা",
      paymentSummary: "পেমেন্ট বিবরণ",
      itemDetails: "অর্ডারকৃত পণ্যসমূহ",
      statusPending: "পেন্ডিং",
      statusConfirmed: "নিশ্চিত হয়েছে",
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
      portalSubtitle: "কাস্টমার পোর্টাল ও সেটিংস",
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
      title: "স্কিনকেয়ার রুটিন ফাইন্ডার",
      subtitle: "কয়েকটি সহজ প্রশ্নের উত্তরে খুঁজে নিন আপনার ত্বকের জন্য সঠিক রুটিন",
      startQuiz: "কুইজ শুরু করুন",
      step: "ধাপ",
      of: "/",
      selectSkinType: "আপনার ত্বকের ধরণ কোনটি?",
      selectConcerns: "আপনার ত্বকের প্রধান সমস্যা কি?",
      seeRoutine: "আমার রুটিন দেখুন",
      recommendedRoutine: "আপনার জন্য সেরা স্কিনকেয়ার রুটিন",
      routineSubtitle: "১০০% খাঁটি ও কার্যকর প্রোডাক্টের সমন্বয়ে তৈরি ৩ ধাপের রুটিন",
      cleanser: "১. ক্লিনজার",
      treatment: "২. এসেন্স ও সিরাম",
      moisturizer: "৩. ময়েশ্চারাইজার / সানস্ক্রিন",
      addFullRoutine: "সম্পূর্ণ রুটিন কার্টে যোগ করুন",
      restartQuiz: "আবার কুইজ দিন",
    },
    wishlist: {
      title: "আমার পছন্দের তালিকা",
      subtitle: "আপনার প্রিয় প্রসাধনীসমূহ সংরক্ষণ করে রাখুন",
      emptyTitle: "পছন্দের তালিকা খালি",
      emptySubtitle: "আপনার পছন্দের কোনো পণ্য তালিকায় যুক্ত করা হয়নি।",
      exploreProducts: "প্রোডাক্ট ব্রাউজ করুন",
      addToCart: "কার্ট-এ যোগ করুন",
      remove: "সরিয়ে নিন",
    },
    auth: {
      signInTitle: "লগইন করুন",
      signInSubtitle: "আপনার অ্যাকাউন্টে প্রবেশ করে সহজে কেনাকাটা করুন",
      signUpTitle: "নতুন অ্যাকাউন্ট তৈরি করুন",
      signUpSubtitle: "আমাদের পরিবারের অংশ হয়ে বিশেষ সুবিধা পান",
      emailOrPhone: "ইমেইল বা মোবাইল নম্বর",
      password: "পাসওয়ার্ড",
      forgotPassword: "পাসওয়ার্ড ভুলে গেছেন?",
      signInBtn: "লগইন",
      signUpBtn: "নিবন্ধন করুন",
      noAccount: "অ্যাকাউন্ট নেই?",
      haveAccount: "ইতিমধ্যে অ্যাকাউন্ট আছে?",
      createAccount: "নতুন অ্যাকাউন্ট খুলুন",
      loginHere: "লগইন করুন",
    },
    blog: {
      title: "বিউটি জার্নাল ও স্কিনকেয়ার গাইড",
      subtitle: "বিশেষজ্ঞদের স্কিন টিপস, উপাদান বিশ্লেষণ ও ত্বকের সঠিক পরিচর্যা",
      readArticle: "পড়ুন",
      minRead: "মিনিট পড়ার সময়",
      writtenBy: "লেখক:",
      shoppableProducts: "আর্টিকেলে উল্লেখিত প্রোডাক্টসমূহ",
      addRoutineToCart: "সম্পূর্ণ রুটিন কিনুন",
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
    common: {
      bangla: "বাংলা",
      english: "English",
      language: "ভাষা",
    },
  },
  en: {
    header: {
      announcementBadge: "FREE DELIVERY",
      announcementText: "Free nationwide delivery on orders over ৳2,000!",
      routineFinder: "Routine Finder",
      trackOrder: "Track Order",
      authenticGuarantee: "100% Authentic Guarantee",
      brands: "Brands",
      topBrands: "Top Brands",
      viewAll: "View All",
      searchPlaceholder: "Search products, brands, or ingredients...",
      wishlist: "WISHLIST",
      account: "ACCOUNT",
      login: "LOGIN",
      admin: "ADMIN",
      cart: "CART",
      noResults: "No results found",
      viewAllResults: "View all results",
      categories: "Categories",
      concerns: "Skin Concerns",
      actives: "Key Actives",
      products: "Products",
      menu: "Menu",
    },
    home: {
      heroDiscountBadge: "SPECIAL OFFER",
      trendingTitle: "Trending Beauty Collection",
      trendingSubtitle: "Top rated and best selling authentic cosmetics",
      trendingViewAll: "View All",
      dealsTitle: "DEALS YOU CANNOT MISS",
      dealsSubtitle: "Best discounts on your favorite skincare essentials",
      topBrandsTitle: "TOP BRANDS & OFFERS",
      topBrandsSubtitle: "Top Korean & global authentic brands",
      shopByCategoryTitle: "SHOP BY CATEGORY",
      shopByCategorySubtitle: "Find the exact category for your skincare needs",
      limitedOffersTitle: "LIMITED TIME OFFERS",
      limitedOffersSubtitle: "Grab special deals before stock runs out",
      authenticProducts: "100% Authentic Cosmetics",
      authenticDesc: "Imported directly from authorized distributors",
      fastDelivery: "Fast Delivery",
      fastDeliveryDesc: "24–48h in Dhaka, fast nationwide home delivery",
      codAvailable: "Cash on Delivery",
      codDesc: "Pay upon delivery with complete peace of mind",
      easyReturns: "Easy Returns Policy",
      easyReturnsDesc: "Hassle-free 7 days exchange if any issue",
      consultation: "Beauty Expert Support",
      consultationDesc: "24/7 dedicated assistance for your skin",
      viewAll: "View All",
      beforeAfterTitle: "See Visible Results",
      beforeAfterSubtitle: "Visible transformations with consistent routine",
    },
    footer: {
      authenticTitle: "100% Authentic",
      authenticDesc: "Direct from Authorized Brands & Importers",
      deliveryTitle: "Fast Delivery",
      deliveryDesc: "24–48h Dhaka, 3–5d Nationwide",
      returnTitle: "7 Days Return",
      returnDesc: "Easy Return & Replacement Guarantee",
      codTitle: "Cash on Delivery",
      codDesc: "bKash, Nagad & Cash on Arrival",
      aboutTitle: "About Us",
      quickLinks: "Quick Links",
      customerCare: "Customer Care",
      policies: "Policies",
      stayConnected: "Stay Connected",
      newsletterDesc: "Subscribe to receive special offers and new product arrivals:",
      subscribe: "Subscribe",
      subscribed: "Thank you! You are subscribed.",
      emailPlaceholder: "Enter your email address...",
      helpline: "Helpline",
      supportEmail: "Support Email",
      rightsReserved: "All rights reserved. 100% Genuine Certified Cosmetics.",
    },
    product: {
      freeShipping: "FREE SHIPPING",
      inStock: "IN STOCK",
      outOfStock: "OUT OF STOCK",
      addToCart: "ADD TO CART",
      orderNow: "ORDER NOW",
      buyNow: "BUY NOW",
      addedToCart: "ADDED!",
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
      addToCart: "ADD TO CART",
      orderNow: "ORDER NOW",
      added: "ADDED!",
      inStock: "In Stock",
      outOfStock: "Out of Stock",
      freeShipping: "Free Delivery Eligible",
      authenticGuarantee: "100% Authentic Guarantee",
      cashOnDelivery: "Cash on Delivery Available",
      easyExchange: "7 Days Easy Exchange",
      tabDescription: "Description",
      tabBenefits: "Key Benefits",
      tabUsage: "How to Use",
      tabIngredients: "Ingredients",
      tabAuthenticity: "Authenticity",
      tabReviews: "Reviews",
      frequentlyBoughtTogether: "Frequently Bought Together",
      bundleSave: "Bundle Savings",
      addBundleToCart: "Add Complete Bundle to Cart",
      shareProduct: "Share Product",
      linkCopied: "Link copied to clipboard!",
      originCountry: "Country of Origin",
      routineStep: "Routine Step",
      keyActives: "Key Actives",
      skinType: "Skin Type",
      skinConcern: "Skin Concern",
    },
    cart: {
      title: "Your Shopping Cart",
      emptyTitle: "Your Shopping Cart is Empty",
      emptySubtitle: "Explore our collection and add your favorite beauty items",
      shopNow: "Start Shopping",
      subtotal: "Subtotal",
      delivery: "Delivery",
      checkout: "PROCEED TO CHECKOUT",
      freeDeliveryUnlocked: "Congratulations! You unlocked FREE Delivery 🎉",
      addMoreForFreeDelivery: "Add more for FREE delivery",
      item: "item",
      items: "ITEMS",
      couponPlaceholder: "Coupon Code",
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
      emptyStateDesc: "Looks like you haven't added anything to your cart yet. Browse our top beauty essentials.",
      continueShopping: "Continue Shopping",
      clearCart: "Clear Cart",
      orderSummary: "Order Summary",
      estimatedDelivery: "Estimated Delivery",
      promoCode: "Promo / Discount Code",
      applyPromo: "Apply",
      proceedToCheckout: "PROCEED TO CHECKOUT",
      safeCheckoutBadge: "Guaranteed Safe & Secure Checkout",
      freeShippingNotice: "Free nationwide delivery on orders over ৳2,500!",
    },
    checkout: {
      pageTitle: "Secure Checkout",
      expressCheckout: "Express Checkout",
      contactInfo: "Contact Information",
      deliveryAddress: "Delivery Address",
      fullName: "Full Name",
      fullNamePlaceholder: "Enter your full name...",
      phone: "Phone Number",
      phonePlaceholder: "0171XXXXXXXX",
      altPhone: "Alternative Phone (Optional)",
      altPhonePlaceholder: "For delivery emergency...",
      email: "Email Address (Optional)",
      emailPlaceholder: "Enter your email...",
      division: "Division",
      district: "District",
      thana: "Thana / Upazila",
      streetAddress: "Full Address (House, Road, Area)",
      streetAddressPlaceholder: "House, Road, Area or Landmarks...",
      notes: "Delivery Notes (Optional)",
      notesPlaceholder: "e.g. Please deliver in the afternoon, call before arrival...",
      fastCitySelect: "Quick City Selection",
      shippingMethod: "Shipping Method",
      insideDhaka: "Inside Dhaka City",
      outsideDhaka: "Outside Dhaka City",
      freeDelivery: "FREE Delivery",
      deliveryTimeDhaka: "Delivery within 24–48 hours",
      deliveryTimeOutside: "Delivery within 3–5 business days",
      paymentMethod: "Payment Method",
      cod: "Cash on Delivery",
      codDesc: "Pay in cash upon physical receipt of your parcel.",
      bkash: "bKash Payment",
      bkashDesc: "Instant & secure payment via your bKash account.",
      nagad: "Nagad Payment",
      nagadDesc: "Convenient payment directly via Nagad.",
      orderSummary: "Order Summary",
      subtotal: "Subtotal",
      deliveryFee: "Delivery Fee",
      discount: "Discount / Coupon",
      totalPayable: "Total Payable",
      placeOrder: "PLACE ORDER NOW",
      placingOrder: "Processing Order...",
      secureNotice: "Your personal details are encrypted and securely processed.",
      otpTitle: "Phone Verification (OTP)",
      otpPrompt: "For security, we sent a 4-digit verification code to:",
      enterOtp: "Enter OTP Code",
      verifyOtp: "Verify & Confirm Order",
      resendOtp: "Resend Code",
      otpVerifying: "Verifying...",
    },
    catalog: {
      pageTitle: "Authentic Skincare & Beauty Catalogue",
      filterBy: "Filter Products",
      resetFilters: "Reset All Filters",
      categories: "Categories",
      brands: "Brands",
      priceRange: "Price Range",
      skinConcern: "Skin Concern",
      skinType: "Skin Type",
      keyActives: "Key Actives",
      origin: "Origin Country",
      availability: "Availability",
      inStockOnly: "In Stock Only",
      allPrices: "All Prices",
      sortBy: "Sort By",
      sortDefault: "Popularity",
      sortPriceAsc: "Price: Low to High",
      sortPriceDesc: "Price: High to Low",
      sortNewest: "Newest Arrivals",
      productsFound: "products found",
      noProductsFound: "No Products Found",
      noProductsDesc: "No products matched your selected filters. Please adjust your criteria.",
      viewAllProducts: "View All Products",
    },
    orders: {
      confirmationTitle: "Order Confirmed!",
      thankYou: "Thank You For Your Order!",
      receivedMsg: "We have received your order and are preparing it for shipment. We will call you shortly.",
      orderNumber: "Order Number",
      downloadInvoice: "Download & Print Invoice",
      orderDetails: "Order Details",
      shippingAddress: "Shipping Address",
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
      portalSubtitle: "Customer Portal & Settings",
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
      title: "Skincare Routine Finder",
      subtitle: "Answer a few quick questions to find your customized daily skincare regimen",
      startQuiz: "Start Routine Quiz",
      step: "Step",
      of: "of",
      selectSkinType: "What is your skin type?",
      selectConcerns: "What are your primary skin concerns?",
      seeRoutine: "View My Recommended Routine",
      recommendedRoutine: "Your Personalized 3-Step Routine",
      routineSubtitle: "Formulated with 100% genuine ingredients for visible results",
      cleanser: "Step 1: Cleanser",
      treatment: "Step 2: Essence & Serum",
      moisturizer: "Step 3: Moisturizer & Sun Protection",
      addFullRoutine: "Add Complete Routine to Cart",
      restartQuiz: "Retake Quiz",
    },
    wishlist: {
      title: "My Wishlist",
      subtitle: "Save and keep track of your favorite beauty items",
      emptyTitle: "Your Wishlist is Empty",
      emptySubtitle: "Explore our collection and heart your favorites to save them here.",
      exploreProducts: "Explore Products",
      addToCart: "Add to Cart",
      remove: "Remove",
    },
    auth: {
      signInTitle: "Sign In",
      signInSubtitle: "Log in to your account for fast checkout and order tracking",
      signUpTitle: "Create an Account",
      signUpSubtitle: "Join our community for exclusive discounts and routine tracking",
      emailOrPhone: "Email or Phone Number",
      password: "Password",
      forgotPassword: "Forgot Password?",
      signInBtn: "Sign In",
      signUpBtn: "Create Account",
      noAccount: "Don't have an account?",
      haveAccount: "Already have an account?",
      createAccount: "Sign Up",
      loginHere: "Log In",
    },
    blog: {
      title: "Beauty Journal & Guides",
      subtitle: "Expert skincare advice, ingredient deep-dives, and authentic routine guides",
      readArticle: "Read Article",
      minRead: "min read",
      writtenBy: "By",
      shoppableProducts: "Products Mentioned in this Guide",
      addRoutineToCart: "Shop Complete Routine",
    },
    brandsAndCategories: {
      allBrands: "All Brands",
      allCategories: "All Categories",
      exploreBrands: "Explore authentic global & Korean skincare brands",
      exploreCategories: "Find products tailored to your routine and care",
      productsCount: "Products",
    },
    mobileNav: {
      home: "হোম",
      categories: "ক্যাটাগরি",
      wishlist: "উইশলিস্ট",
      cart: "কার্ট",
      account: "অ্যাকাউন্ট",
    },
    common: {
      bangla: "বাংলা",
      english: "English",
      language: "ভাষা",
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
