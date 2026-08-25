import type { Metadata } from "next";
import { hasLocale, pageAlternates, type Locale } from "@/lib/i18n";

const content = {
  ar: {
    title: "سياسة التحرير | بليكسفاي",
    description: "كيف يختار فريق بليكسفاي الألعاب ويكتب الأدلة والأخبار ويصحح الأخطاء ويحافظ على استقلالية المحتوى.",
    heading: "سياسة بليكسفاي التحريرية",
    updated: "آخر تحديث: 25 أغسطس 2026",
    intro: "هدفنا مساعدة اللاعب على معرفة ما إذا كانت اللعبة مناسبة لجهازه واهتمامه قبل أن يبدأ. لا نعتبر صفحة اللعبة مجرد مكان لإطار مضمّن؛ الصفحات التي نعتمدها كمحتوى تحريري تمر بمراجعة بشرية للمعلومات والتعليمات وسهولة التشغيل.",
    sections: [
      ["اختيار الألعاب ومراجعتها", "نعتمد حصريًا على كتالوج Playgama المرخّص، ونزامنه بانتظام مع المصدر. يراجع الفريق تشغيل اللعبة، الفئة، الأجهزة المدعومة، وطريقة التحكم. إذا لم نستطع التحقق من معلومة بوضوح فلا ننشرها كحقيقة."],
      ["أدلة اللعب", "الأدلة التي نطلب فهرستها في محركات البحث تُراجع يدويًا وتضيف شرحًا عمليًا، خطوات لعب، نصائح، وإجابات عن أسئلة شائعة. تبقى بقية الألعاب متاحة للعب، لكنها لا تُقدَّم كمقالات تحريرية حتى تكتمل مراجعتها."],
      ["مصدر البيانات وحدوده", "تأتي اللعبة ومواد المعاينة وبيانات الكتالوج الأساسية من Playgama. نذكر هذا المصدر بوضوح ولا ننسب تطوير اللعبة إلى بليكسفاي. دعم الأجهزة واللغات والمشتريات داخل اللعبة يعكس أحدث بيانات وصلت من المصدر، وقد يتغير عند تحديث اللعبة."],
      ["ما الذي نتحقق منه؟", "نراجع اتساق اسم اللعبة وفئتها ووصفها، تعليمات التحكم، الأجهزة المعلنة، وجود فيديو رسمي، وسلامة رابط التشغيل. لا نستخدم عداد لعب أو تقييمًا نجميًا كدليل على الجودة ما لم يكن مصدره بيانات مستخدمين فعلية قابلة للتفسير."],
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
    updated: "Last updated: August 25, 2026",
    intro: "Our goal is to help players decide whether a game suits their device and interests before they start. We do not treat a game page as merely an embedded frame; pages we present as editorial content undergo human review for accuracy, controls, device support, and playability.",
    sections: [
      ["Game selection and review", "We rely exclusively on Playgama's licensed catalog and regularly synchronize it with the source. Our team checks whether a game launches, its category, supported devices, and controls. If we cannot verify a detail clearly, we do not state it as fact."],
      ["Game guides", "Guides submitted for search indexing are manually reviewed and add practical explanations, play steps, tips, and useful answers. Other games remain playable, but are not presented as editorial articles until their review is complete."],
      ["Data sources and limitations", "The playable game, official preview assets, and core catalog data come from Playgama. We identify that source and do not claim that Plixfy developed the game. Device, language, and in-game-purchase details reflect the latest source data we received and may change when a title is updated."],
      ["What we check", "We check the consistency of the title, category, description, controls, declared device support, official preview availability, and launch URL. We do not use generated play counters or star scores as evidence of quality unless they come from explainable, genuine user data."],
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
