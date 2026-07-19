import type { GameContentFAQ } from "@/lib/gameContent";
import type { Locale } from "@/lib/i18n";

function genericFaqAr(title: string): readonly GameContentFAQ[] {
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

function genericFaqEn(title: string): readonly GameContentFAQ[] {
  return [
    {
      question: "Is " + title + " free to play?",
      answer:
        "Yes, " +
        title +
        " is 100% free on Plixfy. No subscription and no account needed — just open the page and play.",
    },
    {
      question: "Do I need to download or install anything?",
      answer:
        "No, " +
        title +
        " runs directly in your browser. Open the page, hit the Play button, and the game starts instantly with no download.",
    },
    {
      question: "Does " + title + " work on mobile?",
      answer:
        "Yes, " +
        title +
        " is optimized for mobile and runs smoothly on Android and iPhone in the browser, with touch controls appearing automatically on screen.",
    },
  ];
}

export function getGenericGameFaq(
  title: string,
  locale: Locale = "ar"
): readonly GameContentFAQ[] {
  return locale === "en" ? genericFaqEn(title) : genericFaqAr(title);
}
