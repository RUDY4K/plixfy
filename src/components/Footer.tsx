import Link from "next/link";
import CookieSettingsButton from "@/components/CookieSettingsButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import BrandLogo from "@/components/BrandLogo";
import { localeHref, getDict, defaultLocale, type Locale } from "@/lib/i18n";

interface FooterLink {
  href: string;
  label: string;
}

const CONTACT_EMAIL = "privacy@plixfy.com";

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
