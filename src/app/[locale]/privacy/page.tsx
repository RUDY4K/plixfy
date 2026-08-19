import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, localeHref, ogLocaleFor, pageAlternates } from "@/lib/i18n";

const CONTACT_EMAIL = "privacy@plixfy.com";
const SITE = "https://www.plixfy.com";

const metaByLocale = {
  ar: {
    title: "سياسة الخصوصية | بليكسفاي",
    description:
      "كيف يجمع بليكسفاي بياناتك، ولأي غرض، ومن هم الأطراف الثالثة، وحقوقك بموجب نظام حماية البيانات الشخصية السعودي (PDPL).",
    ogDescription:
      "تفاصيل جمع البيانات، الأطراف الثالثة، نقل البيانات خارج المملكة، وحقوقك حسب PDPL.",
  },
  en: {
    title: "Privacy Policy | Plixfy",
    description:
      "How Plixfy collects your data, for what purpose, who the third parties are, and your rights under the Saudi Personal Data Protection Law (PDPL).",
    ogDescription:
      "Details on data collection, third parties, cross-border data transfers, and your rights under the PDPL.",
  },
} as const;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const copy = metaByLocale[locale];
  return {
    title: copy.title,
    description: copy.description,
    alternates: pageAlternates(locale, "/privacy"),
    openGraph: {
      type: "website",
      title: copy.title,
      description: copy.ogDescription,
      url: SITE + localeHref(locale, "/privacy"),
      siteName: "Plixfy",
      locale: ogLocaleFor(locale),
    },
  };
}

export default async function PrivacyPage({
  params,
}: PageProps<"/[locale]/privacy">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  return locale === "en" ? <PrivacyEn /> : <PrivacyAr />;
}

const linkClass = "text-primary underline hover:brightness-110";

function PrivacyAr() {
  return (
    <main className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
        سياسة الخصوصية
      </h1>
      <p className="text-sm text-text-faint mb-8">آخر تحديث: يونيو 2026</p>

      <div className="space-y-6 text-text-secondary leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            1. المسؤول عن معالجة البيانات
          </h2>
          <p>
            بليكسفاي ({SITE}) هو المتحكّم في البيانات الشخصية التي تتم معالجتها
            من خلال هذا الموقع. للتواصل بشأن أي مسألة تتعلّق بالخصوصية أو ممارسة
            حقوقك، يمكنك مراسلتنا على:{" "}
            <a href={"mailto:" + CONTACT_EMAIL} className={linkClass} dir="ltr">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            2. البيانات التي نجمعها
          </h2>
          <ul className="list-disc list-inside space-y-1 marker:text-primary">
            <li>
              <strong className="text-text-primary">بيانات تقنية:</strong> عنوان
              IP، نوع المتصفح ونظام التشغيل، دقّة الشاشة، إعدادات اللغة، وروابط
              الإحالة.
            </li>
            <li>
              <strong className="text-text-primary">بيانات الاستخدام:</strong>{" "}
              الصفحات التي زرتها، الألعاب التي شغّلتها، مدّة الجلسة، وأحداث
              التفاعل (مثل النقر على لعبة).
            </li>
            <li>
              <strong className="text-text-primary">معرّف Google Analytics
              (client_id):</strong> معرّف مجهول الهوية يُنشأ تلقائياً لقياس
              الاستخدام بشكل مجمّع.
            </li>
            <li>
              <strong className="text-text-primary">معرّفات إعلانية (Google
              AdSense):</strong>{" "}
              تُستخدم لعرض الإعلانات وقياس أدائها، وتعتمد على موافقتك الصريحة.
            </li>
            <li>
              <strong className="text-text-primary">التخزين المحلي
              (localStorage):</strong> اختيارك للموافقة، قائمة المفضلة، وسجلّات
              الأحداث المعلّقة.
            </li>
          </ul>
          <p className="mt-3">
            لا نطلب ولا نجمع أي بيانات تعريف مباشرة (الاسم الكامل، رقم الجوال،
            البريد، رقم الهوية) إلا إذا تواصلت معنا طوعاً عبر البريد المذكور
            أعلاه.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            3. الغرض من المعالجة والأساس النظامي
          </h2>
          <ul className="list-disc list-inside space-y-1 marker:text-primary">
            <li>
              <strong className="text-text-primary">المصلحة المشروعة:</strong>{" "}
              تشغيل الموقع، الأمن السيبراني، ومنع الاحتيال.
            </li>
            <li>
              <strong className="text-text-primary">موافقة المستخدم:</strong>{" "}
              التحليلات (GA4) والإعلانات (Google AdSense) لا تعمل إلّا بعد
              موافقتك الصريحة عبر إشعار ملفات تعريف الارتباط.
            </li>
            <li>
              <strong className="text-text-primary">تنفيذ خدمة طلبتها:</strong>{" "}
              تشغيل الألعاب المُضمّنة من Playgama يتطلّب تمرير طلبك إليهم.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            4. الأطراف الثالثة
          </h2>
          <p>نشارك بيانات محدودة مع المعالجات التالية لتشغيل الخدمة:</p>
          <ul className="list-disc list-inside space-y-1 marker:text-primary mt-2">
            <li>
              <strong className="text-text-primary">Google Analytics 4</strong>{" "}
              — قياس الاستخدام (Google LLC، الولايات المتحدة).{" "}
              <a
                href="https://policies.google.com/privacy"
                className={linkClass}
                target="_blank"
                rel="noopener noreferrer"
              >
                سياسة Google
              </a>
              .
            </li>
            <li>
              <strong className="text-text-primary">Google AdSense</strong> —
              عرض الإعلانات على صفحات الموقع (Google LLC، الولايات المتحدة).{" "}
              <a
                href="https://policies.google.com/technologies/ads"
                className={linkClass}
                target="_blank"
                rel="noopener noreferrer"
              >
                سياسة إعلانات Google
              </a>
              .
            </li>
            <li>
              <strong className="text-text-primary">Playgama</strong> — تستضيف
              الألعاب وتعرضها داخل إطار (iframe) معزول. قد تستخدم Playgama ملفات
              تعريف الارتباط الخاصّة بها داخل نطاقها.{" "}
              <a
                href="https://playgama.com/privacy"
                className={linkClass}
                target="_blank"
                rel="noopener noreferrer"
              >
                سياسة Playgama
              </a>
              .
            </li>
            <li>
              <strong className="text-text-primary">Vercel</strong> — مزوّد
              الاستضافة الذي تُقدَّم منه صفحات الموقع.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            5. نقل البيانات خارج المملكة العربية السعودية
          </h2>
          <p>
            الأطراف المذكورة أعلاه (Google، Playgama، Vercel) لديها
            بنية تحتية خارج المملكة العربية السعودية. عند موافقتك على التحليلات
            أو الإعلانات، يتمّ نقل البيانات المرتبطة بها إلى دول قد تشمل
            الولايات المتحدة والاتحاد الأوروبي. يطبّق هؤلاء المعالجون ضوابط
            تعاقدية قياسية وضوابط أمنية تلتزم بأطر حماية البيانات الدولية.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            6. مدّة الاحتفاظ
          </h2>
          <ul className="list-disc list-inside space-y-1 marker:text-primary">
            <li>اختيار الموافقة على ملفات تعريف الارتباط: 180 يوماً.</li>
            <li>بيانات Google Analytics: 14 شهراً (الإعداد الافتراضي لـ GA4).</li>
            <li>قائمة المفضلة وتفضيلاتك في المتصفح: حتى تمسحها من إعدادات المتصفح.</li>
            <li>طلبات الدعم المرسلة عبر البريد: حتى انتهاء الغرض من الطلب.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            7. حقوقك بموجب نظام حماية البيانات الشخصية (PDPL)
          </h2>
          <p>لك بصفتك صاحب البيانات الحقوق التالية:</p>
          <ul className="list-disc list-inside space-y-1 marker:text-primary mt-2">
            <li>الوصول إلى بياناتك ومعرفة كيفية معالجتها.</li>
            <li>طلب تصحيح بياناتك إذا كانت غير صحيحة أو غير مكتملة.</li>
            <li>طلب حذف بياناتك في الحالات التي يسمح بها النظام.</li>
            <li>الاعتراض على بعض أنواع المعالجة، أو سحب موافقتك في أي وقت.</li>
            <li>تقديم شكوى إلى الهيئة السعودية للبيانات والذكاء الاصطناعي (SDAIA).</li>
          </ul>
          <p className="mt-3">
            لممارسة هذه الحقوق، راسلنا على{" "}
            <a href={"mailto:" + CONTACT_EMAIL} className={linkClass} dir="ltr">
              {CONTACT_EMAIL}
            </a>
            . سنردّ خلال 30 يوماً كحدّ أقصى. يمكنك أيضاً سحب موافقتك على
            التحليلات والإعلانات في أي وقت من زرّ{" "}
            <strong className="text-text-primary">
              إعدادات ملفات تعريف الارتباط
            </strong>{" "}
            في تذييل الموقع.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            8. أمن البيانات
          </h2>
          <p>
            نطبّق إجراءات تقنية وتنظيمية معقولة لحماية البيانات: HTTPS إجباري
            (HSTS)، إعدادات حماية متعدّدة على مستوى المتصفح (CSP، X-Frame-Options،
            Referrer-Policy)، عزل الألعاب المُضمّنة في iframe sandbox، ووصول
            مقيّد إلى لوحات التحكم الداخلية.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            9. الأطفال
          </h2>
          <p>
            الموقع موجَّه للجمهور العام. لا نجمع عمداً بيانات شخصية من الأطفال
            دون 13 سنة. بعض الفئات (مثل ألعاب التصويب) تعرض شاشة تأكيد عمر قبل
            الدخول. إذا اعتقدت أن طفلاً قدّم بيانات، راسلنا للحذف الفوري.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            10. التحديثات على هذه السياسة
          </h2>
          <p>
            قد نحدّث هذه السياسة عند تغيّر الأنظمة أو الأطراف الثالثة. التغييرات
            الجوهرية ستُعرض في إشعار على الموقع لمدّة 14 يوماً. تاريخ آخر تحديث
            في أعلى الصفحة.
          </p>
        </section>
      </div>
    </main>
  );
}

function PrivacyEn() {
  return (
    <main className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
        Privacy Policy
      </h1>
      <p className="text-sm text-text-faint mb-8">Last updated: June 2026</p>

      <div className="space-y-6 text-text-secondary leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            1. Data Controller
          </h2>
          <p>
            Plixfy ({SITE}) is the controller of the personal data processed
            through this website. For any privacy matter or to exercise your
            rights, contact us at:{" "}
            <a href={"mailto:" + CONTACT_EMAIL} className={linkClass} dir="ltr">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            2. Data We Collect
          </h2>
          <ul className="list-disc list-inside space-y-1 marker:text-primary">
            <li>
              <strong className="text-text-primary">Technical data:</strong> IP
              address, browser type and operating system, screen resolution,
              language settings, and referral links.
            </li>
            <li>
              <strong className="text-text-primary">Usage data:</strong> pages
              you visited, games you launched, session duration, and interaction
              events (such as clicking a game).
            </li>
            <li>
              <strong className="text-text-primary">Google Analytics
              identifier (client_id):</strong> an anonymous identifier created
              automatically to measure usage in aggregate.
            </li>
            <li>
              <strong className="text-text-primary">Advertising identifiers
              (Google AdSense):</strong>{" "}
              used to serve ads and measure their performance, subject to your
              explicit consent.
            </li>
            <li>
              <strong className="text-text-primary">Local storage
              (localStorage):</strong> your consent choice, favorites list, and
              pending event logs.
            </li>
          </ul>
          <p className="mt-3">
            We do not request or collect any directly identifying data (full
            name, phone number, email, ID number) unless you voluntarily contact
            us at the email above.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            3. Purpose of Processing and Legal Basis
          </h2>
          <ul className="list-disc list-inside space-y-1 marker:text-primary">
            <li>
              <strong className="text-text-primary">Legitimate interest:</strong>{" "}
              operating the site, cybersecurity, and fraud prevention.
            </li>
            <li>
              <strong className="text-text-primary">User consent:</strong>{" "}
              analytics (GA4) and advertising (Google AdSense) only run after
              your explicit consent via the cookie notice.
            </li>
            <li>
              <strong className="text-text-primary">Performing a service you
              requested:</strong>{" "}
              running games embedded from Playgama requires passing your request
              to them.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            4. Third Parties
          </h2>
          <p>We share limited data with the following processors to operate the service:</p>
          <ul className="list-disc list-inside space-y-1 marker:text-primary mt-2">
            <li>
              <strong className="text-text-primary">Google Analytics 4</strong>{" "}
              — usage measurement (Google LLC, United States).{" "}
              <a
                href="https://policies.google.com/privacy"
                className={linkClass}
                target="_blank"
                rel="noopener noreferrer"
              >
                Google policy
              </a>
              .
            </li>
            <li>
              <strong className="text-text-primary">Google AdSense</strong> —
              serving ads on the site&apos;s pages (Google LLC, United States).{" "}
              <a
                href="https://policies.google.com/technologies/ads"
                className={linkClass}
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Ads policy
              </a>
              .
            </li>
            <li>
              <strong className="text-text-primary">Playgama</strong> — hosts
              the games and displays them inside an isolated iframe. Playgama
              may use its own cookies within its domain.{" "}
              <a
                href="https://playgama.com/privacy"
                className={linkClass}
                target="_blank"
                rel="noopener noreferrer"
              >
                Playgama policy
              </a>
              .
            </li>
            <li>
              <strong className="text-text-primary">Vercel</strong> — the
              hosting provider that serves the site&apos;s pages.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            5. Data Transfers Outside Saudi Arabia
          </h2>
          <p>
            The parties mentioned above (Google, Playgama, Vercel) have
            infrastructure outside Saudi Arabia. When you consent to analytics
            or advertising, the related data is transferred to countries that
            may include the United States and the European Union. These
            processors apply standard contractual and security controls that
            comply with international data protection frameworks.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            6. Retention Periods
          </h2>
          <ul className="list-disc list-inside space-y-1 marker:text-primary">
            <li>Cookie consent choice: 180 days.</li>
            <li>Google Analytics data: 14 months (GA4 default setting).</li>
            <li>Favorites list and browser preferences: until you clear them from your browser settings.</li>
            <li>Support requests sent by email: until the purpose of the request is fulfilled.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            7. Your Rights Under the Personal Data Protection Law (PDPL)
          </h2>
          <p>As a data subject you have the following rights:</p>
          <ul className="list-disc list-inside space-y-1 marker:text-primary mt-2">
            <li>Access your data and know how it is processed.</li>
            <li>Request correction of inaccurate or incomplete data.</li>
            <li>Request deletion of your data where the law allows.</li>
            <li>Object to certain types of processing, or withdraw your consent at any time.</li>
            <li>File a complaint with the Saudi Data and Artificial Intelligence Authority (SDAIA).</li>
          </ul>
          <p className="mt-3">
            To exercise these rights, email us at{" "}
            <a href={"mailto:" + CONTACT_EMAIL} className={linkClass} dir="ltr">
              {CONTACT_EMAIL}
            </a>
            . We will respond within 30 days at most. You can also withdraw your
            consent to analytics and advertising at any time using the{" "}
            <strong className="text-text-primary">Cookie Settings</strong>{" "}
            button in the site footer.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            8. Data Security
          </h2>
          <p>
            We apply reasonable technical and organizational measures to protect
            data: enforced HTTPS (HSTS), multiple browser-level protections
            (CSP, X-Frame-Options, Referrer-Policy), embedded games isolated in
            an iframe sandbox, and restricted access to internal dashboards.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            9. Children
          </h2>
          <p>
            The site is intended for a general audience. We do not knowingly
            collect personal data from children under 13. Some categories (such
            as shooting games) show an age confirmation screen before entry. If
            you believe a child has provided data, contact us for immediate
            deletion.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            10. Updates to This Policy
          </h2>
          <p>
            We may update this policy when laws or third parties change.
            Material changes will be announced in a notice on the site for 14
            days. The last-updated date is at the top of the page.
          </p>
        </section>
      </div>
    </main>
  );
}
