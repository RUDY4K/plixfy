import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "سياسة الخصوصية | بليكسفاي",
  description:
    "تعرّف على كيفية جمع بليكسفاي للبيانات واستخدامها وحمايتها أثناء استخدامك للموقع وألعابه المجانية.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    type: "website",
    title: "سياسة الخصوصية | بليكسفاي",
    description:
      "تعرّف على كيفية جمع بليكسفاي للبيانات واستخدامها وحمايتها أثناء استخدامك للموقع وألعابه المجانية.",
    url: "https://www.plixfy.com/privacy",
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
      <p className="text-sm text-text-faint mb-8">
        آخر تحديث: يناير 2026
      </p>

      <div className="space-y-5 text-text-secondary leading-relaxed">
        <p>
          نحرص في بليكسفاي على حماية خصوصية مستخدمينا. توضح هذه السياسة طبيعة
          البيانات التي قد نجمعها أثناء استخدامك للموقع، والغرض من جمعها، والإجراءات
          التي نتخذها للحفاظ على سريّتها.
        </p>
        <p>
          نستخدم أدوات تحليلات ويب مثل Google Analytics لفهم سلوك الزوار بشكل
          مجمّع وغير شخصي بهدف تحسين تجربة الاستخدام واختيار الألعاب الأنسب.
          لا نبيع أو نؤجر أي بيانات شخصية لأي طرف ثالث.
        </p>
        <p>
          قد يستخدم الموقع ملفات تعريف الارتباط (Cookies) لتذكّر تفضيلاتك مثل
          قائمة المفضلة وآخر الألعاب التي لعبتها. يمكنك تعطيل هذه الملفات من
          إعدادات متصفحك في أي وقت، مع العلم أن ذلك قد يؤثر على بعض الميزات.
        </p>
        <p>
          باستخدامك لبليكسفاي فإنك توافق على بنود هذه السياسة. قد نقوم بتحديثها
          من وقت لآخر، ويُعد استمرار استخدامك للموقع بعد التحديث موافقةً على
          النسخة المعدّلة.
        </p>
      </div>
    </main>
  );
}
