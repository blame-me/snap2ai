Snap2AI v5.5

INSTALL / UPDATE
1. Unzip. Open brave://extensions (or chrome://extensions) and turn on Developer mode.
2. "Load unpacked" -> pick the snap2ai folder. (Updating: click the reload icon on Snap2AI, then refresh your pages.)
3. Shortcut: brave://extensions/shortcuts -> set "Screenshot the screen and get the answer" to Alt+S.
4. Log in to your AI site (Gemini, ChatGPT, Claude, Grok, Copilot, Perplexity, DeepSeek or Mistral) in the same browser.

USE
Press Alt+S (or click the icon > Capture screen). Your screen is sent to the AI in a background tab and the answer
appears in a panel on your page: a green ANSWER box with "Copy answer", and the explanation below.

Icon popup: ON/OFF switch, pick the AI, capture, and your recent answers.
Settings: prompt, fresh chat, auto-copy the answer, show the AI tab.

NEW IN 5.2
- Gemini: ignores "Searching the web"/thinking text and waits for the real answer.
- Backup AI (Settings): if your main AI fails, the same screenshot is sent to a second one automatically.
- Clear messages for "not logged in" and "verify you're human" problems.
- Screenshot attach retries (drag-and-drop fallback) and send is double-checked.
- Panel shows elapsed time; press Esc to close it (and stop a running request).

NEW IN 5.3
- Fixed: a site echoing the instruction line ("FINAL ANSWER: <only the final answer...>") was accepted as the answer.
- Fixed: sites with no detectable send button waited 30s before pressing Enter (now ~3s).
- Fixed: a "Stop" button that never disappears could hang the panel for minutes.
- Login walls are detected in a few seconds instead of after a 25s timeout.
- Verified with an automated test suite of 30 scenarios (all 8 AIs, slow/search replies, retries, cancel, backup AI).

NEW IN 5.4
- Opening settings now lands on an About page: certificate of authenticity, link to github.com/blame-me, and how Blame made it. A "Settings" tab sits next to it.

NEW IN 5.5
- Faster: default prompt is now "Give me the answer and a quick explanation." plus a brief-reply instruction (1-3 sentences, no intro, no web search).
- Lighter screenshot upload, shorter waits between steps, and it finishes sooner once the final answer is in.
