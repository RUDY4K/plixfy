import type { Metadata } from "next";
import { Mail, MessageSquareText } from "lucide-react";
import {
  hasLocale,
  pageAlternates,
  type Locale,
} from "@/lib/i18n";

const EMAIL = "plixfy.com@gmail.com";

const copy = {
  ar: {
    title: "تواصل معنا | بليكسفاي",
    description: "تواصل مع فريق بليكسفاي للدعم، الاقتراحات، الإبلاغ عن لعبة أو طلب تصحيح محتوى.",
    heading: "تواصل مع فريق بليكسفاي",
    intro: "نقرأ كل رسالة ونستخدم ملاحظات اللاعبين لتحسين الألعاب والمحتوى. أرسل لنا تفاصيل واضحة وسنحاول الرد خلال يومي عمل.",
    emailTitle: "البريد الإلكتروني",
    emailBody: "للدعم العام، الشراكات، وطلبات الخصوصية.",
    reportTitle: "الإبلاغ عن مشكلة",
    reportBody: "اذكر رابط الصفحة، نوع جهازك، والمتصفح المستخدم. إذا كانت المشكلة داخل لعبة، أرسل اسم اللعبة وصورة للشاشة إن أمكن.",
    corrections: "لتصحيح خبر أو مقال، أرسل رابط الصفحة والمعلومة التي تحتاج إلى تعديل مع مصدر موثوق.",
    button: "إرسال رسالة",
  },
  en: {
    title: "Contact Us | Plixfy",
    description: "Contact the Plixfy team for support, suggestions, game reports, partnerships, or content corrections.",
    heading: "Contact the Plixfy Team",
    intro: "We read every message and use player feedback to improve our games and content. Send clear details and we will aim to reply within two business days.",
    emailTitle: "Email",
    emailBody: "For general support, partnerships, and privacy requests.",
    reportTitle: "Report a Problem",
    reportBody: "Include the page URL, your device type, and browser. For an in-game issue, add the game name and a screenshot when possible.",
    corrections: "For a news or article correction, send the page URL, the information that needs changing, and a reliable source.",
    button: "Send an Email",
  },
} as const;

interface PageParams {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  const c = copy[locale];
  return {
    title: c.title,
    description: c.description,
    alternates: pageAlternates(locale, "/contact"),
  };
}

export default async function ContactPage({ params }: PageParams) {
  const { locale: rawLocale } = await params;
  const locale: Locale = hasLocale(rawLocale) ? rawLocale : "ar";
  const c = copy[locale];

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-16">
      <header className="max-w-3xl">
        <p className="text-sm font-bold text-primary">Plixfy</p>
        <h1 className="mt-3 text-3xl font-black text-text-primary md:text-5xl">
          {c.heading}
        </h1>
        <p className="mt-5 text-base leading-8 text-text-secondary md:text-lg">
          {c.intro}
        </p>
      </header>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-surface p-6">
          <Mail className="h-7 w-7 text-primary" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-bold text-text-primary">{c.emailTitle}</h2>
          <p className="mt-2 leading-7 text-text-secondary">{c.emailBody}</p>
          <a className="mt-4 block font-bold text-primary hover:underline" href={`mailto:${EMAIL}`} dir="ltr">
            {EMAIL}
          </a>
        </section>

        <section className="rounded-3xl border border-white/10 bg-surface p-6">
          <MessageSquareText className="h-7 w-7 text-primary" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-bold text-text-primary">{c.reportTitle}</h2>
          <p className="mt-2 leading-7 text-text-secondary">{c.reportBody}</p>
          <p className="mt-3 leading-7 text-text-secondary">{c.corrections}</p>
        </section>
      </div>

      <a
        href={`mailto:${EMAIL}?subject=Plixfy%20Support`}
        className="mt-8 inline-flex min-h-12 items-center rounded-2xl bg-primary px-6 font-bold text-white transition hover:brightness-110"
      >
        {c.button}
      </a>
    </main>
  );
}
