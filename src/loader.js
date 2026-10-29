// Loading screen. Inlined by build.cjs right after the loader markup, so it runs before the page paints.
// The counter follows real progress (document, images, window load), stays at least MIN_MS so the
// animation reads, never blocks longer than MAX_MS, and only shows once per browser session.
(function () {
  var root = document.documentElement;
  var loader = document.getElementById("loader");
  if (!loader) return;
  var seen = false;
  try {
    seen = sessionStorage.getItem("qa-loader-seen") === "1";
  } catch (e) {}
  if (seen) {
    loader.remove();
    return;
  }
  root.classList.add("is-loading");

  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var MIN_MS = reduced ? 400 : 1400;
  var MAX_MS = 8000;
  var start = performance.now();
  var count = loader.querySelector("[data-count]");
  var bar = loader.querySelector("[data-bar]");
  var note = loader.querySelector("[data-note]");
  var notes = ["Preparing the workspace", "Collecting projects", "Drawing the orbit", "Lighting the stage", "Almost there"];
  var target = 8;
  var shown = 0;
  var finished = false;

  var noteIndex = 0;
  var noteTimer = setInterval(function () {
    noteIndex = (noteIndex + 1) % notes.length;
    note.textContent = notes[noteIndex];
  }, 650);

  // Progress: 0–30 while the document parses, 30–90 as above-the-fold images arrive, 100 on load.
  document.addEventListener("DOMContentLoaded", function () {
    target = Math.max(target, 30);
    var images = Array.prototype.filter.call(document.images, function (img) {
      return img.loading !== "lazy";
    });
    var done = 0;
    var tick = function () {
      done++;
      target = Math.max(target, 30 + (60 * done) / Math.max(images.length, 1));
    };
    if (!images.length) target = 90;
    images.forEach(function (img) {
      if (img.complete) tick();
      else {
        img.addEventListener("load", tick, { once: true });
        img.addEventListener("error", tick, { once: true });
      }
    });
  });
  addEventListener("load", function () {
    target = 100;
  });

  function finish() {
    if (finished) return;
    finished = true;
    clearInterval(noteTimer);
    count.textContent = "100";
    bar.style.transform = "scaleX(1)";
    loader.classList.add("done");
    root.classList.remove("is-loading");
    try {
      sessionStorage.setItem("qa-loader-seen", "1");
    } catch (e) {}
    dispatchEvent(new Event("loader-done"));
    setTimeout(function () {
      loader.remove();
    }, reduced ? 300 : 1100);
  }

  // Ring of discs turning round a vertical axis, seen slightly from above. Each disc faces outwards,
  // so it narrows at the sides; discs at the back are smaller, higher, dimmer and blurred.
  var discs = Array.prototype.slice.call(loader.querySelectorAll("[data-ring] span"));
  var RX = 150; // ring radius on screen, px
  var TILT = 0.32; // how far the back rises (vertical squash of the orbit)
  var FOCAL = 520;
  // Disc colours run round the theme gradient (--a1 -> --a2 -> --a1), shifted by the turn.
  var css = getComputedStyle(root);
  var hex = function (name) {
    var h = css.getPropertyValue(name).trim().replace("#", "");
    return [0, 2, 4].map(function (k) { return parseInt(h.slice(k, k + 2), 16); });
  };
  var A1 = hex("--a1");
  var A2 = hex("--a2");
  var mix = function (t) {
    var w = (1 - Math.cos(t * Math.PI * 2)) / 2; // 0 at a1, 1 at a2, back to a1
    return A1.map(function (c, k) { return Math.round(c + (A2[k] - c) * w); });
  };
  var rgb = function (c, a) { return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")"; };
  function ring(now) {
    var turn = reduced ? 0.35 : now * 0.0009;
    for (var i = 0; i < discs.length; i++) {
      var a = turn + (i / discs.length) * Math.PI * 2;
      var x = Math.sin(a) * RX;
      var z = Math.cos(a) * RX; // +RX = front
      var depth = (z / RX + 1) / 2; // 0 back .. 1 front
      var p = FOCAL / (FOCAL - z * 0.9);
      var y = z * TILT;
      var face = Math.max(0.12, Math.abs(Math.cos(a)));
      var d = discs[i];
      d.style.transform =
        "translate3d(" + (x * p).toFixed(1) + "px," + (y * p).toFixed(1) + "px,0) scale(" + (face * p).toFixed(3) + "," + p.toFixed(3) + ")";
      d.style.opacity = (0.12 + 0.88 * Math.pow(depth, 1.6)).toFixed(3);
      d.style.filter = "blur(" + ((1 - depth) * 7).toFixed(1) + "px)";
      d.style.zIndex = String(Math.round(depth * 100));
      var t = (i / discs.length + turn / (Math.PI * 2) * 0.6) % 1;
      var c1 = mix(t);
      var c2 = mix(t + 0.33);
      d.style.background = "linear-gradient(135deg, " + rgb(c1, 1) + ", " + rgb(c2, 1) + ")";
      d.style.boxShadow = "0 0 " + Math.round(10 + depth * 22) + "px " + rgb(c1, 0.35 * depth);
    }
  }

  function frame(now) {
    if (finished) return;
    ring(now);
    var elapsed = now - start;
    // The shown number eases towards the real target, and cannot outrun the minimum duration.
    var cap = Math.min(100, (elapsed / MIN_MS) * 100);
    shown += (Math.min(target, cap) - shown) * 0.12;
    if (target >= 100 && cap >= 100 && shown > 99.4) shown = 100;
    var value = Math.round(shown);
    count.textContent = (value < 10 ? "00" : value < 100 ? "0" : "") + value;
    bar.style.transform = "scaleX(" + shown / 100 + ")";
    if (value >= 100 || elapsed > MAX_MS) finish();
    else requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
