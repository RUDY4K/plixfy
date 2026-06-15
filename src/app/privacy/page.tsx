import type { Metadata } from "next";

const CONTACT_EMAIL = "privacy@plixfy.com";
const SITE = "https://www.plixfy.com";

export const metadata: Metadata = {
  title: "سياسة الخصوصية | بليكسفاي",
  description:
    "كيف يجمع بليكسفاي بياناتك، ولأي غرض، ومن هم الأطراف الثالثة، وحقوقك بموجب نظام حماية البيانات الشخصية السعودي (PDPL).",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    type: "website",
    title: "سياسة الخصوصية | بليكسفاي",
    description:
      "تفاصيل جمع البيانات، الأطراف الثالثة، نقل البيانات خارج المملكة، وحقوقك حسب PDPL.",
    url: SITE + "/privacy",
    siteName: "Plixfy",
    locale: "ar_SA",
  },
};

export default function PrivacyPage() {
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
            <a
              href={"mailto:" + CONTACT_EMAIL}
              className="text-primary underline hover:brightness-110"
              dir="ltr"
            >
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
              <strong className="text-text-primary">معرّف إعلاني (Monetag):
              </strong>{" "}
              يُستخدم لعرض الإعلانات وتقدير الأداء، ويعتمد على موافقتك الصريحة.
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
              التحليلات (GA4) والإعلانات (Monetag) لا تعمل إلّا بعد موافقتك
              الصريحة عبر إشعار ملفات تعريف الارتباط.
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
                className="text-primary underline hover:brightness-110"
                target="_blank"
                rel="noopener noreferrer"
              >
                سياسة Google
              </a>
              .
            </li>
            <li>
              <strong className="text-text-primary">Monetag</strong> — عرض
              الإعلانات + إشعارات الويب عبر Service Worker مُضمّن في الموقع.{" "}
              <a
                href="https://monetag.com/privacy-policy/"
                className="text-primary underline hover:brightness-110"
                target="_blank"
                rel="noopener noreferrer"
              >
                سياسة Monetag
              </a>
              .
            </li>
            <li>
              <strong className="text-text-primary">Playgama</strong> — تستضيف
              الألعاب وتعرضها داخل إطار (iframe) معزول. قد تستخدم Playgama ملفات
              تعريف الارتباط الخاصّة بها داخل نطاقها.{" "}
              <a
                href="https://playgama.com/privacy"
                className="text-primary underline hover:brightness-110"
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
            الأطراف المذكورة أعلاه (Google، Monetag، Playgama، Vercel) لديها
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
            <a
              href={"mailto:" + CONTACT_EMAIL}
              className="text-primary underline hover:brightness-110"
              dir="ltr"
            >
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
