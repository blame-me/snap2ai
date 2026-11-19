(() => {
  if (window.__snap2aiPanel) return;
  window.__snap2aiPanel = true;
  const Snap = self.Snap;

  const SVG = (inner, extra = "") =>
    `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${inner}</svg>`;
  const ICON = {
    logo:
      '<svg class="logo" viewBox="0 0 24 24"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#a855f7"/></linearGradient></defs><rect width="24" height="24" rx="6.5" fill="url(#g)"/><path d="M7 10V7.6a.6.6 0 0 1 .6-.6H10M14 7h2.4a.6.6 0 0 1 .6.6V10M17 14v2.4a.6.6 0 0 1-.6.6H14M10 17H7.6a.6.6 0 0 1-.6-.6V14" stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none"/><path d="M12 9.6l.75 1.65 1.65.75-1.65.75L12 14.4l-.75-1.65-1.65-.75 1.65-.75z" fill="#fff"/></svg>',
    copy: SVG('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>'),
    down: SVG('<path d="M6 9l6 6 6-6"/>'),
    up: SVG('<path d="M6 15l6-6 6 6"/>'),
    close: SVG('<path d="M6 6l12 12M18 6L6 18"/>'),
    check: SVG('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    stop: SVG('<rect x="6.5" y="6.5" width="11" height="11" rx="2.5" fill="currentColor"/>'),
    retry: SVG('<path d="M4 12a8 8 0 1 0 2.6-5.9"/><path d="M4 4v4.2h4.2"/>'),
    power: SVG('<path d="M12 3v8"/><path d="M6.4 6.6a8 8 0 1 0 11.2 0"/>')
  };

  let host = null, R = {}, full = "", answer = "", autoCopy = false, pos = null, minimized = false, running = false;

  async function copyText(t) {
    try { await navigator.clipboard.writeText(t); return true; }
    catch (e) {
      try {
        const ta = document.createElement("textarea");
        ta.value = t;
        ta.style.cssText = "position:fixed;opacity:0;top:0;left:0";
        document.documentElement.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        ta.remove();
        return ok;
      } catch (_) { return false; }
    }
  }

  function flash(btn, okLabel, html) {
    if (!btn._orig) btn._orig = btn.innerHTML;
    btn.innerHTML = html;
    btn.classList.add("ok");
    clearTimeout(btn._t);
    btn._t = setTimeout(() => { btn.innerHTML = btn._orig; btn.classList.remove("ok"); }, 1500);
  }

  const CSS = `
    *{box-sizing:border-box}
    :host{all:initial}
    .card{--bg:#fff;--fg:#0f172a;--muted:#64748b;--line:#e5e7ef;--soft:#f3f4fa;--accent:#6366f1;--accent2:#a855f7;
      --okbg:#ecfdf3;--okline:#b7ebc9;--ok:#15803d;--errbg:#fef2f2;--errline:#fecaca;--err:#dc2626;
      position:relative;background:var(--bg);color:var(--fg);border:1px solid var(--line);border-radius:16px;overflow:hidden;
      box-shadow:0 18px 50px rgba(15,23,42,.28),0 2px 8px rgba(15,23,42,.12);
      font:14px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;user-select:text;animation:pop .22s ease-out}
    @media (prefers-color-scheme:dark){
      .card{--bg:#151821;--fg:#f1f5f9;--muted:#94a3b8;--line:#272c3a;--soft:#1c202b;
        --okbg:#0f2a1b;--okline:#14532d;--ok:#4ade80;--errbg:#2b1315;--errline:#5b1d22;--err:#f87171;
        box-shadow:0 18px 50px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.04)}
    }
    @keyframes pop{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}
    @keyframes slide{0%{transform:translateX(-100%)}100%{transform:translateX(350%)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
    @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
    @keyframes rise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
    .bar{height:3px;background:transparent;overflow:hidden}
    .bar i{display:none;width:30%;height:100%;background:linear-gradient(90deg,transparent,var(--accent),var(--accent2),transparent);animation:slide 1.2s ease-in-out infinite}
    .card.run .bar i{display:block}
    .hd{display:flex;align-items:center;gap:8px;padding:10px 10px 10px 12px;cursor:grab;touch-action:none}
    .hd:active{cursor:grabbing}
    .logo{width:26px;height:26px;display:block;flex:none}
    .tt{font-weight:700;letter-spacing:-.2px}
    .pv{font-size:11px;font-weight:600;color:var(--muted);background:var(--soft);border:1px solid var(--line);padding:1px 8px;border-radius:999px}
    .st{flex:1;display:flex;align-items:center;justify-content:flex-end;gap:6px;color:var(--muted);font-size:12px;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .dot{width:8px;height:8px;border-radius:50%;background:#94a3b8;flex:none}
    .card.run .dot{background:#f59e0b;animation:pulse 1s infinite}
    .card.good .dot{background:#22c55e}
    .card.bad .dot{background:var(--err)}
    .ib{display:grid;place-items:center;width:28px;height:28px;border:0;background:transparent;color:var(--muted);border-radius:8px;cursor:pointer}
    .ib:hover{background:var(--soft);color:var(--fg)}
    .ib.ok{color:var(--ok)}
    .i{width:16px;height:16px;display:block}
    .ans{display:none;gap:12px;align-items:center;margin:0 12px 10px;padding:12px 12px 12px 14px;border-radius:12px;
      background:var(--okbg);border:1px solid var(--okline);animation:rise .25s ease-out}
    .ans.show{display:flex}
    .al{font-size:10.5px;font-weight:800;letter-spacing:.9px;color:var(--ok);margin-bottom:2px}
    .av{font-size:19px;font-weight:750;line-height:1.3;word-wrap:break-word;overflow-wrap:anywhere}
    .pbtn{flex:none;display:inline-flex;align-items:center;gap:7px;border:0;cursor:pointer;color:#fff;font:600 13px system-ui,sans-serif;
      padding:9px 13px;border-radius:10px;background:linear-gradient(135deg,var(--accent),var(--accent2));
      transition:transform .08s,box-shadow .12s}
    .pbtn:hover{box-shadow:0 4px 14px rgba(124,58,237,.45)}
    .pbtn:active{transform:scale(.97)}
    .pbtn.ok{background:#16a34a}
    .bd{padding:2px 14px 12px;max-height:min(44vh,400px);overflow:auto;overflow-wrap:anywhere}
    .bd:empty{display:none}
    .lbl{font-size:10.5px;font-weight:800;letter-spacing:.9px;color:var(--muted);margin:2px 0 6px}
    .bd p{margin:0 0 9px}
    .bd h4{margin:12px 0 6px;font-size:13.5px}
    .bd ul{margin:0 0 9px;padding-left:20px}
    .bd li{margin:3px 0}
    .bd ol.steps{list-style:none;margin:0 0 9px;padding:0}
    .bd ol.steps li{position:relative;padding:2px 0 2px 32px;margin:7px 0;min-height:24px}
    .bd ol.steps li:before{content:attr(data-n);position:absolute;left:0;top:1px;width:23px;height:23px;border-radius:50%;
      display:grid;place-items:center;font-size:12px;font-weight:700;color:#fff;background:linear-gradient(135deg,var(--accent),var(--accent2))}
    .bd code{font:12.5px ui-monospace,Consolas,monospace;background:var(--soft);border:1px solid var(--line);padding:0 5px;border-radius:5px}
    .bd pre{margin:0 0 9px;padding:10px 12px;background:var(--soft);border:1px solid var(--line);border-radius:10px;overflow:auto}
    .bd pre code{background:none;border:0;padding:0}
    .bd sup{font-size:.72em;line-height:0}
    .bd::-webkit-scrollbar{width:8px}.bd::-webkit-scrollbar-thumb{background:var(--line);border-radius:8px}
    .sk{padding:6px 0 2px}
    .sk i{display:block;height:11px;border-radius:6px;margin:9px 0;
      background:linear-gradient(90deg,var(--soft) 25%,var(--line) 37%,var(--soft) 63%);background-size:300% 100%;animation:shimmer 1.4s linear infinite}
    .cap{color:var(--muted);font-size:12.5px;margin-top:4px}
    .msg{display:flex;gap:10px;align-items:flex-start;padding:11px 12px;border-radius:12px;border:1px solid var(--line);background:var(--soft)}
    .msg.err{background:var(--errbg);border-color:var(--errline);color:var(--err)}
    .msg b{display:block;margin-bottom:2px}
    .ft{display:flex;align-items:center;gap:8px;padding:8px 12px 10px;border-top:1px solid var(--line);font-size:12px;color:var(--muted)}
    .ft .sp{flex:1}
    .kbd{font:600 11px ui-monospace,Consolas,monospace;background:var(--soft);border:1px solid var(--line);border-radius:5px;padding:0 5px}
    .fb{display:none;align-items:center;gap:6px;border:1px solid var(--line);background:var(--bg);color:var(--fg);cursor:pointer;
      font:600 12px system-ui,sans-serif;padding:5px 10px;border-radius:8px}
    .fb:hover{background:var(--soft)}
    .fb .i{width:14px;height:14px}
    .card.run .fb.stop,.card.bad .fb.retry,.card.off .fb.on{display:inline-flex}
    .card.min .bd,.card.min .ft{display:none}
    .card.min .ans{margin-bottom:12px}
  `;

  function build() {
    host = document.createElement("div");
    host.style.cssText =
      "all:initial;position:fixed;right:18px;bottom:18px;z-index:2147483647;display:block;width:min(430px,calc(100vw - 24px))";
    if (pos) { host.style.left = pos.x + "px"; host.style.top = pos.y + "px"; host.style.right = "auto"; host.style.bottom = "auto"; }
    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = `
      <style>${CSS}</style>
      <div class="card">
        <div class="bar"><i></i></div>
        <div class="hd">
          ${ICON.logo}<span class="tt">Snap2AI</span><span class="pv"></span>
          <span class="st"><i class="dot"></i><span class="stt"></span></span>
          <button class="ib" data-a="all" title="Copy the whole reply">${ICON.copy}</button>
          <button class="ib" data-a="min" title="Minimize">${ICON.down}</button>
          <button class="ib" data-a="close" title="Close">${ICON.close}</button>
        </div>
        <div class="ans"><div style="flex:1;min-width:0"><div class="al">ANSWER</div><div class="av"></div></div>
          <button class="pbtn" data-a="ans">${ICON.copy}<span>Copy answer</span></button></div>
        <div class="bd"></div>
        <div class="ft"><span>Press <span class="kbd">Alt</span> + <span class="kbd">S</span> to ask again</span><span class="sp"></span>
          <button class="fb stop" data-a="stop">${ICON.stop}Stop</button>
          <button class="fb retry" data-a="retry">${ICON.retry}Try again</button>
          <button class="fb on" data-a="on">${ICON.power}Turn on &amp; capture</button></div>
      </div>`;
    R = {
      card: root.querySelector(".card"),
      prov: root.querySelector(".pv"),
      stt: root.querySelector(".stt"),
      ans: root.querySelector(".ans"),
      av: root.querySelector(".av"),
      bd: root.querySelector(".bd"),
      all: root.querySelector('[data-a="all"]'),
      min: root.querySelector('[data-a="min"]'),
      ansBtn: root.querySelector('[data-a="ans"]')
    };
    root.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-a]");
      if (!b) return;
      const a = b.dataset.a;
      if (a === "close") { host.remove(); host = null; }
      else if (a === "min") {
        minimized = !minimized;
        R.card.classList.toggle("min", minimized);
        R.min.innerHTML = minimized ? ICON.up : ICON.down;
        R.min.title = minimized ? "Expand" : "Minimize";
      }
      else if (a === "all") { if (await copyText(full)) flash(R.all, "", ICON.check); }
      else if (a === "ans") { if (await copyText(answer)) flash(R.ansBtn, "", ICON.check + "<span>Copied</span>"); }
      else if (a === "stop") chrome.runtime.sendMessage({ type: "cancel" });
      else if (a === "retry") chrome.runtime.sendMessage({ type: "retry" });
      else if (a === "on") chrome.runtime.sendMessage({ type: "enable" });
    });
    // drag by the header
    const hd = root.querySelector(".hd");
    hd.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button")) return;
      const r = host.getBoundingClientRect();
      const dx = e.clientX - r.left, dy = e.clientY - r.top;
      hd.setPointerCapture(e.pointerId);
      const move = (ev) => {
        const x = Math.min(Math.max(0, ev.clientX - dx), Math.max(0, innerWidth - r.width));
        const y = Math.min(Math.max(0, ev.clientY - dy), Math.max(0, innerHeight - 48));
        host.style.left = x + "px"; host.style.top = y + "px";
        host.style.right = "auto"; host.style.bottom = "auto";
        pos = { x, y };
      };
      const up = () => { hd.removeEventListener("pointermove", move); hd.removeEventListener("pointerup", up); };
      hd.addEventListener("pointermove", move);
      hd.addEventListener("pointerup", up);
    });
    R.card.classList.toggle("min", minimized);
    document.documentElement.appendChild(host);
  }

  let tick = null, t0 = 0, baseStatus = "";
  function set(cls, status) {
    R.card.classList.remove("run", "good", "bad", "off");
    if (cls) R.card.classList.add(cls);
    const wasRunning = running;
    running = cls === "run";
    baseStatus = status || "";
    R.stt.textContent = baseStatus;
    if (running && !wasRunning) t0 = Date.now();
    clearInterval(tick);
    if (running) {
      tick = setInterval(() => {
        if (!R.stt) return;
        const s = Math.round((Date.now() - t0) / 1000);
        R.stt.textContent = baseStatus + (s >= 3 ? " " + s + "s" : "");
      }, 1000);
    }
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && host && host.isConnected && host.style.display !== "none") {
      if (running) chrome.runtime.sendMessage({ type: "cancel" });
      host.remove(); host = null; clearInterval(tick); running = false;
    }
  }, true);

  const skeleton = (caption) =>
    `<div class="sk"><i></i><i style="width:82%"></i><i style="width:55%"></i></div><div class="cap">${Snap.esc(caption)}</div>`;

  function showAnswer(text) {
    const s = Snap.split(text);
    answer = s.answer;
    R.ans.classList.toggle("show", !!answer);
    R.av.textContent = answer;
    R.bd.innerHTML = s.explanation
      ? (answer ? '<div class="lbl">EXPLANATION</div>' : "") + Snap.render(s.explanation)
      : "";
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type !== "panel") return;
    if (msg.state === "hide") { if (host) host.style.display = "none"; return; }
    if (!host || !host.isConnected) build();
    host.style.display = "block";
    const prov = msg.provider || R.prov.textContent || "AI";
    R.prov.textContent = prov;

    switch (msg.state) {
      case "sending":
        full = ""; answer = "";
        if (typeof msg.autoCopy === "boolean") autoCopy = msg.autoCopy;
        R.ans.classList.remove("show");
        set("run", "Sending\u2026");
        R.bd.innerHTML = skeleton("Sending your screenshot to " + prov + "\u2026");
        break;
      case "waiting":
        set("run", "Thinking\u2026");
        if (!full) R.bd.innerHTML = skeleton(prov + " is working on it\u2026");
        break;
      case "streaming":
      case "done":
        if (msg.text && msg.text !== full) { full = msg.text; showAnswer(full); }
        if (msg.state === "streaming") set("run", "Answering\u2026");
        else {
          set("good", "Done");
          if (autoCopy && answer) {
            copyText(answer).then((ok) => ok && flash(R.ansBtn, "", ICON.check + "<span>Copied</span>"));
          }
        }
        break;
      case "info":
        set("run", msg.text || "Working\u2026");
        R.bd.innerHTML = skeleton(msg.text || "Working\u2026");
        full = "";
        break;
      case "cancelled":
        set("bad", "Stopped");
        R.bd.innerHTML = '<div class="msg"><div><b>Stopped</b>Nothing more will be added to this answer.</div></div>';
        break;
      case "off":
        set("off", "Off");
        R.ans.classList.remove("show");
        R.bd.innerHTML = '<div class="msg"><div><b>Snap2AI is turned off</b>Turn it on to capture your screen.</div></div>';
        break;
      case "error":
        set("bad", "Problem");
        R.ans.classList.remove("show");
        R.bd.innerHTML = '<div class="msg err"><div><b>Something went wrong</b>' + Snap.esc(msg.text || "Unknown error.") + "</div></div>";
        break;
    }
  });
})();
