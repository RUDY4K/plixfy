import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الملف الشخصي | بليكسفاي",
  description: "ملفك الشخصي في بليكسفاي.",
  alternates: {
    canonical: "/profile",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function ProfilePage() {
  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-6">
        الملف الشخصي
      </h1>

      <div className="bg-surface rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-surface-elevated rounded-full flex items-center justify-center text-2xl">
            👤
          </div>
          <div>
            <p className="text-lg md:text-xl font-bold text-text-primary">
              زائر
            </p>
            <p className="text-sm text-text-secondary">سجّل علشان تحفظ ألعابك</p>
          </div>
        </div>

        <div className="text-sm text-text-secondary">
          المزيد من الميزات قريباً
        </div>
      </div>
    </main>
  );
}
