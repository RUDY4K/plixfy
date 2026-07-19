import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, localeHref, ogLocaleFor, pageAlternates } from "@/lib/i18n";

const copyByLocale = {
  ar: {
    title: "شروط الاستخدام | بليكسفاي",
    description:
      "اطّلع على شروط وأحكام استخدام منصة بليكسفاي للألعاب المجانية اونلاين والحقوق والواجبات بين المستخدم والمنصة.",
    h1: "شروط الاستخدام",
    updated: "آخر تحديث: يونيو 2026",
    paragraphs: [
      "تنظّم هذه الشروط استخدامك لمنصة بليكسفاي وما تقدّمه من ألعاب وخدمات مجانية اونلاين. يُعدّ دخولك للموقع أو استخدامه موافقةً صريحة على هذه الشروط، فإن لم توافق عليها يُرجى عدم الاستمرار باستخدام المنصة.",
      "جميع الألعاب المعروضة على بليكسفاي مجانية وتعمل مباشرة من المتصفح دون الحاجة إلى تنزيل. حقوق الملكية الفكرية لكل لعبة محفوظة لأصحابها الأصليين، ونعرضها بصورة قانونية وفق اتفاقيات مع موزعيها.",
      "يلتزم المستخدم بعدم استخدام الموقع لأي غرض غير مشروع أو يتعارض مع الأنظمة المعمول بها في المملكة العربية السعودية ودول الخليج. لا نتحمل أي مسؤولية عن إساءة استخدام المحتوى أو الإخلال بهذه الشروط.",
      "نحتفظ بحقّ تعديل هذه الشروط أو إيقاف بعض الخدمات في أي وقت دون إشعار مسبق. أي نزاع ينشأ عن استخدام الموقع يخضع للأنظمة المعمول بها محليًا.",
    ],
  },
  en: {
    title: "Terms of Use | Plixfy",
    description:
      "Read the terms and conditions for using the Plixfy free online gaming platform, and the rights and obligations between users and the platform.",
    h1: "Terms of Use",
    updated: "Last updated: June 2026",
    paragraphs: [
      "These terms govern your use of the Plixfy platform and the free online games and services it provides. By accessing or using the site you expressly agree to these terms; if you do not agree, please discontinue use of the platform.",
      "All games on Plixfy are free and run directly in the browser with no download required. The intellectual property rights of each game remain with their original owners, and we display them legally under agreements with their distributors.",
      "Users agree not to use the site for any unlawful purpose or in a way that conflicts with applicable laws. We accept no liability for misuse of the content or breach of these terms.",
      "We reserve the right to amend these terms or discontinue certain services at any time without prior notice. Any dispute arising from use of the site is subject to the applicable local laws.",
    ],
  },
} as const;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/terms">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const copy = copyByLocale[locale];
  return {
    title: copy.title,
    description: copy.description,
    alternates: pageAlternates(locale, "/terms"),
    openGraph: {
      type: "website",
      title: copy.title,
      description: copy.description,
      url: "https://www.plixfy.com" + localeHref(locale, "/terms"),
      siteName: "Plixfy",
      locale: ogLocaleFor(locale),
    },
  };
}

export default async function TermsPage({
  params,
}: PageProps<"/[locale]/terms">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const copy = copyByLocale[locale];

  return (
    <main className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
        {copy.h1}
      </h1>
      <p className="text-sm text-text-faint mb-8">
        {copy.updated}
      </p>

      <div className="space-y-5 text-text-secondary leading-relaxed">
        {copy.paragraphs.map((para, idx) => (
          <p key={idx}>{para}</p>
        ))}
      </div>
    </main>
  );
}
