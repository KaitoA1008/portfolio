// Shared ocean Dark Veil background. Only the decorative canvas is affected.
(() => {
  const canvas = document.querySelector(".flow-veil");
  if (!canvas) return;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const gl = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "low-power" });
  if (!gl) return; // The CSS ocean gradient remains visible without WebGL.

  const vertex = `attribute vec2 position;
    void main() { gl_Position = vec4(position, 0., 1.); }`;
  const fragment = `
    precision highp float;
    uniform vec2 uRes, uMouse;
    uniform float uTime;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      f = f * f * (3. - 2. * f);
      return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x),
                 mix(hash(i + vec2(0., 1.)), hash(i + vec2(1.)), f.x), f.y);
    }
    float fbm(vec2 p) {
      float a = .5, v = 0.;
      for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p = mat2(.8, -.6, .6, .8) * p * 2.08 + vec2(3.4, 1.2);
        a *= .5;
      }
      return v;
    }
    void main() {
      vec2 uv = gl_FragCoord.xy / uRes;
      vec2 p = (uv - .5) * vec2(uRes.x / uRes.y, 1.);
      p += (uMouse - .5) * .13;
      float t = uTime;
      vec2 q = vec2(fbm(p * 1.8 + vec2(t * .04, 0.)),
                    fbm(p * 1.8 + vec2(7.8, t * .025)));
      float n = fbm(p * 1.9 + 2.6 * q + vec2(t * .025, -t * .02));
      float cloud = smoothstep(.27, .76, n);
      float veil = exp(-pow((p.x * .58 + p.y * .72 + .26 * sin(p.y * 3. + t * .13) + n * .62 - .12) * 2.5, 2.));
      vec3 haze = mix(vec3(.055, .13, .25), vec3(.08, .31, .29), smoothstep(.1, .9, uv.x + n * .3));
      vec3 col = vec3(.018, .025, .038) + haze * (.2 + cloud * .9) * veil;
      col += vec3(.06, .19, .29) * pow(cloud, 3.) * .65;
      float vignette = 1. - .46 * smoothstep(.25, .95, length((uv - .5) * vec2(1., .85)));
      float grain = (hash(gl_FragCoord.xy + mod(t, 100.)) - .5) * .012;
      gl_FragColor = vec4(clamp(col * 1.1 * vignette + grain, 0., 1.), 1.);
    }`;

  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };
  const vs = compile(gl.VERTEX_SHADER, vertex);
  const fs = compile(gl.FRAGMENT_SHADER, fragment);
  if (!vs || !fs) {
    canvas.style.visibility = "hidden";
    return;
  }
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    canvas.style.visibility = "hidden";
    return;
  }
  gl.useProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const resolution = gl.getUniformLocation(program, "uRes");
  const mouse = gl.getUniformLocation(program, "uMouse");
  const clock = gl.getUniformLocation(program, "uTime");

  const pointer = { x: .64, y: .55, tx: .64, ty: .55 };
  let visible = false, raf = 0, last = 0, time = 0, lost = false;
  const draw = () => {
    if (lost) return;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(resolution, canvas.width, canvas.height);
    gl.uniform2f(mouse, pointer.x, pointer.y);
    gl.uniform1f(clock, time);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    // Broad, soft shapes need fewer pixels; cap the buffer on large displays.
    const ratio = Math.min(.8, Math.sqrt(900000 / Math.max(1, rect.width * rect.height)));
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    draw();
  };
  function frame(now) {
    raf = 0;
    if (!visible || document.hidden || motion.matches || lost) return;
    const dt = now - last;
    if (dt >= 1000 / 24) {
      time += Math.min(dt / 1000, .1) * .65;
      last = now;
      pointer.x += (pointer.tx - pointer.x) * .12;
      pointer.y += (pointer.ty - pointer.y) * .12;
      draw();
    }
    raf = requestAnimationFrame(frame);
  }
  function wake() {
    if (!raf && visible && !document.hidden && !motion.matches && !lost) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    wake();
  }).observe(canvas);
  addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse" || motion.matches || !visible) return;
    const rect = canvas.getBoundingClientRect();
    pointer.tx = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    pointer.ty = 1 - Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
  }, { passive: true });
  document.addEventListener("pointerleave", () => { pointer.tx = .64; pointer.ty = .55; });
  document.addEventListener("visibilitychange", wake);
  motion.addEventListener("change", () => {
    if (motion.matches) {
      cancelAnimationFrame(raf); raf = 0;
      pointer.x = .64; pointer.y = .55;
      draw();
    } else wake();
  });
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault(); lost = true;
    cancelAnimationFrame(raf); raf = 0;
    canvas.style.visibility = "hidden"; // Reveal the CSS fallback without interrupting the page.
  });
  resize();
})();
