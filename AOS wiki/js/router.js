(function () {
  const Codex = window.Codex = window.Codex || {};

  function parse() {
    let raw = (location.hash || "").replace(/^#/, "");
    const qIndex = raw.indexOf("?");
    let query = {};
    if (qIndex !== -1) {
      query = Object.fromEntries(new URLSearchParams(raw.slice(qIndex + 1)));
      raw = raw.slice(0, qIndex);
    }
    if (!raw || raw === "/") return { name: "home", parts: [], query: query };
    const parts = raw.split("/").filter(Boolean);
    if (parts[0] === "create") return { name: "create", parts: parts, query: query };
    if (parts[0] === "taxonomy") return { name: "taxonomy", parts: parts, query: query };
    if (parts[0] === "setup") return { name: "setup", parts: parts, query: query };
    if (parts[0] === "search") return { name: "search", parts: parts, query: query };
    if (parts[0] === "hero" && parts[1]) {
      if (parts[2] === "edit") return { name: "edit", id: parts[1], parts: parts, query: query };
      if (parts[2] === "history" && parts[3]) return { name: "version", id: parts[1], version: parts[3], parts: parts, query: query };
      if (parts[2] === "history") return { name: "history", id: parts[1], parts: parts, query: query };
      if (parts[2] === "ability") return { name: "hero", id: parts[1], abilityId: parts[3], parts: parts, query: query };
      return { name: "hero", id: parts[1], parts: parts, query: query };
    }
    return { name: "home", parts: parts, query: query };
  }

  function fillHeroChrome(hero, mode) {
    const crumbs = document.querySelector("[data-crumbs]");
    if (crumbs) {
      crumbs.innerHTML = '<a href="#/">Directory</a><span>/</span><a href="#/hero/' + encodeURIComponent(hero.id) + '">' +
        Codex.schema.escapeHtml(hero.name || "Hero") + "</a>" +
        (mode === "edit" ? "<span>/</span><span>Edit</span>" : "") +
        (mode === "history" ? "<span>/</span><span>History</span>" : "");
    }
    const tools = document.querySelector("[data-tools]");
    if (tools) {
      if (mode === "edit") tools.innerHTML = "";
      else {
        tools.innerHTML =
          '<button type="button" class="btn ghost" data-scroll="overview">Hero</button>' +
          '<button type="button" class="btn ghost" data-scroll="abilities">Abilities</button>' +
          '<a class="btn" href="#/hero/' + encodeURIComponent(hero.id) + '/edit">Edit</a>' +
          '<a class="btn ghost" href="#/hero/' + encodeURIComponent(hero.id) + '/history">History</a>';
        tools.querySelectorAll("[data-scroll]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            const el = document.getElementById(btn.getAttribute("data-scroll"));
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        });
      }
    }
  }

  async function showHero(route, mode) {
    const [hero, tax, heroes, history] = await Promise.all([
      Codex.store.getHero(route.id),
      Codex.store.listTaxonomy(),
      Codex.store.listHeroes(),
      Codex.store.listHistory(route.id)
    ]);
    const view = document.getElementById("view");
    if (!hero) {
      view.innerHTML = '<section class="page-block wrap"><div class="empty-state"><h2>Hero not found</h2><p>That id is not in the data folder.</p><a class="btn" href="#/">Back to directory</a></div></section>';
      return;
    }
    if (mode === "edit") {
      Codex.ui.navCurrent("hero");
      await Codex.editor.start({ hero: hero, tax: tax, heroes: heroes, history: history });
      fillHeroChrome(hero, "edit");
      return;
    }
    view.innerHTML = "";
    view.appendChild(document.getElementById("tpl-hero").content.cloneNode(true));
    await Codex.heroPage.render({
      mount: view,
      hero: hero,
      tax: tax,
      heroes: heroes,
      history: history,
      mode: mode || "view",
      highlightAbilityId: route.abilityId,
      versionLabel: route.versionLabel
    });
    fillHeroChrome(hero, mode || "view");
    if (route.abilityId) {
      const section = document.getElementById("abilities");
      if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // ---------- scroll memory ----------
  // Each page remembers where it was left. Moving to another page restores that page's
  // position (top on first visit); re-rendering the same page (filters, saves) keeps the
  // current position. A hero's view and edit pages share one position.
  const SCROLL_KEY = "aos-codex-scroll";
  const LOADING_DELAY_MS = 150;
  const scroll = { memory: {}, currentKey: null, settling: false };

  function scrollKey(hash) {
    return String(hash || "#/").replace(/\/edit$/, "");
  }

  function loadScrollMemory() {
    try { scroll.memory = JSON.parse(sessionStorage.getItem(SCROLL_KEY) || "{}") || {}; } catch (err) { scroll.memory = {}; }
  }

  function saveScrollMemory() {
    try { sessionStorage.setItem(SCROLL_KEY, JSON.stringify(scroll.memory)); } catch (err) { /* private mode: memory only */ }
  }

  function rememberScroll() {
    if (scroll.settling || scroll.currentKey === null) return;
    scroll.memory[scroll.currentKey] = window.scrollY;
  }

  function scrollToY(y) {
    window.scrollTo({ top: y, left: 0, behavior: "instant" });
  }

  // Late-loading images can make the page too short for the first attempt; retry once.
  function restoreScroll(y) {
    scrollToY(y);
    if (window.scrollY >= y) return;
    const landed = window.scrollY;
    window.setTimeout(function () {
      if (window.scrollY === landed) scrollToY(y);
    }, 300);
  }

  async function render() {
    if (!location.hash) {
      location.hash = "#/";
      return;
    }
    const route = parse();
    const view = document.getElementById("view");
    const key = scrollKey(location.hash);
    const navigating = key !== scroll.currentKey;
    const targetY = navigating ? (scroll.memory[key] || 0) : window.scrollY;
    scroll.currentKey = key;
    scroll.settling = true;
    const loadingTimer = window.setTimeout(function () {
      view.classList.add("is-loading");
      view.setAttribute("aria-busy", "true");
    }, LOADING_DELAY_MS);
    try {
      await renderRoute(route, view);
    } finally {
      window.clearTimeout(loadingTimer);
      view.classList.remove("is-loading");
      view.removeAttribute("aria-busy");
      // An ability link scrolls itself to the Abilities section.
      if (!(navigating && route.abilityId)) restoreScroll(targetY);
      scroll.settling = false;
      rememberScroll();
    }
  }

  async function renderRoute(route, view) {
    Codex.heroPage.destroy();
    Codex.editor.draft = null;
    view.dataset.edit = "off";
    Codex.ui.applyTheme(Codex.schema.themeFor(null));

    try {
      const nav = document.querySelector(".nav");
      if (nav) document.documentElement.style.setProperty("--nav-full-h", Math.round(nav.getBoundingClientRect().height) + "px");
      if (route.name === "home") {
        Codex.ui.navCurrent("home");
        document.title = "Hero encyclopedia — Allure of the Supernal Codex";
        const [heroes, tax] = await Promise.all([Codex.store.listHeroes(), Codex.store.listTaxonomy()]);
        await Codex.home.render(view, heroes, tax);
        return;
      }
      if (route.name === "create") {
        Codex.ui.navCurrent("create");
        document.title = "Create New Hero — Allure of the Supernal Codex";
        const [heroes, tax] = await Promise.all([Codex.store.listHeroes(), Codex.store.listTaxonomy()]);
        Codex.editor.renderCreate(view, tax, heroes);
        return;
      }
      if (route.name === "taxonomy") {
        Codex.ui.navCurrent("taxonomy");
        document.title = "Tags & states — Allure of the Supernal Codex";
        const [heroes, tax] = await Promise.all([Codex.store.listHeroes(), Codex.store.listTaxonomy()]);
        await Codex.taxonomy.render(view, tax, heroes);
        return;
      }
      if (route.name === "setup") {
        Codex.ui.navCurrent("setup");
        document.title = "Setup — Allure of the Supernal Codex";
        await Codex.setupPage.render(view, await Codex.store.listTaxonomy());
        return;
      }
      if (route.name === "search") {
        Codex.ui.navCurrent("home");
        document.title = "Search — Allure of the Supernal Codex";
        const [heroes, tax] = await Promise.all([Codex.store.loadDossiers(), Codex.store.listTaxonomy()]);
        Codex.search.renderPage(view, route.query.q || "", heroes, tax);
        return;
      }
      if (route.name === "history") {
        Codex.ui.navCurrent("hero");
        const hero = await Codex.store.getHero(route.id);
        if (!hero) {
          view.innerHTML = '<section class="page-block wrap"><div class="empty-state"><h2>Hero not found</h2></div></section>';
          return;
        }
        document.title = hero.name + " history — Allure of the Supernal Codex";
        const [history, tax] = await Promise.all([Codex.store.listHistory(route.id), Codex.store.listTaxonomy()]);
        await Codex.historyView.render(view, hero, history, tax);
        return;
      }
      if (route.name === "version") {
        Codex.ui.navCurrent("hero");
        const tenths = Number(route.version);
        const snap = await Codex.store.getSnapshot(route.id, tenths);
        if (!snap) {
          view.innerHTML = '<section class="page-block wrap"><div class="empty-state"><h2>Version not found</h2></div></section>';
          return;
        }
        const [tax, heroes, history, current] = await Promise.all([
          Codex.store.listTaxonomy(),
          Codex.store.listHeroes(),
          Codex.store.listHistory(route.id),
          Codex.store.getHero(route.id)
        ]);
        view.innerHTML = "";
        view.appendChild(document.getElementById("tpl-hero").content.cloneNode(true));
        await Codex.heroPage.render({
          mount: view,
          hero: snap.hero,
          tax: tax,
          heroes: heroes,
          history: history,
          mode: "history",
          versionLabel: Codex.version.tenthsToString(tenths)
        });
        fillHeroChrome(current || snap.hero, "history");
        const tools = document.querySelector("[data-tools]");
        if (tools) {
          tools.innerHTML =
            '<button type="button" class="btn" data-restore-now>Restore this version</button>' +
            '<a class="btn ghost" href="#/hero/' + encodeURIComponent(route.id) + '/history">Back to history</a>';
          tools.querySelector("[data-restore-now]").addEventListener("click", async function () {
            const ok = await Codex.ui.confirm("Restore this version?", "A new draft will be created. Later history is kept.", "Restore");
            if (!ok) return;
            const next = Codex.schema.normalizeHero(snap.hero);
            next.id = route.id;
            try {
              const result = await Codex.store.saveHero(next, { restoreFrom: Codex.version.tenthsToString(tenths) });
              if (!result.saved) return Codex.ui.toast("No changes to restore.", "ok");
              Codex.ui.toast("Restored as v" + result.version + ".", "ok");
              location.hash = "#/hero/" + encodeURIComponent(route.id);
            } catch (err) {
              Codex.ui.toast(err.message || "Restore failed.", "err");
            }
          });
        }
        return;
      }
      if (route.name === "edit" || route.name === "hero") {
        Codex.ui.navCurrent(route.name === "edit" ? "create" : "hero");
        await showHero(route, route.name === "edit" ? "edit" : "view");
      }
    } catch (err) {
      console.error(err);
      view.innerHTML = '<section class="page-block wrap"><div class="empty-state"><h2>Something went wrong</h2><p>' + Codex.schema.escapeHtml(err.message || "Unknown error") + "</p></div></section>";
    }
  }

  function start() {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    loadScrollMemory();
    let queued = false;
    window.addEventListener("scroll", function () {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(function () { queued = false; rememberScroll(); });
    }, { passive: true });
    window.addEventListener("pagehide", saveScrollMemory);
    window.addEventListener("hashchange", function () {
      rememberScroll();
      saveScrollMemory();
      render();
    });
    render();
  }

  Codex.router = { start: start, refresh: render, parse: parse, fillHeroChrome: fillHeroChrome };
})();
