# SEO Content Pages Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Arabic SEO landing content (homepage intro, /all-games index, category intros), WebSite+Organization structured data, internal linking, and sitemap/robots updates — all as Next.js 16 server components.

**Architecture:** Two new content modules (`siteContent.ts`, `categoryContent.ts`) hold all Arabic copy. Homepage and category pages consume them. One new route `/all-games` groups all 386 games by category with anchor IDs and lazy-loaded thumbnails. Sitemap adds the new route; robots adds `/dashboard` to disallow. No client components; no new JS bundle.

**Tech Stack:** Next.js 16.2.6 (App Router, Turbopack), TypeScript, Tailwind, existing GameCard + Breadcrumbs components.

**Brand:** بليكسفاي everywhere. Spec's `يافسكيلب` is a typo (zero occurrences in repo).

**Out of scope:** CSS minification, thumbnail proxying, per-category `CollectionPage` JSON-LD (already exists), dashboard env-vars issue.

---

## Task 1: Add Arabic content data files

**Files:**
- Create: `src/lib/siteContent.ts`
- Create: `src/lib/categoryContent.ts`

**Step 1: Create `src/lib/siteContent.ts`**

Holds homepage intro paragraph and brand strings. Single source of truth so we don't sprinkle copy across components.

```typescript
export const BRAND_AR = "بليكسفاي";

export const HOME_H1 = "ألعاب أونلاين مجانية - بليكسفاي";

export const HOME_INTRO = `بليكسفاي منصة ألعاب أونلاين مجانية تعمل من المتصفح مباشرة بدون أي تحميل أو تسجيل. تجد لدينا أكثر من 380 لعبة موزّعة على ثمانية تصنيفات رئيسية: السباق، الأكشن، الألغاز، الرياضة، التصويب، ألعاب البنات، ألعاب آيو، والألعاب الخفيفة المناسبة لجميع الأعمار. كل لعبة محمّلة من خوادم سريعة وتعمل بسلاسة على الجوال والحاسوب، مع واجهة عربية بالكامل تدعم الكتابة من اليمين إلى اليسار. تستطيع أن تبدأ اللعب في ثوانٍ، أن تحفظ ألعابك المفضّلة، وأن تكتشف ألعاباً جديدة كل أسبوع من قائمتنا المختارة بعناية. سواء كنت تبحث عن جلسة سريعة بين الفصول، عن لعبة عائلية تشاركها مع إخوتك، أو عن تحدٍّ جاد يستهلك ساعات، فإن مكتبتنا تضمّ كل ما تحتاجه من ألعاب أونلاين مجانية بدون تحميل.`;
```

**Step 2: Create `src/lib/categoryContent.ts`**

Per-category Arabic intro (~120 words each), keywords, and related categories.

```typescript
import type { CategorySlug } from "@/lib/games";

export interface CategoryContent {
  intro: string;
  keywords: readonly string[];
  related: readonly CategorySlug[];
}

export const categoryContent: Record<CategorySlug, CategoryContent> = {
  racing: {
    intro:
      "ألعاب السباق على بليكسفاي تنقلك إلى أكثر تجارب القيادة إثارة، حيث تتسابق بأقوى السيارات والدراجات النارية والشاحنات على مضامير عالمية مشهورة وطرق صحراوية وعرة وحلبات مدنية بإضاءات نيون. تتنوّع الألعاب بين السباقات الفيزيائية كموتو اكس 3 ام التي تختبر مهارات التوازن والشقلبات الجوية، وسباقات الدريفت التي تعتمد على التحكم الدقيق في الفرامل، وسباقات الأبطال متعددة اللاعبين التي تتنافس فيها مع متسابقين من السعودية والخليج. كل اللعبة تعمل من المتصفح بدون تحميل، وتدعم التحكم باللمس على الجوال والمفاتيح على الحاسوب. اختر سيارتك، اضبط نمط القيادة، واستعدّ لتحطيم الأرقام القياسية في تصنيفات سرعة عالمية.",
    keywords: ["سباق سيارات", "سباق دراجات", "ألعاب سيارات", "دريفت", "سرعة"],
    related: ["sports", "action"],
  },
  action: {
    intro:
      "ألعاب الأكشن على بليكسفاي تجمع أفضل المغامرات القتالية والمعارك المثيرة في صفحة واحدة، من ألعاب القتال بأسلوب الستيكمان إلى معارك البقاء على قيد الحياة في أراضٍ مفتوحة. ستجد ألعاب التسلّل التي تختبر مهارة التخفّي والتخطيط، ألعاب الكاراتيه والملاكمة التي تعتمد على ردود الفعل السريعة، وألعاب البطل الخارق التي تطلق فيها قواك الخاصّة لتحرير المدن من الأعداء. كثير من ألعاب الأكشن هنا تتميّز بقصص متكاملة ونظام ترقيات يجعلك تطوّر بطلك مع كل مرحلة. كل ذلك من المتصفح، بدون تحميل، وبأداء سلس على الجوال والحاسوب. ادخل، اختر بطلك، وابدأ المعركة الآن.",
    keywords: ["ألعاب قتال", "أكشن", "مغامرة", "بقاء", "ستيكمان"],
    related: ["shooting", "racing"],
  },
  puzzle: {
    intro:
      "ألعاب الألغاز على بليكسفاي تتحدّى عقلك وتدرّبك على التفكير الإبداعي وحلّ المشكلات. القسم يضمّ ألعاباً منوّعة: ماجونغ كلاسيكي، تركيب الكلمات، ألغاز الأشياء المخفية، ألعاب الترتيب بالألوان، وألغاز الفيزياء التي تختبر فهمك لقوانين الحركة والتوازن. كل لعبة مصمّمة لتقديم تحدٍّ تدريجي يبدأ بمراحل سهلة لتعلّم القواعد، ثم يتطوّر إلى ألغاز تحتاج تفكيراً عميقاً ومنطقاً سليماً. مناسبة لجميع الأعمار، ومثالية للأطفال الذين يطوّرون مهاراتهم الذهنية وللكبار الذين يبحثون عن استرخاء مفيد بعد يوم طويل. كل الألعاب تعمل بدون تحميل، وكثير منها يحفظ تقدّمك تلقائياً حتى لو أغلقت المتصفح وعدت لاحقاً.",
    keywords: ["ألغاز", "ماجونغ", "كلمات", "أشياء مخفية", "تنمية الذكاء"],
    related: ["casual", "girls"],
  },
  io: {
    intro:
      "ألعاب آيو على بليكسفاي تأخذك إلى عالم المنافسة الفورية ضدّ آلاف اللاعبين من حول العالم في الوقت ذاته. ستجد هنا الكلاسيكيات الشهيرة من نمط نمو الثعبان واحتلال الخريطة وأخذ التراب، إلى جانب نسخ حديثة تضيف قدرات خاصّة، تطويرات، ومستويات قوّة. اللعب بسيط جداً في البداية: تنضمّ إلى الخادم، تختار اسمك، وتبدأ المعركة فوراً بدون تحميل ولا تسجيل دخول. السرّ في إتقان هذه الألعاب يكمن في الإدمان السريع للجلسات القصيرة المتكرّرة، والتحكّم الدقيق، وقراءة تحرّكات الخصوم. عرض الجوال محسّن بزرّ تحكّم لمسي مريح، وأداء عالٍ يجعل اللعب سلساً حتى على شبكات الإنترنت المتوسّطة.",
    keywords: ["ألعاب آيو", "متعدد اللاعبين", "إنترنت", "ثعبان", "تنافس"],
    related: ["action", "casual"],
  },
  girls: {
    intro:
      "ألعاب البنات على بليكسفاي مساحة مرحة لكل من تحبّ الإبداع والموضة والقصص الجميلة. يضمّ القسم ألعاب تلبيس الشخصيات بآخر صيحات الأزياء، ألعاب صالونات التجميل والمكياج، ألعاب الطبخ والحلويات، ألعاب رعاية الحيوانات الأليفة، وألعاب تصميم الديكور وتزيين البيوت. كل لعبة مصمّمة بألوان جميلة وموسيقى لطيفة وواجهة بسيطة، حتى الأطفال الصغار يقدرون يلعبونها بدون مساعدة. تشتغل من المتصفح مباشرة بدون أي تحميل، وآمنة 100% لا تحتوي على مشاهد عنف أو محتوى غير مناسب. مكتبتنا تتجدّد باستمرار بإضافات أسبوعية تشمل أحدث ألعاب البنات وأكثرها رواجاً في السعودية والخليج.",
    keywords: ["ألعاب بنات", "تلبيس", "مكياج", "طبخ", "تصميم"],
    related: ["casual", "puzzle"],
  },
  casual: {
    intro:
      "الألعاب الخفيفة على بليكسفاي مناسبة لكل من يبحث عن متعة سريعة بدون تعقيد. ستجد ألعاب الدمج والترتيب، ألعاب التابات والنقرات، الألعاب الاستراتيجية البسيطة، ألعاب المحاكاة، وألعاب الإدارة التي تبني فيها مطعمك أو فندقك أو مدينتك خطوة بخطوة. مناسبة للجلسات القصيرة في الباص، الاستراحة، أو قبل النوم، لأن أغلبها يحفظ تقدّمك تلقائياً ويسمح لك بالعودة في أي لحظة من حيث توقّفت. تتميّز بسهولة التعلّم وعمق التحدّي، فأنت تبدأ بطفل صغير ومع الوقت تجد نفسك تطوّر استراتيجيات معقّدة. كلها مجانية بنسبة 100%، تعمل من المتصفح بدون تحميل، ومتوافقة مع الجوال والحاسوب.",
    keywords: ["ألعاب خفيفة", "كاجوال", "محاكاة", "إدارة", "دمج"],
    related: ["puzzle", "girls"],
  },
  sports: {
    intro:
      "ألعاب الرياضة على بليكسفاي تنقلك إلى ملاعب كرة القدم، السلّة، التنس، الغولف، والبلياردو، بإحساس تنافسي حقيقي. تختار ناديك المفضّل، تنزل الملعب، وتلعب مباريات سريعة أو بطولات كاملة ضدّ الذكاء الاصطناعي أو لاعبين حقيقيين. تتنوّع الألعاب بين المحاكاة الواقعية التي تنقل قواعد الرياضة الحقيقية بدقّة، والألعاب الكرتونية المرحة المناسبة للأطفال. كثير منها يعتمد على الفيزياء الواقعية بحيث تشعر بثقل الكرة وتأثير القوّة عند التسديد. كل الألعاب تعمل من المتصفح بدون تحميل، وتدعم التحكم باللمس على الجوال. مناسبة لمن يحبّ الرياضة الواقعية، ولمن يفضّل تجارب رياضية أبسط للتسلية والاسترخاء.",
    keywords: ["كرة قدم", "كرة سلة", "تنس", "بلياردو", "ألعاب رياضية"],
    related: ["racing", "action"],
  },
  shooting: {
    intro:
      "ألعاب التصويب على بليكسفاي تجمع أفضل ألعاب الـ FPS متعدّدة اللاعبين، ألعاب القنّاص الاحترافية، ومعارك البقاء على قيد الحياة. ستلعب مع لاعبين من السعودية والخليج والعالم، تختار سلاحك من ترسانة واسعة تشمل البنادق والقنابل والمسدسات، وتدخل خرائط متنوّعة من المدن المهجورة إلى الصحاري المفتوحة. كثير من الألعاب يضمّ نظام ترقية للأسلحة ومستويات للاعب تحفّز على الاستمرار في اللعب. التحكّم بسيط: مفاتيح للحركة والفأرة للتصويب على الحاسوب، وعصا تحكّم لمسية على الجوال. كل الألعاب تعمل من المتصفح بدون أي تحميل، بأداء عالٍ وزمن استجابة منخفض حتى على شبكات الإنترنت المتوسّطة. تنبيه: بعض الألعاب موجّهة للفئة العمرية 13+.",
    keywords: ["تصويب", "FPS", "قنّاص", "بنادق", "حروب"],
    related: ["action", "racing"],
  },
};
```

**Step 3: Commit**

```bash
git add src/lib/siteContent.ts src/lib/categoryContent.ts
git commit -m "feat: Arabic SEO content for homepage and 8 categories"
```

---

## Task 2: Create /all-games route

**Files:**
- Create: `src/app/all-games/page.tsx`

**Step 1: Verify route does not exist yet**

Run: `ls src/app/all-games`
Expected: "No such file or directory" (sanity check).

**Step 2: Write the page**

Server component. Imports games + categories from `@/lib/games`. Groups games by category, renders one `<section id={slug}>` per category, each with H2, anchor jump nav at top, and per-section CTA back to `/category/{slug}`. First section's first 12 thumbnails eager-loaded; rest lazy.

```tsx
import Link from "next/link";
import type { Metadata } from "next";
import { categories, allGames } from "@/lib/games";
import GameCard from "@/components/GameCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import { BRAND_AR } from "@/lib/siteContent";

const SITE = "https://www.plixfy.com";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: `جميع الألعاب - ${BRAND_AR} | ${allGames.length}+ لعبة مجانية`,
  description: `تصفّح كل ${allGames.length} لعبة على ${BRAND_AR} مرتّبة حسب التصنيف: سباق، أكشن، ألغاز، رياضة، تصويب، بنات، آيو، وخفيف. كلها مجانية وتعمل من المتصفح بدون تحميل.`,
  alternates: { canonical: "/all-games" },
  openGraph: {
    type: "website",
    title: `جميع الألعاب - ${BRAND_AR}`,
    description: `كل الألعاب على ${BRAND_AR} في صفحة واحدة، مرتّبة حسب التصنيف.`,
    url: SITE + "/all-games",
    siteName: "Plixfy",
    locale: "ar_SA",
  },
};

export default function AllGamesPage() {
  const sections = categories.map((c) => ({
    cat: c,
    games: allGames.filter((g) => g.categorySlug === c.slug),
  }));

  const totalCount = allGames.length;

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <Breadcrumbs
        items={[
          { label: "الرئيسية", href: "/" },
          { label: "جميع الألعاب" },
        ]}
      />

      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold text-text-primary">
          جميع الألعاب
        </h1>
        <p className="text-sm md:text-base text-text-secondary mt-2 max-w-3xl">
          {totalCount} لعبة مجانية أونلاين على {BRAND_AR}، مرتّبة حسب التصنيف.
          كل الألعاب تعمل من المتصفح مباشرة بدون تحميل، ومتوافقة مع الجوال
          والحاسوب. اختر تصنيفك المفضّل من القائمة أدناه أو تصفّح القائمة كاملة.
        </p>
      </header>

      <nav
        aria-label="تنقّل سريع للتصنيفات"
        className="mb-8 flex flex-wrap gap-2"
      >
        {sections.map(({ cat, games }) => (
          <a
            key={cat.slug}
            href={`#${cat.slug}`}
            className="px-3 py-2 rounded-full bg-surface-secondary text-sm text-text-primary hover:bg-primary/15 hover:text-primary transition-colors"
          >
            {cat.labelAr}
            <span className="text-text-secondary mr-1">({games.length})</span>
          </a>
        ))}
      </nav>

      {sections.map(({ cat, games }, sectionIdx) => (
        <section
          key={cat.slug}
          id={cat.slug}
          className="mb-12 scroll-mt-24"
          aria-labelledby={`h2-${cat.slug}`}
        >
          <div className="flex items-baseline justify-between mb-4">
            <h2
              id={`h2-${cat.slug}`}
              className="text-xl md:text-2xl font-bold text-text-primary"
            >
              {cat.labelAr}
              <span className="text-text-secondary text-sm font-normal mr-2">
                ({games.length} لعبة)
              </span>
            </h2>
            <Link
              href={`/category/${cat.slug}`}
              className="text-sm text-primary hover:underline"
            >
              عرض الفئة ←
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6">
            {games.map((g, idx) => (
              <GameCard
                key={g.slug}
                {...g}
                position={idx + 1}
                placement={`all-games-${cat.slug}`}
                eagerLoad={sectionIdx === 0 && idx < 12}
              />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
```

**Step 3: Verify GameCard supports `eagerLoad` prop**

Run: `grep -n "eagerLoad\|loading=" src/components/GameCard.tsx`
If `eagerLoad` is not a recognized prop, drop it from the JSX. (Below-fold lazy-loading falls back to next/image defaults, which already lazy-load by default in Next 16.)

**Step 4: Build to verify route compiles**

Run: `npm run build 2>&1 | tail -40`
Expected: build succeeds, `/all-games` listed in route output.

**Step 5: Smoke-test the route**

Dev server is already running on :3000. Hit it:
Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/all-games`
Expected: `200`

**Step 6: Verify anchor IDs in HTML**

Run: `curl -s http://localhost:3000/all-games | grep -oE 'id="(racing|action|puzzle|io|girls|casual|sports|shooting)"' | sort -u`
Expected: 8 unique IDs printed.

**Step 7: Commit**

```bash
git add src/app/all-games/page.tsx
git commit -m "feat: /all-games page grouped by 8 categories"
```

---

## Task 3: Update homepage

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Add H1, intro paragraph, and JSON-LD**

After `<HeroTile>` (around line 53), insert a header block with H1 and intro. Replace the implicit-only-hero structure by adding explicit landing content above the strips. Also add a JSON-LD `<script>` near the top of the `<main>`.

Replace lines 35–53 (the `return ( <main>` opening + first MonetagAds + HeroTile) with this structure:

```tsx
const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "بليكسفاي",
  url: "https://www.plixfy.com",
  inLanguage: "ar",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://www.plixfy.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "بليكسفاي",
  url: "https://www.plixfy.com",
  logo: "https://www.plixfy.com/opengraph-image.png",
};

return (
  <main className="max-w-7xl mx-auto py-6 md:py-8 md:px-6">
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify([websiteLd, organizationLd]) }}
    />

    <header className="px-4 md:px-0 mb-6">
      <h1 className="text-2xl md:text-4xl font-bold text-text-primary mb-3">
        {HOME_H1}
      </h1>
      <p className="text-sm md:text-base text-text-secondary max-w-3xl leading-relaxed">
        {HOME_INTRO}
      </p>
    </header>

    <div className="px-4 md:px-0 mb-6">
      <MonetagAds type="banner" />
    </div>

    <TrackOnMount … />
    <HeroTile … />
```

**Step 2: Add import for site content**

At the top of `src/app/page.tsx`, add:

```tsx
import { HOME_H1, HOME_INTRO } from "@/lib/siteContent";
```

**Step 3: Add CTA box linking to /all-games**

Insert before the closing `</main>` (after the last `CategoryStrip`):

```tsx
<div className="mt-12 px-4 md:px-0">
  <Link
    href="/all-games"
    className="block rounded-2xl bg-gradient-to-r from-primary/20 to-accent/20 p-6 md:p-8 text-center hover:from-primary/30 hover:to-accent/30 transition-colors border border-primary/30"
  >
    <p className="text-xl md:text-2xl font-bold text-text-primary mb-1">
      تصفّح كل {allGames.length} لعبة
    </p>
    <p className="text-sm text-text-secondary">
      مرتّبة حسب التصنيف، بدون تحميل
    </p>
  </Link>
</div>
```

Add to imports:

```tsx
import Link from "next/link";
import { allGames } from "@/lib/games";
```

**Step 4: Build to verify**

Run: `npm run build 2>&1 | tail -30`
Expected: success.

**Step 5: Smoke-test homepage**

Run: `curl -s http://localhost:3000 | grep -oE '"@type":"(WebSite|Organization|SearchAction)"' | sort -u`
Expected:
```
"@type":"Organization"
"@type":"SearchAction"
"@type":"WebSite"
```

Run: `curl -s http://localhost:3000 | grep -oE 'ألعاب أونلاين مجانية' | head -1`
Expected: prints the H1 text.

**Step 6: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: homepage H1 + intro + WebSite/Organization JSON-LD + all-games CTA"
```

---

## Task 4: Update category page with intro + related categories

**Files:**
- Modify: `src/app/category/[slug]/page.tsx`

**Step 1: Add intro paragraph**

In the `<header>` block (around lines 157–170), after `<p>{meta.description}</p>`, insert:

```tsx
<div className="mt-4 text-sm md:text-base text-text-secondary leading-relaxed max-w-3xl">
  {categoryIntro}
</div>
```

Compute `categoryIntro` near the top of the component body (after `const games = ...`):

```tsx
const content = categoryContent[slug as CategorySlug] ?? null;
const categoryIntro = content?.intro ?? meta.description;
```

Add the import at the top:

```tsx
import { categoryContent } from "@/lib/categoryContent";
import type { CategorySlug } from "@/lib/games";
```

**Step 2: Add "related categories" section before `</main>`**

Insert after the grid (after line 186):

```tsx
{content && content.related.length > 0 && (
  <section className="mt-12 pt-8 border-t border-border" aria-labelledby="related-cats">
    <h2
      id="related-cats"
      className="text-lg md:text-xl font-bold text-text-primary mb-4"
    >
      تصنيفات ذات صلة
    </h2>
    <div className="flex flex-wrap gap-3">
      {content.related.map((relSlug) => {
        const rel = getCategoryMeta(relSlug);
        if (!rel) return null;
        return (
          <Link
            key={relSlug}
            href={`/category/${relSlug}`}
            className="px-4 py-2 rounded-full bg-surface-secondary text-text-primary hover:bg-primary/15 hover:text-primary transition-colors"
          >
            {rel.name}
          </Link>
        );
      })}
    </div>
  </section>
)}
```

**Step 3: Build**

Run: `npm run build 2>&1 | tail -20`
Expected: success.

**Step 4: Smoke-test a category page**

Run: `curl -s http://localhost:3000/category/racing | grep -c "تصنيفات ذات صلة"`
Expected: `1`

Run: `curl -s http://localhost:3000/category/racing | grep -oE 'ألعاب السباق على بليكسفاي' | head -1`
Expected: prints the intro opening.

**Step 5: Commit**

```bash
git add src/app/category/[slug]/page.tsx
git commit -m "feat: category page intro + related categories section"
```

---

## Task 5: Sitemap + robots

**Files:**
- Modify: `src/app/sitemap.ts`
- Modify: `src/app/robots.ts`

**Step 1: Add /all-games to sitemap**

In `src/app/sitemap.ts`, in the `staticRoutes` array, add after `/categories`:

```ts
{ url: SITE + "/all-games", lastModified: now, changeFrequency: "weekly", priority: 0.9 },
```

**Step 2: Block /dashboard in robots**

Replace `src/app/robots.ts` body:

```ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard"],
    },
    sitemap: "https://www.plixfy.com/sitemap.xml",
    host: "https://www.plixfy.com",
  };
}
```

**Step 3: Verify locally**

Run: `curl -s http://localhost:3000/sitemap.xml | grep -c "/all-games"`
Expected: `1`

Run: `curl -s http://localhost:3000/robots.txt`
Expected: includes `Disallow: /dashboard`.

**Step 4: Commit**

```bash
git add src/app/sitemap.ts src/app/robots.ts
git commit -m "feat: sitemap /all-games + robots block /dashboard"
```

---

## Task 6: Final verification + push

**Step 1: Full build**

Run: `npm run build 2>&1 | tail -50`
Expected: zero errors. Look for `/all-games` and `/category/[slug]` in route list.

**Step 2: Route smoke tests**

```bash
for path in / /all-games /category/racing /category/action /category/puzzle /category/io /category/girls /category/casual /category/sports /category/shooting /sitemap.xml /robots.txt; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$path")
  echo "$code $path"
done
```
Expected: all `200`.

**Step 3: JSON-LD spot check**

```bash
curl -s http://localhost:3000 | grep -oE '<script type="application/ld\+json">[^<]+</script>' | head -3
```
Expected: at least one JSON-LD script with WebSite + Organization.

**Step 4: Visual check in browser**

Open `http://localhost:3000/all-games` in Playwright/browser; verify:
- 8 chip-links visible at top
- H1 reads "جميع الألعاب"
- Sections render with game thumbnails

Open `http://localhost:3000` and verify:
- H1 = "ألعاب أونلاين مجانية - بليكسفاي"
- Intro paragraph visible
- "تصفّح كل 386 لعبة" CTA at the bottom

Open `http://localhost:3000/category/racing` and verify:
- Long intro paragraph below the category description
- "تصنيفات ذات صلة" section with 2 chips at the bottom

**Step 5: Push**

```bash
git push origin main
```

**Step 6: Confirm Vercel deploy**

Open https://vercel.com/plixfy-s-projects/plixfy/deployments and wait for green checkmark. Then:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://www.plixfy.com/all-games
```
Expected: `200`.
