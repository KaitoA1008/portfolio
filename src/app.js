// Interactions for the dark portfolio. No dependencies.
(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  // Runs fn(time) at ~fps while the element is on screen and the tab is visible.
  function loopWhileVisible(el, fps, fn) {
    let visible = false;
    let raf = 0;
    let last = 0;
    const tick = (t) => {
      raf = 0;
      if (!visible || document.hidden) return;
      if (t - last >= 1000 / fps) {
        last = t;
        fn(t);
      }
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(tick);
    };
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      start();
    }).observe(el);
    document.addEventListener("visibilitychange", start);
  }

  function fitCanvas(canvas) {
    const ratio = 1; // decorative canvases: device pixels would cost more than they show
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { ctx, width, height };
  }

  // ---------- reveal on scroll ----------
  const revealer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          revealer.unobserve(entry.target);
        }
      }),
    { rootMargin: "0px 0px -8% 0px" },
  );
  $$(".reveal").forEach((el) => revealer.observe(el));

  // ---------- pause CSS animations in sections that are off screen ----------
  const offscreen = new IntersectionObserver(
    (entries) => entries.forEach((entry) => entry.target.toggleAttribute("data-offscreen", !entry.isIntersecting)),
    { rootMargin: "120px 0px" },
  );
  $$("main > section").forEach((s) => offscreen.observe(s));

  // ---------- dock: highlight the section in view ----------
  const dockLinks = $$(".dock a[data-target]");
  const sections = dockLinks.map((a) => document.getElementById(a.dataset.target)).filter(Boolean);
  if (sections.length) {
    const spy = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          dockLinks.forEach((a) =>
            a.dataset.target === entry.target.id ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current"),
          );
        }),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((s) => spy.observe(s));
  }

  // ---------- hero: falling characters ----------
  const rain = $(".rain");
  if (rain) {
    const chars = "アカサタナハマヤラワ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ<>{}[]=+*#$&@/";
    let size = { ctx: null, width: 0, height: 0 };
    let drops = [];
    const column = 20;
    const setup = () => {
      size = fitCanvas(rain);
      drops = Array.from({ length: Math.ceil(size.width / column) }, () => Math.random() * -60);
    };
    const draw = () => {
      const { ctx, width, height } = size;
      const color = css("--rain");
      // Fade old trails to transparent, so the page background shows through the canvas.
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "source-over";
      ctx.font = "16px Consolas, 'Fira Code', monospace";
      drops.forEach((y, i) => {
        const ch = chars[(Math.random() * chars.length) | 0];
        ctx.fillStyle = `rgba(${color}, ${Math.random() < 0.06 ? 0.75 : 0.32})`;
        ctx.fillText(ch, i * column, y * column);
        drops[i] = y * column > height && Math.random() > 0.975 ? 0 : y + 1;
      });
    };
    setup();
    addEventListener("resize", setup);
    if (reduced) {
      for (let i = 0; i < 40; i++) draw();
    } else {
      loopWhileVisible(rain, 18, draw);
    }
  }

  // ---------- philosophy: morphing words ----------
  const morph = $(".morph");
  if (morph) {
    const words = morph.dataset.words.split("|");
    const [a, b] = $$("span", morph);
    let index = 0;
    a.textContent = words[0];
    b.textContent = words[1 % words.length];
    if (reduced) {
      b.style.opacity = "0";
    } else {
      const morphTime = 1.1;
      const holdTime = 2.2;
      let morphLeft = 0;
      let hold = holdTime;
      let last = performance.now();
      const setMorph = (f) => {
        resting = false;
        b.style.filter = `blur(${Math.min(8 / f - 8, 100)}px)`;
        b.style.opacity = `${Math.pow(f, 0.4) * 100}%`;
        const g = 1 - f;
        a.style.filter = `blur(${Math.min(8 / g - 8, 100)}px)`;
        a.style.opacity = `${Math.pow(g, 0.4) * 100}%`;
      };
      let resting = false;
      const rest = () => {
        if (resting) return;
        resting = true;
        b.style.filter = "";
        b.style.opacity = "100%";
        a.style.filter = "";
        a.style.opacity = "0%";
      };
      loopWhileVisible(morph, 60, (t) => {
        const dt = (t - last) / 1000;
        last = t;
        hold -= Math.min(dt, 0.1);
        if (hold > 0) {
          morphLeft = 0;
          rest();
          return;
        }
        if (morphLeft === 0) {
          index = (index + 1) % words.length;
          a.textContent = words[(index - 1 + words.length) % words.length];
          b.textContent = words[index];
        }
        morphLeft += Math.min(dt, 0.1);
        const f = morphLeft / morphTime;
        if (f >= 1) {
          hold = holdTime;
          rest();
        } else {
          setMorph(f);
        }
      });
    }
  }


  // ---------- tech stack: spinning orbit; a node opens its card and rotates to the top ----------
  const orbit = $(".orbit");
  const track = $(".orbit-track");
  const nodes = $$(".orbit-node");
  if (orbit && track && nodes.length) {
    const DURATION = 60; // seconds per turn, matches the CSS animation
    let rot = 0;
    let active = -1;
    if (reduced) orbit.classList.remove("spinning");

    const angleNow = () => {
      const m = getComputedStyle(track).transform;
      if (!m || m === "none") return rot;
      const [a, b] = m.slice(m.indexOf("(") + 1, -1).split(",").map(Number);
      return (Math.atan2(b, a) * 180) / Math.PI;
    };
    const mark = (index) => {
      nodes.forEach((node, i) => {
        node.setAttribute("aria-expanded", String(i === index));
        document.getElementById(node.getAttribute("aria-controls")).hidden = i !== index;
      });
      orbit.classList.toggle("has-active", index >= 0);
      active = index;
    };
    const show = (index) => {
      if (index === active) return;
      if (orbit.classList.contains("spinning")) {
        // Freeze exactly where it is; the chosen node stays in place.
        rot = angleNow();
        orbit.classList.add("snap");
        orbit.classList.remove("spinning");
        orbit.style.setProperty("--rot", `${rot}deg`);
        void track.offsetWidth;
        orbit.classList.remove("snap");
      }
      mark(index);
    };
    const resume = () => {
      if (active < 0) return;
      mark(-1);
      if (reduced) return;
      const a = ((rot % 360) + 360) % 360;
      orbit.style.setProperty("--spin-delay", `${(-a / 360) * DURATION}s`);
      orbit.classList.add("spinning");
    };

    nodes.forEach((node, i) => {
      node.addEventListener("click", () => show(i));
      // Only a pointer that actually moves over a node opens it (not a node moving under the pointer).
      node.addEventListener("pointermove", (e) => {
        if (e.pointerType === "mouse") show(i);
      });
      node.addEventListener("keydown", (e) => {
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (!step) return;
        e.preventDefault();
        const next = (i + step + nodes.length) % nodes.length;
        show(next);
        nodes[next].focus();
      });
    });
    document.addEventListener("pointerdown", (e) => {
      if (active >= 0 && !e.target.closest(".orbit-node, .stack-card")) resume();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && active >= 0) {
        const opened = nodes[active];
        resume();
        if (orbit.contains(document.activeElement)) opened.focus();
      }
    });
  }

  // ---------- playground: falling blocks ----------
  const board = $(".board");
  if (board) {
    const COLS = 10;
    const ROWS = 20;
    const CELL = 30;
    const ctx = board.getContext("2d");
    const message = $(".board-message");
    const stats = Object.fromEntries($$("[data-stat]").map((el) => [el.dataset.stat, el]));
    const SHAPES = [
      [[1, 1, 1, 1]],
      [
        [1, 1],
        [1, 1],
      ],
      [
        [0, 1, 0],
        [1, 1, 1],
      ],
      [
        [1, 0, 0],
        [1, 1, 1],
      ],
      [
        [0, 0, 1],
        [1, 1, 1],
      ],
      [
        [1, 1, 0],
        [0, 1, 1],
      ],
      [
        [0, 1, 1],
        [1, 1, 0],
      ],
    ];
    const palette = () => [css("--a1"), css("--a2"), "#f5f2ee", css("--name"), css("--a1"), css("--a2"), "#d6d0ca"];
    let grid;
    let piece;
    let state = { score: 0, lines: 0, level: 1 };
    let running = false;
    let acc = 0;
    let last = 0;

    const newPiece = () => {
      const k = (Math.random() * SHAPES.length) | 0;
      const m = SHAPES[k].map((r) => r.slice());
      return { m, k, x: ((COLS - m[0].length) / 2) | 0, y: -1 };
    };
    const collides = (p, dx = 0, dy = 0, m = p.m) =>
      m.some((row, y) =>
        row.some((v, x) => {
          if (!v) return false;
          const nx = p.x + x + dx;
          const ny = p.y + y + dy;
          return nx < 0 || nx >= COLS || ny >= ROWS || (ny >= 0 && grid[ny][nx] !== null);
        }),
      );
    const rotate = (m) => m[0].map((_, i) => m.map((r) => r[i]).reverse());
    const speed = () => Math.max(90, 800 - (state.level - 1) * 75);
    const updateStats = () => Object.entries(state).forEach(([k, v]) => stats[k] && (stats[k].textContent = v));

    const lock = () => {
      piece.m.forEach((row, y) =>
        row.forEach((v, x) => {
          if (v && piece.y + y >= 0) grid[piece.y + y][piece.x + x] = piece.k;
        }),
      );
      if (piece.y < 0) return gameOver();
      let cleared = 0;
      grid = grid.filter((row) => {
        const full = row.every((c) => c !== null);
        if (full) cleared++;
        return !full;
      });
      while (grid.length < ROWS) grid.unshift(Array(COLS).fill(null));
      if (cleared) {
        state.lines += cleared;
        state.score += [0, 100, 300, 500, 800][cleared] * state.level;
        state.level = 1 + Math.floor(state.lines / 10);
        updateStats();
      }
      piece = newPiece();
      if (collides(piece)) gameOver();
    };

    const act = (key) => {
      if (!running) return;
      if (key === "ArrowLeft" && !collides(piece, -1)) piece.x--;
      else if (key === "ArrowRight" && !collides(piece, 1)) piece.x++;
      else if (key === "ArrowDown") {
        if (!collides(piece, 0, 1)) {
          piece.y++;
          state.score += 1;
          updateStats();
        } else lock();
      } else if (key === "ArrowUp" || key === " ") {
        const m = rotate(piece.m);
        for (const kick of [0, -1, 1, -2, 2]) {
          if (!collides(piece, kick, 0, m)) {
            piece.m = m;
            piece.x += kick;
            break;
          }
        }
      }
      draw();
    };

    const cell = (x, y, color, alpha = 1) => {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = alpha === 1 ? 10 : 0;
      ctx.beginPath();
      ctx.roundRect(x * CELL + 2, y * CELL + 2, CELL - 4, CELL - 4, 5);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    };

    function draw() {
      const colors = palette();
      ctx.clearRect(0, 0, board.width, board.height);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
      for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * CELL + 0.5, 0);
        ctx.lineTo(x * CELL + 0.5, ROWS * CELL);
        ctx.stroke();
      }
      for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL + 0.5);
        ctx.lineTo(COLS * CELL, y * CELL + 0.5);
        ctx.stroke();
      }
      if (!grid) return;
      grid.forEach((row, y) => row.forEach((k, x) => k !== null && cell(x, y, colors[k])));
      if (piece && running) {
        let ghost = 0;
        while (!collides(piece, 0, ghost + 1)) ghost++;
        piece.m.forEach((row, y) =>
          row.forEach((v, x) => {
            if (!v) return;
            if (piece.y + y + ghost >= 0) cell(piece.x + x, piece.y + y + ghost, colors[piece.k], 0.18);
            if (piece.y + y >= 0) cell(piece.x + x, piece.y + y, colors[piece.k]);
          }),
        );
      }
    }

    function gameOver() {
      running = false;
      message.textContent = `Game over · ${state.score} points`;
      $(".start").textContent = "Play again";
      draw();
    }

    const frame = (t) => {
      if (!running) return;
      acc += t - last;
      last = t;
      if (acc > speed()) {
        acc = 0;
        if (!collides(piece, 0, 1)) piece.y++;
        else lock();
        draw();
      }
      requestAnimationFrame(frame);
    };

    $(".start").addEventListener("click", () => {
      grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
      state = { score: 0, lines: 0, level: 1 };
      updateStats();
      piece = newPiece();
      running = true;
      message.textContent = "";
      $(".start").textContent = "Restart";
      last = performance.now();
      acc = 0;
      draw();
      board.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
      requestAnimationFrame(frame);
    });
    document.addEventListener("keydown", (e) => {
      if (!running || !["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " "].includes(e.key)) return;
      e.preventDefault();
      act(e.key);
    });
    $$(".touch-pad button").forEach((btn) => btn.addEventListener("click", () => act(btn.dataset.key)));
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && running) {
        running = false;
        message.textContent = "Paused · press Restart";
      }
    });
    draw();
  }
})();
