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
      question: "ما الأجهزة التي تدعمها " + title + "؟",
      answer:
        support === "mobile-only"
          ? title + " مخصّصة للجوال وتعمل من متصفح الهاتف بأزرار اللمس."
          : support === "desktop-only"
            ? title + " مخصّصة للكمبيوتر وتحتاج لوحة مفاتيح أو فأرة، لذلك لا نوصي بتشغيلها على الجوال."
            : support === "mobile-and-desktop"
              ? title + " تعمل على الجوال والكمبيوتر من المتصفح، ويتغير أسلوب التحكم بين اللمس ولوحة المفاتيح."
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
      question: "Which devices support " + title + "?",
      answer:
        support === "mobile-only"
          ? title + " is made for mobile browsers and uses touch controls."
          : support === "desktop-only"
            ? title + " is designed for desktop computers and requires a keyboard or mouse, so mobile play is not recommended."
            : support === "mobile-and-desktop"
              ? title + " works in mobile and desktop browsers, switching between touch and keyboard controls as needed."
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
