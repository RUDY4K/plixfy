import type { Metadata } from "next";
import { hasLocale, pageAlternates, type Locale } from "@/lib/i18n";

const content = {
  ar: {
    title: "سياسة التحرير | بليكسفاي",
    description: "كيف يختار فريق بليكسفاي الألعاب ويكتب الأدلة والأخبار ويصحح الأخطاء ويحافظ على استقلالية المحتوى.",
    heading: "سياسة بليكسفاي التحريرية",
    updated: "آخر تحديث: 5 سبتمبر 2026",
    intro: "هدفنا مساعدة اللاعب على الاختيار قبل التشغيل. نفرّق بين وصف الكتالوج المقدم من Playgama، والأدلة التي تضيف شرحًا من بليكسفاي. وجود اللعبة في المكتبة أو وجود دليل عنها لا يثبت اختبارها على كل جهاز.",
    sections: [
      ["اختيار الألعاب ومراجعتها", "مصدر ألعاب المكتبة هو Playgama. بيانات الأجهزة واللغات والتحكم تصريحات من الكتالوج، وليست نتائج اختبار مستقل لكل لعبة. عند نشر نتيجة تجربة فعلية يجب أن نوضح الجهاز والمتصفح وتاريخ التجربة وحدودها؛ لا نستنتج نتيجة تجربة من بيانات المصدر وحدها."],
      ["أدلة اللعب", "أدلة بليكسفاي تضيف شرحًا أو خطوات عملية للقارئ. صفحات الألعاب ذات الوصف المستورد تُسمى صفحات كتالوج، والمسودات الآلية غير المعتمدة لا تُعرض كأدلة لعب. اعتماد المحتوى يكون لكل لغة؛ ترجمة واجهة الموقع لا تمنح النص اعتمادًا تحريريًا ولا تغيّر لغة اللعبة."],
      ["مصدر البيانات وحدوده", "تأتي اللعبة ومواد المعاينة وبيانات الكتالوج الأساسية من Playgama. نذكر هذا المصدر بوضوح ولا ننسب تطوير اللعبة إلى بليكسفاي. دعم الأجهزة واللغات والمشتريات داخل اللعبة يعكس أحدث بيانات وصلت من المصدر، وقد يتغير عند تحديث اللعبة."],
      ["ما الذي نتحقق منه؟", "نميز بين فحص اتساق بيانات الكتالوج وفحص تشغيل اللعبة فعليًا. لا يعني تاريخ مزامنة الكتالوج تاريخ تجربة أو مراجعة تحريرية. ولا يُعد ترتيب العرض أو اختيار اليوم قياسًا لعدد اللاعبين أو تقييمًا للجودة."],
      ["الأخبار والمصادر", "ننسب الأخبار إلى مصدرها الأصلي ونضع رابطًا إليه. الملخص وحده لا يحل محل التقرير الأصلي، ولذلك لا نعرض صفحات الأخبار المختصرة على أنها تحقيقات حصرية ولا نطلب فهرستها حتى نضيف سياقًا أو تحليلاً أصليًا كافيًا."],
      ["الأتمتة والذكاء الاصطناعي", "قد تساعد أدوات آلية في جمع تحديثات الكتالوج، اكتشاف الروابط المعطلة، الترجمة الأولية، أو إعداد مسودة. لا تصبح المسودة محتوى تحريريًا معتمدًا لمجرد إنشائها آليًا؛ يلزم اختيار بشري ومراجعة المعلومات قبل إضافتها إلى الصفحات التي نطلب فهرستها."],
      ["الإعلانات والاستقلالية", "قد يحقق الموقع دخلًا من الإعلانات أو شراكات توزيع الألعاب. لا يشتري المعلن ترتيبًا أو تقييمًا، ولا ننشر أرقام لعب أو تقييمات تقديرية على أنها بيانات حقيقية. أي محتوى مدفوع سيحمل إفصاحًا واضحًا."],
      ["التصحيحات", "إذا اكتشفنا خطأ نصححه ونحدّث الصفحة. يمكن للقراء إرسال رابط الصفحة والتصحيح المقترح إلى plixfy.com@gmail.com، ونعطي الأولوية للأخطاء المتعلقة بالأمان والملكية والأجهزة المدعومة."],
    ],
  },
  en: {
    title: "Editorial Policy | Plixfy",
    description: "How Plixfy selects games, writes guides and news, corrects errors, and protects editorial independence.",
    heading: "Plixfy Editorial Policy",
    updated: "Last updated: September 5, 2026",
    intro: "Our goal is to help players make a choice before launching. We distinguish Playgama catalog descriptions from guides with additional Plixfy explanations. A library listing or guide does not establish that a game was tested on every device.",
    sections: [
      ["Game selection and review", "Playgama supplies the game library. Device, language, and control details are catalog declarations, not independent test results for every game. A published first-hand test should identify the device, browser, date, and limitations; source data alone is not evidence of a play test."],
      ["Game guides", "Plixfy guides add explanations or practical steps for readers. Game pages with imported descriptions are labeled as catalog pages, and unapproved automated drafts are not displayed as game guides. Content approval is language-specific; translating the site interface does not confer editorial approval or change a game’s language."],
      ["Data sources and limitations", "The playable game, official preview assets, and core catalog data come from Playgama. We identify that source and do not claim that Plixfy developed the game. Device, language, and in-game-purchase details reflect the latest source data we received and may change when a title is updated."],
      ["What we check", "Catalog consistency checks and actual gameplay tests are different evidence. A catalog synchronization date is not a play-test or editorial-review date. Display order and the daily pick do not measure player counts or quality."],
      ["News and sources", "We credit the original source and link to it. A summary is not a substitute for the original report, so short news pages are not presented as exclusive reporting or submitted for indexing until we add enough original context or analysis."],
      ["Automation and AI", "Automated tools may help collect catalog updates, detect broken links, produce a first translation, or prepare a draft. A draft is not treated as reviewed editorial content simply because it was generated; human selection and fact-checking are required before it joins the pages submitted for indexing."],
      ["Advertising and independence", "Plixfy may earn revenue from advertising or game-distribution partnerships. Advertisers cannot buy rankings or ratings. We do not present estimated play counts or generated ratings as real user data. Sponsored content will be clearly disclosed."],
      ["Corrections", "When we find an error, we correct it and update the page. Readers can email the page URL and suggested correction to plixfy.com@gmail.com. Safety, ownership, and device-support corrections receive priority."],
    ],
  },
} as const;

interface PageParams {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  const c = content[locale];
  return {
    title: c.title,
    description: c.description,
    alternates: pageAlternates(locale, "/editorial-policy"),
  };
}

export default async function EditorialPolicyPage({ params }: PageParams) {
  const { locale: rawLocale } = await params;
  const locale: Locale = hasLocale(rawLocale) ? rawLocale : "ar";
  const c = content[locale];

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-16">
      <header className="max-w-3xl border-b border-white/10 pb-8">
        <p className="text-sm font-bold text-primary">Plixfy</p>
        <h1 className="mt-3 text-3xl font-black text-text-primary md:text-5xl">{c.heading}</h1>
        <p className="mt-3 text-sm text-text-faint">{c.updated}</p>
        <p className="mt-6 text-base leading-8 text-text-secondary md:text-lg">{c.intro}</p>
      </header>

      <div className="mt-8 space-y-5">
        {c.sections.map(([heading, body]) => (
          <section key={heading} className="rounded-3xl border border-white/10 bg-surface p-6 md:p-8">
            <h2 className="text-xl font-bold text-text-primary md:text-2xl">{heading}</h2>
            <p className="mt-3 leading-8 text-text-secondary">{body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
