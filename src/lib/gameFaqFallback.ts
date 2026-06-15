import type { GameContentFAQ } from "@/lib/gameContent";

export function getGenericGameFaq(title: string): readonly GameContentFAQ[] {
  return [
    {
      question: "هل لعبة " + title + " مجانية؟",
      answer:
        "نعم، " +
        title +
        " مجانية بنسبة 100% على بليكسفاي. لا تحتاج إلى اشتراك ولا حساب؛ ادخل والعب مباشرة.",
    },
    {
      question: "هل أحتاج إلى تحميل أو تثبيت أي شيء؟",
      answer:
        "لا، " +
        title +
        " تعمل من المتصفح مباشرة. بمجرد فتح الصفحة والضغط على زر العب الآن، تبدأ اللعبة فوراً بدون تحميل.",
    },
    {
      question: "هل تعمل " + title + " على الجوال؟",
      answer:
        "نعم، " +
        title +
        " محسّنة للجوال وتعمل بسلاسة على أندرويد وآيفون من المتصفح، ويظهر التحكم تلقائياً على شكل أزرار لمس على الشاشة.",
    },
  ];
}
