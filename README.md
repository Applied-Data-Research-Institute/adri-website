# Applied Data Research Institute — website

A static rebuild of the ADRI site (previously hosted on Wix) as plain HTML/CSS,
ready to publish on GitHub Pages. No build step, no framework, no dependencies.

The URL structure matches the old site, so any links people already have keep working:

| Page | Path |
|------|------|
| Home | `/` |
| About | `/about/` |
| Projects | `/projects/` |
| News | `/news/` |
| EV Resilience Webinars and Workshops | `/news/ev-resilience-webinars-and-workshops/` |
| Contact | `/contact/` |

## Repository layout

```
index.html                 Home
about/index.html
projects/index.html
news/index.html
news/ev-resilience-webinars-and-workshops/index.html
contact/index.html
404.html                   Shown by GitHub Pages for missing URLs
assets/css/style.css       All styling (colors and fonts are at the top)
assets/js/site.js          Mobile menu + form submission
assets/images/             All images, grouped by where they are used
  logo/                    adri-logo.png (header), adri-logo-combined.png (footer), favicon.png
  home/                    Home page hero strip and "Who We Are" photo
  banners/                 Top banner for About, Projects, News, Contact
  gallery/                 Three-photo strip used on About and Projects
  team/                    Headshots (alexander-yoshizumi.jpg, kate-jones.jpg, zachary-ziemba.png)
  projects/                Project thumbnails
  news/                    Article header images
scripts/download_images.py Fills assets/images/ (run once, see below)
scripts/image_manifest.txt Where each image comes from
scripts/google-sheets-form-receiver.gs  Apps Script for the forms spreadsheet
.nojekyll                  Tells GitHub Pages to serve files as-is
```

## Publish on GitHub Pages

1. Create a new repository on GitHub (for example `adri-website`).
2. Upload the contents of this folder to the repository (drag-and-drop on
   github.com works, or use git).
3. In the repository go to **Settings → Pages**.
4. Under **Build and deployment**, set *Source* to **Deploy from a branch**,
   choose the `main` branch and the `/ (root)` folder, then **Save**.
5. After a minute the site is live at `https://<your-username>.github.io/<repo-name>/`.

If you name the repository `<your-username>.github.io`, the site is served from
`https://<your-username>.github.io/` with no sub-path.

### Custom domain (optional)

If you own a domain, add it under **Settings → Pages → Custom domain**. GitHub
creates a `CNAME` file in the repo for you. Then point your DNS at GitHub
Pages following the instructions shown on that settings page.

## Step 0 — fill the images folder (do this first)

The HTML already references local files under `assets/images/`, and nothing in
the pages points at Wix. The image files themselves still need to be fetched
once from Wix's CDN (they could not be bundled here). From the repository
folder, on a computer with internet access, run:

```
python3 scripts/download_images.py
```

It saves all 20 files into the right subfolders and skips any that already
exist. Commit and push the result. Do this before the Wix site is closed;
after that the URLs in `scripts/image_manifest.txt` will stop working.

If you prefer to do it by hand, `scripts/image_manifest.txt` lists each local
path and its source URL, one per line.

## Enforce HTTPS

The site is HTTPS-clean: there are no `http://` references anywhere, every
external resource (Google Fonts, Formspree, outbound links) is loaded over
HTTPS, and each page carries an `upgrade-insecure-requests` policy that makes
browsers upgrade any plain-HTTP asset that might be added by mistake later.

To make GitHub redirect all visitors to HTTPS: **Settings → Pages → tick
"Enforce HTTPS."** On a `github.io` address this is available immediately. On
a custom domain the option becomes available after GitHub finishes issuing the
certificate, which can take a few minutes after the DNS check passes; if it
stalls, remove and re-add the domain on that page to restart it. The full
domain name must be under 64 characters for the certificate to be issued.

Keep it clean when editing: search the repo for `http://` before committing.

## Connect the forms to Google Sheets

Both forms write to **one Google Sheets file**, each to its own tab:
`Subscribers` (from the home-page box) and `Contact Messages` (from the
Contact page). A small Google Apps Script attached to the spreadsheet receives
each submission and appends a row to the right tab. To be told about new
submissions, use the spreadsheet's built-in alerts: **Tools → Notification
settings → Edit notifications → "Any changes are made" → "Email - right away"**.
No email address is written anywhere in the site or the script.

One-time setup, about five minutes:

1. Create a new Google Sheets file (any name, e.g. "ADRI website forms").
   Leave it empty; the script creates the two tabs and their headers.
2. **Extensions → Apps Script.** Delete the sample code, paste in the whole
   contents of `scripts/google-sheets-form-receiver.gs`, and save.
3. **Deploy → New deployment.** Click the gear next to "Select type", choose
   **Web app**, set *Execute as*: **Me** and *Who has access*: **Anyone**, then
   **Deploy**.
4. Authorize when asked: pick your account, click *Advanced → Go to (project
   name)*, then *Allow*. This is normal for a script you wrote yourself.
5. Copy the **Web app URL** (ends in `/exec`) and paste it as the `action` of
   the `<form>` in **both** `index.html` and `contact/index.html`. (Already
   done for the current deployment.)
6. Commit and push, then test each form once. A row should appear in the
   matching tab within a second or two.

Notes:

- Opening the `/exec` URL in a browser should show
  `{"result":"ok","message":"ADRI form receiver is running."}`, which confirms
  the deployment. If the `action` is ever set to a placeholder or a non-Google URL, the
  forms show a "not connected yet" notice instead of sending.
- The forms tell the script which tab to use through a hidden `form` field
  (`subscribe` or `contact`). To add a third form later, add an entry to
  `FORMS` in the script and a hidden field to the new form.
- If you edit the script, go to **Deploy → Manage deployments → Edit (pencil)
  → Version: New version → Deploy** for the change to go live. The URL does
  not change.
- The web app runs as you, so the spreadsheet can stay private: "Anyone"
  means anyone can *post* to it, not read it.
- Safety measures in the script: a hidden "company" honeypot field (bots that
  fill it are discarded), an allowlist so unknown fields are ignored, a 5,000
  character cap per value, text starting with `= + - @` stored as plain text
  so it can never run as a spreadsheet formula, and a limit of 10
  submissions per minute. Failed runs are logged under **Apps Script →
  Executions**.
- The page shows the thank-you message as soon as the request completes; it
  can't read the script's reply (Apps Script answers via a redirect that
  browsers block cross-origin), so a rejected submission, e.g. one over the
  rate limit, still shows thanks. Check the Executions log if in doubt.
- The endpoint is public by design (visitors post to it anonymously). The
  script exposes no way to read the sheet, and the sheet stays private.
- If you later want the subscriber list in a separate file (for example to
  share it with someone who shouldn't see contact messages), make a second
  file, deploy the script there, and give the home-page form that URL.

### Keeping the address off scrapers

- The forms never contain an address; submissions go to a spreadsheet, and
  alerts come from Google Sheets' own notification settings.
- There is deliberately no email address or `mailto:` link anywhere on the
  site; the contact form is the only way to reach ADRI. Keep it that way when
  editing pages.

## Editing the site

- Text: open the relevant `index.html` and edit. Each page is self-contained.
- A new news article: copy `news/ev-resilience-webinars-and-workshops/` to a new
  folder under `news/`, edit its `index.html`, then add a card for it in
  `news/index.html`.
- Team members / projects: duplicate a `<figure>` block in `about/index.html`
  or `projects/index.html`.
- Colors and fonts: the `:root` block at the top of `assets/css/style.css`.
- Replacing a photo: drop the new file in the matching `assets/images/`
  subfolder with the same name, or update the `src` in the page.
- Site address: the canonical link, social-share tags (`og:url`, `og:image`)
  and the `404.html` links all use the current address,
  `https://applied-data-research-institute.github.io/adri-website/`. When the
  domain changes, replace it everywhere in one go from the repo folder:

  ```
  grep -rl 'applied-data-research-institute.github.io/adri-website/' --include=*.html . \
    | xargs sed -i 's#https://applied-data-research-institute.github.io/adri-website/#https://NEW-DOMAIN/#g'
  ```

  (On macOS use `sed -i ''` instead of `sed -i`.) If the new domain is a root
  domain, also change `/adri-website/` in `404.html` to `/`.

## Notes on the migration

- Header/nav, footer, address and copyright line are reproduced as on the original.
- The "More" item in the Wix menu was an automatic overflow item with nothing
  behind it, so it was dropped.
- Wix's "Thanks for subscribing!" / "Thanks for submitting!" messages are shown
  inline after a successful form submission.
- The site uses the Source Sans 3 web font from Google Fonts with a system
  fallback; to remove the external font entirely, delete the two `fonts.googleapis`
  lines in each page's `<head>`.
