export type ConsentChoice = "accept" | "reject";

interface StoredConsent {
  choice: ConsentChoice;
  timestamp: number;
}

const STORAGE_KEY = "gdpr-consent-v1";
const EXPIRY_MS = 180 * 24 * 60 * 60 * 1000;
const EVENT_NAME = "plixfy:consent-change";

export function getConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConsent;
    if (parsed.choice !== "accept" && parsed.choice !== "reject") return null;
    if (Date.now() - parsed.timestamp > EXPIRY_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed.choice;
  } catch {
    return null;
  }
}

export function setConsent(choice: ConsentChoice): void {
  if (typeof window === "undefined") return;
  try {
    const data: StoredConsent = { choice, timestamp: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent<ConsentChoice>(EVENT_NAME, { detail: choice }));
  } catch {
    // storage disabled — fail silently
  }
}

export function onConsentChange(callback: (choice: ConsentChoice) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => {
    const ce = e as CustomEvent<ConsentChoice>;
    if (ce.detail === "accept" || ce.detail === "reject") {
      callback(ce.detail);
    }
  };
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}
