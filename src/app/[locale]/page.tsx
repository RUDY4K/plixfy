import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, ChevronDown, ChevronLeft, Clock3, Gamepad2, Grid2X2, MonitorSmartphone, Play, Search, Sparkles, Trophy, Zap } from "lucide-react";
import GameCard from "@/components/GameCard";
import GameArtwork from "@/components/GameArtwork";
import TrackOnMount from "@/components/TrackOnMount";
import { allGames, categories, getGamesByCategory, getTopPicks, getTrendingGames } from "@/lib/games";
import { getDailyGame } from "@/lib/gameStats";
import { getAllPosts } from "@/lib/blog";
import { getAllPostsEn } from "@/lib/blogEn";
import { formatNewsDate, getAllNews, newsTitle } from "@/lib/news";
import { getDict, hasLocale, localeHref } from "@/lib/i18n";
import { SOCIAL_PROFILE_URLS } from "@/lib/socialProfiles";

const SITE = "https://www.plixfy.com";

export const revalidate = 3600;

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();

  const t = getDict(locale);
  const href = (path: string) => localeHref(locale, path);
  const dailyGame = getDailyGame();
  const trending = getTrendingGames(new Set([dailyGame.slug]));
  const topPicks = getTopPicks(new Set([dailyGame.slug, ...trending.map((game) => game.slug)]));
  const freshGames = allGames.slice(36, 48);
  const guides = (locale === "en" ? getAllPostsEn() : getAllPosts()).slice(0, 4);
  const news = getAllNews().slice(0, 5);
  const leadNews = news[0];
  const moreNews = news.slice(1);
  const localizedCount = allGames.length.toLocaleString(locale === "ar" ? "ar-SA" : "en-US");
  const deviceLabel = {
    "mobile-and-desktop": locale === "ar" ? "الجوال والكمبيوتر" : "Mobile and desktop",
    "mobile-only": locale === "ar" ? "الجوال فقط" : "Mobile only",
    "desktop-only": locale === "ar" ? "الكمبيوتر فقط" : "Desktop only",
    unknown: locale === "ar" ? "تحقق من صفحة اللعبة" : "Check the game page",
  }[dailyGame.supportedDevices];
  const faq = locale === "ar"
    ? [
        ["كيف أبدأ اللعب؟", "اختر أي لعبة من المكتبة واضغط زر اللعب، وستعمل مباشرة داخل المتصفح."],
        ["هل الألعاب مجانية؟", "نعم، جميع ألعاب Plixfy المتاحة مجانية ولا تتطلب تنزيلًا."],
        ["هل تعمل على الجوال والكمبيوتر؟", "توضح بطاقة كل لعبة الأجهزة المدعومة، وتشمل المكتبة ألعابًا للجوال والكمبيوتر."],
        ["هل تتغير ترشيحات الصفحة؟", "نعم، يتغير اختيار اليوم وتُحدّث قوائم الألعاب الرائجة والمختارة باستمرار."],
      ]
    : [
        ["How do I start playing?", "Choose any game and press play. It runs directly inside your browser."],
        ["Are the games free?", "Yes. Available Plixfy games are free and require no download."],
        ["Do they work on mobile and desktop?", "Each game card shows supported devices across mobile and desktop."],
        ["Do recommendations change?", "Yes. The daily pick rotates and discovery lists are refreshed regularly."],
      ];

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: t.brand,
      url: locale === "ar" ? SITE : `${SITE}/en`,
      inLanguage: locale,
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE}${href("/search")}?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: t.brand,
      url: SITE,
      logo: `${SITE}/brand/plixfy-icon-v2-512.png`,
      sameAs: SOCIAL_PROFILE_URLS,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map(([question, answer]) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-5 md:px-6 md:pt-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <TrackOnMount eventName="hero_top_game_viewed" dedupKey={`hero:${dailyGame.slug}`} params={{ game_slug: dailyGame.slug, plays: dailyGame.plays ?? 0 }} />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.72fr)_minmax(19rem,.78fr)]">
        <div className="group relative min-h-[500px] overflow-hidden rounded-[2rem] border border-white/10 bg-surface shadow-[0_30px_90px_rgba(0,0,0,.26)] md:min-h-[540px]">
          <GameArtwork src={dailyGame.thumbnailWide || dailyGame.thumbnail} fallbackSrc={dailyGame.thumbnail} alt={dailyGame.title} fill priority sizes="(max-width: 1280px) 100vw, 900px" className="object-cover transition duration-700 group-hover:scale-[1.015]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,7,18,.04),rgba(7,7,18,.96)_86%)] md:bg-[linear-gradient(90deg,rgba(7,7,18,.98),rgba(7,7,18,.74)_42%,rgba(7,7,18,.12)_78%)] rtl:md:bg-[linear-gradient(270deg,rgba(7,7,18,.98),rgba(7,7,18,.74)_42%,rgba(7,7,18,.12)_78%)]" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5 md:p-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-bg/65 px-3 py-1.5 text-xs font-extrabold text-primary backdrop-blur-xl">
              <Trophy className="h-3.5 w-3.5" />{locale === "ar" ? "اختيار بليكسفاي اليوم" : "Plixfy pick of the day"}
            </span>
            <span className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-bg/55 px-3 py-1.5 text-xs font-bold text-white/80 backdrop-blur-xl sm:inline-flex">
              <BadgeCheck className="h-3.5 w-3.5 text-success" />{locale === "ar" ? "من كتالوج Playgama" : "From Playgama"}
            </span>
          </div>
          <div className="relative flex min-h-[500px] max-w-2xl flex-col justify-end p-6 md:min-h-[540px] md:justify-center md:p-10 lg:p-12">
            <p className="mb-3 text-sm font-extrabold text-accent-2">{locale === "ar" ? "جاهزة الآن — بدون تنزيل أو إنشاء حساب" : "Ready now — no download or sign-up"}</p>
            <h1 dir="ltr" className="text-start font-latin text-4xl font-black leading-[1.02] tracking-[-.045em] text-white drop-shadow-[0_4px_18px_rgba(0,0,0,.55)] sm:text-5xl md:text-6xl">{dailyGame.title}</h1>
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-white/72 md:text-base">
              {locale === "ar" ? `ابدأ بهذه اللعبة أو استكشف ${localizedCount} لعبة مجانية مرتبة لتصل إلى ما يناسب وقتك وجهازك بسرعة.` : `Start here or explore ${localizedCount} free games organised around your time, mood and device.`}
            </p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-white/72">
              <span className="inline-flex items-center gap-2"><Zap className="h-4 w-4 text-primary" />{locale === "ar" ? "تشغيل فوري" : "Instant play"}</span>
              <span className="inline-flex items-center gap-2"><MonitorSmartphone className="h-4 w-4 text-accent-2" />{deviceLabel}</span>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={href(`/play/${dailyGame.slug}`)} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-5 font-black text-white shadow-[0_14px_36px_rgba(255,45,139,.28)] transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0">
                <Play className="h-4 w-4 fill-current" />{locale === "ar" ? "العب الآن" : "Play now"}
              </Link>
              <Link href={href("/all-games")} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/15 bg-bg/45 px-5 font-bold text-white backdrop-blur-xl transition hover:border-white/25 hover:bg-white/10">
                <Grid2X2 className="h-4 w-4" />{locale === "ar" ? "شاهد كل الألعاب" : "Browse all games"}
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <form action={href("/search")} role="search" className="rounded-[2rem] border border-white/[0.08] bg-surface/80 p-5 md:p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div><span className="text-xs font-extrabold text-accent-2">{locale === "ar" ? "وصول مباشر" : "Jump straight in"}</span><label htmlFor="home-library-search" className="mt-1 block text-xl font-black text-white">{locale === "ar" ? "ماذا تريد أن تلعب؟" : "What do you want to play?"}</label></div>
              <Search className="mt-1 h-5 w-5 shrink-0 text-text-faint" />
            </div>
            <div className="relative"><input id="home-library-search" name="q" type="search" placeholder={t.header.searchPlaceholder} className="min-h-14 w-full rounded-xl border border-white/[0.1] bg-bg/75 px-4 ps-11 text-base text-white placeholder:text-text-faint focus:border-accent-2/50 focus:shadow-[0_0_0_4px_rgba(0,229,255,.07)]" /><Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" /></div>
            <div className="mt-4 flex flex-wrap gap-2">
              {categories.slice(0, 4).map((category) => <Link key={category.slug} href={href(`/category/${category.slug}`)} className="rounded-lg border border-white/[0.07] px-2.5 py-1.5 text-xs font-bold text-text-secondary transition hover:border-accent-2/30 hover:text-white">{locale === "ar" ? category.labelAr : category.labelEn}</Link>)}
            </div>
          </form>

          <div className="overflow-hidden rounded-[2rem] border border-white/[0.08] bg-surface/80">
            <div className="grid grid-cols-2 divide-x divide-white/[0.07] rtl:divide-x-reverse">
              <div className="p-5 md:p-6"><Gamepad2 className="h-5 w-5 text-primary" /><strong className="mt-5 block font-latin text-3xl text-white">{localizedCount}</strong><span className="mt-1 block text-xs text-text-secondary">{locale === "ar" ? "لعبة جاهزة الآن" : "games ready now"}</span></div>
              <div className="p-5 md:p-6"><MonitorSmartphone className="h-5 w-5 text-accent-2" /><strong className="mt-5 block text-lg text-white">{locale === "ar" ? "كل الأجهزة" : "Every device"}</strong><span className="mt-1 block text-xs text-text-secondary">{locale === "ar" ? "جوال وكمبيوتر" : "mobile and desktop"}</span></div>
            </div>
            <Link href={href("/category/top")} className="flex items-center justify-between gap-4 border-t border-white/[0.07] bg-[linear-gradient(115deg,rgba(118,87,255,.16),rgba(0,229,255,.045))] p-5 transition hover:bg-white/[0.05] md:p-6">
              <span><strong className="block text-base text-white">{locale === "ar" ? "اختيارات تتجدد يوميًا" : "Fresh picks every day"}</strong><span className="mt-1 block text-xs leading-5 text-text-secondary">{locale === "ar" ? "ترشيحات منتقاة من كتالوج Playgama." : "Curated from the Playgama catalog."}</span></span>
              <Sparkles className="h-5 w-5 shrink-0 text-accent-2" />
            </Link>
          </div>
        </div>
      </section>

      <nav className="scrollbar-hide mt-5 flex gap-2 overflow-x-auto border-y border-white/[0.07] py-3" aria-label={locale === "ar" ? "فئات الألعاب" : "Game categories"}>
        {categories.map((category) => (
          <Link key={category.slug} href={href(`/category/${category.slug}`)} className="group inline-flex min-h-12 shrink-0 items-center gap-3 rounded-xl px-3 text-sm font-black text-text-secondary transition hover:bg-white/[0.045] hover:text-white">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.035] text-[11px] font-black text-accent-2 transition group-hover:border-accent-2/30">{getGamesByCategory(category.slug).length}</span>
            {locale === "ar" ? category.labelAr : category.labelEn}
          </Link>
        ))}
      </nav>

      <section className="mt-12">
        <div className="mb-5 flex items-end justify-between">
          <div><h2 className="text-2xl font-black text-white md:text-3xl">{locale === "ar" ? "الأكثر لعبًا الآن" : "Most played now"}</h2><p className="mt-1 text-sm text-text-secondary">{locale === "ar" ? "شبكة سريعة تعرض اختيارات أكثر من أول نظرة" : "A faster grid with more choices at first glance"}</p></div>
          <Link href={href("/category/trending")} className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-bold text-accent-2">{t.common.viewAll}<ChevronLeft className="h-4 w-4 ltr:rotate-180" /></Link>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {trending.slice(0, 12).map((game, index) => <GameCard key={game.slug} {...game} position={index + 1} placement="home-library" locale={locale} />)}
        </div>
      </section>

      <section className="mt-16 grid gap-8 lg:grid-cols-[1.05fr_1.45fr]">
        <aside>
          <div className="mb-5 flex items-end justify-between gap-4"><div><span className="text-xs font-extrabold text-primary">{locale === "ar" ? "نبض الألعاب" : "Gaming pulse"}</span><h2 className="mt-1 text-2xl font-black text-white">{t.common.latestNews}</h2></div><Link href={href("/news")} className="text-sm font-bold text-accent-2">{t.common.allNews}</Link></div>
          {leadNews ? (
            <Link href={href(`/news/${leadNews.slug}`)} className="group block overflow-hidden rounded-[1.6rem] border border-white/[0.08] bg-surface/70">
              {leadNews.image ? <div className="relative aspect-[16/9] overflow-hidden"><img src={leadNews.image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]" /><span className="absolute inset-0 bg-gradient-to-t from-bg/75 to-transparent" /></div> : null}
              <div className="p-5"><span className="text-xs font-bold text-primary">{formatNewsDate(leadNews.publishedAt, locale)}</span><h3 className="mt-2 text-lg font-black leading-8 text-white group-hover:text-accent-2">{newsTitle(leadNews, locale)}</h3></div>
            </Link>
          ) : null}
          <div className="mt-3 divide-y divide-white/[0.07]">
            {moreNews.map((item) => (
              <Link key={item.slug} href={href(`/news/${item.slug}`)} className="group flex items-center gap-3 py-3.5">
                {item.image ? <div className="h-14 w-16 shrink-0 overflow-hidden rounded-lg"><img src={item.image} alt="" loading="lazy" className="h-full w-full object-cover" /></div> : null}
                <span className="min-w-0"><span className="block text-[10px] font-bold text-primary">{formatNewsDate(item.publishedAt, locale)}</span><span className="mt-1 line-clamp-2 block text-xs font-bold leading-5 text-white/80 group-hover:text-white">{newsTitle(item, locale)}</span></span>
              </Link>
            ))}
          </div>
        </aside>
        <div className="border-t border-white/[0.07] pt-6 lg:border-s lg:border-t-0 lg:ps-8 lg:pt-0">
          <div className="mb-5 flex items-center justify-between"><div><h2 className="text-2xl font-black text-white">{locale === "ar" ? "جديد المكتبة" : "New in the library"}</h2><p className="mt-1 text-xs text-text-secondary">{locale === "ar" ? "اكتشف إضافات جديدة بسرعة" : "Discover recent additions quickly"}</p></div><Clock3 className="h-5 w-5 text-accent-2" /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {freshGames.slice(0, 6).map((game) => (
              <Link key={game.slug} href={href(`/play/${game.slug}`)} className="group flex items-center gap-3 border-b border-white/[0.07] py-3 transition hover:bg-white/[0.025]">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl"><GameArtwork src={game.thumbnail} fallbackSrc={game.thumbnailWide} alt={game.title} fill sizes="80px" className="object-cover transition duration-300 group-hover:scale-105" /></div>
                <span className="min-w-0"><span dir="ltr" className="block truncate text-start font-latin text-sm font-black text-white">{game.title}</span><span className="mt-1 block text-xs text-text-secondary">{locale === "ar" ? game.category : game.genres[0] ?? game.category}</span><span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-primary"><Play className="h-3 w-3 fill-current" />{locale === "ar" ? "العب" : "Play"}</span></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-16">
        <div className="mb-5 flex items-center justify-between"><h2 className="text-2xl font-black text-white">{t.strips.topPicks}</h2><Link href={href("/category/top")} className="text-sm font-bold text-accent-2">{t.common.viewAll}</Link></div>
        <div className="scrollbar-hide flex snap-x gap-4 overflow-x-auto pb-3">
          {topPicks.slice(0, 8).map((game) => (
            <Link key={game.slug} href={href(`/play/${game.slug}`)} className="group relative min-h-52 w-[280px] shrink-0 snap-start overflow-hidden rounded-[1.6rem] border border-white/[0.08] bg-surface sm:w-[330px]">
              <GameArtwork src={game.thumbnailWide || game.thumbnail} fallbackSrc={game.thumbnail} alt={game.title} fill sizes="330px" className="object-cover transition duration-500 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" /><div className="absolute inset-x-0 bottom-0 p-5"><p dir="ltr" className="text-start font-latin text-lg font-black text-white">{game.title}</p><span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary"><Play className="h-3 w-3 fill-current" />{locale === "ar" ? "تشغيل فوري" : "Instant play"}</span></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-16 grid gap-10 border-y border-white/[0.07] py-10 lg:grid-cols-2">
        <div>
          <div className="mb-5 flex items-center justify-between"><h2 className="text-2xl font-black text-white">{t.common.fromBlog}</h2><Link href={href("/blog")} className="text-sm font-bold text-accent-2">{t.common.allPosts}</Link></div>
          <div className="divide-y divide-white/[0.07]">
            {guides.map((post, index) => <Link key={post.slug} href={href(`/blog/${post.slug}`)} className="group grid grid-cols-[2.25rem_1fr] gap-3 py-4"><span className="font-latin text-xs font-black text-primary">0{index + 1}</span><span><h3 className="line-clamp-2 font-bold leading-6 text-white group-hover:text-accent-2">{post.h1}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-text-secondary">{post.description}</p></span></Link>)}
          </div>
        </div>
        <div>
          <h2 className="mb-5 text-2xl font-black text-white">{locale === "ar" ? "أسئلة سريعة" : "Quick answers"}</h2>
          <div className="divide-y divide-white/[0.07]">{faq.map(([question, answer]) => <details key={question} className="group py-4 first:pt-0"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-white"><span>{question}</span><ChevronDown className="h-4 w-4 shrink-0 text-text-faint transition group-open:rotate-180" /></summary><p className="mt-3 max-w-xl text-sm leading-7 text-text-secondary">{answer}</p></details>)}</div>
        </div>
      </section>

      <section className="mt-14 overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(110deg,rgba(255,45,139,.16),rgba(118,87,255,.14),rgba(0,229,255,.08))] p-7 text-center md:p-10">
        <h2 className="text-2xl font-black text-white md:text-3xl">{t.common.browseAllCount.replace("{count}", String(allGames.length))}</h2>
        <p className="mt-2 text-sm text-text-secondary">{t.common.browseAllSub}</p>
        <Link href={href("/all-games")} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 font-black text-bg">{locale === "ar" ? "افتح المكتبة" : "Open library"}<ArrowLeft className="h-4 w-4 ltr:rotate-180" /></Link>
      </section>
    </main>
  );
}
