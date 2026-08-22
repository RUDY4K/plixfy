import type { CategorySlug } from "@/lib/games";

export interface CategoryContent {
  intro: string;
  keywords: readonly string[];
  related: readonly CategorySlug[];
  metaHooks: readonly string[];
}

export const categoryContent: Record<CategorySlug, CategoryContent> = {
  racing: {
    intro:
      "ألعاب السباق على بليكسفاي تنقلك إلى أكثر تجارب القيادة إثارة، حيث تتسابق بأقوى السيارات والدراجات النارية والشاحنات على مضامير عالمية مشهورة وطرق صحراوية وعرة وحلبات مدنية بإضاءات نيون. تتنوّع الألعاب بين السباقات الفيزيائية كموتو اكس 3 ام التي تختبر مهارات التوازن والشقلبات الجوية، وسباقات الدريفت التي تعتمد على التحكم الدقيق في الفرامل، وسباقات الأبطال متعددة اللاعبين التي تتنافس فيها مع متسابقين من السعودية والخليج. كل لعبة تعمل من المتصفح بدون تحميل، وتدعم التحكم باللمس على الجوال والمفاتيح على الحاسوب. اختر سيارتك، اضبط نمط القيادة، واستعدّ لتحطيم الأرقام القياسية في تصنيفات سرعة عالمية.",
    keywords: ["سباق سيارات", "سباق دراجات", "ألعاب سيارات", "دريفت", "سرعة"],
    related: ["sports", "action"],
    metaHooks: [
      "تحدّ مهارات القيادة والسرعة على مضامير صعبة",
      "تسابق بسيارات قوية ودرّاجات نارية في حلبات مثيرة",
      "اضبط الدريفت بدقّة وحطّم الأرقام القياسية",
      "انطلق في طرق صحراوية ومدن نيون بأسرع المركبات",
    ],
  },
  action: {
    intro:
      "ألعاب الأكشن على بليكسفاي تجمع أفضل المغامرات القتالية والمعارك المثيرة في صفحة واحدة، من ألعاب القتال بأسلوب الستيكمان إلى معارك البقاء على قيد الحياة في أراضٍ مفتوحة. ستجد ألعاب التسلّل التي تختبر مهارة التخفّي والتخطيط، ألعاب الكاراتيه والملاكمة التي تعتمد على ردود الفعل السريعة، وألعاب البطل الخارق التي تطلق فيها قواك الخاصّة لتحرير المدن من الأعداء. كثير من ألعاب الأكشن هنا تتميّز بقصص متكاملة ونظام ترقيات يجعلك تطوّر بطلك مع كل مرحلة. كل ذلك من المتصفح، بدون تحميل، وبأداء سلس على الجوال والحاسوب. ادخل، اختر بطلك، وابدأ المعركة الآن.",
    keywords: ["ألعاب قتال", "أكشن", "مغامرة", "بقاء", "ستيكمان"],
    related: ["shooting", "racing"],
    metaHooks: [
      "خوض المعارك المثيرة والمغامرات القتالية",
      "حرّر المدن من الأعداء بقدرات بطل خارق",
      "اختبر مهارات الكاراتيه والملاكمة بردود فعل سريعة",
      "تسلّل بصمت أو واجه أعداءك مباشرة في مهمات متنوّعة",
    ],
  },
  puzzle: {
    intro:
      "ألعاب الألغاز على بليكسفاي تتحدّى عقلك وتدرّبك على التفكير الإبداعي وحلّ المشكلات. القسم يضمّ ألعاباً منوّعة: ماجونغ كلاسيكي، تركيب الكلمات، ألغاز الأشياء المخفية، ألعاب الترتيب بالألوان، وألغاز الفيزياء التي تختبر فهمك لقوانين الحركة والتوازن. كل لعبة مصمّمة لتقديم تحدٍّ تدريجي يبدأ بمراحل سهلة لتعلّم القواعد، ثم يتطوّر إلى ألغاز تحتاج تفكيراً عميقاً ومنطقاً سليماً. مناسبة لجميع الأعمار، ومثالية للأطفال الذين يطوّرون مهاراتهم الذهنية وللكبار الذين يبحثون عن استرخاء مفيد بعد يوم طويل. كل الألعاب تعمل بدون تحميل، وكثير منها يحفظ تقدّمك تلقائياً حتى لو أغلقت المتصفح وعدت لاحقاً.",
    keywords: ["ألغاز", "ماجونغ", "كلمات", "أشياء مخفية", "تنمية الذكاء"],
    related: ["casual", "girls"],
    metaHooks: [
      "حلّ ألغاز ذكية تختبر قدرتك على التفكير",
      "رتّب وادمج لتكشف نمط الحلّ المخفي",
      "اكتشف الأشياء المخفية وتجاوز المراحل الصعبة",
      "درّب عقلك على المنطق والاستنتاج بسرعة",
    ],
  },
  io: {
    intro:
      "ألعاب آيو على بليكسفاي تأخذك إلى عالم المنافسة الفورية ضدّ آلاف اللاعبين من حول العالم في الوقت ذاته. ستجد هنا الكلاسيكيات الشهيرة من نمط نمو الثعبان واحتلال الخريطة وأخذ التراب، إلى جانب نسخ حديثة تضيف قدرات خاصّة، تطويرات، ومستويات قوّة. اللعب بسيط جداً في البداية: تنضمّ إلى الخادم، تختار اسمك، وتبدأ المعركة فوراً بدون تحميل ولا تسجيل دخول. السرّ في إتقان هذه الألعاب يكمن في الإدمان السريع للجلسات القصيرة المتكرّرة، والتحكّم الدقيق، وقراءة تحرّكات الخصوم. عرض الجوال محسّن بزرّ تحكّم لمسي مريح، وأداء عالٍ يجعل اللعب سلساً حتى على شبكات الإنترنت المتوسّطة.",
    keywords: ["ألعاب آيو", "متعدد اللاعبين", "إنترنت", "ثعبان", "تنافس"],
    related: ["action", "casual"],
    metaHooks: [
      "تنافس مع آلاف اللاعبين من حول العالم في الوقت ذاته",
      "نمّ ذاتك واحتلّ الخريطة قبل بقية اللاعبين",
      "العب مباشرة بدون تسجيل دخول مع لاعبين حقيقيين",
      "اختر شخصيتك وادخل المعركة الفوريّة على الإنترنت",
    ],
  },
  girls: {
    intro:
      "ألعاب البنات على بليكسفاي مساحة مرحة لكل من تحبّ الإبداع والموضة والقصص الجميلة. يضمّ القسم ألعاب تلبيس الشخصيات بآخر صيحات الأزياء، ألعاب صالونات التجميل والمكياج، ألعاب الطبخ والحلويات، ألعاب رعاية الحيوانات الأليفة، وألعاب تصميم الديكور وتزيين البيوت. كل لعبة مصمّمة بألوان جميلة وموسيقى لطيفة وواجهة بسيطة، حتى الأطفال الصغار يقدرون يلعبونها بدون مساعدة. تشتغل من المتصفح مباشرة بدون أي تحميل، وآمنة 100% لا تحتوي على مشاهد عنف أو محتوى غير مناسب. مكتبتنا تتجدّد باستمرار بإضافات أسبوعية تشمل أحدث ألعاب البنات وأكثرها رواجاً في السعودية والخليج.",
    keywords: ["ألعاب بنات", "تلبيس", "مكياج", "طبخ", "تصميم"],
    related: ["casual", "puzzle"],
    metaHooks: [
      "صمّم، البس، وأبدع في عالم البنات الجميل",
      "نسّق المكياج والأزياء بأحدث الصيحات العالمية",
      "اطبخ الحلويات الشهيّة وزيّن الأطباق بأسلوبك",
      "اعتنِ بحيواناتك الأليفة وزيّن منزلك بطريقتك",
    ],
  },
  casual: {
    intro:
      "الألعاب الخفيفة على بليكسفاي مناسبة لكل من يبحث عن متعة سريعة بدون تعقيد. ستجد ألعاب الدمج والترتيب، ألعاب التابات والنقرات، الألعاب الاستراتيجية البسيطة، ألعاب المحاكاة، وألعاب الإدارة التي تبني فيها مطعمك أو فندقك أو مدينتك خطوة بخطوة. مناسبة للجلسات القصيرة في الباص، الاستراحة، أو قبل النوم، لأن أغلبها يحفظ تقدّمك تلقائياً ويسمح لك بالعودة في أي لحظة من حيث توقّفت. تتميّز بسهولة التعلّم وعمق التحدّي، فأنت تبدأ بطفل صغير ومع الوقت تجد نفسك تطوّر استراتيجيات معقّدة. كلها مجانية بنسبة 100%، تعمل من المتصفح بدون تحميل، ومتوافقة مع الجوال والحاسوب.",
    keywords: ["ألعاب خفيفة", "كاجوال", "محاكاة", "إدارة", "دمج"],
    related: ["puzzle", "girls"],
    metaHooks: [
      "متعة سريعة في جلسة قصيرة بدون أي تعقيد",
      "ادمج ورتّب لتكشف مفاجآت اللعبة الذكيّة",
      "ابنِ مدينتك أو مطعمك خطوة بخطوة",
      "احفظ تقدّمك تلقائياً والعب وقتما تشاء",
    ],
  },
  sports: {
    intro:
      "ألعاب الرياضة على بليكسفاي تنقلك إلى ملاعب كرة القدم، السلّة، التنس، الغولف، والبلياردو، بإحساس تنافسي حقيقي. تختار ناديك المفضّل، تنزل الملعب، وتلعب مباريات سريعة أو بطولات كاملة ضدّ الذكاء الاصطناعي أو لاعبين حقيقيين. تتنوّع الألعاب بين المحاكاة الواقعية التي تنقل قواعد الرياضة الحقيقية بدقّة، والألعاب الكرتونية المرحة المناسبة للأطفال. كثير منها يعتمد على الفيزياء الواقعية بحيث تشعر بثقل الكرة وتأثير القوّة عند التسديد. كل الألعاب تعمل من المتصفح بدون تحميل، وتدعم التحكم باللمس على الجوال. مناسبة لمن يحبّ الرياضة الواقعية، ولمن يفضّل تجارب رياضية أبسط للتسلية والاسترخاء.",
    keywords: ["كرة قدم", "كرة سلة", "تنس", "بلياردو", "ألعاب رياضية"],
    related: ["racing", "action"],
    metaHooks: [
      "العب على ملاعب كرة القدم والسلّة والتنس",
      "تنافس في بطولات سريعة بإحساس رياضي حقيقي",
      "اختر فريقك وانطلق لخوض مباراة كاملة",
      "اضرب بدقّة وسجّل أهدافاً بأسلوبك الخاص",
    ],
  },
  shooting: {
    intro:
      "ألعاب التصويب على بليكسفاي تجمع أفضل ألعاب الـ FPS متعدّدة اللاعبين، ألعاب القنّاص الاحترافية، ومعارك البقاء على قيد الحياة. ستلعب مع لاعبين من السعودية والخليج والعالم، تختار سلاحك من ترسانة واسعة تشمل البنادق والقنابل والمسدسات، وتدخل خرائط متنوّعة من المدن المهجورة إلى الصحاري المفتوحة. كثير من الألعاب يضمّ نظام ترقية للأسلحة ومستويات للاعب تحفّز على الاستمرار في اللعب. التحكّم بسيط: مفاتيح للحركة والفأرة للتصويب على الحاسوب، وعصا تحكّم لمسية على الجوال. كل الألعاب تعمل من المتصفح بدون أي تحميل، بأداء عالٍ وزمن استجابة منخفض حتى على شبكات الإنترنت المتوسّطة. تنبيه: بعض الألعاب موجّهة للفئة العمرية 13+.",
    keywords: ["تصويب", "FPS", "قنّاص", "بنادق", "حروب"],
    related: ["action", "racing"],
    metaHooks: [
      "صوّب بدقّة وانتصر في معارك الـ FPS متعددة اللاعبين",
      "اختر سلاحك من ترسانة واسعة وادخل المعركة",
      "قاتل لاعبين من حول العالم في خرائط متنوّعة",
      "طوّر بطلك وارتقِ في مستويات اللاعب الاحترافي",
    ],
  },
};

/**
 * Original English editorial copy for the indexable category pages. Keeping it
 * beside the Arabic copy makes the two experiences equally useful while the
 * game catalogue and counts remain data-driven.
 */
export const categoryContentEn: Record<CategorySlug, CategoryContent> = {
  racing: {
    intro:
      "Racing games on Plixfy cover quick arcade sprints, careful drifting challenges, motorcycle obstacle courses, and longer events where consistency matters as much as raw speed. Start by choosing a game that matches the controls you prefer: keyboard steering works well for precise desktop play, while touch-friendly titles are easier to enjoy on a phone. If a track feels difficult, learn its braking points before chasing the fastest time. A clean lap is usually more useful than accelerating into every corner. You can open each game directly in your browser with no installation, then use the category list to compare different vehicles, track styles, and levels of challenge.",
    keywords: ["racing games", "car games", "motorcycle games", "drifting", "driving"],
    related: ["sports", "action"],
    metaHooks: [
      "Race cars and motorcycles on tracks built for speed and control",
      "Practise clean corners before chasing a faster lap time",
      "Choose touch-friendly driving games for quick mobile sessions",
      "Explore arcade racing, drifting, and obstacle-course challenges",
    ],
  },
  action: {
    intro:
      "Action games bring together fast movement, combat, platforming, and mission-based adventures. Some reward quick reactions, while others give you room to study enemy patterns, choose upgrades, and decide when to attack or retreat. New players can begin with games that use only a few controls, then move to deeper challenges once movement and timing feel natural. On each game page, check the description and controls before starting so you know whether the title is best suited to a keyboard, mouse, or touchscreen. Every game in this category opens in the browser without an installation, making it easy to try a few styles and find the pace that suits you.",
    keywords: ["action games", "fighting games", "adventure games", "platform games", "combat"],
    related: ["shooting", "racing"],
    metaHooks: [
      "Take on fast missions, battles, and platforming challenges",
      "Learn enemy patterns and improve your timing with every attempt",
      "Choose simple action games or deeper upgrade-based adventures",
      "Play browser action games on desktop or mobile without installing them",
    ],
  },
  puzzle: {
    intro:
      "Puzzle games are a good choice when you want a calmer session built around observation, logic, or pattern recognition. The collection includes matching games, word challenges, hidden-object puzzles, number problems, and physics-based levels. Before making a move, look for the rule the level is teaching: colours may need to be grouped, objects may react in a set order, or a limited number of moves may reward planning ahead. If you get stuck, pause and test one idea at a time instead of repeating the same action. These games run directly in the browser and range from short, accessible levels to longer challenges that are easier to solve across several attempts.",
    keywords: ["puzzle games", "brain games", "word games", "matching games", "logic puzzles"],
    related: ["casual", "girls"],
    metaHooks: [
      "Solve word, matching, hidden-object, and logic challenges",
      "Look for the level rule before spending a limited move",
      "Take a calm break with puzzles that reward careful observation",
      "Try short brain teasers or longer multi-stage browser puzzles",
    ],
  },
  io: {
    intro:
      ".io games are built around short competitive rounds with simple rules that become more demanding as other players react to your choices. Depending on the game, your goal may be to collect resources, grow your character, claim space, or survive longer than nearby rivals. A useful first step is to learn the map and movement system before heading toward the busiest area. Staying near a safe edge can give you time to understand pickups and hazards. Because multiplayer availability and controls differ between titles, read the game page before joining a round. Plixfy lets you open the available .io games in your browser without installing a separate app.",
    keywords: [".io games", "multiplayer games", "arena games", "survival games", "browser games"],
    related: ["action", "casual"],
    metaHooks: [
      "Join short competitive rounds with clear, easy-to-learn goals",
      "Collect resources, claim space, or outlast nearby rivals",
      "Learn the map before moving into the busiest part of the arena",
      "Compare browser-based .io games and their control styles",
    ],
  },
  girls: {
    intro:
      "This creative games collection includes fashion, cooking, decoration, character design, pet care, and story-led activities. The category name follows a familiar search term, but the games are open to anyone who enjoys these themes. Some titles focus on free-form creativity, while others use recipes, customer requests, time limits, or step-by-step goals. For younger players, an adult should still review the individual game and its external content before play; a broad category label cannot guarantee that every title suits every age. Each game opens in the browser with no installation, and the cards make it easy to compare themes before choosing what to try.",
    keywords: ["creative games", "fashion games", "cooking games", "dress up games", "decoration games"],
    related: ["casual", "puzzle"],
    metaHooks: [
      "Create outfits, recipes, rooms, and character looks",
      "Choose between open-ended creativity and goal-based challenges",
      "Compare cooking, fashion, decoration, and pet-care games",
      "Open each creative game directly in your browser",
    ],
  },
  casual: {
    intro:
      "Casual games are designed for quick starts and rules you can understand without a long tutorial. You will find clickers, merging games, simple simulations, management challenges, and compact arcade levels that work well when you only have a few minutes. Easy controls do not always mean an easy finish: many titles gradually add new goals, faster timing, or resources that need to be used carefully. Check whether a game saves progress before closing the tab, because save behaviour varies by title and browser. Everything here can be opened without an installation, so you can sample different ideas and keep the games that fit the length and style of session you want.",
    keywords: ["casual games", "clicker games", "merge games", "simulation games", "quick games"],
    related: ["puzzle", "girls"],
    metaHooks: [
      "Start quickly with simple controls and short browser sessions",
      "Try clickers, merging games, simulations, and compact arcade levels",
      "Watch how each game adds goals and resource decisions over time",
      "Check the game page for controls and save behaviour before playing",
    ],
  },
  sports: {
    intro:
      "Sports games turn familiar ideas from football, basketball, tennis, golf, and cue sports into short browser challenges. Some titles aim for realistic timing and positioning, while others simplify the rules for faster arcade play. If you are new to a game, practise one skill first—such as passing, aiming, or controlling shot power—before trying to win a full match. The game description can also tell you whether you are facing computer-controlled opponents or whether a multiplayer mode is available. Browse the category to compare solo drills, quick matches, tournaments, and physics-based challenges, all playable from the browser without installing a separate game client.",
    keywords: ["sports games", "football games", "basketball games", "tennis games", "pool games"],
    related: ["racing", "action"],
    metaHooks: [
      "Play quick football, basketball, tennis, golf, and cue-sport challenges",
      "Practise aiming, passing, and shot power before a full match",
      "Compare arcade rules with more timing-focused sports games",
      "Find solo drills, tournaments, and available multiplayer modes",
    ],
  },
  shooting: {
    intro:
      "Shooting games test aiming, movement, positioning, and decisions made under pressure. The category includes target challenges, defence games, arena combat, and first- or third-person experiences with different control schemes. Desktop titles commonly combine keyboard movement with mouse aiming, while mobile-friendly games use touch controls; check the individual page before you begin. Accuracy improves when you pause between shots, use cover when the game provides it, and learn how each weapon behaves instead of firing continuously. Some games may contain stylised combat or themes intended for older players, so families should review a title before play. The games open directly in the browser with no installation.",
    keywords: ["shooting games", "aiming games", "target games", "arena games", "defence games"],
    related: ["action", "racing"],
    metaHooks: [
      "Practise aiming, movement, and positioning in varied challenges",
      "Check whether a title uses mouse, keyboard, or touch controls",
      "Use cover and learn weapon behaviour instead of firing continuously",
      "Review combat themes before choosing a game for younger players",
    ],
  },
};
