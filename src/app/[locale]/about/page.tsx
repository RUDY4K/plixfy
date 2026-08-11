import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, localeHref, ogLocaleFor, pageAlternates } from "@/lib/i18n";
import { allGames } from "@/lib/games";

const SITE = "https://www.plixfy.com";
const AR_GAME_COUNT = allGames.length.toLocaleString("ar-SA");
const EN_GAME_COUNT = allGames.length.toLocaleString("en-US");

const copyByLocale = {
  ar: {
    title: "من نحن | بليكسفاي",
    description:
      `بليكسفاي منصة عربية للألعاب المجانية اونلاين — ${AR_GAME_COUNT} لعبة تعمل مباشرة من المتصفح دون تحميل.`,
    ldName: "من نحن - بليكسفاي",
    brand: "بليكسفاي",
    h1: "من نحن",
    subtitle: "تعرّف على منصة بليكسفاي",
    homeLabel: "الرئيسية",
    paragraphs: [
      "بليكسفاي منصة عربية متخصصة في تقديم الألعاب المجانية اونلاين، صُمّمت لتمنح اللاعب العربي تجربة سريعة وسلسة من متصفحه دون الحاجة إلى أي تنزيلات أو تسجيلات. هدفنا أن تكون الوجهة الأولى للترفيه الخفيف والممتع لكل أفراد العائلة.",
      `نختار لك بعناية ${AR_GAME_COUNT} لعبة تغطي تصنيفات متنوّعة: السباق، الأكشن، الألغاز، الرياضة، ألعاب البنات، والألعاب الخفيفة. نُحدّث المكتبة باستمرار لإضافة أحدث وأشهر الألعاب، مع التركيز على الجودة وسرعة الأداء على الجوال والكمبيوتر.`,
      "نؤمن بأن الألعاب يجب أن تكون متاحة للجميع ومجانية، لذلك تعتمد المنصة على عرض الإعلانات بشكل مدروس لا يُخلّ بتجربة اللعب. شكراً لاختيارك بليكسفاي، ونتمنى لك أوقاتاً ممتعة!",
    ],
  },
  en: {
    title: "About Us | Plixfy",
    description:
      `Plixfy is a free online gaming platform — ${EN_GAME_COUNT} games that run directly in your browser with no download.`,
    ldName: "About Us - Plixfy",
    brand: "Plixfy",
    h1: "About Us",
    subtitle: "Get to know the Plixfy platform",
    homeLabel: "Home",
    paragraphs: [
      "Plixfy is a platform dedicated to free online games, built to give players a fast, smooth experience straight from the browser — no downloads, no sign-ups. Our goal is to be the go-to destination for light, fun entertainment for the whole family.",
      `We hand-pick ${EN_GAME_COUNT} games covering a wide range of categories: racing, action, puzzle, sports, girls games, and casual titles. The library is updated constantly with the newest and most popular games, with a focus on quality and fast performance on mobile and desktop.`,
      "We believe games should be free and accessible to everyone, so the platform is supported by carefully placed ads that never get in the way of gameplay. Thanks for choosing Plixfy — have fun!",
    ],
  },
} as const;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/about">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const copy = copyByLocale[locale];
  return {
    title: copy.title,
    description: copy.description,
    alternates: pageAlternates(locale, "/about"),
    openGraph: {
      type: "website",
      title: copy.title,
      description: copy.description,
      url: SITE + localeHref(locale, "/about"),
      siteName: "Plixfy",
      locale: ogLocaleFor(locale),
    },
  };
}

export default async function AboutPage({
  params,
}: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const copy = copyByLocale[locale];
  const pageUrl = SITE + localeHref(locale, "/about");

  const aboutPageLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: copy.ldName,
    url: pageUrl,
    inLanguage: locale,
    description: copy.description,
    mainEntity: {
      "@type": "Organization",
      name: copy.brand,
      url: SITE,
      logo: SITE + "/brand/plixfy-icon-v2-512.png",
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: copy.homeLabel,
        item: SITE + localeHref(locale, "/"),
      },
      { "@type": "ListItem", position: 2, name: copy.h1, item: pageUrl },
    ],
  };

  return (
    <main className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify([aboutPageLd, breadcrumbLd]) }}
      />
      <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
        {copy.h1}
      </h1>
      <p className="text-sm text-text-faint mb-8">
        {copy.subtitle}
      </p>

      <div className="space-y-5 text-text-secondary leading-relaxed">
        {copy.paragraphs.map((para, idx) => (
          <p key={idx}>{para}</p>
        ))}
      </div>
    </main>
  );
}
