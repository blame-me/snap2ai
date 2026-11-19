const $ = (id) => document.getElementById(id);
const Snap = self.Snap;
let S = { ...Snap.DEFAULTS };
let toastT;

function toast(t = "Saved") {
  $("toast").textContent = t;
  $("toast").classList.add("show");
  clearTimeout(toastT);
  toastT = setTimeout(() => $("toast").classList.remove("show"), 1100);
}
const save = (patch) => { Object.assign(S, patch); chrome.storage.sync.set(patch).then(() => toast()); };

function paintChips() {
  document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c.dataset.id === S.provider));
}

(async () => {
  for (const p of Snap.PROVIDER_UI) {
    const b = document.createElement("button");
    b.className = "chip";
    b.dataset.id = p.id;
    b.innerHTML = `<span class="dot" style="background:${p.color}"></span>${p.name}`;
    b.onclick = () => { save({ provider: p.id }); paintChips(); };
    $("chips").appendChild(b);
  }
  S = { ...S, ...(await chrome.storage.sync.get(Snap.DEFAULTS)) };
  paintChips();
  const fb = $("fallback");
  fb.innerHTML = '<option value="">None</option>' + Snap.PROVIDER_UI.map((p) => `<option value="${p.id}">${p.name}</option>`).join("");
  fb.value = S.fallback || "";
  fb.onchange = () => save({ fallback: fb.value });
  $("prompt").value = S.prompt;
  for (const k of ["freshChat", "autoCopy", "showTab"]) {
    $(k).checked = !!S[k];
    $(k).onchange = () => save({ [k]: $(k).checked });
  }
  const cmds = await chrome.commands.getAll();
  const c = cmds.find((x) => x.name === "capture");
  $("key").textContent = c && c.shortcut ? c.shortcut.replace(/\+/g, " + ") : "Not set";
})();

let pt;
$("prompt").oninput = () => {
  clearTimeout(pt);
  pt = setTimeout(() => save({ prompt: $("prompt").value.trim() || Snap.DEFAULT_PROMPT }), 450);
};
$("reset").onclick = () => { $("prompt").value = Snap.DEFAULT_PROMPT; save({ prompt: Snap.DEFAULT_PROMPT }); };
$("chg").onclick = () => chrome.tabs.create({ url: "chrome://extensions/shortcuts" });

// ---- About / Settings tabs (opens on About) ----
function showView(v) {
  v = v === "settings" ? "settings" : "about";
  for (const n of ["about", "settings"]) {
    $("view-" + n).classList.toggle("active", n === v);
    $("tab-" + n).classList.toggle("active", n === v);
    $("tab-" + n).setAttribute("aria-selected", String(n === v));
  }
  history.replaceState(null, "", "#" + v);
}
document.querySelectorAll(".tab").forEach((b) => (b.onclick = () => showView(b.dataset.view)));
$("toSettings").onclick = () => showView("settings");
$("certMeta").textContent = "Snap2AI v" + chrome.runtime.getManifest().version + " \u00b7 github.com/blame-me";
showView(location.hash === "#settings" ? "settings" : "about");
