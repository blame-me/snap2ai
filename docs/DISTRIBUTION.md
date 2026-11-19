# Getting Snap2AI in front of people

What already exists:

- GitHub repo with a README, preview image, topics and a homepage link
- Landing page at https://snap2ai-site.vercel.app with install and troubleshooting
- Privacy policy at https://snap2ai-site.vercel.app/privacy
- Release zip attached to every `v*` tag by the Release workflow
- A mirror of the current zip on the site (`/snap2ai-5.5.zip`)

The rest needs an account that belongs to you. This page is the checklist so none of it gets lost.

## 1. Chrome Web Store

The store is the single biggest distribution step. Unpacked installs stop most people.

1. Register at https://chrome.google.com/webstore/devconsole (one time, 5 USD).
2. Build the zip. Either download the asset from the latest release, or run the packaging step from `.github/workflows/release.yml` by hand.
3. Upload it, then fill in the listing:
   - **Name:** Snap2AI
   - **Short description (132 chars):** Screenshot any page, get the answer in a panel from the AI you already use. One shortcut, no API key.
   - **Category:** Productivity
   - **Language:** English
   - **Homepage:** https://snap2ai-site.vercel.app
   - **Support:** https://github.com/blame-me/snap2ai/issues
   - **Privacy policy:** https://snap2ai-site.vercel.app/privacy
4. Screenshots: at least one 1280x800 image. Use real captures of the panel over a normal page, not mockups. The preview at `docs/preview.png` is a good composition reference.
5. Permission justification: copy the table in the README. `activeTab`, `tabs`, `scripting`, `storage` and host access to the eight AI domains. Say plainly that there is no remote code and no analytics.
6. Submit. Review usually takes a few days.

## 2. Microsoft Edge Add-ons

Free, and the same MV3 package works.

1. Register at https://partner.microsoft.com/dashboard/microsoftedge.
2. Create a new submission, upload the same `snap2ai.zip`.
3. Reuse the description, privacy URL and screenshots from the Chrome listing.

## 3. Share it

Post it yourself, once per place, and answer the replies. Do not cross-post the same text on the same day.

**One-liner**

> Snap2AI: press Alt+S on any page, get the answer in a panel from the AI you're already signed into. Chrome and Brave, no API key, 40 KB. https://snap2ai-site.vercel.app

**X / Bluesky**

> I got tired of retyping Netmath questions into a chat box, so I built a shortcut for it.
>
> Alt+S anywhere, the screenshot goes to Gemini or ChatGPT in the background, and the answer shows up in a panel on the page.
>
> Free, 40 KB, source: https://github.com/blame-me/snap2ai

**Reddit** (r/chrome_extensions, then maybe r/brave_browser, not both at once)

> **I made a screenshot-to-answer extension that drives the AI site you already pay for**
>
> No API keys and no extra account. It opens your AI in a background tab, attaches the screenshot, sends it, and puts the answer in a panel over the page. Esc cancels.
>
> Eight providers, including Gemini, ChatGPT and Claude. 40 KB, no telemetry.
>
> Source and zip: https://github.com/blame-me/snap2ai

**Show HN**

> Show HN: Snap2AI, one shortcut from a screenshot to an answer
>
> A Chromium extension that takes the visible tab, pastes it into your existing AI chat in a background tab, and renders the answer in a panel. Built it for Netmath problem sets. No API keys, no telemetry, <1000 lines.
>
> https://snap2ai-site.vercel.app

**Product Hunt tagline (60 chars)**

> Screenshot it. Understand it.

## 4. Not worth doing yet

- **Firefox:** `chrome.*` works in current Firefox for many APIs, but `captureVisibleTab`, service workers and the DOM automation need testing. Treat it as a port, not a repackage.
- **Paid promotion:** pointless before the store listing exists.
- **Adding it to "awesome" lists:** only after the store link exists, and only where the list allows self-submissions.

## Tracking

GitHub release downloads are the only number that matters before the store. Watch them at https://github.com/blame-me/snap2ai/releases. Vercel Analytics is off; if you turn it on, the site gets one script and no cookies.
