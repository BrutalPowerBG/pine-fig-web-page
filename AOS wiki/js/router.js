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

  async function render() {
    if (!location.hash) {
      location.hash = "#/";
      return;
    }
    const route = parse();
    const view = document.getElementById("view");
    Codex.heroPage.destroy();
    Codex.editor.draft = null;
    view.dataset.edit = "off";
    document.documentElement.style.setProperty("--accent", "#f0c67a");
    document.documentElement.style.setProperty("--accent-2", "#ff7340");
    document.documentElement.style.setProperty("--glow", "rgba(240, 198, 122, 0.45)");

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
    window.addEventListener("hashchange", render);
    render();
  }

  Codex.router = { start: start, refresh: render, parse: parse, fillHeroChrome: fillHeroChrome };
})();
