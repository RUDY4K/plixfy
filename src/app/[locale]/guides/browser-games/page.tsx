import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale, localeHref, pageAlternates } from "@/lib/i18n";

const content = {
  ar: {
    title: "دليل اختيار ألعاب المتصفح وتشغيلها | بليكسفاي",
    heading: "قبل أن تبدأ لعبة في المتصفح",
    description: "خطوات اختيار لعبة تناسب جهازك ولغتك، وفهم شاشة التشغيل، وتشخيص مشكلات التحميل والتحكم وحفظ التقدم على بليكسفاي.",
    intro: "ابدأ من معلومات اللعبة، ثم جرّب التحكم قبل أن تقضي وقتًا طويلًا فيها. يساعدك هذا الدليل على التمييز بين مشكلة في اختيار اللعبة ومشكلة في تشغيلها، وعلى وصف العطل بطريقة تسهّل متابعته.",
    choose: "١. اختر وفق المعلومات المعلنة",
    chooseBody: "في صفحة اللعبة، افتح قسم «معلومات اللعبة» واقرأ الأجهزة المدعومة واللغات والمشتريات داخل اللعبة. هذه بيانات الكتالوج الواردة من Playgama؛ هي نقطة بداية للاختيار، وليست ضمانًا بأن كل هاتف أو متصفح سيشغّل اللعبة بالطريقة نفسها. صورة اللعبة واسم فئتها لا يكفيان لمعرفة طريقة التحكم.",
    tableCaption: "قرار سريع قبل الضغط على «العب الآن»",
    columns: ["ما الذي تراه؟", "ما الخطوة المناسبة؟"],
    decisions: [
      ["أنت على الجوال، والدعم «كمبيوتر فقط»", "اختر لعبة تعلن دعم الجوال، أو انتقل إلى كمبيوتر. تدوير الشاشة لا يضيف تحكمًا باللمس."],
      ["دعم الأجهزة «غير محدد»", "لا تفترض التوافق. جرّب بداية قصيرة، وتأكد من ظهور الأزرار واستجابتها قبل بدء جلسة طويلة."],
      ["لغتك غير مذكورة، أو تظهر شرطة بدل اللغات", "تحقق من إعدادات اللغة داخل اللعبة إن وُجدت. اختيار العربية في بليكسفاي لا يترجم اللعبة المضمّنة."],
      ["المشتريات داخل اللعبة «متوفرة»", "راجع ما يعرضه كل زر داخل اللعبة قبل المتابعة. إمكانية بدء اللعب مجانًا لا تعني أن كل عنصر مجاني."],
      ["المشتريات معلنة «غير موجودة»", "اعتبر ذلك وصفًا للبيانات المتاحة. إذا ظهر طلب شراء مخالف، توقف وأرسل لنا رابط اللعبة لتصحيح المعلومة."],
    ],
    launch: "٢. افهم الفرق بين الصفحة واللعبة",
    launchBody: "صفحة اللعبة هي مكان قراءة المعلومات والتعليمات والعودة إلى ألعاب أخرى. الضغط على «العب الآن» يفتح اللعبة المقدمة من Playgama داخل مساحة تشغيل؛ وقد تتوسع المساحة على أجهزة اللمس أو تفتح شاشة تشغيل مستقلة. زر الخروج يعيدك إلى صفحة اللعبة أو يغلق مساحة اللعب. لا يعني ظهور صفحة بليكسفاي بنجاح أن ملفات اللعبة نفسها اكتمل تحميلها.",
    checklistTitle: "قائمة البداية القصيرة",
    providerTitle: "إذا ظهرت شاشة ثانية أو إعلان قبل اللعب",
    providerBody: "قد تظهر داخل مساحة اللعب شاشة بدء أخرى من مزوّد اللعبة، مثل Let's Play، أو إعلان قبل قائمة المراحل. ظهور مساحة اللعب لا يثبت أن المرحلة بدأت. انتظر زر الإغلاق الواضح إن ظهر إعلان؛ لا تضغط على الإعلان للوصول إلى اللعبة. بعد الإغلاق ابحث عن قائمة اللعبة أو زر البدء الخاص بها. إعلانات المزوّد المضمّن منفصلة عن إعلانات صفحات بليكسفاي، وقد تظهر حتى عند تعطيل إعلانات الموقع. إذا بقيت الشاشة عالقة، أغلق مساحة اللعب من زر بليكسفاي وأرسل اسم اللعبة وصورة المشكلة، بدل تكرار الضغط داخل الإعلان.",
    checklist: [
      "اقرأ تعليمات التحكم، ثم جرّب حركة واحدة أو زرًا واحدًا داخل اللعبة.",
      "تأكد من رؤية الأزرار المهمة كاملة، ومن ملاءمة اتجاه الشاشة قبل بدء الجولة.",
      "افحص مستوى الصوت وإعدادات اللعبة؛ اضغط زر البداية داخلها إذا كانت تنتظر تفاعلك.",
      "ابحث عن طريقة حفظ أو متابعة معلنة داخل اللعبة إذا كنت تريد العودة لاحقًا.",
    ],
    troubleshoot: "٣. حدّد أين تتوقف التجربة",
    problems: [
      ["مساحة بيضاء أو تحميل لا يتقدم", "لاحظ أولًا: هل تظهر معلومات اللعبة خارج مساحة التشغيل؟ إذا ظهرت، فالمشكلة قد تخص تحميل اللعبة المضمّنة. افحص اتصالك بفتح صفحة عادية، ثم جرّب لعبة أخرى في بليكسفاي. تعطل لعبة واحدة يختلف عن تعطل الجميع. إذا لم تبدأ جولة، يمكنك الخروج وإعادة التشغيل مرة واحدة؛ تجنب التحديث أثناء تقدم غير محفوظ."],
      ["اللعبة ظاهرة لكن اللمس أو لوحة المفاتيح لا يستجيبان", "اضغط داخل مساحة اللعبة ثم جرّب التحكم المذكور في تعليماتها. على الجوال، راجع دعم الجهاز وابحث عن أزرار ظاهرة داخل اللعبة. إذا كانت التعليمات تطلب مفاتيح ولا توجد أزرار لمس، لا تفترض أن المشكلة في هاتفك. جرّب عنوانًا يعلن دعم الجوال."],
      ["أزرار مقصوصة أو اتجاه غير مناسب", "إذا طلبت اللعبة الوضع الأفقي أو العمودي، جرّب الاتجاه المطلوب وتحقق من قفل تدوير الجهاز. ليس كل عنوان يدعم الاتجاهين. إذا بقيت الأزرار خارج الشاشة، سجّل الاتجاه ونوع الجهاز وأرسل المشكلة؛ لا تبدأ جولة تتطلب زرًا لا تستطيع الوصول إليه."],
      ["توجد حركة ولا يوجد صوت", "ابدأ بالتفاعل مع زر البدء داخل اللعبة، ثم افحص كتم الصوت داخلها ومستوى صوت الجهاز وكتم تبويب المتصفح إن وُجد. لا ترفع الصوت فجأة إلى الحد الأقصى. إذا بقيت المشكلة في لعبة واحدة، أضف هذه الملاحظة إلى البلاغ."],
    ],
    save: "٤. المفضلة ليست حفظًا للتقدم",
    saveBody: "زر القلب يحفظ اختيار اللعبة في المفضلة، ولا يحفظ مرحلتك أو نقاطك داخلها. طريقة حفظ التقدم تتبع اللعبة نفسها؛ قد تعتمد على بيانات المتصفح أو حساب لدى مزود اللعبة، وقد لا تتوفر أصلًا. لا نفترض وجود مزامنة بين الأجهزة. قبل الخروج، استخدم خيار الحفظ إن وُجد واقرأ رسالة التأكيد. لا تمسح بيانات الموقع أو تنتقل إلى متصفح آخر بهدف إصلاح مشكلة قبل فهم أثر ذلك على تقدمك؛ لا نستطيع ضمان استعادته.",
    report: "٥. أرسل بلاغًا يمكن التحقق منه",
    reportBody: "اذكر اسم اللعبة ورابط صفحتها، نوع الجهاز والمتصفح، ما ضغطت عليه، وما ظهر بدل النتيجة المتوقعة. وضّح هل تتكرر المشكلة مع ألعاب أخرى، وأرفق صورة تخفي معلوماتك الشخصية إن أمكن. لا ترسل كلمة مرور أو بيانات دفع. هذه التفاصيل تساعد على فصل خطأ المعلومات عن مشكلة التشغيل.",
    links: ["ابحث عن لعبة", "تصفح جميع الألعاب", "أبلغ عن مشكلة", "كيف نتعامل مع المحتوى والتصحيحات"],
    navigation: "خطوتك التالية",
  },
  en: {
    title: "Choosing and Running Browser Games | Plixfy",
    heading: "Before you start a browser game",
    description: "Choose games using device and language information, understand the player, and troubleshoot loading, controls, audio, and saved progress on Plixfy.",
    intro: "Start with the game's information, then try its controls before committing to a long session. This guide helps you distinguish an unsuitable game from a loading problem and describe a fault so it can be investigated.",
    choose: "1. Choose using the declared information",
    chooseBody: "On a game page, find Game Info and read Supported devices, Languages, and In-game purchases. These catalog details come from Playgama. They are a starting point, not a guarantee that every phone or browser will run the title identically. A thumbnail or category alone cannot tell you which controls a game needs.",
    tableCaption: "A quick decision before selecting Play Now",
    columns: ["What do you see?", "What should you do?"],
    decisions: [
      ["You are on a phone; support says Desktop only", "Choose a title declaring mobile support, or use a computer. Rotating your phone does not add touch controls."],
      ["Device support is Not specified", "Do not assume compatibility. Try a short start and check that the controls are visible and responsive before a longer session."],
      ["Your language is missing, or languages show a dash", "Check the game's own language settings if available. Switching Plixfy to Arabic does not translate the embedded game."],
      ["In-game purchases are Available", "Read what each in-game button offers before continuing. Free access to start playing does not mean every item is free."],
      ["In-game purchases say None", "Treat this as the available catalog information. If a purchase request contradicts it, stop and report the game page so the information can be corrected."],
    ],
    launch: "2. Understand the page and the player",
    launchBody: "The game page provides information, instructions, and a way to browse other titles. Play Now opens the Playgama game in a playing area, which may expand on touch devices or open a separate launch screen. The exit control returns you to the game page or closes the playing area. A successfully loaded Plixfy page does not mean the game itself has finished loading.",
    checklistTitle: "A short starting checklist",
    providerTitle: "A second start screen or an ad before play",
    providerBody: "The playing area may first show another provider start screen, such as Let's Play, or an advertisement before the level menu. Opening the player does not prove that a level has started. If an ad appears, wait for its clearly marked close control; do not click the advertisement to reach the game. After closing it, look for the game's menu or start control. Embedded provider advertising is separate from Plixfy page advertising and may appear even when site ads are disabled. If the screen stays stuck, close the playing area with Plixfy's exit control and report the game name and a screenshot instead of repeatedly clicking inside the advertisement.",
    checklist: [
      "Read the controls, then try one movement or button inside the game.",
      "Check that essential controls fit on screen and the orientation suits the game.",
      "Check the sound settings; use the game's own start button if it is waiting for interaction.",
      "Look for an explicit save or continue feature if you want to return later.",
    ],
    troubleshoot: "3. Identify where the experience stops",
    problems: [
      ["A blank area or loading that does not advance", "Can you see the information outside the player? If so, the problem may concern the embedded game. Check your connection by opening an ordinary page, then try another Plixfy game. One failing title is different from all titles failing. Before starting a round, you can exit and relaunch once; avoid refreshing during unsaved progress."],
      ["The game appears, but touch or keyboard input does nothing", "Click or tap inside the playing area, then try the controls described in its instructions. On a phone, check declared support and look for on-screen buttons. If instructions require keys and there are no touch controls, do not assume your phone is faulty. Try a title declaring mobile support."],
      ["Controls are cut off or the orientation seems wrong", "If the game requests landscape or portrait, try that orientation and check your device's rotation lock. Not every title supports both. If controls remain outside the screen, record the orientation and device and report the problem. Avoid starting a round that needs an unreachable button."],
      ["Animation works but there is no sound", "Interact with the game's start control, then check its mute setting, device volume, and the browser tab's mute setting if available. Avoid suddenly raising volume to maximum. If only one title remains silent, include that detail in your report."],
    ],
    save: "4. Favorites do not save game progress",
    saveBody: "The heart button adds a game to your favorites; it does not save your level or score inside that game. Saving depends on the game itself and may use browser data or a provider account, or may not be offered at all. Do not assume progress syncs across devices. Use an available save option and read its confirmation before leaving. Do not clear site data or switch browsers as a repair step without understanding the effect on progress. We cannot guarantee its recovery.",
    report: "5. Send a report that can be investigated",
    reportBody: "Include the game name and page link, device and browser, what you pressed, and what appeared instead of the expected result. Say whether other games have the same problem. A screenshot with personal information hidden can help. Never send passwords or payment details. These details help distinguish an incorrect catalog entry from a playback problem.",
    links: ["Search for a game", "Browse all games", "Report a problem", "How we handle content and corrections"],
    navigation: "Your next step",
  },
} as const;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  return {
    title: content[locale].title,
    description: content[locale].description,
    alternates: pageAlternates(locale, "/guides/browser-games"),
  };
}

export default async function BrowserGamesGuide({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const c = content[locale];
  const paths = ["/search", "/all-games", "/contact", "/editorial-policy"];
  const headingClass = "text-xl font-bold text-text-primary md:text-2xl";
  const paragraphClass = "mt-4 leading-8 text-text-secondary";

  return (
    <main lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-16">
      <article>
        <header className="border-b border-white/10 pb-8">
          <p className="text-sm font-bold text-primary">Plixfy</p>
          <h1 className="mt-3 text-3xl font-black leading-tight text-text-primary md:text-5xl">{c.heading}</h1>
          <p className={paragraphClass}>{c.intro}</p>
        </header>
        <section className="mt-10" aria-labelledby="choose-game">
          <h2 id="choose-game" className={headingClass}>{c.choose}</h2>
          <p className={paragraphClass}>{c.chooseBody}</p>
          <table className="mt-6 w-full table-fixed border-collapse text-start text-sm leading-7 text-text-secondary md:text-base">
            <caption className="pb-3 text-start font-bold text-text-primary">{c.tableCaption}</caption>
            <thead className="bg-surface">
              <tr>{c.columns.map((column, index) => <th key={column} scope="col" className={`${index === 0 ? "w-2/5" : "w-3/5"} border border-white/10 p-3 text-start text-text-primary`}>{column}</th>)}</tr>
            </thead>
            <tbody>{c.decisions.map(([situation, action]) => <tr key={situation}><th scope="row" className="break-words border border-white/10 p-3 text-start align-top font-semibold text-text-primary">{situation}</th><td className="break-words border border-white/10 p-3 align-top">{action}</td></tr>)}</tbody>
          </table>
        </section>
        <section className="mt-10" aria-labelledby="launch-game">
          <h2 id="launch-game" className={headingClass}>{c.launch}</h2>
          <p className={paragraphClass}>{c.launchBody}</p>
          <h3 className="mt-6 text-lg font-bold text-text-primary">{c.providerTitle}</h3>
          <p className={paragraphClass}>{c.providerBody}</p>
          <h3 className="mt-6 text-lg font-bold text-text-primary">{c.checklistTitle}</h3>
          <ul className="mt-3 list-disc space-y-2 ps-6 leading-8 text-text-secondary">{c.checklist.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
        <section className="mt-10" aria-labelledby="troubleshoot-game">
          <h2 id="troubleshoot-game" className={headingClass}>{c.troubleshoot}</h2>
          <div className="mt-5 space-y-5">{c.problems.map(([heading, body]) => <section key={heading} className="rounded-2xl border border-white/10 bg-surface p-5"><h3 className="text-lg font-bold text-text-primary">{heading}</h3><p className={paragraphClass}>{body}</p></section>)}</div>
        </section>
        <section className="mt-10" aria-labelledby="save-game"><h2 id="save-game" className={headingClass}>{c.save}</h2><p className={paragraphClass}>{c.saveBody}</p></section>
        <section className="mt-10" aria-labelledby="report-game"><h2 id="report-game" className={headingClass}>{c.report}</h2><p className={paragraphClass}>{c.reportBody}</p></section>
        <nav aria-label={c.navigation} className="mt-8 flex flex-wrap gap-3 border-t border-white/10 pt-6">{paths.map((path, index) => <Link key={path} href={localeHref(locale, path)} className="inline-flex min-h-11 items-center rounded-xl border border-white/15 px-4 py-2 font-semibold text-primary underline decoration-primary/40 underline-offset-4 hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">{c.links[index]}</Link>)}</nav>
      </article>
    </main>
  );
}
