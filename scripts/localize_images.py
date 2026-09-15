#!/usr/bin/env python3
"""
Download every image the site uses from Wix's CDN into assets/img/ and
rewrite the HTML pages to reference the local copies.

Run this ONCE, from the repository root, before you cancel your Wix plan:

    python3 scripts/localize_images.py

Requires only the Python standard library (Python 3.8+).
"""
import os
import re
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
IMG_DIR = os.path.join(ROOT, "assets", "img")
MANIFEST = os.path.join(HERE, "image_manifest.txt")

# Every HTML page and how many directories deep it sits (for relative paths).
PAGES = {
    "index.html": "",
    "404.html": "/",           # served at any URL -> use a root-relative path
    "about/index.html": "../",
    "projects/index.html": "../",
    "news/index.html": "../",
    "news/ev-resilience-webinars-and-workshops/index.html": "../../",
    "contact/index.html": "../",
}


def main():
    os.makedirs(IMG_DIR, exist_ok=True)
    mapping = {}
    with open(MANIFEST) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            filename, url = line.split("\t")
            mapping[url] = filename

    # 1. Download
    failures = []
    for url, filename in mapping.items():
        dest = os.path.join(IMG_DIR, filename)
        if os.path.exists(dest):
            print(f"  exists   {filename}")
            continue
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=30) as r, open(dest, "wb") as out:
                out.write(r.read())
            print(f"  saved    {filename}")
        except Exception as e:  # noqa: BLE001
            failures.append((filename, str(e)))
            print(f"  FAILED   {filename}: {e}")

    if failures:
        print("\nSome downloads failed; HTML was NOT rewritten. Fix the errors and re-run.")
        sys.exit(1)

    # 2. Rewrite HTML
    for page, prefix in PAGES.items():
        path = os.path.join(ROOT, page)
        with open(path) as f:
            html = f.read()
        original = html
        for url, filename in mapping.items():
            local = f"{prefix}assets/img/{filename}"
            html = html.replace(url, local)
        if html != original:
            with open(path, "w") as f:
                f.write(html)
            print(f"  rewrote  {page}")

    leftover = re.findall(r"static\.wixstatic\.com[^\"']+", "".join(
        open(os.path.join(ROOT, p)).read() for p in PAGES))
    if leftover:
        print("\nWarning: some Wix URLs remain:")
        for u in sorted(set(leftover)):
            print("   ", u)
    else:
        print("\nDone. All images are now served from assets/img/.")


if __name__ == "__main__":
    main()
