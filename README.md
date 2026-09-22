# Applied Data Research Institute website

This is the source for [www.applieddataresearch.org](https://www.applieddataresearch.org).
We moved off Wix in September 2026 and rebuilt the site as plain HTML and CSS
so we could host it on GitHub Pages for free and keep it under version control.
There's no build step and no framework: what's in this repo is what gets served.
The `CNAME` file at the top level is what tells GitHub Pages to serve the repo
at our domain; don't delete it.

The URLs match the old Wix site (`/about/`, `/projects/`, `/news/`, `/contact/`),
so links people already have still work.

## How it's organized

Each page is a folder with an `index.html` in it. The home page is the
`index.html` at the top level, and `404.html` is what GitHub shows when
someone hits a URL that doesn't exist.

Everything shared lives under `assets/`:

- `css/style.css` is all of the styling. The colors, fonts and content width
  are defined in the `:root` block at the top, so most visual tweaks happen there.
- `js/site.js` handles the mobile menu and submits the two forms in the
  background so visitors see a thank-you message without leaving the page.
- `images/` is grouped by where each image is used: `logo/`, `home/`,
  `banners/`, `gallery/`, `team/`, `projects/`, `news/`. Team photos are named
  `firstname-lastname.jpg`.

The `scripts/` folder holds a couple of things that aren't part of the site
itself: `download_images.py` and `image_manifest.txt`, which we used to pull
our images off Wix during the move, and `google-sheets-form-receiver.gs`, the
code behind the forms (see below).

## Making changes

Edit the HTML directly and push to `main`; GitHub Pages redeploys within a
minute or so. A few common jobs:

- **Text changes:** open the page's `index.html` and edit. Nothing is
  templated, so the header and footer are repeated in every file. If you change
  those, change them everywhere.
- **Team members:** each person is a `<figure>` block in `about/index.html`.
  Copy one, update the name, title and photo path, and drop the headshot into
  `assets/images/team/`. Square crops of at least 500×500 look best; they're
  shown as circles.
- **Projects:** same idea in `projects/index.html`.
- **News:** copy the `news/ev-resilience-webinars-and-workshops/` folder,
  rename it, edit its `index.html`, and add a card for it on `news/index.html`.
- **Photos:** replace the file in `assets/images/` keeping the same name, or
  point the `src` at a new one. Please compress large photos before committing;
  the banners are 1920px wide and should be well under 300 KB each.

A couple of things we're deliberately careful about:

- **No email addresses on the site.** We don't put a `mailto:` link or a
  written-out address anywhere, to keep it off scrapers. The contact form is
  the way to reach us.
- **Only HTTPS.** Everything loads over `https://`, and each page carries an
  `upgrade-insecure-requests` policy as a backstop. HTTPS is enforced in the
  repo's Pages settings. Please don't add `http://` links or assets.

## The forms

The Subscribe box on the home page and the Contact form both post to a Google
Apps Script web app, which appends a row to a private Google Sheet: subscribers
go to a `Subscribers` tab and messages to a `Contact Messages` tab. The
spreadsheet's own notification settings email us when a row is added, so no
address has to appear in the site or the script.

The script's source is in `scripts/google-sheets-form-receiver.gs`. It does a
bit of defensive work: it ignores fields it doesn't recognize, drops
submissions that fill the hidden honeypot field, stores anything that looks
like a spreadsheet formula as plain text, caps values at 5,000 characters, and
refuses more than 10 submissions a minute. Anything that fails shows up under
**Executions** in the Apps Script editor.

If you change the script, remember that Apps Script only serves the deployed
version: after saving, go to **Deploy → Manage deployments**, edit the existing
deployment, and pick **New version**. The URL stays the same, so the site
doesn't need to change. If you ever need to set it up fresh on a new
spreadsheet, it's **Extensions → Apps Script**, paste the file, then **Deploy →
New deployment → Web app** with *Execute as: Me* and *Who has access: Anyone*,
and put the resulting `/exec` URL in the `action` of both forms.

One quirk worth knowing: the browser can't read the script's reply (Apps Script
answers through a redirect that cross-origin pages aren't allowed to see), so
the page shows the thank-you message as soon as the request completes. If a
submission ever seems to have vanished, check the Executions log rather than
assuming the visitor saw an error.

## The domain

The site is served at `www.applieddataresearch.org`. The custom domain is set
under **Settings → Pages** in this repo (which is what created the `CNAME`
file), the DNS at our registrar points at GitHub Pages, and Enforce HTTPS is
ticked so the bare `http://` address redirects. The canonical links,
social-share tags and the links in `404.html` all use the full
`https://www.applieddataresearch.org/` address.

If the domain ever changes, update it in the Pages settings first, wait for
GitHub to issue the new certificate before re-ticking Enforce HTTPS, then
swap the address throughout the HTML:

```
grep -rl 'www.applieddataresearch.org' --include=*.html . \
  | xargs sed -i 's#https://www.applieddataresearch.org/#https://NEW-DOMAIN/#g'
```

On macOS use `sed -i ''`.

## Notes from the migration

- The header, footer, address and copyright line are as they were on Wix.
- Wix's menu had a "More" item that was just an overflow placeholder with
  nothing behind it, so it's gone.
- The site uses Source Sans 3 from Google Fonts with a system fallback. It's
  the only external dependency besides the form script; remove the two
  `fonts.googleapis` lines from each `<head>` if you'd rather not have it.
