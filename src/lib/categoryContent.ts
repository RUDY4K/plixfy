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
      "تجمع ألعاب السباق في بليكسفاي بين جولات أركيد سريعة، وتحديات دريفت، ومسارات دراجات تحتاج إلى موازنة دقيقة، وسباقات أطول يكون فيها الثبات أهم من السرعة وحدها. ابدأ بلعبة تناسب وسيلة التحكم التي تفضلها؛ فبعض الألعاب أوضح باستخدام لوحة المفاتيح، بينما صُممت ألعاب أخرى للمس على الجوال. إذا كان المسار صعبًا، تعرّف أولًا إلى نقاط الكبح واتجاه المنعطفات قبل محاولة تسجيل زمن أسرع. افتح صفحة اللعبة للتأكد من الأجهزة المدعومة وطريقة التحكم، ثم قارن بين المركبات والمسارات ومستوى التحدي من دون الحاجة إلى تثبيت لعبة منفصلة.",
    keywords: ["سباق سيارات", "سباق دراجات", "ألعاب سيارات", "دريفت", "سرعة"],
    related: ["sports", "action"],
    metaHooks: [
      "جرّب سباقات السيارات والدراجات وتحديات المسارات",
      "تعلّم نقاط الكبح قبل محاولة تحسين زمن اللفة",
      "اختر لعبة قيادة تناسب اللمس أو لوحة المفاتيح",
      "قارن بين سباقات الأركيد والدريفت والعوائق",
    ],
  },
  action: {
    intro:
      "تضم ألعاب الأكشن تحديات تعتمد على الحركة السريعة والقتال والمنصات والمهمات القصيرة. بعضها يكافئ سرعة رد الفعل، بينما يمنحك بعضها الآخر وقتًا لفهم نمط الخصم واختيار الترقية المناسبة وتحديد لحظة الهجوم أو التراجع. إذا كنت جديدًا على هذا النوع، ابدأ بلعبة ذات أزرار قليلة، ثم انتقل إلى تجربة أعمق عندما تتقن الحركة والتوقيت. راجع وصف كل لعبة لمعرفة ما إذا كانت أنسب للوحة المفاتيح والفأرة أو للمس، وللتأكد من الجهاز المدعوم قبل بدء اللعب من المتصفح.",
    keywords: ["ألعاب قتال", "أكشن", "مغامرة", "بقاء", "ستيكمان"],
    related: ["shooting", "racing"],
    metaHooks: [
      "اختر بين القتال والمنصات والمهمات السريعة",
      "راقب نمط الخصم وحدد الوقت المناسب للهجوم",
      "ابدأ بتحكم بسيط ثم انتقل إلى تحديات أعمق",
      "تحقق من طريقة التحكم والجهاز المدعوم قبل اللعب",
    ],
  },
  puzzle: {
    intro:
      "تناسب ألعاب الألغاز من يريد جلسة أهدأ تعتمد على الملاحظة والمنطق واكتشاف الأنماط. تشمل المجموعة ألعاب المطابقة والكلمات والأشياء المخفية والأرقام والفيزياء، وتتدرج من مراحل قصيرة وواضحة إلى تحديات تحتاج أكثر من محاولة. قبل تنفيذ الحركة، ابحث عن القاعدة التي يشرحها المستوى: قد يكون المطلوب تجميع ألوان، أو ترتيب عناصر، أو استغلال عدد محدود من النقلات. وإذا توقفت عند لغز، جرّب فكرة واحدة في كل مرة بدل تكرار الحركة نفسها. تعمل الألعاب من المتصفح، لكن حفظ التقدم يختلف من لعبة إلى أخرى، لذلك راجع تفاصيل الصفحة قبل إغلاقها.",
    keywords: ["ألغاز", "ماجونغ", "كلمات", "أشياء مخفية", "تنمية الذكاء"],
    related: ["casual", "girls"],
    metaHooks: [
      "جرّب ألغاز الكلمات والمطابقة والأشياء المخفية",
      "اكتشف قاعدة المستوى قبل استخدام النقلات المحدودة",
      "توقف قليلًا واختبر فكرة جديدة عندما يصعب الحل",
      "اختر بين مراحل قصيرة وتحديات متعددة الخطوات",
    ],
  },
  io: {
    intro:
      "تعتمد ألعاب آيو عادةً على جولات قصيرة وقواعد يسهل فهمها، ثم تصبح المنافسة أصعب مع تغير حركة الخصوم. قد يكون هدفك جمع الموارد أو تكبير الشخصية أو السيطرة على مساحة أو البقاء مدة أطول، بحسب اللعبة. في الجولة الأولى، تعرّف إلى الخريطة وأسلوب الحركة قبل التوجه إلى المنطقة الأكثر ازدحامًا، واستفد من الأطراف الهادئة لفهم العناصر والمخاطر. يختلف توفر اللعب الجماعي وطريقة التحكم من عنوان إلى آخر، لذا اقرأ صفحة اللعبة وتحقق من توافقها مع جهازك قبل دخول الجولة من المتصفح.",
    keywords: ["ألعاب آيو", "متعدد اللاعبين", "إنترنت", "ثعبان", "تنافس"],
    related: ["action", "casual"],
    metaHooks: [
      "ادخل جولات قصيرة بقواعد واضحة وسريعة التعلم",
      "اجمع الموارد أو سيطر على المساحة بحسب هدف اللعبة",
      "تعرّف إلى الخريطة قبل دخول المنطقة الأكثر ازدحامًا",
      "تحقق من توفر اللعب الجماعي وأسلوب التحكم لكل عنوان",
    ],
  },
  girls: {
    intro:
      "تضم هذه الفئة ألعاب الأزياء والطبخ والديكور وتصميم الشخصيات والعناية بالحيوانات والقصص التفاعلية، وهي متاحة لكل من يستمتع بهذه الأنماط. تمنحك بعض الألعاب مساحة مفتوحة للتجربة والإبداع، بينما تضع ألعاب أخرى وصفة أو طلبًا أو وقتًا محددًا يجب إنجازه. يساعدك وصف اللعبة وصورها على معرفة الفكرة قبل البدء، كما توضح الصفحة الأجهزة التي تدعمها. وبالنسبة إلى الأطفال، يُفضّل أن يراجع أحد الوالدين اللعبة ومحتواها الخارجي أولًا؛ فاسم الفئة وحده لا يكفي للحكم على ملاءمة كل عنوان.",
    keywords: ["ألعاب بنات", "تلبيس", "مكياج", "طبخ", "تصميم"],
    related: ["casual", "puzzle"],
    metaHooks: [
      "جرّب تصميم الأزياء والشخصيات والوصفات والديكور",
      "اختر بين الإبداع المفتوح والتحديات ذات الأهداف",
      "قارن بين ألعاب الطبخ والموضة والعناية بالحيوانات",
      "راجع محتوى اللعبة قبل اختيارها للاعبين الأصغر سنًا",
    ],
  },
  casual: {
    intro:
      "تبدأ الألعاب الخفيفة بسرعة وتشرح قواعدها عادةً من دون مقدمة طويلة. ستجد هنا ألعاب الدمج والنقر والمحاكاة والإدارة ومراحل أركيد قصيرة، وهي خيارات مناسبة عندما يكون وقتك محدودًا. سهولة البداية لا تعني أن كل مرحلة بسيطة؛ فكثير من الألعاب يضيف أهدافًا أسرع أو موارد تحتاج إلى توزيع محسوب مع التقدم. تحقق من طريقة التحكم والجهاز المدعوم، وانتبه إلى أن حفظ التقدم قد يختلف بحسب اللعبة والمتصفح. يمكنك تجربة أكثر من فكرة مباشرة في المتصفح ثم الاحتفاظ بالعناوين التي تناسب مدة جلستك وأسلوبك.",
    keywords: ["ألعاب خفيفة", "كاجوال", "محاكاة", "إدارة", "دمج"],
    related: ["puzzle", "girls"],
    metaHooks: [
      "ابدأ بسرعة مع قواعد واضحة وجلسات قصيرة",
      "جرّب ألعاب الدمج والنقر والمحاكاة والإدارة",
      "راقب الموارد والأهداف الجديدة مع تقدم المراحل",
      "تحقق من حفظ التقدم قبل إغلاق صفحة اللعبة",
    ],
  },
  sports: {
    intro:
      "تحول ألعاب الرياضة أفكار كرة القدم والسلة والتنس والغولف والبلياردو إلى تحديات قصيرة داخل المتصفح. تحاول بعض الألعاب محاكاة التوقيت والتمركز، بينما تختصر ألعاب أخرى القواعد لتقديم جولة أركيد أسرع. إذا كانت اللعبة جديدة عليك، تدرب على مهارة واحدة مثل التمرير أو التصويب أو ضبط قوة الضربة قبل محاولة الفوز بمباراة كاملة. راجع وصف العنوان لمعرفة نوع المنافس المتاح وطريقة التحكم والأجهزة المدعومة، ثم قارن بين التدريبات الفردية والمباريات والبطولات والتحديات المعتمدة على الفيزياء.",
    keywords: ["كرة قدم", "كرة سلة", "تنس", "بلياردو", "ألعاب رياضية"],
    related: ["racing", "action"],
    metaHooks: [
      "جرّب تحديات كرة القدم والسلة والتنس والغولف",
      "تدرّب على التمرير والتصويب وقوة الضربة",
      "قارن بين أسلوب الأركيد والمحاكاة الرياضية",
      "اكتشف التدريبات والمباريات والبطولات المتاحة",
    ],
  },
  shooting: {
    intro:
      "تختبر ألعاب التصويب دقة التصويب والحركة والتمركز واتخاذ القرار تحت الضغط. تشمل الفئة تحديات أهداف وألعاب دفاع ومعارك ساحات وتجارب بمنظور أول أو ثالث، ولكل لعبة نظام تحكم مختلف. تستخدم ألعاب الحاسوب غالبًا لوحة المفاتيح للحركة والفأرة للتصويب، بينما تعتمد الألعاب المتوافقة مع الجوال على اللمس؛ تأكد من الشارة الموجودة في صفحة العنوان قبل البدء. تتحسن الدقة عندما تتوقف بين الطلقات وتستخدم الغطاء وتتعلم سلوك السلاح بدل الإطلاق المتواصل. وقد تتضمن بعض الألعاب قتالًا أو موضوعات لا تناسب الأعمار الصغيرة، لذلك يُنصح بمراجعتها قبل اللعب.",
    keywords: ["تصويب", "FPS", "قنّاص", "بنادق", "حروب"],
    related: ["action", "racing"],
    metaHooks: [
      "تدرّب على التصويب والحركة واختيار موقع آمن",
      "تحقق من دعم الفأرة أو لوحة المفاتيح أو اللمس",
      "استخدم الغطاء وتعرّف إلى سلوك السلاح قبل التقدم",
      "راجع موضوعات القتال قبل اختيار لعبة للاعب أصغر سنًا",
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
