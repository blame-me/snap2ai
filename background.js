importScripts("shared.js");
const Snap = self.Snap;

const PROVIDERS = {
  gemini: {
    name: "Gemini",
    url: "https://gemini.google.com/app",
    match: "https://gemini.google.com/*",
    input: ["rich-textarea .ql-editor", "div.ql-editor[contenteditable='true']", "div[contenteditable='true'][role='textbox']", "div[contenteditable='true']"],
    send: ["button.send-button", "button[aria-label*='Send message']", "button[aria-label*='Envoyer']", "button[aria-label*='Send']"],
    stop: ["button[aria-label*='Stop']", "button[aria-label*='Arr\u00eater']", "button.stop"],
    resp: ["model-response message-content", "model-response .markdown", "model-response"]
  },
  chatgpt: {
    name: "ChatGPT",
    url: "https://chatgpt.com/",
    match: "https://chatgpt.com/*",
    input: ["#prompt-textarea", "div[contenteditable='true']", "textarea"],
    send: ["button[data-testid='send-button']", "button[aria-label*='Send']", "button[aria-label*='Envoyer']"],
    stop: ["button[data-testid='stop-button']", "button[aria-label*='Stop']", "button[aria-label*='Arr\u00eater']"],
    resp: ["[data-message-author-role='assistant'] .markdown", "[data-message-author-role='assistant']"]
  },
  claude: {
    name: "Claude",
    url: "https://claude.ai/new",
    match: "https://claude.ai/*",
    input: ["div[contenteditable='true'].ProseMirror", "div[contenteditable='true']"],
    send: ["button[aria-label*='Send']", "button[aria-label*='Envoyer']"],
    stop: ["button[aria-label*='Stop']", "button[aria-label*='Arr\u00eater']"],
    resp: [".font-claude-response", "div[data-is-streaming]", ".font-claude-message"]
  },
  grok: {
    name: "Grok",
    url: "https://grok.com/",
    match: "https://grok.com/*",
    input: ["div.tiptap.ProseMirror[contenteditable='true']", "textarea", "div[contenteditable='true']"],
    send: ["button[type='submit']", "button[aria-label*='Submit']", "button[aria-label*='Send']"],
    stop: ["button[aria-label*='Stop']"],
    resp: [".response-content-markdown", "[class*='response-content']"]
  },
  copilot: {
    name: "Copilot",
    url: "https://copilot.microsoft.com/",
    match: "https://copilot.microsoft.com/*",
    input: ["textarea#userInput", "textarea", "div[contenteditable='true']"],
    send: ["button[data-testid='submit-button']", "button[aria-label*='Submit']", "button[aria-label*='Send']"],
    stop: ["button[data-testid='stop-button']", "button[aria-label*='Stop']"],
    resp: ["[data-content='ai-message']", "div[data-testid='ai-message']"]
  },
  perplexity: {
    name: "Perplexity",
    url: "https://www.perplexity.ai/",
    match: "https://www.perplexity.ai/*",
    input: ["#ask-input", "div[contenteditable='true']", "textarea"],
    send: ["button[data-testid='submit-button']", "button[aria-label*='Submit']", "button[aria-label*='Send']"],
    stop: ["button[aria-label*='Stop']"],
    resp: ["div[id^='markdown-content']", "div.prose", "[class*='prose']"]
  },
  deepseek: {
    name: "DeepSeek",
    url: "https://chat.deepseek.com/",
    match: "https://chat.deepseek.com/*",
    input: ["textarea#chat-input", "textarea"],
    send: [],
    stop: [],
    resp: [".ds-markdown", "div.ds-markdown--block"]
  },
  mistral: {
    name: "Mistral",
    url: "https://chat.mistral.ai/chat",
    match: "https://chat.mistral.ai/*",
    input: ["div.ProseMirror[contenteditable='true']", "textarea", "div[contenteditable='true']"],
    send: ["button[type='submit']", "button[aria-label*='Send']"],
    stop: ["button[aria-label*='Stop']"],
    resp: ["[data-message-part-type='answer']", "div[data-message-author-role='assistant']", "div.prose"]
  }
};

const SUFFIX =
  " Be fast and brief: no intro, no follow-up questions, don't search the web. Keep the explanation to 1-3 short sentences. Write math in plain text (3/4, x^2), not LaTeX. End with one last line in exactly this format: FINAL ANSWER: <only the final answer, no explanation>";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const getSettings = async () => ({ ...Snap.DEFAULTS, ...(await chrome.storage.sync.get(Snap.DEFAULTS)) });
const toPanel = (tabId, payload) =>
  chrome.tabs.sendMessage(tabId, { type: "panel", ...payload }).catch(() => {});

// ---------- run state (one run at a time; a new capture cancels the old one) ----------
let runSeq = 0;
let active = null; // { id, tabId }

// ---------- toolbar badge ----------
function setBadge(text, color) {
  chrome.action.setBadgeText({ text });
  if (color) chrome.action.setBadgeBackgroundColor({ color });
}
async function updateBadge() {
  if (active) return setBadge("\u2026", "#f59e0b");
  const s = await getSettings();
  setBadge(s.enabled ? "" : "OFF", "#dc2626");
}
function flashBadge(text, color, ms = 3500) {
  setBadge(text, color);
  setTimeout(updateBadge, ms);
}
chrome.runtime.onInstalled.addListener(updateBadge);
chrome.runtime.onStartup.addListener(updateBadge);
chrome.storage.onChanged.addListener((c, area) => { if (area === "sync" && c.enabled) updateBadge(); });
updateBadge();

// ---------- entry points ----------
chrome.commands.onCommand.addListener(async (cmd, tab) => {
  if (cmd !== "capture") return;
  if (!tab || !tab.id) [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (tab) handleCapture(tab);
});

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === "capture-now") {
    (async () => {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      await sleep(300); // let the popup close
      if (tab) handleCapture(tab);
    })();
  } else if (msg.type === "cancel" && sender.tab) {
    if (active && active.tabId === sender.tab.id) {
      active = null;
      toPanel(sender.tab.id, { state: "cancelled" });
      updateBadge();
    }
  } else if (msg.type === "retry" && sender.tab) {
    handleCapture(sender.tab);
  } else if (msg.type === "enable" && sender.tab) {
    chrome.storage.sync.set({ enabled: true }).then(() => handleCapture(sender.tab));
  }
});

async function ensurePanel(tabId) {
  await chrome.scripting.executeScript({ target: { tabId }, files: ["shared.js", "panel.js"] });
}

async function handleCapture(tab) {
  if (!tab || !tab.id) return;
  const originId = tab.id;
  const settings = await getSettings();
  const cfg = PROVIDERS[settings.provider] || PROVIDERS.gemini;

  if (!settings.enabled) {
    try { await ensurePanel(originId); await toPanel(originId, { state: "off", provider: cfg.name }); }
    catch (e) { flashBadge("OFF", "#dc2626"); }
    return;
  }

  const run = { id: ++runSeq, tabId: originId };
  active = run; // cancels any older run
  setBadge("\u2026", "#f59e0b");
  const alive = () => active === run;

  try {
    await toPanel(originId, { state: "hide" }); // keep an old panel out of the screenshot
    await sleep(100);
    const shot = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "jpeg", quality: 85 });
    const bmp = await createImageBitmap(await (await fetch(shot)).blob());
    const k = Math.min(1, 1440 / bmp.width);
    const w = Math.round(bmp.width * k), h = Math.round(bmp.height * k);
    const canvas = new OffscreenCanvas(w, h);
    canvas.getContext("2d").drawImage(bmp, 0, 0, w, h);
    const base64 = await blobToBase64(await canvas.convertToBlob({ type: "image/jpeg", quality: 0.85 }));
    if (!alive()) return;

    await ensurePanel(originId);
    await toPanel(originId, { state: "sending", provider: cfg.name, autoCopy: !!settings.autoCopy });
    const fbCfg = settings.fallback && settings.fallback !== settings.provider ? PROVIDERS[settings.fallback] : null;
    const res = await runFlow({ alive, originId, base64, settings, cfg, quietFail: !!fbCfg });
    if (res === "failed" && fbCfg && alive()) {
      await toPanel(originId, { state: "info", provider: fbCfg.name, text: cfg.name + " didn't answer. Trying " + fbCfg.name + "\u2026" });
      await runFlow({ alive, originId, base64, settings, cfg: fbCfg, quietFail: false });
    }
  } catch (e) {
    console.error(e);
    if (alive()) {
      try {
        await ensurePanel(originId);
        await toPanel(originId, { state: "error", provider: cfg.name, text: friendly(e) });
      } catch (_) {
        flashBadge("!", "#dc2626"); // restricted page (browser pages, web store...)
      }
    }
  } finally {
    if (active === run) { active = null; updateBadge(); }
  }
}

function friendly(e) {
  const m = String((e && e.message) || e);
  if (/cannot be scripted|cannot access|chrome:|Extensions gallery/i.test(m)) {
    return "Snap2AI can't run on this kind of page. Open a normal website and try again.";
  }
  return m;
}

async function blobToBase64(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

// ---------- the flow: the service worker drives, tiny scripts run in the AI tab ----------
// (Timers inside hidden tabs get throttled by the browser, so all waiting happens here.)
async function exec(tabId, func, args = []) {
  try {
    const [r] = await chrome.scripting.executeScript({ target: { tabId }, func, args });
    return r ? r.result : undefined;
  } catch (e) {
    return undefined; // page is navigating / not ready yet
  }
}

async function poll(timeout, every, alive, fn) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (!alive()) return null;
    const r = await fn();
    if (r) return r;
    await sleep(every);
  }
  return null;
}

function waitForLoad(tabId, timeout = 25000) {
  return new Promise((resolve) => {
    const done = () => { chrome.tabs.onUpdated.removeListener(listener); clearTimeout(t); resolve(); };
    const listener = (id, info) => { if (id === tabId && info.status === "complete") done(); };
    const t = setTimeout(done, timeout);
    chrome.tabs.onUpdated.addListener(listener);
  });
}

async function openProviderTab(cfg, settings, originId) {
  const existing = (await chrome.tabs.query({ url: cfg.match })).filter((t) => t.id !== originId);
  if (existing.length) {
    const t = existing[0];
    if (settings.freshChat) {
      const loaded = waitForLoad(t.id);
      await chrome.tabs.update(t.id, { url: cfg.url, active: settings.showTab });
      await loaded;
    } else if (settings.showTab) {
      await chrome.tabs.update(t.id, { active: true });
    }
    if (settings.showTab) await chrome.windows.update(t.windowId, { focused: true }).catch(() => {});
    return t;
  }
  const t = await chrome.tabs.create({ url: cfg.url, active: settings.showTab });
  await waitForLoad(t.id);
  return t;
}

async function saveHistory(provider, text) {
  const { answer } = Snap.split(text);
  const { history = [] } = await chrome.storage.local.get("history");
  history.unshift({ t: Date.now(), provider, answer, text });
  await chrome.storage.local.set({ history: history.slice(0, 8) });
}

async function runFlow({ alive, originId, base64, settings, cfg, quietFail }) {
  const say = (p) => alive() && toPanel(originId, { provider: cfg.name, ...p });
  // returns "failed" so the caller can try the fallback AI; stays silent when a fallback is coming
  const fail = (text) => { if (!quietFail) say({ state: "error", text }); return "failed"; };

  const aiTab = await openProviderTab(cfg, settings, originId);
  if (!alive()) return;
  const tid = aiTab.id;

  // 1. chat box (fail fast if we're clearly looking at a login wall)
  let loginHits = 0;
  const hasInput = await poll(25000, 300, alive, async () => {
    if (await exec(tid, aiHasInput, [cfg])) return true;
    if ((await exec(tid, aiDetectBlock, [])) === "login") { if (++loginHits >= 10) return "login-wall"; }
    else loginHits = 0;
    return false;
  });
  if (!alive()) return;
  if (hasInput === "login-wall") {
    return fail("You're not logged in to " + cfg.name + ". Open it in this browser, log in, then try again.");
  }
  if (!hasInput) {
    const block = await exec(tid, aiDetectBlock, []);
    if (block === "captcha") return fail(cfg.name + " is asking you to verify you're human. Turn on \"Show the AI tab\" in settings, pass the check once, then try again.");
    if (block === "login") return fail("You're not logged in to " + cfg.name + ". Open it in this browser, log in, then try again.");
    return fail("Couldn't find the chat box on " + cfg.name + ". Make sure you're logged in, or turn on \"Show the AI tab\" in settings.");
  }

  // 2. attach screenshot
  const base = (await exec(tid, aiBaseline, [cfg])) || { resp: cfg.resp.map(() => 0), attach: 0 };
  if (!alive()) return;
  await exec(tid, aiPaste, [cfg, base64]);
  let attached = await poll(8000, 150, alive, async () => (await exec(tid, aiAttachCount, [])) > base.attach);
  if (!attached && alive()) {
    // second try: simulate dragging the file onto the chat box
    await exec(tid, aiDrop, [cfg, base64]);
    attached = await poll(6000, 150, alive, async () => (await exec(tid, aiAttachCount, [])) > base.attach);
  }
  await sleep(250);
  if (!alive()) return;

  // 3. prompt + send
  await exec(tid, aiType, [cfg, settings.prompt + SUFFIX]);
  let sent = false, noneSince = 0;
  await poll(30000, 300, alive, async () => {
    const r = await exec(tid, aiTrySend, [cfg, false]);
    if (r === "sent") { sent = true; return true; }
    if (r === "none") { // no send button found at all: after a few seconds go straight to pressing Enter
      if (!noneSince) noneSince = Date.now();
      return Date.now() - noneSince > 3000;
    }
    noneSince = 0; // "disabled" = still uploading/typing, keep waiting
    return false;
  });
  if (!alive()) return;
  if (!sent) sent = (await exec(tid, aiTrySend, [cfg, true])) === "sent";
  if (!sent) await exec(tid, aiPressEnter, [cfg]);
  else {
    // make sure it really went: the chat box should empty out after sending
    const cleared = await poll(6000, 200, alive, async () => (await exec(tid, aiInputEmpty, [cfg])) === true);
    if (!cleared && alive()) await exec(tid, aiPressEnter, [cfg]);
  }

  // 4. wait for a NEW reply to appear
  say({ state: "waiting" });
  let sel = -1;
  await poll(90000, 250, alive, async () => {
    const r = await exec(tid, aiRead, [cfg, base.resp, -1]);
    if (r && r.sel >= 0) { sel = r.sel; return true; }
    return false;
  });
  if (!alive()) return;
  if (sel < 0) {
    const block = await exec(tid, aiDetectBlock, []);
    if (block === "captcha") return fail(cfg.name + " is asking you to verify you're human. Turn on \"Show the AI tab\" in settings, pass the check once, then try again.");
    return fail("No answer showed up from " + cfg.name + (sent ? "" : " (it couldn't press send, try pressing it yourself)") +
      ". If this keeps happening, turn on \"Show the AI tab\" in settings.");
  }

  // 5. stream until the REAL answer is there.
  // Some AIs (Gemini especially) first show status text such as "Searching the web..." in the
  // reply element. We ignore that and only finish once the reply contains our "FINAL ANSWER:"
  // line and has stopped changing. If the AI never writes that line, we fall back to the
  // longest stable non-status text after a longer grace period.
  const settle = cfg.stop.length ? 1300 : 2200;
    let prev = "", lastChange = Date.now();
  const startedAt = Date.now();
  const hardEnd = startedAt + 300000;
  while (Date.now() < hardEnd) {
    if (!alive()) return;
    await sleep(300);
    const r = await exec(tid, aiRead, [cfg, base.resp, sel]);
    if (!r) continue;
    const txt = r.text || "";
    if (txt !== prev) {
      prev = txt;
      lastChange = Date.now();
      if (!Snap.isStatusOnly(prev)) say({ state: "streaming", text: prev });
    }
    if (!prev || Snap.isStatusOnly(prev)) continue;
    const quiet = Date.now() - lastChange;
    const hasFinal = Snap.hasFinal(prev);
    // normal finish: answer line present, text stopped changing, no Stop button showing
    if (hasFinal && !r.stopping && quiet > settle) break;
    // a Stop button that never goes away must not hang us once the answer line is there
    if (hasFinal && quiet > 10000) break;
    // fallback: no FINAL ANSWER line, but the reply is real text and has been still for a while
    if (!hasFinal && !r.stopping && quiet > 12000 && prev.length > 40) break;
    if (!hasFinal && quiet > 30000 && prev.length > 40) break;
  }
  if (!alive()) return;
  if (!prev || Snap.isStatusOnly(prev)) return fail("Timed out waiting for " + cfg.name + " to answer.");
  say({ state: "done", text: prev });
  saveHistory(cfg.name, prev);
  return "ok";
}

// ---------- functions that run INSIDE the AI page (each must be self-contained) ----------
function aiHasInput(cfg) {
  return cfg.input.some((s) => !!document.querySelector(s));
}

function aiBaseline(cfg) {
  const attach = "img[src^='blob:'], img[src^='data:image'], uploader-file-preview, [data-testid*='attachment'], [data-testid*='file-thumbnail']";
  return {
    resp: cfg.resp.map((s) => document.querySelectorAll(s).length),
    attach: document.querySelectorAll(attach).length
  };
}

function aiAttachCount() {
  const attach = "img[src^='blob:'], img[src^='data:image'], uploader-file-preview, [data-testid*='attachment'], [data-testid*='file-thumbnail']";
  return document.querySelectorAll(attach).length;
}

function aiPaste(cfg, base64) {
  let input = null;
  for (const s of cfg.input) { input = document.querySelector(s); if (input) break; }
  if (!input) return false;
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const dt = new DataTransfer();
  dt.items.add(new File([bytes], "screenshot.jpg", { type: "image/jpeg" }));
  input.focus();
  input.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
  return true;
}

function aiType(cfg, prompt) {
  let input = null;
  for (const s of cfg.input) { input = document.querySelector(s); if (input) break; }
  if (!input) return false;
  input.focus();
  if (input.tagName === "TEXTAREA") {
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set;
    setter.call(input, prompt);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  } else {
    document.execCommand("insertText", false, prompt);
  }
  return true;
}

function aiTrySend(cfg, force) {
  let input = null;
  for (const s of cfg.input) { input = document.querySelector(s); if (input) break; }
  const SEND_RE = /send|envoy|enviar|senden|invia/i;
  const NOT_RE = /stop|arr[\u00eae]t|detener|feedback|attach|upload/i;
  const isDisabled = (b) =>
    b.disabled || b.getAttribute("aria-disabled") === "true" || b.classList.contains("disabled");
  let btn = null;
  for (const s of cfg.send) { btn = document.querySelector(s); if (btn) break; }
  if (!btn && input) {
    let root = input;
    for (let i = 0; i < 10 && root && root.parentElement && !btn; i++) {
      root = root.parentElement;
      btn = [...root.querySelectorAll("button, [role='button']")].find((b) => {
        const label = [b.getAttribute("aria-label"), b.className, b.getAttribute("mattooltip"), b.getAttribute("data-testid")].join(" ");
        const ic = b.querySelector("mat-icon");
        const icon = ic ? (ic.getAttribute("fonticon") || ic.getAttribute("data-mat-icon-name") || ic.textContent || "").trim() : "";
        return !NOT_RE.test(label) && (SEND_RE.test(label) || /^send$/i.test(icon) || b.type === "submit");
      }) || null;
    }
  }
  if (!btn) return "none";
  if (isDisabled(btn) && !force) return "disabled";
  btn.click();
  return "sent";
}

function aiPressEnter(cfg) {
  let input = null;
  for (const s of cfg.input) { input = document.querySelector(s); if (input) break; }
  if (!input) return false;
  input.focus();
  for (const type of ["keydown", "keypress", "keyup"]) {
    input.dispatchEvent(new KeyboardEvent(type, { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true, cancelable: true }));
  }
  return true;
}

function aiRead(cfg, baselines, selKnown) {
  // ser-start
  function ser(node) {
    if (node.nodeType === 3) return node.textContent.replace(/\s+/g, " ");
    if (node.nodeType !== 1) return "";
    const el = node;
    const tag = el.tagName.toLowerCase();
    if (["script", "style", "button", "mat-icon", "svg", "img"].includes(tag)) return "";
    const cls = (el.className && el.className.toString()) || "";
    if (/katex-mathml|sr-only|cdk-visually-hidden|model-thoughts|thoughts-container|thinking-container/.test(cls)) return "";
    if (tag === "model-thoughts" || tag === "thought-container") return "";
    const dm = el.getAttribute("data-math");
    if (dm) return /block/.test(cls) ? "\n" + dm + "\n" : dm;
    if (el.classList.contains("katex") || el.classList.contains("katex-display")) {
      const a = el.querySelector("annotation");
      return a ? a.textContent : el.textContent;
    }
    if (tag === "br") return "\n";
    if (tag === "pre") return "\n```\n" + el.textContent.replace(/\n+$/, "") + "\n```\n";
    if (tag === "tr") {
      return "\n" + [...el.children].map((c) => ser(c).trim()).join(" | ") + "\n";
    }
    const inner = [...el.childNodes].map(ser).join("");
    if (tag === "code") return "`" + inner + "`";
    if (tag === "strong" || tag === "b") return "**" + inner + "**";
    if (/^h[1-6]$/.test(tag)) return "\n\n**" + inner.trim() + "**\n";
    if (tag === "li") {
      const p = el.parentElement;
      let prefix = "\u2022 ";
      if (p && p.tagName.toLowerCase() === "ol") {
        prefix = Array.prototype.indexOf.call(p.children, el) + 1 + ". ";
      }
      return "\n" + prefix + inner.trim() + "\n";
    }
    if (["p", "div", "section", "blockquote", "ul", "ol", "table", "message-content"].includes(tag)) {
      return "\n" + inner + "\n";
    }
    return inner;
  }
  const clean = (t) =>
    t.replace(/[ \t]+\n/g, "\n").replace(/\n[ \t]+/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  // ser-end

  let sel = selKnown;
  if (sel < 0) {
    for (let i = 0; i < cfg.resp.length; i++) {
      if (document.querySelectorAll(cfg.resp[i]).length > baselines[i]) { sel = i; break; }
    }
  }
  if (sel < 0) return { sel: -1 };
  const els = document.querySelectorAll(cfg.resp[sel]);
  const last = els[els.length - 1];
  const text = last ? clean(ser(last)) : "";
  const stopping = cfg.stop.some((s) => !!document.querySelector(s));
  return { sel, text, stopping };
}

function aiInputEmpty(cfg) {
  let input = null;
  for (const s of cfg.input) { input = document.querySelector(s); if (input) break; }
  if (!input) return true;
  const v = input.tagName === "TEXTAREA" ? input.value : input.textContent;
  return !String(v || "").trim();
}

function aiDrop(cfg, base64) {
  let input = null;
  for (const s of cfg.input) { input = document.querySelector(s); if (input) break; }
  if (!input) return false;
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const dt = new DataTransfer();
  dt.items.add(new File([bytes], "screenshot.jpg", { type: "image/jpeg" }));
  const target = input.closest("form") || input.parentElement || input;
  for (const type of ["dragenter", "dragover", "drop"]) {
    target.dispatchEvent(new DragEvent(type, { dataTransfer: dt, bubbles: true, cancelable: true }));
  }
  // last resort: a plain file input on the page
  const fi = document.querySelector("input[type='file']");
  if (fi) {
    try { fi.files = dt.files; fi.dispatchEvent(new Event("change", { bubbles: true })); } catch (e) {}
  }
  return true;
}

function aiDetectBlock() {
  const body = document.body;
  const t = ((body && (body.innerText || body.textContent)) || "").replace(/\s+/g, " ").slice(0, 3000);
  if (/verify you are human|just a moment|checking your browser|cloudflare|are you a robot|captcha/i.test(t + " " + document.title)) return "captcha";
  const path = location.pathname + location.hostname;
  if (/login|log-in|signin|sign-in|auth|accounts\.google/i.test(path)) return "login";
  if (/(log in|sign in|se connecter|connexion)/i.test(t) && !document.querySelector("textarea, div[contenteditable='true']")) return "login";
  return null;
}
