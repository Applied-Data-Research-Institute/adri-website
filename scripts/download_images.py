#!/usr/bin/env python3
"""
Download every image the site uses into assets/images/.

The HTML already points at the local paths, so this is the only step needed
to make the site self-contained. Run it once, from the repository root:

    python3 scripts/download_images.py

Needs Python 3.8+ and nothing else. Safe to re-run; existing files are skipped.
Do this before closing the Wix site, since it pulls from Wix's CDN.
"""
import os
import sys
import urllib.request

try:
    HERE = os.path.dirname(os.path.abspath(__file__))
    ROOT = os.path.dirname(HERE)
except NameError:
    # Pasted into a notebook/IDE cell: __file__ doesn't exist, so use the
    # current working directory. Set ROOT here by hand if that isn't the repo.
    ROOT = os.getcwd()
    if not os.path.exists(os.path.join(ROOT, "index.html")):
        raise SystemExit(
            "Can't find the repository. Either run this as a file "
            "(python3 scripts/download_images.py) or set ROOT above to the "
            "folder that contains index.html.")
    HERE = os.path.join(ROOT, "scripts")
MANIFEST = os.path.join(HERE, "image_manifest.txt")


def main():
    failures = []
    with open(MANIFEST) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            local, url = line.split("\t")
            dest = os.path.join(ROOT, local)
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            if os.path.exists(dest):
                print(f"  exists  {local}")
                continue
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req, timeout=30) as r, open(dest, "wb") as out:
                    out.write(r.read())
                print(f"  saved   {local}")
            except Exception as e:  # noqa: BLE001
                failures.append((local, str(e)))
                print(f"  FAILED  {local}: {e}")

    if failures:
        print(f"\n{len(failures)} download(s) failed. Re-run to retry the missing ones.")
        sys.exit(1)
    print("\nAll images saved. Commit assets/images/ and push.")


if __name__ == "__main__":
    main()
