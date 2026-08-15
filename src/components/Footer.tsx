import Link from "next/link";
import CookieSettingsButton from "@/components/CookieSettingsButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import BrandLogo from "@/components/BrandLogo";
import { localeHref, getDict, defaultLocale, type Locale } from "@/lib/i18n";

interface FooterLink {
  href: string;
  label: string;
}

const CONTACT_EMAIL = "plixfy.com@gmail.com";
const SOCIAL_LINKS = [
  { href: "https://x.com/plixfycom", label: "X", icon: "x" },
  {
    href: "https://www.instagram.com/plixfycom/",
    label: "Instagram",
    icon: "instagram",
  },
  {
    href: "https://www.tiktok.com/@plixfygames",
    label: "TikTok",
    icon: "tiktok",
  },
  {
    href: "https://www.facebook.com/profile.php?id=61592922983710",
    label: "Facebook",
    icon: "facebook",
  },
] as const;

export default function Footer({ locale = defaultLocale }: { locale?: Locale }) {
  const t = getDict(locale);

  const navLinks: readonly FooterLink[] = [
    { href: localeHref(locale, "/"), label: t.nav.home },
    { href: localeHref(locale, "/categories"), label: t.nav.categories },
    { href: localeHref(locale, "/favorites"), label: t.nav.favorites },
    { href: localeHref(locale, "/blog"), label: t.footer.blog },
    { href: localeHref(locale, "/news"), label: t.footer.news },
  ];

  const legalLinks: readonly FooterLink[] = [
    { href: localeHref(locale, "/privacy"), label: t.footer.privacy },
    { href: localeHref(locale, "/terms"), label: t.footer.terms },
    { href: localeHref(locale, "/about"), label: t.footer.about },
    { href: localeHref(locale, "/contact"), label: t.footer.contact },
    {
      href: localeHref(locale, "/editorial-policy"),
      label: t.footer.editorialPolicy,
    },
  ];

  return (
    <footer
      className="mt-20 border-t border-white/[0.07] bg-[#090914]/80 pb-28 md:pb-0"
      aria-label={t.footer.footerAria}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          <div>
            <BrandLogo locale={locale} />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-text-secondary">
              {t.footer.tagline}
            </p>
            <div className="mt-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-text-faint">
                {locale === "ar" ? "تابع بليكسفاي" : "Follow Plixfy"}
              </p>
              <div className="flex flex-wrap gap-2" dir="ltr">
                {SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.href}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer me"
                    aria-label={`${social.label} — Plixfy`}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-bold text-text-secondary transition hover:border-primary/40 hover:text-primary"
                  >
                    <SocialIcon name={social.icon} />
                    {social.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <FooterColumn title={t.footer.linksTitle} links={navLinks} />
          <div>
            <h2 className="text-sm font-bold text-text-primary mb-3 tracking-wide">
              {t.footer.legalTitle}
            </h2>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-secondary hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <CookieSettingsButton />
              </li>
              <li>
                <a
                  href={"mailto:" + CONTACT_EMAIL}
                  className="text-sm text-text-secondary hover:text-primary transition-colors"
                  dir="ltr"
                >
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li>
                <LanguageSwitcher />
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-surface-elevated text-center text-xs text-text-faint">
          {t.footer.rights}
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ name }: { name: (typeof SOCIAL_LINKS)[number]["icon"] }) {
  const symbol =
    name === "x" ? "𝕏" : name === "instagram" ? "◎" : name === "facebook" ? "f" : "♪";
  return (
    <span
      className="grid h-5 w-5 place-items-center rounded-md bg-white/10 text-xs font-black"
      aria-hidden="true"
    >
      {symbol}
    </span>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly FooterLink[];
}) {
  return (
    <div>
      <h2 className="text-sm font-bold text-text-primary mb-3 tracking-wide">
        {title}
      </h2>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-text-secondary hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
