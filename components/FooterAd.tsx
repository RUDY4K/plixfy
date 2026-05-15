import AdPlacement from './AdPlacement';

export default function FooterAd() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-6">
      <AdPlacement slot="footer" label="Ad · footer 728×90" />
    </div>
  );
}
