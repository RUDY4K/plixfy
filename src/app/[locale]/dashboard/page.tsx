import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import RevenueDashboard from "@/components/RevenueDashboard";

export const metadata: Metadata = {
  title: "Revenue Dashboard | بليكسفاي",
  description: "Internal revenue monitoring dashboard.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  alternates: {
    canonical: "/dashboard",
  },
};

export default function DashboardPage() {
  return (
    <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <header className="mb-6 md:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-primary/15 text-primary">
            <BarChart3 className="w-6 h-6" aria-hidden="true" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary">
            Revenue Dashboard
          </h1>
        </div>
        <p className="text-sm md:text-base text-text-secondary">
          متابعة يومية للـ revenue من Playgama، Monetag، وGA4. سجل يدوي محلي.
        </p>
      </header>

      <RevenueDashboard />
    </main>
  );
}
