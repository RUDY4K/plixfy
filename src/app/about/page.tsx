import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "من نحن | بليكسفاي",
  description:
    "بليكسفاي منصة عربية للألعاب المجانية اونلاين — أكثر من 100 لعبة موبايل تعمل مباشرة من المتصفح دون تحميل.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    type: "website",
    title: "من نحن | بليكسفاي",
    description:
      "بليكسفاي منصة عربية للألعاب المجانية اونلاين — أكثر من 100 لعبة موبايل تعمل مباشرة من المتصفح دون تحميل.",
    url: "https://www.plixfy.com/about",
    siteName: "Plixfy",
    locale: "ar_SA",
  },
};

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
        من نحن
      </h1>
      <p className="text-sm text-text-faint mb-8">
        تعرّف على منصة بليكسفاي
      </p>

      <div className="space-y-5 text-text-secondary leading-relaxed">
        <p>
          بليكسفاي منصة عربية متخصصة في تقديم الألعاب المجانية اونلاين، صُمّمت
          لتمنح اللاعب العربي تجربة سريعة وسلسة من متصفحه دون الحاجة إلى أي
          تنزيلات أو تسجيلات. هدفنا أن تكون الوجهة الأولى للترفيه الخفيف
          والممتع لكل أفراد العائلة.
        </p>
        <p>
          نختار لك بعناية أكثر من 100 لعبة موبايل تغطي تصنيفات متنوّعة:
          السباق، الأكشن، الألغاز، الرياضة، ألعاب البنات، والألعاب الخفيفة.
          نُحدّث المكتبة باستمرار لإضافة أحدث وأشهر الألعاب، مع التركيز على
          الجودة وسرعة الأداء على الأجهزة المحمولة.
        </p>
        <p>
          نؤمن بأن الألعاب يجب أن تكون متاحة للجميع ومجانية، لذلك تعتمد
          المنصة على عرض الإعلانات بشكل مدروس لا يُخلّ بتجربة اللعب. شكراً
          لاختيارك بليكسفاي، ونتمنى لك أوقاتاً ممتعة!
        </p>
      </div>
    </main>
  );
}
