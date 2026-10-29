// Builds dist/index.html and dist/projects/*.html. Run: node src/build.cjs
// Content and assets live in this project. Images are prepared by tools/prepare-assets.py.
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const out = path.join(root, "dist");
const projects = require("./content.cjs");
const skills = require("./skills.json");

const site = {
  first: "QUANG",
  last: "ANH",
  logo: "quang-anh · portfolio",
  tagline: "Practical AI, with a human in the loop.",
  email: "quanganhptit030@gmail.com",
  github: "https://github.com/KaitoA1008",
  linkedin: "https://www.linkedin.com/in/quanganhptit",
};

// Work, training and education only; projects live in their own section.
const journey = [
  {
    date: "Sep 2026 — Present",
    title: "Lab Coach",
    org: "VinUniversity",
    text: "Run hands-on labs on deploying and operating AI systems.",
    group: "Experience",
    points: ["Docker, API serving, CI/CD and monitoring", "Review trainees’ LLM/RAG pipelines and agents"],
    tech: ["Docker", "CI/CD", "Vector DBs"],
    images: [],
  },
  {
    date: "May — Aug 2026",
    title: "Applied AI Trainee",
    org: "Vingroup × VinUni",
    text: "Completed the Applied AI Talent Program and built VinGrade.",
    group: "Training",
    points: ["Evidence-based essay grading with LangGraph", "Cost and failure tracing with LangSmith and Langfuse"],
    tech: ["LangGraph", "FastAPI", "pgvector", "React"],
    images: [],
  },
  {
    date: "Jan — Apr 2026",
    title: "AI Engineer Intern",
    org: "FPT Software",
    text: "Retrieval and evaluation for an internal document-QA RAG system.",
    group: "Experience",
    points: ["6-stage retrieval pipeline with hybrid search and reranking", "4-axis evaluation gating every change"],
    tech: ["Python", "FastAPI", "pgvector", "pytest"],
    images: [],
  },
  {
    date: "2022 — Dec 2026",
    title: "Information Technology",
    org: "PTIT",
    text: "Engineer’s degree, expected December 2026.",
    group: "Education",
    points: ["Thesis: Englow3, IELTS and TOEIC prep platform", "DeepLearning.AI ML and Deep Learning certificates"],
    tech: [],
    images: [],
  },
];

const words = ["Curious", "Practical", "Grounded"];

const e = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const webp = (name) => name.replace(/\.png$/, ".webp");
// 760 px copies for cards and timeline thumbnails (tools/prepare-assets.py).
const card = (name) => name.replace(/\.(png|webp)$/, "-card.webp");

// Line icons (24px grid, stroke = currentColor).
const ICONS = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/>',
  sparkles: '<path d="M12 3l1.8 4.6L18 9.4l-4.2 1.8L12 16l-1.8-4.8L6 9.4l4.2-1.8zM19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8zM5 15l.6 1.4L7 17l-1.4.6L5 19l-.6-1.4L3 17l1.4-.6z"/>',
  code: '<path d="m8 7-5 5 5 5M16 7l5 5-5 5"/>',
  folder: '<path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  game: '<rect x="2" y="7" width="20" height="11" rx="4"/><path d="M7 11v3M5.5 12.5h3M15.5 12h.01M18 14h.01"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  left: '<path d="m15 6-6 6 6 6"/>',
  right: '<path d="m9 6 6 6-6 6"/>',
  linkedin: '<path d="M4 9h3v11H4zM5.5 4a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6zM10 9h3v1.6c.6-1 1.8-1.9 3.6-1.9 3 0 3.4 2 3.4 4.6V20h-3v-5.8c0-1.4 0-3-1.9-3s-2.1 1.4-2.1 2.9V20h-3z" fill="currentColor" stroke="none"/>',
  github: '<path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5a3.9 3.9 0 0 1 1-2.7 3.6 3.6 0 0 1 .1-2.7s.8-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7a3.9 3.9 0 0 1 1 2.7c0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9V21c0 .3.2.6.7.5A10 10 0 0 0 12 2z" fill="currentColor" stroke="none"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6"/>',
  brain: '<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3h1V4zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3h-1V4z"/>',
  server: '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>',
  layout: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11"/>',
  database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  cloud: '<path d="M7 18a5 5 0 0 1-.9-9.9A6 6 0 0 1 17.6 9 4.5 4.5 0 0 1 17 18z"/>',
};
const icon = (name, size = 20) =>
  `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

const NAV = [
  ["home", "Home", "home"],
  ["about", "About", "user"],
  ["journey", "Journey", "trophy"],
  ["philosophy", "Philosophy", "sparkles"],
  ["stack", "Tech stack", "code"],
  ["projects", "Projects", "folder"],
  ["contact", "Contact", "mail"],
  ["playground", "Playground", "game"],
];

function head(title, description, base = "") {
  return `<!doctype html><html lang="en" data-theme="ocean"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#070b12"><title>${e(title)}</title><meta name="description" content="${e(description)}"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}"><meta property="og:type" content="website"><link rel="icon" href="${base}assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="${base}styles.css"><script>document.documentElement.classList.add("js")</script><script src="${base}app.js" defer></script></head><body><a class="skip-link" href="#main">Skip to content</a>`;
}

function dock(base = "") {
  const links = NAV.map(
    ([id, label, ic]) =>
      `<a href="${base}#${id}" data-target="${id}" aria-label="${label}"><span class="dock-icon">${icon(ic, 19)}</span><span class="dock-tip">${label}</span></a>`,
  ).join("");
  return `<nav class="dock" aria-label="Sections">${links}</nav>`;
}

const marquee = (text) =>
  `<div class="marquee" aria-hidden="true"><div class="marquee-track">${`<span>${text}</span><i></i>`.repeat(6)}</div></div>`;

// ---------- sections ----------

const hero = `<section class="hero" id="home" aria-labelledby="hero-name">
<canvas class="rain" aria-hidden="true"></canvas>
<p class="hero-logo">${e(site.logo)}</p>
<h1 class="hero-name" id="hero-name"><span>${site.first}</span><span class="hero-last">${site.last}<img decoding="async" src="assets/quang-anh-cutout.webp" alt="" width="675" height="900" fetchpriority="high"></span></h1>
<p class="hero-tagline">${e(site.tagline)}</p>
</section>`;

const about = `<section class="about" id="about" aria-labelledby="about-title">
<div class="about-copy reveal"><h2 id="about-title">Hi, I'm <span class="accent">Quang Anh</span><br>An AI Engineer</h2>
<p>AI engineer based in Hanoi. I build retrieval pipelines, agent workflows and the backend systems that make them usable — and I measure them honestly.</p></div>
<figure class="portrait-card reveal"><img decoding="async" src="assets/quang-anh-cutout.webp" alt="Nguyễn Quang Anh" width="675" height="900" loading="lazy"></figure>
</section>`;

const journeyHtml = `<section class="journey" id="journey" aria-labelledby="journey-title">
<h2 class="visually-hidden" id="journey-title">My journey</h2>
${marquee("MY JOURNEY")}
<ol class="timeline">${journey
  .map(
    (j) => `<li class="timeline-item reveal"><span class="timeline-dot" aria-hidden="true"></span>
<p class="timeline-date">${e(j.date)}</p>
<div class="timeline-body"><h3>${e(j.title)} <span>at ${e(j.org)}</span></h3><p>${e(j.text)}</p>
${j.points.length ? `<p class="timeline-group">${e(j.group)}</p><ul>${j.points.map((p) => `<li>${e(p)}</li>`).join("")}</ul>` : `<p class="timeline-group">${e(j.group)}</p>`}
${j.tech && j.tech.length ? `<ul class="timeline-tech" aria-label="Technologies">${j.tech.map((t) => `<li>${e(t)}</li>`).join("")}</ul>` : ""}
${j.images.length ? `<div class="timeline-images">${j.images.map(([src, alt]) => `<img decoding="async" src="assets/${card(src)}" alt="${e(alt)}" loading="lazy">`).join("")}</div>` : ""}</div></li>`,
  )
  .join("")}</ol>
</section>`;

const philosophy = `<section class="philosophy" id="philosophy" aria-labelledby="philosophy-title">
${marquee("MY PHILOSOPHY")}
<div class="philosophy-stage">
<div class="ring-text" aria-hidden="true"><svg viewBox="0 0 200 200"><defs><path id="ring" d="M100 100m-74 0a74 74 0 1 1 148 0a74 74 0 1 1-148 0"/></defs><text><textPath href="#ring" textLength="452" lengthAdjust="spacing">MY PHILOSOPHY • MY PHILOSOPHY •</textPath></text></svg></div>
<h2 class="visually-hidden" id="philosophy-title">My philosophy: ${words.join(", ")}</h2>
<div class="morph" aria-hidden="true" data-words="${words.join("|")}"><span></span><span></span></div>
<svg class="goo-filter" aria-hidden="true"><defs><filter id="threshold"><feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 255 -140"/></filter></defs></svg>
<p class="philosophy-line">Stay curious, build practically, and keep people in control.</p></div>
</section>`;

// Five groups, so the nodes sit evenly around the orbit. "used" lists the projects in content.cjs
// that actually use the group; the card shows that share instead of a self-rated skill level.
const GROUPS = [
  {
    id: "ai",
    label: "AI & LLM",
    icon: "brain",
    text: "LLM applications, retrieval and agent workflows, measured with evaluation sets.",
    skills: ["Python", "LangGraph", "LangChain", "PyTorch", "OpenAI", "Gemini", "scikit-learn", "Langfuse"],
    used: ["vingrade", "ledgerlens", "relaydesk"],
  },
  {
    id: "backend",
    label: "Backend",
    icon: "server",
    text: "APIs and services that make AI features dependable: validation, jobs and permissions.",
    skills: ["FastAPI", "Java", "Spring Boot", "GraphQL"],
    used: ["vingrade", "englow3", "ledgerlens", "relaydesk"],
  },
  {
    id: "data",
    label: "Data",
    icon: "database",
    text: "Relational data, vector search and caching behind the applications.",
    skills: ["PostgreSQL", "Redis"],
    used: ["vingrade", "englow3", "ledgerlens", "relaydesk"],
  },
  {
    id: "frontend",
    label: "Frontend & mobile",
    icon: "layout",
    text: "Interfaces for reviewing, approving and using what the models produce.",
    skills: ["React", "TypeScript", "Next.js", "Expo", "Vite"],
    used: ["vingrade", "englow3", "ledgerlens", "relaydesk"],
  },
  {
    id: "devops",
    label: "DevOps & testing",
    icon: "cloud",
    text: "Containers, CI and automated tests that keep releases repeatable.",
    skills: ["Docker", "Git", "GitHub Actions", "pytest", "Vercel"],
    used: ["ledgerlens", "relaydesk"],
  },
];
const skillByName = Object.fromEntries(skills.map((s) => [s.name, s]));
const projectBySlug = Object.fromEntries(projects.map((p) => [p.slug, p]));
for (const g of GROUPS) {
  for (const name of g.skills) if (!skillByName[name]) throw new Error(`Unknown skill: ${name}`);
  for (const slug of g.used) if (!projectBySlug[slug]) throw new Error(`Unknown project: ${slug}`);
}

const stackCard = (g) => `<div class="stack-card" role="region" id="panel-${g.id}" aria-labelledby="tab-${g.id}" hidden>
<div class="card-top"><span class="badge">${g.skills.length} tools</span><span class="card-kind">${e(g.label)}</span></div>
<h3>${e(g.label)}</h3><p>${e(g.text)}</p>
<div class="card-meter"><div class="meter-head"><span>${icon("folder", 13)} Project coverage</span><strong>${g.used.length}/${projects.length}</strong></div><div class="meter"><span style="width:${Math.round((g.used.length / projects.length) * 100)}%"></span></div></div>
<p class="card-sub">${icon("code", 13)} Tech stack</p><ul class="chips">${g.skills
  .map((name) => `<li><img decoding="async" src="assets/skills/${skillByName[name].slug}.svg" alt="" width="18" height="18" loading="lazy">${e(name)}</li>`)
  .join("")}</ul>
<p class="card-sub">${icon("arrow", 13)} Used in</p><div class="card-links">${g.used
  .map((slug) => `<a href="projects/${slug}.html" data-project="${slug}">${e(projectBySlug[slug].name)} ${icon("arrow", 12)}</a>`)
  .join("")}</div></div>`;

const stack = `<section class="stack" id="stack" aria-labelledby="stack-title">
<h2 class="visually-hidden" id="stack-title">My tech stack</h2>
${marquee("MY TECH STACK")}
<div class="orbit-wrap reveal"><div class="orbit spinning"><div class="orbit-square">
<div class="orbit-ring" aria-hidden="true"></div><div class="orbit-glow" aria-hidden="true"></div>
<div class="orbit-track" role="group" aria-label="Technology groups">${GROUPS.map(
  (g, i) =>
    `<button class="orbit-node" type="button" id="tab-${g.id}" aria-controls="panel-${g.id}" aria-expanded="false" style="--n:${i}"><span class="node-inner"><span class="node-icon">${icon(g.icon, 30)}</span><span class="node-label">${e(g.label)}</span></span></button>`,
).join("")}</div>
</div>
${GROUPS.map(stackCard).join("")}
</div></div>
</section>`;

const projectCards = projects
  .map(
    (p) => `<article class="project-card reveal"><a href="projects/${p.slug}.html" data-project="${p.slug}" aria-label="Read the ${e(p.name)} case study">
<div class="project-shot"><img decoding="async" src="assets/${card(p.image)}" alt="" width="760" height="570" loading="lazy"></div>
<div class="project-text"><h3>${e(p.name)}</h3><p>${e(p.summary)}</p><ul class="project-stack">${p.stack.map((s) => `<li>${e(s)}</li>`).join("")}</ul>
<span class="project-link">Read case study ${icon("arrow", 15)}</span></div></a></article>`,
  )
  .join("");

const projectsHtml = `<section class="projects" id="projects" aria-labelledby="projects-title">
<h2 class="visually-hidden" id="projects-title">My projects</h2>
${marquee("MY PROJECTS")}
<p class="section-sub reveal">AI products, retrieval systems and full-stack applications — each with a case study.</p>
<div class="stage-wrap" data-stage><div class="stage">
<canvas class="stage-canvas" aria-hidden="true"></canvas>
<div class="stage-caption" aria-live="polite"><div class="cap-text"><p class="cap-kind" data-kind></p><h3 data-name></h3><p class="cap-summary" data-text></p><a class="cap-link" data-link href="#">Read case study ${icon("arrow", 14)}</a></div>
<div class="cap-nav"><button type="button" data-prev aria-label="Previous project">${icon("left", 18)}</button><button type="button" data-next aria-label="Next project">${icon("right", 18)}</button></div></div>
</div></div>
<script type="application/json" id="stage-data">${JSON.stringify(
  projects.map((p) => ({ slug: p.slug, name: p.name, type: p.type, summary: p.summary, href: `projects/${p.slug}.html`, image: `assets/${webp(p.image)}` })),
).replace(/</g, "\\u003c")}</script>
<div class="project-grid">${projectCards}</div>
</section>`;

const CONTACTS = [
  ["Email", "Write to me", `mailto:${site.email}`, "mail", ""],
  ["LinkedIn", "Professional network", site.linkedin, "linkedin", ""],
  ["GitHub", "Code repository", site.github, "github", ""],
];

const contact = `<section class="contact" id="contact" aria-labelledby="contact-title">
<div class="contact-copy reveal"><span class="pill">Let's Connect</span><h2 id="contact-title">Get In Touch</h2>
<p>Ready to collaborate or just want to chat? Let's build something useful together.</p>
<a class="contact-email" href="mailto:${site.email}">${site.email}</a></div>
<div class="contact-grid">${CONTACTS.map(
  ([name, sub, href, ic, dl]) =>
    `<a class="contact-card reveal" href="${href}" ${dl ? "download" : href.startsWith("http") ? 'target="_blank" rel="noopener"' : ""}><span class="contact-icon">${icon(ic, 22)}</span><strong>${name}</strong><span>${sub}</span><em>${dl ? "Download" : "Connect"} ${icon("arrow", 14)}</em></a>`,
).join("")}</div>
</section>`;

const playground = `<section class="playground" id="playground" aria-labelledby="play-title">
<div class="play-copy reveal"><h2 id="play-title">Quang Anh <span class="accent">Playground</span></h2>
<p>Take a break and enjoy a small game built with vanilla JavaScript.</p></div>
<div class="game reveal"><div class="board-wrap"><canvas class="board" width="300" height="600" aria-label="Falling blocks game board" role="img"></canvas><p class="board-message" aria-live="polite">Press Start Game</p></div>
<div class="game-side"><div class="stat"><span>Score</span><strong data-stat="score">0</strong></div><div class="stat"><span>Level</span><strong data-stat="level">1</strong></div><div class="stat"><span>Lines</span><strong data-stat="lines">0</strong></div>
<div class="stat controls"><span>Controls</span><p>← → Move<br>↓ Soft drop<br>↑ / Space Rotate</p></div>
<button class="start" type="button">Start Game</button></div>
<div class="touch-pad" aria-label="Game controls"><button type="button" data-key="ArrowLeft" aria-label="Move left">←</button><button type="button" data-key="ArrowUp" aria-label="Rotate">⟳</button><button type="button" data-key="ArrowDown" aria-label="Soft drop">↓</button><button type="button" data-key="ArrowRight" aria-label="Move right">→</button></div></div>
</section>`;

const footer = (base = "") =>
  `<footer class="footer"><span>© 2026 Nguyễn Quang Anh</span><a href="mailto:${site.email}">${site.email}</a></footer>`;

// ---------- pages ----------

// Case study content, shared by the standalone pages (h1) and the modal on the home page (h2).
function caseContent(p, base, heading) {
  const steps = p.steps.map((s) => `<li><h3>${e(s[0])}</h3><p>${e(s[1])}</p></li>`).join("");
  return `<p class="case-kicker"><span>${e(p.type)}</span><span>${e(p.status)} · ${e(p.year)}</span></p>
<${heading} class="case-title">${e(p.name)}<span class="accent">.</span></${heading}><p class="case-tagline">${e(p.title)}</p><p class="case-intro">${e(p.intro)}</p>
<dl class="case-meta"><div><dt>Role</dt><dd>${e(p.role)}</dd></div><div><dt>Built with</dt><dd>${p.stack.map(e).join(" · ")}</dd></div>${p.repo ? `<div><dt>Source</dt><dd><a class="case-repo" href="${e(p.repo)}" target="_blank" rel="noopener">${e(p.repo.replace("https://", ""))} ${icon("arrow", 14)}</a></dd></div>` : ""}</dl>
<figure class="case-cover"><img decoding="async" src="${base}assets/${webp(p.image)}" alt="${e(p.name)} interface" loading="lazy"></figure>
<section class="case-section"><p class="eyebrow">The problem</p><h3 class="case-h">What needed to work.</h3><p>${e(p.challenge)}</p></section>
<section class="case-section"><p class="eyebrow">The workflow</p><h3 class="case-h">A deliberate path.</h3><ol class="case-steps">${steps}</ol></section>
<section class="case-section"><p class="eyebrow">My contribution</p><h3 class="case-h">Under the interface.</h3><ul class="case-list">${p.contributions.map((c) => `<li>${e(c)}</li>`).join("")}</ul></section>
${p.detailImage ? `<figure class="case-cover"><img decoding="async" src="${base}assets/${webp(p.detailImage)}" alt="${e(p.name)} detail" loading="lazy"></figure>` : ""}
<section class="case-section"><p class="eyebrow">Engineering decisions</p><div class="case-decisions">${p.decisions.map((d) => `<div><h4>${e(d[0])}</h4><p>${e(d[1])}</p></div>`).join("")}</div></section>
<aside class="case-note"><p class="eyebrow">Project context</p><p>${e(p.note)}</p></aside>`;
}

function casePage(p, i) {
  const next = projects[(i + 1) % projects.length];
  return (
    head(`${p.name} — Quang Anh`, p.summary, "../") +
    `<main id="main" class="case"><a class="back" href="../index.html#projects">${icon("left", 16)} All projects</a>
${caseContent(p, "../", "h1")}
<a class="case-next" href="${next.slug}.html"><span class="eyebrow">Next project</span><span>${e(next.name)} ${icon("arrow", 28)}</span></a></main>${footer("../")}${dock("../index.html")}</body></html>`
  );
}

// Modal shell plus one template per project; modal.js fills the shell on click.
const modal = `<dialog class="project-modal" aria-label="Project case study"><div class="modal-shell"><button class="modal-close" type="button" aria-label="Close case study">${icon("close", 20)}</button><div class="modal-body case"></div></div></dialog>
${projects
  .map((p, i) => {
    const next = projects[(i + 1) % projects.length];
    return `<template id="tpl-${p.slug}">${caseContent(p, "", "h2")}<a class="case-next" href="projects/${next.slug}.html" data-project="${next.slug}"><span class="eyebrow">Next project</span><span>${e(next.name)} ${icon("arrow", 28)}</span></a></template>`;
  })
  .join("")}`;

// Loading screen, home page only. Markup first, then its script inline so it runs before the page paints.
const loader = `<div class="loader" id="loader" aria-hidden="true"><div class="loader-inner">
<p class="loader-logo">${e(site.logo)}</p>
<div class="loader-ring" data-ring>${'<span></span>'.repeat(12)}</div>
<p class="loader-count"><span data-count>000</span><sup>%</sup></p>
<p class="loader-note" data-note>Preparing the workspace</p></div>
<div class="loader-track"><span data-bar></span></div></div>
<script>${fs.readFileSync(path.join(__dirname, "loader.js"), "utf8")}</script>`;

const index =
  head(
    "Quang Anh — Portfolio",
    "Nguyễn Quang Anh, AI engineer in Hanoi: retrieval pipelines, agent workflows and the backend systems behind them.",
  ) +
  loader +
  `<main id="main">${hero}<div class="flow"><div class="flow-bg" aria-hidden="true"><canvas class="flow-veil"></canvas></div>${about}${journeyHtml}${philosophy}${stack}${projectsHtml}${contact}${playground}</div></main>${footer()}${dock()}${modal}<script src="background.js" defer></script><script src="stage.js" defer></script><script src="modal.js" defer></script></body></html>`;

fs.mkdirSync(path.join(out, "projects"), { recursive: true });
fs.cpSync(path.join(root, "public", "assets"), path.join(out, "assets"), { recursive: true });
fs.copyFileSync(path.join(__dirname, "styles.css"), path.join(out, "styles.css"));
fs.copyFileSync(path.join(__dirname, "app.js"), path.join(out, "app.js"));
fs.copyFileSync(path.join(__dirname, "stage.js"), path.join(out, "stage.js"));
fs.copyFileSync(path.join(__dirname, "background.js"), path.join(out, "background.js"));
fs.copyFileSync(path.join(__dirname, "modal.js"), path.join(out, "modal.js"));
fs.writeFileSync(
  path.join(out, "assets", "favicon.svg"),
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#91ddd2"/><stop offset="1" stop-color="#78b2ed"/></linearGradient></defs><rect width="64" height="64" rx="16" fill="#070b12"/><text x="9" y="43" font-family="Arial Black,Arial,sans-serif" font-size="30" font-weight="900" fill="url(#g)">QA</text></svg>',
);
fs.writeFileSync(path.join(out, "index.html"), index);
projects.forEach((p, i) => fs.writeFileSync(path.join(out, "projects", `${p.slug}.html`), casePage(p, i)));
console.log(`Built index + ${projects.length} case studies into dist/`);
