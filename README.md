# Snap2AI v5.5

A browser extension that captures your screen, sends it to your AI of choice (Gemini, ChatGPT, Claude, Grok, Copilot, Perplexity, DeepSeek, Mistral), and shows the answer in a panel on your page.

**Site:** https://snap2ai-site.vercel.app · **Download:** [releases](https://github.com/blame-me/snap2ai/releases/latest)

## Install

1. Download the latest release zip below and unzip it.
2. Open `brave://extensions` (or `chrome://extensions`) and turn on **Developer mode**.
3. Click **Load unpacked** and select the `snap2ai` folder.
   - Updating: click the reload icon on Snap2AI, then refresh your pages.
4. Shortcut: `brave://extensions/shortcuts` → set "Screenshot the screen and get the answer" to `Alt+S`.
5. Log in to your AI site in the same browser.

## Use

Press `Alt+S` (or click the icon → Capture screen). Your screen is sent to the AI in a background tab and the answer appears in a panel on your page: a green ANSWER box with "Copy answer", and the explanation below.

Icon popup: ON/OFF switch, pick the AI, capture, and your recent answers. Settings: prompt, fresh chat, auto-copy the answer, show the AI tab.

## Highlights

- **v5.5** — Faster: default prompt is now "Give me the answer and a quick explanation." plus a brief-reply instruction (1–3 sentences, no intro, no web search). Lighter screenshot upload, shorter waits between steps.
- **v5.4** — Settings opens on an About page: certificate of authenticity, link to github.com/blame-me, and how Blame made it. A "Settings" tab sits next to it.
- **v5.3** — Fixed site echoing the instruction line; reduced send-button wait (30s → ~3s); fixed "Stop" button hangs; faster login-wall detection; verified with an automated 30-scenario test suite.
- **v5.2** — Gemini ignores "Searching the web"/thinking text; backup AI support; clearer "not logged in"/"verify you're human" messages; screenshot attach retries with drag-and-drop fallback; panel shows elapsed time; press Esc to close.

## Author

By [Blame](https://github.com/blame-me).