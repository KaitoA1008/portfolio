// Projects "stage": curved screens on a transparent backdrop (WebGL2).
// The ring turns slowly on its own; press and drag to turn it (with inertia). The mouse wheel scrolls the page.
// Falls back to the plain project list on touch screens, reduced motion or without WebGL2.
(() => {
  const wrap = document.querySelector("[data-stage]");
  const dataEl = document.getElementById("stage-data");
  if (!wrap || !dataEl) return;
  const root = document.documentElement;
  const list = document.querySelector(".project-grid");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  // The in-app preview can be narrower than 900px even with a desktop pointer.
  // Keep the horizontal stage available there and let its camera resize to fit.
  if (reduced || !finePointer) return;
  const canvas = wrap.querySelector(".stage-canvas");
  const gl = canvas.getContext("webgl2", { antialias: true, alpha: true, premultipliedAlpha: false });
  if (!gl) return; // keep the list when WebGL2 is unavailable

  const projects = JSON.parse(dataEl.textContent);
  const COPIES = 3; // 4 projects x 3 = 12 screens around the ring
  const COUNT = projects.length * COPIES;
  const SPACING = (Math.PI * 2) / COUNT;
  const ARC = SPACING * 0.9;
  const RADIUS = 6;
  const HEIGHT = 1.95;
  const PANEL_Y = 0.35;
  const ASPECT = (RADIUS * ARC) / HEIGHT;

  root.classList.add("has-stage");

  // ---------- GL helpers ----------
  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const program = (vs, fs) => {
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {};
    for (let i = 0; i < gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i++) {
      const name = gl.getActiveUniform(p, i).name;
      u[name] = gl.getUniformLocation(p, name);
    }
    return { p, u };
  };

  const ROTATE = `
    vec3 view(vec3 p, float yaw) {
      float c = cos(-yaw), s = sin(-yaw);
      return vec3(p.x * c - p.z * s, p.y, p.x * s + p.z * c);
    }`;

  const panelProg = program(
    `#version 300 es
    in vec2 aUV;
    uniform mat4 uProj;
    uniform float uYaw, uAngle, uArc, uRadius, uHeight, uY, uVel, uHover;
    out vec2 vUV;
    out float vShade;
    ${ROTATE}
    void main() {
      float u = aUV.x - 0.5;
      float v = aUV.y - 0.5;
      float a = uAngle + u * uArc * (1.0 + 0.05 * uHover);
      // Bend with the ring's speed; the hovered screen comes forward.
      float r = uRadius - uHover * 0.55 + uVel * 9.0 * (u * u - 0.083);
      float y = uY + v * uHeight * (1.0 + 0.05 * uHover) + uVel * 1.6 * u * v;
      vec3 p = view(vec3(sin(a) * r, y, -cos(a) * r), uYaw);
      gl_Position = uProj * vec4(p, 1.0);
      vUV = vec2(aUV.x, 1.0 - aUV.y);
      float rel = a - uYaw;
      vShade = mix(0.32, 1.0, pow(max(cos(rel), 0.0), 6.0));
    }`,
    `#version 300 es
    precision highp float;
    in vec2 vUV;
    in float vShade;
    uniform sampler2D uTex;
    uniform float uAspect;
    out vec4 outColor;
    float roundBox(vec2 p, vec2 b, float r) {
      vec2 q = abs(p) - b + r;
      return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
    }
    void main() {
      vec2 p = (vUV - 0.5) * vec2(uAspect, 1.0);
      float d = roundBox(p, vec2(uAspect * 0.5, 0.5), 0.05);
      float mask = 1.0 - smoothstep(-0.002, 0.002, d);
      if (mask < 0.01) discard;
      vec3 c = texture(uTex, vUV).rgb * vShade;
      outColor = vec4(c, mask);
    }`,
  );

  // Panel mesh: a 40 x 10 grid in UV space, so the cylinder curve and the bend stay smooth.
  const SX = 40;
  const SY = 10;
  const uv = [];
  for (let y = 0; y < SY; y++)
    for (let x = 0; x < SX; x++) {
      const x0 = x / SX;
      const x1 = (x + 1) / SX;
      const y0 = y / SY;
      const y1 = (y + 1) / SY;
      uv.push(x0, y0, x1, y0, x1, y1, x0, y0, x1, y1, x0, y1);
    }
  const panelVao = gl.createVertexArray();
  gl.bindVertexArray(panelVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.STATIC_DRAW);
  const aUV = gl.getAttribLocation(panelProg.p, "aUV");
  gl.enableVertexAttribArray(aUV);
  gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 0, 0);
  const panelVerts = uv.length / 2;

  gl.bindVertexArray(null);

  // ---------- textures: screenshot + title + arrow, drawn once per project ----------
  const textures = projects.map(() => null);
  const TW = 1280;
  const TH = Math.round(TW / ASPECT);
  projects.forEach((project, i) => {
    const img = new Image();
    img.decoding = "async";
    img.src = project.image;
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = TW;
      c.height = TH;
      const x = c.getContext("2d");
      x.fillStyle = "#151311";
      x.fillRect(0, 0, TW, TH);
      const scale = Math.max(TW / img.width, TH / img.height);
      x.drawImage(img, (TW - img.width * scale) / 2, 0, img.width * scale, img.height * scale);
      const shade = x.createLinearGradient(0, TH * 0.55, 0, TH);
      shade.addColorStop(0, "rgba(0,0,0,0)");
      shade.addColorStop(1, "rgba(0,0,0,0.78)");
      x.fillStyle = shade;
      x.fillRect(0, 0, TW, TH);
      x.fillStyle = "#fff";
      x.font = "600 58px 'Segoe UI', system-ui, Arial, sans-serif";
      x.textBaseline = "alphabetic";
      x.fillText(project.name, 52, TH - 56);
      x.globalAlpha = 0.7;
      x.font = "500 22px 'Segoe UI', system-ui, Arial, sans-serif";
      x.fillText(project.type, 54, TH - 128);
      x.globalAlpha = 1;
      x.beginPath();
      x.arc(TW - 82, TH - 76, 34, 0, Math.PI * 2);
      x.fillStyle = "#0b0a09";
      x.fill();
      x.strokeStyle = "#fff";
      x.lineWidth = 4;
      x.lineCap = "round";
      x.beginPath();
      x.moveTo(TW - 96, TH - 76);
      x.lineTo(TW - 68, TH - 76);
      x.moveTo(TW - 79, TH - 87);
      x.lineTo(TW - 68, TH - 76);
      x.lineTo(TW - 79, TH - 65);
      x.stroke();
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
      if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8);
      textures[i] = tex;
      wake();
    };
  });

  // ---------- camera ----------
  const FOV = (40 * Math.PI) / 180;
  let W = 0;
  let H = 0;
  let proj = new Float32Array(16);
  const resize = () => {
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * ratio);
    canvas.height = Math.round(H * ratio);
    const f = 1 / Math.tan(FOV / 2);
    const aspect = W / H;
    const near = 0.1;
    const far = 80;
    proj = new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, (2 * far * near) / (near - far), 0]);
    wake();
  };

  // ---------- motion state ----------
  const AUTO_SPEED = SPACING / 7; // radians per second: one screen every 7 s
  const AUTO_RESUME_MS = 1500; // pause after a drag or a button press
  let targetYaw = 0;
  let yaw = 0;
  let vel = 0;
  let inertia = 0;
  let dragging = false;
  let dragMoved = 0;
  let lastX = 0;
  let lastInput = -Infinity;
  let lastFrame = 0;
  const pointer = { x: 0, y: 0, inside: false };
  const hover = new Float32Array(COUNT);
  let hovered = -1;

  // Which screen is under the pointer: angle from the horizontal position, then height on that screen.
  const pick = () => {
    if (!pointer.inside) return -1;
    const rect = canvas.getBoundingClientRect();
    const nx = ((pointer.x - rect.left) / rect.width) * 2 - 1;
    const ny = 1 - ((pointer.y - rect.top) / rect.height) * 2;
    const t = Math.tan(FOV / 2);
    const off = Math.atan(nx * t * (W / H));
    const angle = yaw + off;
    const i = Math.round(angle / SPACING);
    if (Math.abs(angle - i * SPACING) > ARC / 2) return -1;
    const dist = RADIUS * Math.cos(off);
    const yScreen = (y) => y / dist / t;
    if (ny > yScreen(PANEL_Y + HEIGHT / 2) || ny < yScreen(PANEL_Y - HEIGHT / 2)) return -1;
    return ((i % COUNT) + COUNT) % COUNT;
  };

  // ---------- caption for the screen in front ----------
  const caption = wrap.querySelector(".stage-caption");
  const capKind = caption.querySelector("[data-kind]");
  const capName = caption.querySelector("[data-name]");
  const capText = caption.querySelector("[data-text]");
  const capLink = caption.querySelector("[data-link]");
  let front = -1;
  const updateCaption = () => {
    const i = ((Math.round(yaw / SPACING) % projects.length) + projects.length) % projects.length;
    if (i === front) return;
    front = i;
    const p = projects[i];
    capKind.textContent = p.type;
    capName.textContent = p.name;
    capText.textContent = p.summary;
    capLink.href = p.href;
    capLink.dataset.project = p.slug;
    capLink.setAttribute("aria-label", `Read the ${p.name} case study`);
  };
  const step = (dir) => {
    targetYaw = Math.round(targetYaw / SPACING + dir) * SPACING;
    lastInput = performance.now();
    wake();
  };
  wrap.querySelector("[data-prev]").addEventListener("click", () => step(-1));
  wrap.querySelector("[data-next]").addEventListener("click", () => step(1));

  // ---------- input ----------
  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    dragMoved = 0;
    lastX = e.clientX;
    inertia = 0;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.inside = true;
    if (dragging) {
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      dragMoved += Math.abs(dx);
      const d = -dx * 0.0032;
      targetYaw += d;
      inertia = d;
      lastInput = performance.now();
    }
    wake();
  });
  const endDrag = () => {
    dragging = false;
    lastInput = performance.now();
  };
  canvas.addEventListener("pointerup", (e) => {
    endDrag();
    if (dragMoved < 6) {
      const i = pick();
      if (i >= 0) dispatchEvent(new CustomEvent("open-project", { detail: projects[i % projects.length].slug }));
    }
  });
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("pointerleave", () => {
    pointer.inside = false;
    wake();
  });
  addEventListener("resize", resize);

  // ---------- render loop (runs while the stage is on screen and the tab is visible) ----------
  let visible = false;
  let raf = 0;
  function wake() {
    if (!raf && visible && !document.hidden) {
      lastFrame = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    wake();
  }).observe(canvas);
  document.addEventListener("visibilitychange", wake);

  function frame(now) {
    raf = 0;
    const dt = Math.min(now - lastFrame, 50) / 1000;
    lastFrame = now;
    if (!dragging && Math.abs(inertia) > 0.00005) {
      targetYaw += inertia;
      inertia *= 0.92;
    }
    hovered = dragging ? -1 : pick();
    // Slow automatic turn, paused while a screen is hovered and shortly after the visitor moved it.
    const idle = !dragging && hovered < 0 && Math.abs(inertia) < 0.0004 && now - lastInput > AUTO_RESUME_MS;
    if (idle) targetYaw += AUTO_SPEED * dt;
    const next = yaw + (targetYaw - yaw) * 0.12;
    vel += (Math.max(-0.06, Math.min(0.06, next - yaw)) - vel) * 0.3;
    yaw = next;
    canvas.style.cursor = dragging ? "grabbing" : hovered >= 0 ? "pointer" : "grab";
    for (let i = 0; i < COUNT; i++) hover[i] += ((i === hovered ? 1 : 0) - hover[i]) * 0.14;
    draw();
    updateCaption();
    if (visible && !document.hidden) raf = requestAnimationFrame(frame);
  }

  function draw() {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.enable(gl.DEPTH_TEST);
    gl.useProgram(panelProg.p);
    gl.uniformMatrix4fv(panelProg.u.uProj, false, proj);
    gl.uniform1f(panelProg.u.uYaw, yaw);
    gl.uniform1f(panelProg.u.uArc, ARC);
    gl.uniform1f(panelProg.u.uRadius, RADIUS);
    gl.uniform1f(panelProg.u.uHeight, HEIGHT);
    gl.uniform1f(panelProg.u.uY, PANEL_Y);
    gl.uniform1f(panelProg.u.uVel, reduced ? 0 : vel);
    gl.uniform1f(panelProg.u.uAspect, ASPECT);
    gl.bindVertexArray(panelVao);
    for (let i = 0; i < COUNT; i++) {
      const tex = textures[i % projects.length];
      if (!tex) continue;
      const angle = i * SPACING;
      let rel = (((angle - yaw) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
      if (Math.abs(rel) > Math.PI * 0.62) continue; // behind the camera
      gl.uniform1f(panelProg.u.uAngle, yaw + rel);
      gl.uniform1f(panelProg.u.uHover, hover[i]);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.drawArrays(gl.TRIANGLES, 0, panelVerts);
    }
    gl.bindVertexArray(null);
  }

  resize();
  wake();
})();
