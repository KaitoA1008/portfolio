// Project case studies open in a window over the page instead of a new page.
// Links keep their real href (new tab, no-JS); the URL hash (#project-slug) is shareable and Back closes it.
(() => {
  const dialog = document.querySelector(".project-modal");
  if (!dialog || typeof dialog.showModal !== "function") return;
  const body = dialog.querySelector(".modal-body");
  const root = document.documentElement;
  const cursor = document.querySelector(".cursor");
  const HASH = /^#project-([\w-]+)$/;

  const render = (slug) => {
    const tpl = document.getElementById(`tpl-${slug}`);
    if (!tpl) return false;
    body.replaceChildren(tpl.content.cloneNode(true));
    body.scrollTop = 0;
    return true;
  };

  const open = (slug, mode = "push") => {
    if (!render(slug)) return;
    if (!dialog.open) {
      dialog.showModal();
      root.classList.add("modal-open");
      if (cursor) dialog.append(cursor); // the page cursor would sit under the modal's top layer
    }
    const state = { project: slug, initial: mode === "initial" };
    if (mode === "push") history.pushState(state, "", `#project-${slug}`);
    else history.replaceState(state, "", `#project-${slug}`);
    dialog.querySelector(".modal-close").focus({ preventScroll: true });
  };

  // Closing goes back in history when the window added an entry, so Back and × behave the same.
  const close = () => {
    if (!dialog.open) return;
    if (history.state && history.state.project && !history.state.initial) history.back();
    else dialog.close();
  };

  dialog.addEventListener("close", () => {
    root.classList.remove("modal-open");
    if (cursor) document.body.append(cursor);
    body.replaceChildren();
    if (HASH.test(location.hash)) history.replaceState(null, "", `${location.pathname}${location.search}#projects`);
  });
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    close();
  });
  dialog.querySelector(".modal-close").addEventListener("click", close);
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) close(); // backdrop
  });

  addEventListener("popstate", () => {
    const m = location.hash.match(HASH);
    if (m) open(m[1], "replace");
    else if (dialog.open) dialog.close();
  });

  document.addEventListener("click", (e) => {
    const link = e.target.closest("[data-project]");
    if (!link || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    open(link.dataset.project, dialog.open ? "replace" : "push");
  });
  addEventListener("open-project", (e) => open(e.detail, dialog.open ? "replace" : "push"));

  const initial = location.hash.match(HASH);
  if (initial) {
    // A deep link opens once the loading screen has gone, so the window is not hidden behind it.
    if (root.classList.contains("is-loading")) addEventListener("loader-done", () => open(initial[1], "initial"), { once: true });
    else open(initial[1], "initial");
  }
})();
