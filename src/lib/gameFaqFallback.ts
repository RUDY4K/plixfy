import type { GameContentFAQ } from "@/lib/gameContent";
import type { GameDeviceSupport } from "@/lib/games";
import type { Locale } from "@/lib/i18n";

function genericFaqAr(
  title: string,
  support: GameDeviceSupport
): readonly GameContentFAQ[] {
  return [
    {
      question: "هل لعبة " + title + " مجانية؟",
      answer:
        "نعم، " +
        title +
        " متاحة لبدء اللعب دون رسم دخول على بليكسفاي. قد تتضمن اللعبة إعلانات أو مشتريات اختيارية؛ راجع بياناتها وشروطها داخل اللعبة.",
    },
    {
      question: "هل أحتاج إلى تحميل أو تثبيت أي شيء؟",
      answer:
        "لا، " +
        title +
        " تعمل من المتصفح دون تثبيت تطبيق. افتح شاشة اللعب وانتظر تحميل ملفات اللعبة؛ يعتمد الوقت على الشبكة والجهاز.",
    },
    {
      question: "ما الأجهزة التي تدعمها " + title + "؟",
      answer:
        support === "mobile-only"
          ? title + " مدرجة في كتالوج Playgama كداعمة للجوال. راجع تعليمات التحكم؛ الأداء والتوافق يختلفان حسب الهاتف والمتصفح."
          : support === "desktop-only"
            ? title + " مدرجة في كتالوج Playgama كداعمة للكمبيوتر فقط. راجع تعليمات التحكم قبل التشغيل."
            : support === "mobile-and-desktop"
              ? title + " مدرجة في كتالوج Playgama كداعمة للجوال والكمبيوتر. هذا لا يثبت توافقها مع كل جهاز؛ راجع تعليمات التحكم وجرّبها على جهازك."
              : "لم يؤكد الناشر الأجهزة المتوافقة مع " + title + " حتى الآن؛ راجع خانة الأجهزة المدعومة في الصفحة بعد تحديث بيانات اللعبة.",
    },
  ];
}

function genericFaqEn(
  title: string,
  support: GameDeviceSupport
): readonly GameContentFAQ[] {
  return [
    {
      question: "Is " + title + " free to play?",
      answer:
        "Yes, " +
        title +
        " is available to start without an entry fee on Plixfy. The game may contain ads or optional purchases; check its details and in-game terms.",
    },
    {
      question: "Do I need to download or install anything?",
      answer:
        "No, " +
        title +
        " runs in your browser without installing an app. Open the play screen and allow the game files to load; loading time depends on your connection and device.",
    },
    {
      question: "Which devices support " + title + "?",
      answer:
        support === "mobile-only"
          ? title + " is listed by Playgama as supporting mobile. Check its control instructions; performance and compatibility vary by phone and browser."
          : support === "desktop-only"
            ? title + " is listed by Playgama as supporting desktop only. Check its control instructions before launching."
            : support === "mobile-and-desktop"
              ? title + " is listed by Playgama as supporting mobile and desktop. This does not verify every device; check its control instructions and try it on your device."
              : "The publisher has not confirmed device compatibility for " + title + " yet; check the supported-devices field after the game's data is updated.",
    },
  ];
}

export function getGenericGameFaq(
  title: string,
  locale: Locale = "ar",
  support: GameDeviceSupport = "unknown"
): readonly GameContentFAQ[] {
  return locale === "en"
    ? genericFaqEn(title, support)
    : genericFaqAr(title, support);
}
