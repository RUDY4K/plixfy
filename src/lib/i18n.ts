export const locales = ["ar", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ar";

export function hasLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** يبني رابطًا داخليًا حسب اللغة: العربي بدون بادئة، الإنجليزي تحت ‎/en */
export function localeHref(locale: Locale, path: string): string {
  if (locale === "ar") return path;
  return path === "/" ? "/en" : "/en" + path;
}

/** يستخرج اللغة من المسار — للمكوّنات client عبر usePathname */
export function localeFromPathname(pathname: string): Locale {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "ar";
}

/** canonical + hreflang لكل صفحة متوفرة باللغتين */
export function pageAlternates(locale: Locale, path: string) {
  const arPath = path;
  const enPath = localeHref("en", path);
  return {
    canonical: locale === "ar" ? arPath : enPath,
    languages: {
      ar: arPath,
      en: enPath,
      "x-default": arPath,
    },
  };
}

export const dirFor = (locale: Locale): "rtl" | "ltr" =>
  locale === "ar" ? "rtl" : "ltr";

export const langFor = (locale: Locale): string => locale;

export const ogLocaleFor = (locale: Locale): string =>
  locale === "ar" ? "ar_SA" : "en_US";

interface UIDict {
  brand: string;
  header: {
    homeAria: string;
    searchPlaceholder: string;
    searchAria: string;
    closeSearch: string;
    profileAria: string;
  };
  nav: {
    home: string;
    categories: string;
    search: string;
    favorites: string;
    profile: string;
    mainNavAria: string;
  };
  footer: {
    tagline: string;
    linksTitle: string;
    legalTitle: string;
    blog: string;
    news: string;
    privacy: string;
    terms: string;
    about: string;
    contact: string;
    editorialPolicy: string;
    rights: string;
    footerAria: string;
  };
  common: {
    viewAll: string;
    viewAllAria: string;
    playNow: string;
    playAria: string;
    mostPlayed: string;
    featured: string;
    newBadge: string;
    fromBlog: string;
    allPosts: string;
    latestNews: string;
    allNews: string;
    browseAllCount: string;
    browseAllSub: string;
  };
  strips: {
    trending: string;
    topPicks: string;
    racing: string;
    action: string;
    puzzle: string;
    io: string;
    girls: string;
    casual: string;
  };
  home: {
    h1: string;
    intro: string;
  };
  share: {
    shareAria: string;
    copied: string;
    share: string;
    freeSuffix: string;
  };
  ageGate: {
    title: string;
    bodyPrefix: string;
    bodyAgeNote: string;
    bodyConfirm: string;
    confirm: string;
    backHome: string;
  };
  gameFrame: {
    exitFullscreen: string;
    similarHeading: string;
    playAnother: string;
  };
  consent: {
    notice: string;
    body: string;
    agreeNote: string;
    privacyPolicy: string;
    decline: string;
    accept: string;
    cookieSettings: string;
  };
  misc: {
    adLabel: string;
    breadcrumbsAria: string;
  };
  play: {
    similar: string;
    more: string;
    moreLikeAria: string;
    gameInfo: string;
    category: string;
    name: string;
    rating: string;
    outOf5: string;
    playsLabel: string;
    playsSuffix: string;
    supportedDevices: string;
    mobileAndDesktop: string;
    mobileOnly: string;
    desktopOnly: string;
    deviceSupportUnknown: string;
    free: string;
    yes: string;
    about: string;
    howToPlay: string;
    genericControls: string;
    tips: string;
    faq: string;
    playNowCta: string;
    notFoundTitle: string;
    metaTitleSuffix: string;
  };
}

const ar: UIDict = {
  brand: "بليكسفاي",
  header: {
    homeAria: "بليكسفاي - الرئيسية",
    searchPlaceholder: "ابحث عن لعبة...",
    searchAria: "بحث",
    closeSearch: "إغلاق البحث",
    profileAria: "الملف الشخصي",
  },
  nav: {
    home: "الرئيسية",
    categories: "الفئات",
    search: "بحث",
    favorites: "المفضلة",
    profile: "الملف",
    mainNavAria: "التنقل الرئيسي",
  },
  footer: {
    tagline: "منصة الألعاب المجانية اونلاين",
    linksTitle: "روابط",
    legalTitle: "قانوني",
    blog: "المدوّنة",
    news: "أخبار الألعاب",
    privacy: "سياسة الخصوصية",
    terms: "شروط الاستخدام",
    about: "من نحن",
    contact: "تواصل معنا",
    editorialPolicy: "سياسة التحرير",
    rights: "© {year} بليكسفاي — جميع الحقوق محفوظة",
    footerAria: "تذييل الصفحة",
  },
  common: {
    viewAll: "عرض الكل",
    viewAllAria: "عرض الكل: ",
    playNow: "العب الآن",
    playAria: "العب ",
    mostPlayed: "الأكثر لعباً",
    featured: "مميز",
    newBadge: "جديد",
    fromBlog: "من المدونة",
    allPosts: "كل المقالات ←",
    latestNews: "آخر أخبار الألعاب",
    allNews: "كل الأخبار ←",
    browseAllCount: "تصفّح كل {count} لعبة",
    browseAllSub: "مرتّبة حسب التصنيف، بدون تحميل",
  },
  strips: {
    trending: "ألعاب رائجة الآن",
    topPicks: "ترشيحات بليكسفاي",
    racing: "ألعاب السباق",
    action: "أكشن وقتال",
    puzzle: "ألغاز ومخ",
    io: "ألعاب آيو",
    girls: "ألعاب البنات",
    casual: "ألعاب خفيفة",
  },
  share: {
    shareAria: "شارك ",
    copied: "تم النسخ",
    share: "شارك",
    freeSuffix: "مجاناً على بليكسفاي",
  },
  ageGate: {
    title: "تأكيد العمر مطلوب",
    bodyPrefix: "ألعاب",
    bodyAgeNote: "قد تحتوي على محتوى موجّه للفئة العمرية",
    bodyConfirm: "الرجاء تأكيد عمرك للمتابعة.",
    confirm: "أنا فوق 13 سنة — متابعة",
    backHome: "العودة للرئيسية",
  },
  gameFrame: {
    exitFullscreen: "خروج من ملء الشاشة",
    similarHeading: "العب ألعاب مشابهة",
    playAnother: "العب لعبة تانية",
  },
  consent: {
    notice: "إشعار ملفات تعريف الارتباط",
    body: "نستخدم ملفات تعريف الارتباط لتحليلات الموقع والإعلانات.",
    agreeNote: "بالموافقة، توافق على معالجة بياناتك حسب",
    privacyPolicy: "سياسة الخصوصية",
    decline: "رفض",
    accept: "موافقة",
    cookieSettings: "إعدادات ملفات تعريف الارتباط",
  },
  misc: {
    adLabel: "إعلان",
    breadcrumbsAria: "مسار التنقّل",
  },
  play: {
    similar: "ألعاب مشابهة",
    more: "المزيد ←",
    moreLikeAria: "شاهد المزيد من ألعاب مثل ",
    gameInfo: "معلومات اللعبة",
    category: "الفئة",
    name: "الاسم",
    rating: "التقييم",
    outOf5: "من 5",
    playsLabel: "مرات اللعب",
    playsSuffix: "مرة لعب",
    supportedDevices: "الأجهزة المدعومة",
    mobileAndDesktop: "جوال وكمبيوتر",
    mobileOnly: "جوال فقط",
    desktopOnly: "كمبيوتر فقط",
    deviceSupportUnknown: "غير محدد",
    free: "مجانية",
    yes: "نعم",
    about: "عن اللعبة",
    howToPlay: "كيف تلعب",
    genericControls: "استخدم لوحة المفاتيح أو شاشة اللمس للتحكم في اللعبة. استمتع!",
    tips: "حيل ونصائح",
    faq: "أسئلة شائعة",
    playNowCta: "العب الآن ▶",
    notFoundTitle: "اللعبة غير موجودة | بليكسفاي",
    metaTitleSuffix: " - العب مجاناً | بليكسفاي",
  },
  home: {
    h1: "ألعاب أونلاين مجانية - بليكسفاي",
    intro:
      "بليكسفاي منصة ألعاب أونلاين مجانية تعمل من المتصفح مباشرة بدون أي تحميل أو تسجيل. تجد لدينا {count} لعبة موزّعة على ثمانية تصنيفات رئيسية: السباق، الأكشن، الألغاز، الرياضة، التصويب، ألعاب البنات، ألعاب آيو، والألعاب الخفيفة المناسبة لجميع الأعمار. كل لعبة محمّلة من خوادم سريعة وتعمل بسلاسة على الجوال والحاسوب، مع واجهة عربية بالكامل تدعم الكتابة من اليمين إلى اليسار. تستطيع أن تبدأ اللعب في ثوانٍ، أن تحفظ ألعابك المفضّلة، وأن تكتشف ألعاباً جديدة كل أسبوع من قائمتنا المختارة بعناية. سواء كنت تبحث عن جلسة سريعة بين الفصول، عن لعبة عائلية تشاركها مع إخوتك، أو عن تحدٍّ جاد يستهلك ساعات، فإن مكتبتنا تضمّ كل ما تحتاجه من ألعاب أونلاين مجانية بدون تحميل.",
  },
};

const en: UIDict = {
  brand: "Plixfy",
  header: {
    homeAria: "Plixfy - Home",
    searchPlaceholder: "Search for a game...",
    searchAria: "Search",
    closeSearch: "Close search",
    profileAria: "Profile",
  },
  nav: {
    home: "Home",
    categories: "Categories",
    search: "Search",
    favorites: "Favorites",
    profile: "Profile",
    mainNavAria: "Main navigation",
  },
  footer: {
    tagline: "Free online games platform",
    linksTitle: "Links",
    legalTitle: "Legal",
    blog: "Blog",
    news: "Gaming News",
    privacy: "Privacy Policy",
    terms: "Terms of Use",
    about: "About Us",
    contact: "Contact Us",
    editorialPolicy: "Editorial Policy",
    rights: "© {year} Plixfy — All rights reserved",
    footerAria: "Page footer",
  },
  common: {
    viewAll: "View all",
    viewAllAria: "View all: ",
    playNow: "Play Now",
    playAria: "Play ",
    mostPlayed: "Most Played",
    featured: "Featured",
    newBadge: "NEW",
    fromBlog: "From the Blog",
    allPosts: "All posts →",
    latestNews: "Latest Gaming News",
    allNews: "All news →",
    browseAllCount: "Browse all {count} games",
    browseAllSub: "Sorted by category, no downloads",
  },
  strips: {
    trending: "Trending Now",
    topPicks: "Plixfy Top Picks",
    racing: "Racing Games",
    action: "Action & Fighting",
    puzzle: "Puzzle & Brain",
    io: ".io Games",
    girls: "Games for Girls",
    casual: "Casual Games",
  },
  share: {
    shareAria: "Share ",
    copied: "Copied",
    share: "Share",
    freeSuffix: "free on Plixfy",
  },
  ageGate: {
    title: "Age Verification Required",
    bodyPrefix: "Games in",
    bodyAgeNote: "may contain content intended for ages",
    bodyConfirm: "Please confirm your age to continue.",
    confirm: "I am over 13 — Continue",
    backHome: "Back to Home",
  },
  gameFrame: {
    exitFullscreen: "Exit fullscreen",
    similarHeading: "Play Similar Games",
    playAnother: "Play Another Game",
  },
  consent: {
    notice: "Cookie Notice",
    body: "We use cookies for site analytics and advertising.",
    agreeNote: "By accepting, you agree to the processing of your data per our",
    privacyPolicy: "Privacy Policy",
    decline: "Decline",
    accept: "Accept",
    cookieSettings: "Cookie Settings",
  },
  misc: {
    adLabel: "Ad",
    breadcrumbsAria: "Breadcrumb",
  },
  play: {
    similar: "Similar Games",
    more: "More →",
    moreLikeAria: "See more games like ",
    gameInfo: "Game Info",
    category: "Category",
    name: "Name",
    rating: "Rating",
    outOf5: "out of 5",
    playsLabel: "Plays",
    playsSuffix: "plays",
    supportedDevices: "Supported devices",
    mobileAndDesktop: "Mobile & desktop",
    mobileOnly: "Mobile only",
    desktopOnly: "Desktop only",
    deviceSupportUnknown: "Not specified",
    free: "Free",
    yes: "Yes",
    about: "About the Game",
    howToPlay: "How to Play",
    genericControls: "Use your keyboard or touch screen to control the game. Have fun!",
    tips: "Tips & Tricks",
    faq: "FAQ",
    playNowCta: "Play Now ▶",
    notFoundTitle: "Game Not Found | Plixfy",
    metaTitleSuffix: " - Play Free Online | Plixfy",
  },
  home: {
    h1: "Free Online Games - Play Instantly on Plixfy",
    intro:
      "Plixfy is a free online gaming platform that runs directly in your browser — no downloads, no sign-up. Explore {count} games across eight main categories: racing, action, puzzle, sports, shooting, girls games, .io games, and casual games suitable for all ages. Every game loads from fast servers and runs smoothly on both mobile and desktop. Start playing in seconds, save your favorite games, and discover new hand-picked titles every week. Whether you want a quick session between classes, a family-friendly game to share, or a serious challenge that lasts for hours, our library has all the free online games you need — no download required.",
  },
};

const dictionaries: Record<Locale, UIDict> = { ar, en };

export function getDict(locale: Locale): UIDict {
  return dictionaries[locale];
}
