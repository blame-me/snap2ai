const $ = (id) => document.getElementById(id);
const Snap = self.Snap;
let S = { ...Snap.DEFAULTS };

const COPY_SVG = '<svg class="icon" viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>';
const CHECK_SVG = '<svg class="icon" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

function paint() {
  document.body.classList.toggle("off", !S.enabled);
  $("on").checked = S.enabled;
  $("state").textContent = S.enabled ? "Ready" : "Turned off";
  $("go").disabled = !S.enabled;
  document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c.dataset.id === S.provider));
}

function buildChips() {
  $("chips").innerHTML = "";
  for (const p of Snap.PROVIDER_UI) {
    const b = document.createElement("button");
    b.className = "chip";
    b.dataset.id = p.id;
    b.innerHTML = `<span class="dot" style="background:${p.color}"></span>${p.name}`;
    b.onclick = () => { S.provider = p.id; chrome.storage.sync.set({ provider: p.id }); paint(); };
    $("chips").appendChild(b);
  }
}

async function renderHistory() {
  const { history = [] } = await chrome.storage.local.get("history");
  const box = $("hist");
  box.innerHTML = "";
  if (!history.length) {
    box.innerHTML = '<div class="empty">Your answers will show up here.</div>';
    return;
  }
  for (const h of history.slice(0, 4)) {
    const row = document.createElement("div");
    row.className = "h";
    const text = h.answer || (h.text || "").replace(/\s+/g, " ").slice(0, 70);
    row.innerHTML = `<div class="grow"><div class="tag"></div><div class="tx"></div></div><button class="cp" title="Copy">${COPY_SVG}</button>`;
    row.querySelector(".tag").textContent = `${h.provider} \u00b7 ${Snap.timeAgo(h.t)}`;
    row.querySelector(".tx").textContent = text;
    row.querySelector(".tx").title = text;
    const btn = row.querySelector(".cp");
    btn.onclick = async () => {
      try { await navigator.clipboard.writeText(h.answer || h.text); } catch (e) {}
      btn.innerHTML = CHECK_SVG; btn.classList.add("ok");
      setTimeout(() => { btn.innerHTML = COPY_SVG; btn.classList.remove("ok"); }, 1300);
    };
    box.appendChild(row);
  }
}

(async () => {
  buildChips();
  S = { ...S, ...(await chrome.storage.sync.get(Snap.DEFAULTS)) };
  paint();
  renderHistory();

  const cmds = await chrome.commands.getAll();
  const c = cmds.find((x) => x.name === "capture");
  if (c && c.shortcut) $("key").textContent = c.shortcut.replace(/\+/g, " + ");
  else { $("key").textContent = "no shortcut"; $("hint").textContent = "Set a shortcut in Settings"; }
})();

$("on").onchange = async () => {
  S.enabled = $("on").checked;
  await chrome.storage.sync.set({ enabled: S.enabled });
  paint();
};
$("go").onclick = () => {
  chrome.runtime.sendMessage({ type: "capture-now" });
  window.close();
};
$("opt").onclick = () => chrome.runtime.openOptionsPage();
chrome.storage.onChanged.addListener((c, area) => { if (area === "local" && c.history) renderHistory(); });
