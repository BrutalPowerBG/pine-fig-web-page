(function () {
  const Codex = window.Codex = window.Codex || {};

  function hay(parts) {
    return parts.filter(Boolean).join(" \n ").toLowerCase();
  }

  function indexHero(hero, tax) {
    const taxMap = Codex.schema.taxMap(tax);
    const roles = (hero.roleIds || []).map(function (id) { return taxMap[id] && taxMap[id].name; });
    const tags = (hero.tagIds || []).map(function (id) { return taxMap[id] && taxMap[id].name; });
    const stats = (hero.stats || []).map(function (s) { return s.id + " " + Codex.schema.statName(s.id) + " " + s.value; });
    const abilities = (hero.abilities || []).map(function (ab) {
      const abilityTags = (ab.tagIds || []).map(function (id) { return taxMap[id] && taxMap[id].name; }).join(" ");
      return [ab.name, ab.summary, ab.lore, ab.kind, ab.cooldown, ab.cost, ab.range, abilityTags, (ab.effects || []).join(" "), (ab.upgrades || []).join(" "), (ab.interactions || []).join(" ")].join(" ");
    });
    const related = (hero.related || []).map(function (item) { return item.name + " " + item.note; });
    return hay([
      hero.name, hero.epithet, hero.code, hero.summary, hero.phase,
      Codex.schema.taxName(tax, hero.productionStateId, ""),
      Codex.schema.taxName(tax, hero.tierId, ""),
      roles.join(" "), tags.join(" "),
      (hero.lore || []).join(" "),
      stats.join(" "),
      abilities.join(" "),
      related.join(" ")
    ]);
  }

  function searchAll(query, heroes, tax) {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return [];
    const results = [];
    heroes.forEach(function (hero) {
      const taxMap = Codex.schema.taxMap(tax);
      if (indexHero(hero, tax).indexOf(q) !== -1) {
        results.push({
          type: "Hero",
          id: hero.id,
          heroId: hero.id,
          label: hero.name,
          href: "#/hero/" + encodeURIComponent(hero.id),
          hint: hero.epithet || Codex.schema.taxName(tax, hero.productionStateId, "")
        });
      }
      (hero.abilities || []).forEach(function (ab) {
        const abilityTags = (ab.tagIds || []).map(function (id) { return taxMap[id] && taxMap[id].name; }).join(" ");
        const blob = hay([ab.name, ab.summary, ab.lore, ab.kind, ab.cooldown, ab.cost, ab.range, abilityTags, (ab.effects || []).join(" "), (ab.upgrades || []).join(" "), (ab.interactions || []).join(" ")]);
        if (blob.indexOf(q) !== -1) {
          results.push({
            type: "Ability",
            id: ab.id,
            heroId: hero.id,
            abilityId: ab.id,
            label: ab.name,
            href: "#/hero/" + encodeURIComponent(hero.id) + "/ability/" + encodeURIComponent(ab.id),
            hint: "On " + hero.name
          });
        }
      });
      (hero.lore || []).forEach(function (p) {
        if (p.toLowerCase().indexOf(q) !== -1) {
          results.push({
            type: "Lore",
            id: hero.id + "-lore",
            heroId: hero.id,
            label: hero.name,
            href: "#/hero/" + encodeURIComponent(hero.id),
            hint: p.slice(0, 90)
          });
        }
      });
      (hero.related || []).forEach(function (item) {
        const blob = hay([item.name, item.note, item.type]);
        if (blob.indexOf(q) !== -1) {
          results.push({
            type: "Linked",
            id: hero.id + "-rel-" + item.id,
            heroId: hero.id,
            label: item.name || "Linked entry",
            href: "#/hero/" + encodeURIComponent(hero.id),
            hint: "From " + hero.name
          });
        }
      });
      (hero.tagIds || []).concat(hero.roleIds || []).forEach(function (id) {
        const name = (taxMap[id] && taxMap[id].name) || "";
        if (name.toLowerCase().indexOf(q) !== -1) {
          results.push({
            type: taxMap[id] && taxMap[id].type === "role" ? "Role" : "Tag",
            id: hero.id + "-" + id,
            heroId: hero.id,
            label: hero.name,
            href: "#/hero/" + encodeURIComponent(hero.id),
            hint: name
          });
        }
      });
    });
    const seen = {};
    return results.filter(function (row) {
      const key = row.type + ":" + row.id;
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function bindNav() {
    const search = document.querySelector("[data-search]");
    const results = document.querySelector("[data-results]");
    if (!search || !results) return;

    function close() { results.classList.remove("open"); results.innerHTML = ""; }

    search.addEventListener("input", async function () {
      const query = search.value.trim();
      if (!query) { close(); return; }
      const [heroes, tax] = await Promise.all([Codex.store.loadDossiers(), Codex.store.listTaxonomy()]);
      const matches = searchAll(query, heroes, tax).slice(0, 12);
      if (!matches.length) {
        results.innerHTML = '<button type="button" disabled>No matching entries</button>';
        results.classList.add("open");
        return;
      }
      results.innerHTML = matches.map(function (entry) {
        return '<button type="button" data-href="' + Codex.schema.escapeHtml(entry.href) + '"><small>' + Codex.schema.escapeHtml(entry.type) + "</small>" + Codex.schema.escapeHtml(entry.label) + (entry.hint ? '<small>' + Codex.schema.escapeHtml(entry.hint) + "</small>" : "") + "</button>";
      }).join("") + '<button type="button" data-href="#/search?q=' + encodeURIComponent(query) + '"><small>Search</small>View all results</button>';
      results.classList.add("open");
    });

    search.addEventListener("keydown", function (event) {
      if (event.key !== "Enter") return;
      event.preventDefault();
      const q = search.value.trim();
      if (q) location.hash = "#/search?q=" + encodeURIComponent(q);
      close();
    });

    results.addEventListener("click", function (event) {
      const button = event.target.closest("button[data-href]");
      if (!button) return;
      location.hash = button.getAttribute("data-href");
      close();
      search.value = "";
    });

    document.addEventListener("click", function (event) {
      if (!event.target.closest(".search")) close();
    });
  }

  function renderPage(mount, query, heroes, tax) {
    const esc = Codex.schema.escapeHtml;
    const matches = searchAll(query, heroes, tax);
    mount.innerHTML =
      '<section class="page-block wrap">' +
        '<div class="crumbs"><a href="#/">Directory</a><span>/</span><span>Search</span></div>' +
        "<h1>Search</h1>" +
        '<p class="lede">Results across heroes, abilities, lore, tags, and linked entries in the data folder.</p>' +
        (query ? "<p>Query: <strong>" + esc(query) + "</strong></p>" : missingNote("Type a phrase in the header search.")) +
        (matches.length
          ? '<div class="result-list">' + matches.map(function (entry) {
            return '<a class="result-row" href="' + esc(entry.href) + '"><small>' + esc(entry.type) + "</small><strong>" + esc(entry.label) + "</strong><span>" + esc(entry.hint || "") + "</span></a>";
          }).join("") + "</div>"
          : (query ? '<div class="empty-state"><h2>No matching entries</h2><p>Try a hero name, ability, lore phrase, or tag.</p></div>' : "")) +
      "</section>";
  }

  function missingNote(text) {
    return '<p class="missing">' + Codex.schema.escapeHtml(text) + "</p>";
  }

  Codex.search = { searchAll: searchAll, bindNav: bindNav, renderPage: renderPage };
})();
