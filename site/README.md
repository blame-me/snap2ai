# Snap2AI site

The landing page and privacy policy for [Snap2AI](https://github.com/blame-me/snap2ai), a screenshot-to-answer extension for Chrome and Brave.

The site lives in the main repository under `site/` and is deployed on its own. The Vercel project `snap2ai-site` uses this folder as its root directory, so the extension source and the website version together but ship separately.

**Live:** https://snap2ai-site.vercel.app
**Privacy:** https://snap2ai-site.vercel.app/privacy

## Stack

Plain HTML, CSS and JavaScript. No framework, no build step, no dependencies. Vercel serves the directory as a static site.

```
index.html      landing page
privacy.html    privacy policy (cleanUrls serves it at /privacy)
styles.css      all styles, including the legal page
script.js       reveal on scroll, nav state, accordion behaviour
og.png          1200x630 social card
sitemap.xml     landing page and privacy page
robots.txt      allows everything, points at the sitemap
vercel.json     cleanUrls, security headers
snap2ai-5.5.zip mirror of the current release asset
```

## Local

```bash
npx serve .
```

Open the printed localhost URL. The site is static, so any file server works. `python -m http.server` is fine too.

## Type

The CSS asks for Claude's actual faces first (`Tiempos Text`, `Styrene B`), then falls back to the free stand-ins loaded from Google Fonts: Newsreader for display and reading, Inter Tight for UI.

## Releasing a new extension version

The download buttons point at `https://github.com/blame-me/snap2ai/releases/latest/download/snap2ai.zip`, so new releases are picked up automatically. Two things still need a manual edit:

1. Replace `snap2ai-5.5.zip` with the new zip and update the mirror link in `index.html`.
2. Update the version strings in `index.html`, then bump `<lastmod>` in `sitemap.xml`.

## Deploy

The Vercel project is connected to `blame-me/snap2ai` with `site` as its root directory. Pushes to `master` deploy automatically. To deploy by hand:

```bash
npx vercel --prod
```

Run it from this folder after `npx vercel link` has picked the existing project once.

## Editing notes

- Keep the copy plain. Short sentences, no em dashes, no marketing filler.
- The signature line in the footer is deliberate. Leave it.
- If you add a page, add it to `sitemap.xml` and link it from the footer.
