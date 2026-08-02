import Link from "next/link";
import { notFound } from "next/navigation";
import HeroTile from "@/components/HeroTile";
import CategoryStrip from "@/components/CategoryStrip";
import TrackOnMount from "@/components/TrackOnMount";
import {
  getTrendingGames,
  getTopPicks,
  getGamesByCategory,
  allGames,
} from "@/lib/games";
import type { Game } from "@/lib/games";
import { getTopGame } from "@/lib/gameStats";
import { getAllPosts } from "@/lib/blog";
import { getAllPostsEn } from "@/lib/blogEn";
import { getAllNews, formatNewsDate, newsTitle } from "@/lib/news";
import { categoryShortLabel } from "@/lib/categoryI18n";
import { hasLocale, localeHref, getDict } from "@/lib/i18n";

const SITE = "https://www.plixfy.com";

export const revalidate = 86400;

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const t = getDict(locale);
  const href = (path: string) => localeHref(locale, path);
  const homeIntro = t.home.intro.replace(
    /(?:أكثر من|more than)\s+380/i,
    locale === "ar"
      ? `${allGames.length.toLocaleString("ar-SA")}`
      : `${allGames.length.toLocaleString("en-US")}`
  );
  const homeSummary =
    locale === "ar"
      ? `العب ${allGames.length.toLocaleString("ar-SA")} لعبة مجانية فوراً من المتصفح، بدون تحميل أو تسجيل.`
      : `Play ${allGames.length.toLocaleString("en-US")} free games instantly in your browser, with no download or sign-up.`;

  const faq =
    locale === "ar"
      ? [
          {
            question: "كيف ألعب ألعاب مجانية على المتصفح بدون تحميل؟",
            answer:
              "افتح Plixfy من الجوال أو الكمبيوتر، اختر اللعبة التي تريدها ثم اضغط زر اللعب. تعمل الألعاب مباشرة داخل المتصفح مجانًا، ولا تحتاج إلى تنزيل تطبيق أو إنشاء حساب.",
          },
          {
            question: "هل ألعاب Plixfy مجانية؟",
            answer:
              "نعم، تستطيع تشغيل جميع الألعاب المتاحة على Plixfy مجانًا من المتصفح.",
          },
          {
            question: "كيف ألعب أونلاين من الجوال بدون تسجيل؟",
            answer:
              "افتح Plixfy في متصفح الجوال واختر أي لعبة متوافقة ثم اضغط زر اللعب. لا تحتاج إلى تسجيل حساب، وتعمل اللعبة مباشرة عبر الإنترنت دون تثبيت.",
          },
          {
            question: "هل تعمل ألعاب Plixfy على الجوال؟",
            answer:
              "نعم، يدعم Plixfy الهواتف والأجهزة اللوحية وأجهزة الكمبيوتر. قد تختلف أدوات التحكم بحسب اللعبة والجهاز.",
          },
          {
            question: "هل أحتاج إلى تسجيل حساب قبل اللعب؟",
            answer:
              "لا، يمكنك بدء معظم الألعاب فورًا دون تسجيل. تُحفظ بعض التفضيلات محليًا في متصفحك عند توفرها.",
          },
          {
            question: "ما أنواع الألعاب المتوفرة على Plixfy؟",
            answer:
              "تضم المكتبة ألعاب الأكشن والسباقات والألغاز والرياضة والتصويب والألعاب الخفيفة وألعاب البنات وألعاب io، وتُضاف اختيارات جديدة باستمرار.",
          },
        ]
      : [
          {
            question: "How can I play free browser games without downloading?",
            answer:
              "Open Plixfy on your phone or computer, choose a game, and select Play. Games run free inside your browser without an app download or account.",
          },
          {
            question: "Are Plixfy games free?",
            answer: "Yes. Every game available on Plixfy can be played free in your browser.",
          },
          {
            question: "How can I play online on mobile without signing up?",
            answer:
              "Open Plixfy in your mobile browser, choose a compatible game, and select Play. The game runs online without registration or installation.",
          },
          {
            question: "Do Plixfy games work on mobile devices?",
            answer:
              "Yes. Plixfy supports phones, tablets, and desktop computers, although controls can vary by game and device.",
          },
          {
            question: "Do I need an account to play?",
            answer:
              "No. You can start most games immediately without registering. Some preferences may be saved locally in your browser.",
          },
          {
            question: "What kinds of games are available on Plixfy?",
            answer:
              "The library includes action, racing, puzzle, sports, shooting, casual, girls, and io games, with new picks added regularly.",
          },
        ];

  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: t.brand,
    url: locale === "ar" ? SITE : SITE + "/en",
    inLanguage: locale,
    potentialAction: {
      "@type": "SearchAction",
      target: SITE + href("/search") + "?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: t.brand,
    url: SITE,
    logo: SITE + "/icon-512.png",
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  const topGame = getTopGame();

  const used = new Set<string>([topGame.slug]);
  const take = <T extends readonly Game[]>(list: T): T => {
    list.forEach((g) => used.add(g.slug));
    return list;
  };

  const trending = take(getTrendingGames(used));
  const topPicks = take(getTopPicks(used));
  const racing = take(getGamesByCategory("racing", used));
  const action = take(getGamesByCategory("action", used));
  const puzzle = take(getGamesByCategory("puzzle", used));
  const io = take(getGamesByCategory("io", used));
  const girls = take(getGamesByCategory("girls", used));
  const casual = take(getGamesByCategory("casual", used));

  const MIN_STRIP = 10;

  const buildItemListLd = (name: string, games: readonly Game[]) => ({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: Math.min(games.length, 10),
    itemListElement: games.slice(0, 10).map((g, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: SITE + href("/play/" + g.slug),
      name: g.title,
      image: g.thumbnail,
    })),
  });

  const trendingLd =
    trending.length >= MIN_STRIP ? buildItemListLd(t.strips.trending, trending) : null;
  const topPicksLd =
    topPicks.length >= MIN_STRIP ? buildItemListLd(t.strips.topPicks, topPicks) : null;

  const allLd = [
    websiteLd,
    organizationLd,
    faqLd,
    ...(trendingLd ? [trendingLd] : []),
    ...(topPicksLd ? [topPicksLd] : []),
  ];

  const strips: readonly { title: string; viewAllHref: string; games: readonly Game[] }[] = [
    { title: t.strips.trending, viewAllHref: href("/category/trending"), games: trending },
    { title: t.strips.topPicks, viewAllHref: href("/category/top"), games: topPicks },
    { title: t.strips.racing, viewAllHref: href("/category/racing"), games: racing },
    { title: t.strips.action, viewAllHref: href("/category/action"), games: action },
    { title: t.strips.puzzle, viewAllHref: href("/category/puzzle"), games: puzzle },
    { title: t.strips.io, viewAllHref: href("/category/io"), games: io },
    { title: t.strips.girls, viewAllHref: href("/category/girls"), games: girls },
    { title: t.strips.casual, viewAllHref: href("/category/casual"), games: casual },
  ];

  return (
    <main className="max-w-7xl mx-auto py-6 md:py-8 md:px-6">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(allLd).replace(/</g, "\\u003c"),
        }}
      />

      <header className="px-4 md:px-0 mb-6">
        <h1 className="text-2xl md:text-4xl font-bold text-text-primary mb-3">
          {t.home.h1}
        </h1>
        <p className="text-sm md:text-base text-text-secondary max-w-3xl leading-relaxed">
          {homeSummary}
        </p>
      </header>

      <TrackOnMount
        eventName="hero_top_game_viewed"
        dedupKey={`hero:${topGame.slug}`}
        params={{ game_slug: topGame.slug, plays: topGame.plays ?? 0 }}
      />
      <HeroTile
        title={topGame.title}
        slug={topGame.slug}
        thumbnail={topGame.thumbnail}
        category={categoryShortLabel(topGame.categorySlug, locale, topGame.category)}
        description={topGame.description}
        isTopGame
        locale={locale}
      />

      {strips.map((strip) =>
        strip.games.length >= MIN_STRIP ? (
          <CategoryStrip
            key={strip.viewAllHref}
            title={strip.title}
            viewAllHref={strip.viewAllHref}
            games={strip.games}
            locale={locale}
          />
        ) : null
      )}

      <section className="mt-12 px-4 md:px-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-2xl font-bold text-text-primary">
            {t.common.fromBlog}
          </h2>
          <Link href={href("/blog")} className="text-sm text-primary hover:underline">
            {t.common.allPosts}
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(locale === "en" ? getAllPostsEn() : getAllPosts())
            .slice(0, 4)
            .map((post) => (
              <Link
                key={post.slug}
                href={href(`/blog/${post.slug}`)}
                className="block rounded-2xl border border-primary/20 bg-surface/60 p-4 hover:border-primary/50 transition-colors"
              >
                <h3 className="text-sm font-bold text-text-primary mb-2 leading-snug">
                  {post.h1}
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">
                  {post.description}
                </p>
              </Link>
            ))}
        </div>
      </section>

      <section className="mt-10 px-4 md:px-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-2xl font-bold text-text-primary">
            {t.common.latestNews}
          </h2>
          <Link href={href("/news")} className="text-sm text-primary hover:underline">
            {t.common.allNews}
          </Link>
        </div>
        <ul className="space-y-2">
          {getAllNews()
            .slice(0, 3)
            .map((item) => (
              <li key={item.slug}>
                <Link
                  href={href(`/news/${item.slug}`)}
                  className="flex items-baseline gap-3 rounded-xl border border-primary/10 bg-surface/40 px-4 py-3 hover:border-primary/40 transition-colors"
                >
                  <span className="text-xs text-text-secondary shrink-0">
                    {formatNewsDate(item.publishedAt, locale)}
                  </span>
                  <span className="text-sm text-text-primary leading-snug">
                    {newsTitle(item, locale)}
                  </span>
                </Link>
              </li>
            ))}
        </ul>
      </section>

      <section className="mt-10 px-4 md:px-0" aria-labelledby="about-plixfy-heading">
        <h2
          id="about-plixfy-heading"
          className="text-lg md:text-2xl font-bold text-text-primary mb-3"
        >
          {locale === "ar" ? "ألعاب مجانية لكل الأجهزة" : "Free games for every device"}
        </h2>
        <p className="text-sm md:text-base text-text-secondary max-w-4xl leading-relaxed">
          {homeIntro}
        </p>
      </section>

      <section
        className="mt-10 px-4 md:px-0"
        aria-labelledby="home-faq-heading"
        itemScope
        itemType="https://schema.org/FAQPage"
      >
        <h2
          id="home-faq-heading"
          className="text-lg md:text-2xl font-bold text-text-primary mb-4"
        >
          {locale === "ar" ? "أسئلة شائعة عن الألعاب المجانية" : "Free games FAQ"}
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {faq.map((item) => (
            <article
              key={item.question}
              className="rounded-2xl border border-primary/15 bg-surface/50 p-4"
              itemScope
              itemProp="mainEntity"
              itemType="https://schema.org/Question"
            >
              <h3
                className="font-bold text-text-primary leading-snug"
                itemProp="name"
              >
                {item.question}
              </h3>
              <div
                itemScope
                itemProp="acceptedAnswer"
                itemType="https://schema.org/Answer"
              >
                <p
                  className="mt-2 text-sm text-text-secondary leading-relaxed"
                  itemProp="text"
                >
                  {item.answer}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-12 px-4 md:px-0">
        <Link
          href={href("/all-games")}
          className="block rounded-2xl bg-gradient-to-r from-primary/20 to-accent/20 p-6 md:p-8 text-center hover:from-primary/30 hover:to-accent/30 transition-colors border border-primary/30"
        >
          <p className="text-xl md:text-2xl font-bold text-text-primary mb-1">
            {t.common.browseAllCount.replace("{count}", String(allGames.length))}
          </p>
          <p className="text-sm text-text-secondary">
            {t.common.browseAllSub}
          </p>
        </Link>
      </div>
    </main>
  );
}
