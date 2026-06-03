import Link from "next/link";

interface FooterLink {
  href: string;
  label: string;
}

const navLinks: readonly FooterLink[] = [
  { href: "/", label: "الرئيسية" },
  { href: "/categories", label: "التصنيفات" },
  { href: "/favorites", label: "المفضلة" },
];

const legalLinks: readonly FooterLink[] = [
  { href: "/privacy", label: "سياسة الخصوصية" },
  { href: "/terms", label: "شروط الاستخدام" },
  { href: "/about", label: "من نحن" },
];

export default function Footer() {
  return (
    <footer
      className="mt-16 border-t border-surface-elevated bg-surface/40 pb-28 md:pb-0"
      aria-label="تذييل الصفحة"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          <div>
            <div className="text-2xl font-extrabold gradient-text mb-2 font-latin">
              بليكسفاي
            </div>
            <p className="text-sm text-text-secondary leading-relaxed max-w-xs">
              منصة الألعاب المجانية اونلاين
            </p>
          </div>

          <FooterColumn title="روابط" links={navLinks} />
          <FooterColumn title="قانوني" links={legalLinks} />
        </div>

        <div className="mt-10 pt-6 border-t border-surface-elevated text-center text-xs text-text-faint">
          © 2026 بليكسفاي — جميع الحقوق محفوظة
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
