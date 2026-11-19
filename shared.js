(function (g) {
  const Snap = (g.Snap = g.Snap || {});

  Snap.DEFAULT_PROMPT =
    "Give me the answer and a quick explanation.";

  Snap.DEFAULTS = {
    enabled: true,
    provider: "gemini",
    freshChat: true,
    showTab: false,
    autoCopy: false,
    fallback: "",
    prompt: Snap.DEFAULT_PROMPT
  };

  Snap.PROVIDER_UI = [
    { id: "gemini", name: "Gemini", color: "#4285f4" },
    { id: "chatgpt", name: "ChatGPT", color: "#10a37f" },
    { id: "claude", name: "Claude", color: "#d97757" },
    { id: "grok", name: "Grok", color: "#6b7280" },
    { id: "copilot", name: "Copilot", color: "#7c3aed" },
    { id: "perplexity", name: "Perplexity", color: "#20808d" },
    { id: "deepseek", name: "DeepSeek", color: "#4d6bfe" },
    { id: "mistral", name: "Mistral", color: "#fa520f" }
  ];

  Snap.esc = (s) =>
    String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // True when the reply contains a real "FINAL ANSWER: ..." line.
  Snap.hasFinal = (text) => !!Snap.split(text).answer;

  // True when the text is only a progress/status line (e.g. Gemini's "Searching the web"),
  // not a real answer yet.
  Snap.isStatusOnly = function (text) {
    const t = String(text || "").replace(/\s+/g, " ").trim();
    if (!t) return true;
    if (Snap.hasFinal(t)) return false;
    const STATUS =
      /^(show thinking\s*)?(gemini said\s*)?(searching( the web| for)?|looking( it)? up|browsing|reading|analy[sz]ing( the)?( image| screenshot)?|thinking|reasoning|working on it|generating|processing|loading|just a (moment|sec)|one moment|let me|i('| a)m (searching|looking|analy|thinking|checking)|recherche|r\u00e9flexion|analyse|chargement)\b/i;
    if (STATUS.test(t) && t.length < 120) return true;
    return t.length < 12;
  };

  // Pulls the "FINAL ANSWER: ..." line out of a reply.
  Snap.split = function (text) {
    const re = /^[\s*_#>-]*FINAL ANSWER[\s*:_]*(.+?)[\s*_]*$/gim;
    let m, last = null;
    while ((m = re.exec(text))) last = m;
    if (!last) return { answer: "", explanation: String(text || "").trim() };
    const answer = last[1].replace(/\*\*|`/g, "").replace(/^\$+|\$+$/g, "").trim();
    // the site echoed our instruction instead of answering
    if (/^<?\s*only the final answer/i.test(answer)) return { answer: "", explanation: String(text || "").trim() };
    const explanation = (text.slice(0, last.index) + text.slice(last.index + last[0].length)).trim();
    return { answer, explanation };
  };

  // Tiny markdown-ish renderer for the serialized AI reply.
  Snap.render = function (text) {
    const esc = Snap.esc;
    const inline = (s) => {
      s = esc(s);
      s = s.replace(/`([^`\n]+)`/g, "<code>$1</code>");
      s = s.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
      s = s.replace(/(\w|\))\^(-?[A-Za-z0-9.]+|\([^)\n]+\))/g, (m, a, b) =>
        a + "<sup>" + b.replace(/^\(|\)$/g, "") + "</sup>");
      s = s.replace(/sqrt\(/g, "\u221a(").replace(/&lt;=/g, "\u2264").replace(/&gt;=/g, "\u2265").replace(/!=/g, "\u2260");
      return s;
    };
    const BUL = /^\s*[\u2022*-]\s+/;
    const NUM = /^\s*(\d+)[.)]\s+(.*)$/;
    const lines = String(text || "").replace(/\r/g, "").split("\n");
    const blank = (l) => !l.trim();
    let html = "", i = 0, m;
    while (i < lines.length) {
      const l = lines[i];
      if (blank(l)) { i++; continue; }
      if (/^```/.test(l.trim())) {
        const buf = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i].trim())) buf.push(lines[i++]);
        i++;
        html += "<pre><code>" + esc(buf.join("\n")) + "</code></pre>";
        continue;
      }
      if (BUL.test(l)) {
        html += "<ul>";
        while (i < lines.length && BUL.test(lines[i])) html += "<li>" + inline(lines[i++].replace(BUL, "")) + "</li>";
        html += "</ul>";
        continue;
      }
      if (NUM.test(l)) {
        html += '<ol class="steps">';
        while (i < lines.length && (m = lines[i].match(NUM))) {
          html += '<li data-n="' + m[1] + '">' + inline(m[2]) + "</li>";
          i++;
        }
        html += "</ol>";
        continue;
      }
      if ((m = l.match(/^\s*\*\*([^*]+)\*\*:?\s*$/))) {
        html += "<h4>" + inline(m[1]) + "</h4>";
        i++;
        continue;
      }
      const buf = [];
      while (
        i < lines.length && !blank(lines[i]) && !/^```/.test(lines[i].trim()) &&
        !BUL.test(lines[i]) && !/^\s*\d+[.)]\s+/.test(lines[i])
      ) buf.push(lines[i++]);
      if (!buf.length) buf.push(lines[i++]);
      html += "<p>" + buf.map(inline).join("<br>") + "</p>";
    }
    return html;
  };

  Snap.timeAgo = function (t) {
    const s = Math.max(0, Math.round((Date.now() - t) / 1000));
    if (s < 45) return "now";
    if (s < 3600) return Math.round(s / 60) + "m";
    if (s < 86400) return Math.round(s / 3600) + "h";
    return Math.round(s / 86400) + "d";
  };
})(typeof self !== "undefined" ? self : globalThis);
