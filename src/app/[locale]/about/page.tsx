import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, localeHref, ogLocaleFor, pageAlternates } from "@/lib/i18n";
import { allGames } from "@/lib/games";
import { SOCIAL_PROFILE_URLS } from "@/lib/socialProfiles";

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
    sections: [
      ["ما الذي نقدّمه؟", "لا نكتفي بعرض كتالوج ألعاب. نوضّح في صفحة كل لعبة الفئة، الأجهزة التي يعلن المصدر دعمها، اللغات، وجود مشتريات داخل اللعبة، وطريقة التحكم. وعندما تحمل الصفحة صفة دليل تحريري، يضيف فريقنا شرحاً عربياً ونصائح وأسئلة شائعة تساعدك على فهم اللعبة قبل تشغيلها."],
      ["مصدر الألعاب", "نعتمد حالياً على كتالوج Playgama المرخّص كمصدر وحيد للألعاب ومواد المعاينة الرسمية. هذا يعني أن تشغيل اللعبة وملفاتها الأساسية يأتيان من الموزّع، بينما تتولى بليكسفاي تنظيم الاكتشاف، التصفح العربي، التصنيفات، والمحتوى الإرشادي المحيط باللعبة."],
      ["المراجعة والدقة", "لا نطلب فهرسة كل صفحات الكتالوج في محركات البحث. نختار مجموعة محدودة فقط عندما يتوفر لها محتوى تحريري إضافي. وإذا تغيّر دعم جهاز أو طريقة تحكم أو توقفت لعبة عن العمل، نحدّث الصفحة أو نخرجها من مجموعة الصفحات المعتمدة حتى تُراجع من جديد."],
      ["الإعلانات والاستقلالية", "تساعد الإعلانات وشراكات توزيع الألعاب في تغطية تكاليف الاستضافة والتطوير. لا يستطيع المعلن شراء تقييم أو ترتيب داخل الموقع، ولا نعرض عدد لعب أو تقييم مستخدمين ما لم يكن مستنداً إلى بيانات حقيقية. نحافظ كذلك على فصل واضح بين مساحة اللعب والإعلانات."],
      ["تواصل وتصحيح", "إذا وجدت لعبة لا تعمل، أو معلومة غير دقيقة، أو محتوى تعتقد أنه ينتهك حقاً، أرسل رابط الصفحة ووصف المشكلة إلى plixfy.com@gmail.com. نراجع البلاغات المرتبطة بالأمان والحقوق والأجهزة المدعومة بأولوية، ويمكنك قراءة تفاصيل أكثر في سياسة التحرير المرتبطة أسفل الموقع."],
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
    sections: [
      ["What do we add?", "Plixfy is more than a catalog. A game page identifies the category, source-declared device support, languages, in-game purchases, and controls. Pages marked as editorial guides also include explanations, practical tips, and answers written for Plixfy readers."],
      ["Where the games come from", "We currently use Playgama's licensed catalog as our sole source for games and official preview assets. Playgama delivers the playable title and core catalog data; Plixfy adds discovery, bilingual navigation, categorization, and the editorial material surrounding selected games."],
      ["Review and accuracy", "We do not submit every catalog page for search indexing. Only a limited selection with additional editorial material is eligible. When device support changes, controls are inaccurate, or a title stops loading, we update the page or remove it from the reviewed set until it can be checked again."],
      ["Funding and independence", "Advertising and game-distribution partnerships help pay for hosting and development. Advertisers cannot buy a rating or ranking, and we do not present generated play counts or ratings as genuine user data. Ads are also kept separate from the gameplay area."],
      ["Corrections and contact", "If a game does not work, a detail is inaccurate, or you believe content infringes a right, email the page URL and a description to plixfy.com@gmail.com. Safety, rights, and device-support reports receive priority. Our Editorial Policy explains the process in more detail."],
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
      sameAs: SOCIAL_PROFILE_URLS,
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

      <div className="mt-10 space-y-5">
        {copy.sections.map(([heading, body]) => (
          <section key={heading} className="rounded-3xl border border-white/10 bg-surface p-6 md:p-8">
            <h2 className="text-xl font-bold text-text-primary">{heading}</h2>
            <p className="mt-3 leading-8 text-text-secondary">{body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
