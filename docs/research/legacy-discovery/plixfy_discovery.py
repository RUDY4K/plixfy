"""PLIXFY DISCOVERY SCRIPT"""
import requests
from bs4 import BeautifulSoup
import json
import random
import re
from urllib.parse import urlparse, urljoin
import time
from collections import Counter

BASE_URL = "https://plixfy.com"
SITEMAP_URL = f"{BASE_URL}/sitemap.xml"
SAMPLE_SIZE = 30
OUTPUT_FILE = "plixfy_discovery_report.json"
DELAY = 0.5


def safe_request(url, timeout=15):
    try:
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        r = requests.get(url, headers=headers, timeout=timeout)
        r.raise_for_status()
        return r
    except Exception as e:
        print(f"    error: {url[:60]} - {str(e)[:60]}")
        return None


def fetch_sitemap():
    print("\n=== Step 1: Fetch sitemap.xml ===\n")
    r = safe_request(SITEMAP_URL)
    if not r:
        return []
    soup = BeautifulSoup(r.content, "xml")
    sitemap_tags = soup.find_all("sitemap")
    if sitemap_tags:
        print(f"Found sitemap index with {len(sitemap_tags)} sub-sitemaps")
        all_urls = []
        for sm in sitemap_tags:
            loc = sm.find("loc")
            if loc:
                sub = safe_request(loc.text)
                if sub:
                    sub_soup = BeautifulSoup(sub.content, "xml")
                    urls = [u.find("loc").text for u in sub_soup.find_all("url") if u.find("loc")]
                    all_urls.extend(urls)
                    print(f"  {loc.text}: {len(urls)} urls")
        return all_urls
    url_tags = soup.find_all("url")
    urls = [u.find("loc").text for u in url_tags if u.find("loc")]
    print(f"Found {len(urls)} urls")
    return urls


def categorize_urls(urls):
    print("\n=== Step 2: Categorize URLs ===\n")
    game_patterns = ["/game/", "/games/", "/play/", "/g/"]
    cat_patterns = ["/category/", "/categories/", "/genre/", "/tag/"]
    games, categories, static = [], [], []
    for url in urls:
        path = urlparse(url).path.lower()
        if any(p in path for p in game_patterns):
            games.append(url)
        elif any(p in path for p in cat_patterns):
            categories.append(url)
        else:
            static.append(url)
    print(f"  Game pages: {len(games)}")
    print(f"  Category pages: {len(categories)}")
    print(f"  Static pages: {len(static)}")
    print("\n  Sample game URLs:")
    for url in games[:5]:
        print(f"    {url}")
    return {"games": games, "categories": categories, "static": static}


def analyze_game_page(url):
    r = safe_request(url)
    if not r:
        return None
    soup = BeautifulSoup(r.content, "html.parser")
    data = {
        "url": url, "title": None, "meta_description": None, "h1": None,
        "iframe_src": None, "iframe_provider": None, "images": [],
        "description_text": None, "category_links": [], "structured_data": None,
        "has_mobile_meta": False, "has_pwa_meta": False,
    }
    if soup.title and soup.title.string:
        data["title"] = soup.title.string.strip()
    meta_desc = soup.find("meta", attrs={"name": "description"})
    if meta_desc:
        data["meta_description"] = meta_desc.get("content", "")[:200]
    h1 = soup.find("h1")
    if h1:
        data["h1"] = h1.get_text(strip=True)[:100]
    iframe = soup.find("iframe")
    if iframe:
        src = iframe.get("src", "")
        data["iframe_src"] = src
        s = src.lower()
        if "gamedistribution" in s:
            data["iframe_provider"] = "GameDistribution"
        elif "gamemonetize" in s:
            data["iframe_provider"] = "GameMonetize"
        elif "crazygames" in s:
            data["iframe_provider"] = "CrazyGames"
        else:
            data["iframe_provider"] = "Other"
    images = soup.find_all("img")
    data["images"] = [img.get("src", "") for img in images[:5] if img.get("src")]
    desc_candidates = soup.find_all(["p", "div"], class_=re.compile(r"desc|about|info", re.I))
    if desc_candidates:
        longest = max(desc_candidates, key=lambda x: len(x.get_text(strip=True)))
        data["description_text"] = longest.get_text(strip=True)[:300]
    cat_links = soup.find_all("a", href=re.compile(r"/category|/genre|/tag", re.I))
    data["category_links"] = list(set([urljoin(url, a.get("href")) for a in cat_links[:10]]))
    script_jsonld = soup.find("script", type="application/ld+json")
    if script_jsonld and script_jsonld.string:
        try:
            data["structured_data"] = json.loads(script_jsonld.string)
        except:
            data["structured_data"] = "Invalid JSON"
    viewport = soup.find("meta", attrs={"name": "viewport"})
    data["has_mobile_meta"] = bool(viewport)
    manifest = soup.find("link", attrs={"rel": "manifest"})
    data["has_pwa_meta"] = bool(manifest)
    return data


def sample_games(game_urls, sample_size=30):
    print(f"\n=== Step 3: Sample {sample_size} games ===\n")
    if len(game_urls) > sample_size:
        sample = random.sample(game_urls, sample_size)
    else:
        sample = game_urls
    results = []
    for i, url in enumerate(sample, 1):
        print(f"  [{i}/{len(sample)}] {url[:60]}")
        data = analyze_game_page(url)
        if data:
            results.append(data)
        time.sleep(DELAY)
    return results


def analyze_results(game_data):
    print("\n=== Step 4: Analyze results ===\n")
    if not game_data:
        return {}
    providers = Counter(g["iframe_provider"] for g in game_data if g["iframe_provider"])
    print("  Provider distribution:")
    for p, c in providers.most_common():
        pct = (c / len(game_data)) * 100
        print(f"    {p}: {c} ({pct:.1f}%)")
    mobile_count = sum(1 for g in game_data if g["has_mobile_meta"])
    pwa_count = sum(1 for g in game_data if g["has_pwa_meta"])
    sd_count = sum(1 for g in game_data if g["structured_data"])
    print(f"\n  Pages with viewport meta: {mobile_count}/{len(game_data)}")
    print(f"  Pages with PWA manifest: {pwa_count}/{len(game_data)}")
    print(f"  Pages with structured data: {sd_count}/{len(game_data)}")
    return {
        "providers": dict(providers),
        "mobile_meta_count": mobile_count,
        "pwa_count": pwa_count,
        "structured_data_count": sd_count,
    }


def main():
    print("\n" + "=" * 60)
    print("  PLIXFY DISCOVERY")
    print("=" * 60)
    print(f"  Target: {BASE_URL}")
    print(f"  Sample size: {SAMPLE_SIZE}")
    all_urls = fetch_sitemap()
    if not all_urls:
        print("\nCould not fetch sitemap")
        return
    categorized = categorize_urls(all_urls)
    if not categorized["games"]:
        print("\nNo game URLs found with standard patterns")
        candidates = [u for u in all_urls if u not in [BASE_URL, f"{BASE_URL}/"]]
        game_data = sample_games(candidates[:SAMPLE_SIZE], SAMPLE_SIZE)
    else:
        game_data = sample_games(categorized["games"], SAMPLE_SIZE)
    stats = analyze_results(game_data)
    report = {
        "base_url": BASE_URL,
        "total_urls_in_sitemap": len(all_urls),
        "url_categories": {
            "games": len(categorized["games"]),
            "categories": len(categorized["categories"]),
            "static": len(categorized["static"]),
        },
        "sample_size": len(game_data),
        "statistics": stats,
        "sample_data": game_data,
        "category_urls_examples": categorized["categories"][:20],
    }
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print("\n" + "=" * 60)
    print(f"  Done. Report saved to: {OUTPUT_FILE}")
    print("=" * 60)


if __name__ == "__main__":
    main()
