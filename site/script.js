(function () {
  "use strict";

  var nav = document.getElementById("nav");
  var year = document.getElementById("year");

  if (year) year.textContent = new Date().getFullYear();

  function onScroll() {
    if (!nav) return;
    nav.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  var items = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));

  if (!("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("in"); });
    return;
  }

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
  );

  // Small stagger for siblings revealed in the same batch.
  var groups = new Map();
  items.forEach(function (el) {
    var parent = el.parentElement;
    if (!groups.has(parent)) groups.set(parent, 0);
    var i = groups.get(parent);
    groups.set(parent, i + 1);
    if (i > 0 && i < 6) el.style.transitionDelay = i * 65 + "ms";
    io.observe(el);
  });

  // Keep one troubleshooting item open at a time.
  var fixes = Array.prototype.slice.call(document.querySelectorAll("details.fix"));
  fixes.forEach(function (d) {
    d.addEventListener("toggle", function () {
      if (!d.open) return;
      fixes.forEach(function (other) {
        if (other !== d) other.open = false;
      });
    });
  });

  // A quiet nod for anyone who tries the shortcut on the site.
  var konami = ["a", "l", "t", "s"];
  var keys = [];
  document.addEventListener("keydown", function (e) {
    if (e.altKey && e.key.toLowerCase() === "s") {
      e.preventDefault();
      var sig = document.querySelector(".sig");
      if (sig) {
        sig.style.opacity = "1";
        setTimeout(function () { sig.style.opacity = ""; }, 2600);
      }
      return;
    }
    if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
    keys.push(e.key.toLowerCase());
    if (keys.length > konami.length) keys.shift();
    if (keys.join("") === konami.join("")) {
      var cta = document.querySelector(".cta h2 em");
      if (cta) {
        cta.textContent = "Show it.";
        cta.animate(
          [{ transform: "scale(1)" }, { transform: "scale(1.04)" }, { transform: "scale(1)" }],
          { duration: 600, easing: "cubic-bezier(.22,.68,0,1)" }
        );
      }
      keys = [];
    }
  });
})();
