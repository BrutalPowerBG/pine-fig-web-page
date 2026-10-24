(function () {
  const Codex = window.Codex = window.Codex || {};
  const state = {
    view: "grid",
    sort: "updatedAt",
    dir: "desc",
    roles: {},
    tags: {},
    tiers: {},
    states: {},
    statMin: {},
    statMax: {}
  };

  function selected(map) {
    return Object.keys(map).filter(function (key) { return map[key]; });
  }

  function matches(hero, tax) {
    const roles = selected(state.roles);
    const tags = selected(state.tags);
    const tiers = selected(state.tiers);
    const states = selected(state.states);
    if (roles.length && !roles.some(function (id) { return (hero.roleIds || []).indexOf(id) !== -1; })) return false;
    if (tags.length && !tags.some(function (id) {
      return (hero.tagIds || []).indexOf(id) !== -1
        || (hero.abilities || []).some(function (ab) { return (ab.tagIds || []).indexOf(id) !== -1; });
    })) return false;
    if (tiers.length && tiers.indexOf(hero.tierId) === -1) return false;
    if (states.length && states.indexOf(hero.productionStateId) === -1) return false;
    return Codex.schema.STAT_DEFS.every(function (def) {
      const stat = (hero.stats || []).find(function (item) { return item.id === def.id; });
      const num = Codex.schema.parseStatNumber(stat && stat.value);
      const min = state.statMin[def.id];
      const max = state.statMax[def.id];
      if (min != null && min !== "" && (num == null || num < Number(min))) return false;
      if (max != null && max !== "" && (num == null || num > Number(max))) return false;
      return true;
    });
  }

  function sortHeroes(list, tax) {
    const taxMap = Codex.schema.taxMap(tax);
    const copy = list.slice();
    copy.sort(function (a, b) {
      let av;
      let bv;
      if (state.sort === "name") {
        av = (a.name || "").toLowerCase();
        bv = (b.name || "").toLowerCase();
      } else if (state.sort === "tier") {
        av = (taxMap[a.tierId] && taxMap[a.tierId].value) || 0;
        bv = (taxMap[b.tierId] && taxMap[b.tierId].value) || 0;
      } else if (state.sort === "production") {
        av = (taxMap[a.productionStateId] && taxMap[a.productionStateId].order) || 0;
        bv = (taxMap[b.productionStateId] && taxMap[b.productionStateId].order) || 0;
      } else if (state.sort === "updatedAt") {
        av = a.updatedAt || "";
        bv = b.updatedAt || "";
      } else {
        const sa = (a.stats || []).find(function (s) { return s.id === state.sort; });
        const sb = (b.stats || []).find(function (s) { return s.id === state.sort; });
        av = Codex.schema.parseStatNumber(sa && sa.value);
        bv = Codex.schema.parseStatNumber(sb && sb.value);
        if (av == null) av = -Infinity;
        if (bv == null) bv = -Infinity;
      }
      if (av < bv) return state.dir === "asc" ? -1 : 1;
      if (av > bv) return state.dir === "asc" ? 1 : -1;
      return (a.name || "").localeCompare(b.name || "");
    });
    return copy;
  }

  async function cardHtml(hero, tax) {
    const esc = Codex.schema.escapeHtml;
    const taxMap = Codex.schema.taxMap(tax);
    const src = await Codex.ui.resolveSrc(hero.artwork);
    const roles = (hero.roleIds || []).map(function (id) { return taxMap[id] && taxMap[id].name; }).filter(Boolean);
    const tags = (hero.tagIds || []).map(function (id) { return taxMap[id] && taxMap[id].name; }).filter(Boolean);
    const stats = (hero.stats || []).slice(0, 4).map(function (stat) {
      return '<span><i>' + esc(stat.code) + "</i> " + esc(stat.value) + "</span>";
    }).join("");
    return (
      '<a class="hero-card" href="#/hero/' + encodeURIComponent(hero.id) + '">' +
        '<div class="hero-card-art">' + (src ? '<img src="' + esc(src) + '" alt="">' : '<div class="portrait-empty">No art</div>') + "</div>" +
        "<div class=\"hero-card-body\">" +
          '<div class="card-kicker"><span class="chip ghost">' + esc(Codex.schema.taxName(tax, hero.productionStateId, "—")) + '</span><span class="chip">Tier ' + esc(Codex.schema.taxName(tax, hero.tierId, "—")) + "</span></div>" +
          "<h3>" + esc(hero.name || "Untitled") + "</h3>" +
          '<p class="epithet">' + esc(hero.epithet || "") + "</p>" +
          '<div class="chip-row">' + roles.map(function (role) { return '<span class="chip ghost">' + esc(role) + "</span>"; }).join("") +
            tags.map(function (tag) { return '<span class="chip">' + esc(tag) + "</span>"; }).join("") + "</div>" +
          '<div class="mini-stats">' + stats + "</div>" +
        "</div>" +
      "</a>"
    );
  }

  function chipGroup(label, items, map, key) {
    const esc = Codex.schema.escapeHtml;
    return '<div class="filter-block"><span class="mini-label">' + esc(label) + '</span><div class="chip-picks">' +
      items.map(function (item) {
        const on = !!map[item.id];
        return '<button type="button" class="chip-toggle' + (on ? " is-on" : "") + '" data-filter-key="' + key + '" data-id="' + esc(item.id) + '">' + esc(item.name) + "</button>";
      }).join("") + "</div></div>";
  }

  async function render(mount, heroes, tax) {
    const esc = Codex.schema.escapeHtml;
    const filtered = sortHeroes(heroes.filter(function (hero) { return matches(hero, tax); }), tax);
    const recent = heroes.slice().sort(function (a, b) { return String(b.updatedAt).localeCompare(String(a.updatedAt)); }).slice(0, 4);

    const sortOpts = [
      ["updatedAt", "Recent updates"],
      ["name", "Name"],
      ["tier", "Tier"],
      ["production", "Production state"]
    ].concat(Codex.schema.STAT_DEFS.map(function (def) { return [def.id, def.name]; }));

    const statFilters = Codex.schema.STAT_DEFS.map(function (def) {
      return '<label class="stat-range">' + esc(def.code) +
        ' <input type="number" data-stat-min="' + def.id + '" placeholder="min" value="' + esc(state.statMin[def.id] || "") + '">' +
        ' <input type="number" data-stat-max="' + def.id + '" placeholder="max" value="' + esc(state.statMax[def.id] || "") + '">' +
        "</label>";
    }).join("");

    const recentHtml = recent.length
      ? '<div class="recent-row">' + (await Promise.all(recent.map(function (hero) { return cardHtml(hero, tax); }))).join("") + "</div>"
      : "";
    const cards = await Promise.all(filtered.map(function (hero) { return cardHtml(hero, tax); }));

    mount.innerHTML =
      '<section class="page-block wrap">' +
        '<div class="dir-head">' +
          "<div><p class=\"kicker-plain\">Allure of the Supernal</p><h1>Hero encyclopedia</h1><p class=\"lede\">Design dossiers are files in the data folder on this PC. The directory reads the catalog; opening a hero loads that hero’s file.</p></div>" +
          '<a class="btn primary" href="#/create">Create New Hero</a>' +
        "</div>" +
        (recent.length ? '<div class="section-head tight"><h2>Recently updated</h2></div>' + recentHtml : "") +
        '<div class="dir-toolbar">' +
          '<div class="view-toggle">' +
            '<button type="button" data-view="grid" aria-pressed="' + (state.view === "grid") + '">Grid</button>' +
            '<button type="button" data-view="list" aria-pressed="' + (state.view === "list") + '">List</button>' +
          "</div>" +
          '<label>Sort <select data-sort>' + sortOpts.map(function (opt) {
            return '<option value="' + opt[0] + '"' + (state.sort === opt[0] ? " selected" : "") + ">" + esc(opt[1]) + "</option>";
          }).join("") + "</select></label>" +
          '<label>Direction <select data-dir><option value="desc"' + (state.dir === "desc" ? " selected" : "") + '>Descending</option><option value="asc"' + (state.dir === "asc" ? " selected" : "") + ">Ascending</option></select></label>" +
          '<button type="button" class="btn ghost" data-clear-filters>Clear filters</button>' +
        "</div>" +
        '<div class="dir-filters">' +
          chipGroup("Roles", Codex.schema.taxByType(tax, "role"), state.roles, "roles") +
          chipGroup("Tags", Codex.schema.taxByType(tax, "tag"), state.tags, "tags") +
          chipGroup("Tiers", Codex.schema.taxByType(tax, "tier"), state.tiers, "tiers") +
          chipGroup("Production state", Codex.schema.taxByType(tax, "productionState"), state.states, "states") +
          '<div class="filter-block"><span class="mini-label">Stat ranges</span><div class="stat-ranges">' + statFilters + "</div></div>" +
        "</div>" +
        (filtered.length
          ? '<div class="hero-dir is-' + state.view + '">' + cards.join("") + "</div>"
          : '<div class="empty-state"><h2>' + (heroes.length ? "No matching heroes" : "No heroes yet") + "</h2><p>" +
            (heroes.length ? "Clear filters or create a new dossier." : "Create your first hero to start the encyclopedia.") +
            '</p><a class="btn primary" href="#/create">Create New Hero</a></div>') +
      "</section>";

    mount.querySelector("[data-sort]").addEventListener("change", function (event) {
      state.sort = event.target.value;
      Codex.router.refresh();
    });
    mount.querySelector("[data-dir]").addEventListener("change", function (event) {
      state.dir = event.target.value;
      Codex.router.refresh();
    });
    mount.querySelectorAll("[data-view]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.view = btn.getAttribute("data-view");
        Codex.router.refresh();
      });
    });
    mount.querySelector("[data-clear-filters]").addEventListener("click", function () {
      state.roles = {}; state.tags = {}; state.tiers = {}; state.states = {}; state.statMin = {}; state.statMax = {};
      Codex.router.refresh();
    });
    mount.querySelectorAll("[data-filter-key]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const key = btn.getAttribute("data-filter-key");
        const id = btn.getAttribute("data-id");
        state[key][id] = !state[key][id];
        Codex.router.refresh();
      });
    });
    mount.querySelectorAll("[data-stat-min]").forEach(function (input) {
      input.addEventListener("change", function () {
        state.statMin[input.getAttribute("data-stat-min")] = input.value;
        Codex.router.refresh();
      });
    });
    mount.querySelectorAll("[data-stat-max]").forEach(function (input) {
      input.addEventListener("change", function () {
        state.statMax[input.getAttribute("data-stat-max")] = input.value;
        Codex.router.refresh();
      });
    });
  }

  Codex.home = { render: render };
})();
