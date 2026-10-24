(function () {
  const Codex = window.Codex = window.Codex || {};
  const esc = Codex.schema.escapeHtml;

  let live = {
    root: null,
    onKey: null,
    onResize: null,
    paint: 0,
    activeId: "",
    kindFilter: "all",
    roleFilter: "all",
    iconSrc: {}
  };

  function destroy() {
    if (live.onKey) document.removeEventListener("keydown", live.onKey);
    if (live.onResize) window.removeEventListener("resize", live.onResize);
    live.onKey = null;
    live.onResize = null;
    live.root = null;
    Codex.ui.revokeUrls();
  }

  function tagClass(name) {
    const slug = Codex.schema.slugify(name);
    if (slug === "damage" || slug === "movement" || slug === "control") return "tag tag-" + slug;
    return "tag";
  }

  function missing(text) {
    return '<p class="missing">' + esc(text) + "</p>";
  }

  function renderBoard(movement, editable) {
    const setupBoard = Codex.schema.board();
    const size = setupBoard.size;
    const origin = setupBoard.origin;
    const reach = {};
    (movement.squares || []).forEach(function (sq) { reach[Codex.schema.squareKey(sq)] = true; });
    const cells = [];
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        const key = row + "," + col;
        const isOrigin = row === origin.row && col === origin.col;
        const isReach = !!reach[key];
        let cls = "";
        let inner = "";
        if (isOrigin) cls = "origin";
        else if (isReach) { cls = "reach"; inner = "+"; }
        cells.push(
          '<span class="' + cls + (editable && !isOrigin ? " is-edit-cell" : "") + '" data-row="' + row + '" data-col="' + col + '" aria-hidden="true">' + inner + "</span>"
        );
      }
    }
    const flags = [];
    if (movement.intermediateMustBeEmpty) flags.push("Needs a clear path");
    return (
      '<div><h3>' + esc(setupBoard.label) + "</h3>" +
      '<p data-move-tip>' + esc(setupBoard.note) + (flags.length ? " " + esc(flags.join(" · ")) : "") + "</p></div>" +
      '<div class="board" style="grid-template-columns:repeat(' + size + ',minmax(0,1fr))" role="img" aria-label="' + esc(setupBoard.note) + '">' +
      cells.join("") + "</div>"
    );
  }

  function abilityButton(ability, index, taxMap, iconHtml, pressed) {
    const tags = (ability.tagIds || []).map(function (id) { return taxMap[id] ? taxMap[id].name : id.replace(/^tag-/, ""); });
    return (
      '<button class="ability-key" type="button" data-ability="' + esc(ability.id) + '" data-kind="' + esc(ability.kind) + '" data-roles="' + esc(tags.join(" ")) + '" aria-pressed="' + (pressed ? "true" : "false") + '">' +
        '<span class="icon"><span class="slot-square">' + esc(ability.slot) + "</span>" + iconHtml + "</span>" +
        '<span class="tag-groups"><span class="tag-row"><span class="kind">' + esc(ability.kind) + "</span></span>" +
        '<span class="tag-row">' + tags.map(function (tag) { return '<span class="' + tagClass(tag) + '">' + esc(tag) + "</span>"; }).join("") + "</span></span>" +
        '<span class="ability-name">' + esc(ability.name) + "</span>" +
        '<span class="ability-cd">' + esc(ability.cooldown || "—") + "</span>" +
      "</button>"
    );
  }

  function list(items) {
    if (!items || !items.length) return missing("None recorded.");
    return "<ul>" + items.map(function (item) { return "<li>" + esc(item) + "</li>"; }).join("") + "</ul>";
  }

  function cardHtml(ability, taxMap, iconHtml, mode) {
    const tags = (ability.tagIds || []).map(function (id) { return taxMap[id] ? taxMap[id].name : id.replace(/^tag-/, ""); });
    const extras = [];
    ["damage", "healing", "scaling", "duration", "charges", "aoe"].forEach(function (field) {
      if (ability[field]) extras.push("<span>" + esc(field) + " <strong>" + esc(ability[field]) + "</strong></span>");
    });
    return (
      '<div class="hero-icon">' + iconHtml + "</div>" +
      "<div>" +
        "<h3>" + esc(ability.name) + "</h3>" +
        '<div class="meta">' +
          "<span>Ability <strong>" + esc(ability.slot) + "</strong></span>" +
          "<span><strong>" + esc(ability.kind.charAt(0).toUpperCase() + ability.kind.slice(1)) + "</strong></span>" +
          (tags.length ? "<span><strong>" + esc(tags.join(" · ")) + "</strong></span>" : "") +
          "<span>Cooldown <strong>" + esc(ability.cooldown) + "</strong></span>" +
          "<span>Cost <strong>" + esc(ability.cost) + "</strong></span>" +
          "<span>Range <strong>" + esc(ability.range) + "</strong></span>" +
          extras.join("") +
        "</div>" +
        '<p class="desc">' + (ability.summary ? esc(ability.summary) : "No description yet.") + "</p>" +
        (ability.lore ? '<p class="desc">' + esc(ability.lore) + "</p>" : "") +
        '<div class="detail-grid detail-grid-single">' +
          "<div><h4>Effects</h4>" + list(ability.effects) + "</div>" +
        "</div>" +
        (mode === "edit" ? '<div class="edit-row"><button type="button" class="btn" data-edit-ability="' + esc(ability.id) + '">Edit ability</button><button type="button" class="btn ghost" data-ab-import-one="' + esc(ability.id) + '">Import CSV</button><button type="button" class="btn ghost" data-delete-ability="' + esc(ability.id) + '">Delete</button></div>' : "") +
      "</div>"
    );
  }

  function alignWash(root) {
    const washImg = root.querySelector("[data-wash] img");
    const row = root.querySelector(".profile-row");
    const frame = root.querySelector("[data-portrait]");
    if (!washImg || !row || !frame || !washImg.naturalWidth) return;
    const rowRect = row.getBoundingClientRect();
    const frameRect = frame.getBoundingClientRect();
    const scale = Math.max(frameRect.width / washImg.naturalWidth, frameRect.height / washImg.naturalHeight);
    const renderedWidth = washImg.naturalWidth * scale;
    const renderedHeight = washImg.naturalHeight * scale;
    const offsetX = (renderedWidth - frameRect.width) * 0.5;
    const offsetY = (renderedHeight - frameRect.height) * 0.18;
    washImg.style.width = renderedWidth + "px";
    washImg.style.height = renderedHeight + "px";
    washImg.style.left = (frameRect.left - rowRect.left - offsetX) + "px";
    washImg.style.top = (frameRect.top - rowRect.top - offsetY) + "px";
    washImg.style.transform = "none";
  }

  function relatedCard(item, resolved, broken, sample) {
    const type = (item.type || item.targetType || "Linked") + (sample && item.targetType === "external" ? " · sample" : "");
    const name = resolved && resolved.name ? resolved.name : (item.name || "Untitled");
    const href = resolved && resolved.href;
    const inner =
      '<div class="type">' + esc(type) + (broken ? " · missing" : "") + "</div>" +
      "<h3>" + (href ? '<a href="' + esc(href) + '">' + esc(name) + "</a>" : esc(name)) + "</h3>" +
      "<p>" + esc(item.note || (broken ? "This link points at an entry that no longer exists." : "")) + "</p>";
    return "<article" + (broken ? ' class="is-broken"' : "") + ">" + inner + "</article>";
  }

  function resolveRelated(item, heroes) {
    if (item.targetType === "hero" && item.targetId) {
      const hero = heroes.find(function (h) { return h.id === item.targetId; });
      if (!hero) return { broken: true };
      return { broken: false, resolved: { name: hero.name, href: "#/hero/" + encodeURIComponent(hero.id) } };
    }
    if (item.targetType === "ability" && item.targetId) {
      for (let i = 0; i < heroes.length; i += 1) {
        const ability = (heroes[i].abilities || []).find(function (ab) { return ab.id === item.targetId; });
        if (ability) {
          return {
            broken: false,
            resolved: {
              name: ability.name + " · " + heroes[i].name,
              href: "#/hero/" + encodeURIComponent(heroes[i].id) + "/ability/" + encodeURIComponent(ability.id)
            }
          };
        }
      }
      return { broken: true };
    }
    return { broken: false, resolved: { name: item.name } };
  }

  function backlinks(hero, heroes) {
    const hits = [];
    heroes.forEach(function (other) {
      if (other.id === hero.id) return;
      (other.related || []).forEach(function (link) {
        const toHero = link.targetType === "hero" && link.targetId === hero.id;
        const toAbility = link.targetType === "ability" && (hero.abilities || []).some(function (ab) { return ab.id === link.targetId; });
        if (toHero || toAbility) {
          hits.push({
            name: other.name,
            href: "#/hero/" + encodeURIComponent(other.id),
            note: toAbility ? "Links to an ability on this hero." : (link.note || "Links here.")
          });
        }
      });
    });
    return hits;
  }

  async function render(options) {
    destroy();
    const hero = Codex.schema.normalizeHero(options.hero);
    const tax = options.tax || [];
    const taxMap = Codex.schema.taxMap(tax);
    const heroes = options.heroes || [];
    const history = options.history || [];
    const mode = options.mode || "view";
    const root = options.mount;
    live.root = root;
    live.kindFilter = "all";
    live.roleFilter = "all";
    live.paint = 0;
    live.iconSrc = {};

    root.dataset.edit = mode === "edit" ? "on" : "off";
    const theme = Codex.schema.themeFor(hero);
    Codex.ui.applyTheme(theme);
    document.title = hero.name + " — Allure of the Supernal Codex";

    const artSrc = await Codex.ui.resolveSrc(hero.artwork);
    const portrait = root.querySelector("[data-portrait]");
    const wash = root.querySelector("[data-wash]");
    if (artSrc) {
      portrait.innerHTML = '<img src="' + esc(artSrc) + '" alt="">' + '<img class="portrait-rim" src="' + esc(artSrc) + '" alt="">';
      wash.innerHTML = '<img src="' + esc(artSrc) + '" alt="">';
    } else {
      portrait.innerHTML = '<div class="portrait-empty">No artwork</div>';
      wash.innerHTML = "";
    }
    if (mode === "edit") {
      portrait.insertAdjacentHTML("beforeend",
        '<div class="art-overlay">' +
          '<button type="button" class="btn" data-upload-art>Upload image</button>' +
          (artSrc ? '<button type="button" class="btn ghost" data-remove-art>Remove</button>' : "") +
        "</div>");
    }
    const washImg = wash.querySelector("img");
    live.onResize = function () { alignWash(root); };
    window.addEventListener("resize", live.onResize);
    if (washImg) {
      washImg.addEventListener("load", live.onResize);
      if (washImg.complete) alignWash(root);
    }

    const stateName = Codex.schema.taxName(tax, hero.productionStateId, "");
    const kicker = [];
    if (hero.contentStatus === "sample") kicker.push('<span class="chip">Sample content</span>');
    if (stateName) kicker.push('<span class="chip ghost">' + esc(stateName) + "</span>");
    if (hero.phase) kicker.push('<span class="chip ember">' + esc(hero.phase) + "</span>");
    if (hero.code) kicker.push('<span class="chip ghost">' + esc(hero.code) + "</span>");
    kicker.push('<span class="chip ghost">v' + esc(hero.currentVersion) + "</span>");
    root.querySelector("[data-kicker]").innerHTML = kicker.join("");

    const nameEl = root.querySelector("[data-name]");
    const epithetEl = root.querySelector("[data-epithet]");
    if (mode === "edit") {
      nameEl.innerHTML = '<input class="inline-input display" data-field="name" value="' + esc(hero.name) + '">';
      epithetEl.innerHTML = '<input class="inline-input epithet-input" data-field="epithet" value="' + esc(hero.epithet) + '">';
    } else {
      nameEl.textContent = hero.name || "Untitled hero";
      epithetEl.textContent = hero.epithet || "";
    }

    const tier = taxMap[hero.tierId];
    const roman = tier ? tier.name : "I";
    const roles = (hero.roleIds || []).map(function (id) { return taxMap[id] ? taxMap[id].name : id; });
    const tags = (hero.tagIds || []).map(function (id) { return taxMap[id] ? taxMap[id].name : id; });
    let tierHtml = '<span class="tier-line"><span class="tier-word">Tier</span><span class="tier-num">' + esc(roman) + "</span></span>";
    if (mode === "edit") {
      const tierOpts = Codex.schema.taxByType(tax, "tier").map(function (item) {
        return '<option value="' + esc(item.id) + '"' + (item.id === hero.tierId ? " selected" : "") + ">" + esc(item.name) + "</option>";
      }).join("");
      const roleOpts = Codex.schema.taxByType(tax, "role").map(function (item) {
        return '<label class="check"><input type="checkbox" data-role-id="' + esc(item.id) + '"' + (hero.roleIds.indexOf(item.id) !== -1 ? " checked" : "") + "> " + esc(item.name) + "</label>";
      }).join("");
      const tagOpts = Codex.schema.taxByType(tax, "tag").map(function (item) {
        return '<label class="check"><input type="checkbox" data-tag-id="' + esc(item.id) + '"' + (hero.tagIds.indexOf(item.id) !== -1 ? " checked" : "") + "> " + esc(item.name) + "</label>";
      }).join("");
      const allegianceOpts = '<option value="">None</option>' + Codex.schema.taxByType(tax, "allegiance").map(function (item) {
        return '<option value="' + esc(item.id) + '"' + (item.id === hero.allegianceId ? " selected" : "") + ">" + esc(item.name) + "</option>";
      }).join("");
      const stateOpts = Codex.schema.taxByType(tax, "productionState").map(function (item) {
        return '<option value="' + esc(item.id) + '"' + (item.id === hero.productionStateId ? " selected" : "") + ">" + esc(item.name) + "</option>";
      }).join("");
      tierHtml +=
        '<div class="edit-stack">' +
          '<label>Tier <select data-field="tierId">' + tierOpts + "</select></label>" +
          '<label>Allegiance <select data-field="allegianceId">' + allegianceOpts + "</select></label>" +
          '<p class="hint">Colour theme: ' + esc(theme.name) + ' (picked from tier, role and allegiance in <a class="text-link" href="#/setup">Setup</a>).</p>' +
          '<label>Production state <select data-field="productionStateId">' + stateOpts + "</select></label>" +
          '<div><span class="mini-label">Roles</span><div class="chip-picks">' + roleOpts + '</div><button type="button" class="btn tiny" data-new-tax="role">New role</button></div>' +
          '<div><span class="mini-label">Tags</span><div class="chip-picks">' + tagOpts + '</div><button type="button" class="btn tiny" data-new-tax="tag">New tag</button></div>' +
          '<label>Code <input data-field="code" value="' + esc(hero.code) + '"></label>' +
          '<label>Phase <input data-field="phase" value="' + esc(hero.phase) + '"></label>' +
        "</div>";
    } else {
      const allegiance = taxMap[hero.allegianceId];
      tierHtml += '<div class="role-stack">' + (allegiance ? '<span class="chip">' + esc(allegiance.name) + "</span>" : "") + roles.map(function (role) {
        return '<span class="chip ghost">' + esc(role) + "</span>";
      }).join("") + (tags.length ? tags.map(function (tag) {
        return '<span class="chip">' + esc(tag) + "</span>";
      }).join("") : "") + "</div>";
    }
    root.querySelector("[data-tier]").innerHTML = tierHtml;

    const snapshot = root.querySelector("[data-snapshot]");
    const shownStats = Codex.schema.statDefs().map(function (def) {
      return hero.stats.find(function (stat) { return stat.id === def.id; }) || { id: def.id, value: def.defaultValue };
    });
    snapshot.innerHTML = Codex.schema.statPairs(shownStats).map(function (row) {
      return '<div class="stat-row">' + row.map(function (stat) {
        const value = mode === "edit"
          ? '<input class="stat-input" data-stat-id="' + esc(stat.id) + '" value="' + esc(stat.value) + '">'
          : esc(stat.value);
        return '<div class="stat-pill"><span><span class="code">' + esc(stat.id) + '</span><span class="name">' + esc(Codex.schema.statName(stat.id)) + "</span></span><strong>" + value + "</strong></div>";
      }).join("") + "</div>";
    }).join("");
    if (mode === "edit") {
      snapshot.insertAdjacentHTML("beforeend", '<button type="button" class="btn ghost" data-import-stats>Import stats (CSV)</button>');
    }

    const movement = root.querySelector("[data-movement]");
    movement.innerHTML = renderBoard(hero.movement, mode === "edit");
    if (mode === "edit") {
      movement.insertAdjacentHTML("beforeend",
        '<p class="hint">Click a square to toggle whether this hero can reach it in one turn.</p>' +
        '<div class="move-form">' +
          '<label class="check"><input type="checkbox" data-move-flag="intermediateMustBeEmpty"' + (hero.movement.intermediateMustBeEmpty ? " checked" : "") + "> Intermediate squares must be empty</label>" +
        "</div>"
      );
    }
    const tip = movement.querySelector("[data-move-tip]");
    movement.addEventListener("mousemove", function (event) {
      if (!tip) return;
      tip.style.left = event.clientX + "px";
      tip.style.top = event.clientY + "px";
    });

    const count = (hero.abilities || []).length;
    const headP = root.querySelector("#abilities .section-head p");
    if (headP) {
      headP.textContent = count
        ? count + " abilit" + (count === 1 ? "y" : "ies") + ". Each is active or passive." + (count && count <= 9 ? " Press 1–" + Math.min(count, 9) + "." : "")
        : "No abilities yet.";
    }
    for (let i = 0; i < hero.abilities.length; i += 1) {
      const ab = hero.abilities[i];
      live.iconSrc[ab.id] = ab.image && ab.image.kind === "svg" ? "" : await Codex.ui.resolveSrc(ab.image);
    }
    const dock = root.querySelector("[data-dock]");
    dock.innerHTML = hero.abilities.map(function (ability, index) {
      return abilityButton(ability, index, taxMap, Codex.ui.abilityIconHtml(ability, live.iconSrc[ability.id]), index === 0);
    }).join("");
    if (mode === "edit") {
      dock.insertAdjacentHTML("afterend",
        '<div class="edit-row">' +
          '<button type="button" class="btn" data-add-ability>Add ability</button>' +
          '<button type="button" class="btn ghost" data-move-ability="left">Move selected left</button>' +
          '<button type="button" class="btn ghost" data-move-ability="right">Move selected right</button>' +
        "</div>");
    }
    const card = root.querySelector("[data-card]");
    live.activeId = options.highlightAbilityId || (hero.abilities[0] && hero.abilities[0].id) || "";

    function renderCard(id) {
      const ability = hero.abilities.find(function (item) { return item.id === id; });
      if (!ability) {
        card.innerHTML = missing("Select or create an ability.");
        return;
      }
      live.activeId = id;
      const token = ++live.paint;
      card.classList.add("is-fading");
      window.setTimeout(function () {
        if (token !== live.paint) return;
        card.innerHTML = cardHtml(ability, taxMap, Codex.ui.abilityIconHtml(ability, live.iconSrc[ability.id]), mode);
        card.classList.remove("is-fading");
      }, 120);
      dock.querySelectorAll(".ability-key").forEach(function (button) {
        button.setAttribute("aria-pressed", button.getAttribute("data-ability") === id ? "true" : "false");
      });
    }

    function applyFilter() {
      dock.querySelectorAll(".ability-key").forEach(function (button) {
        const kind = button.getAttribute("data-kind");
        const roles = (button.getAttribute("data-roles") || "").split(" ");
        const kindOk = live.kindFilter === "all" || kind === live.kindFilter;
        const roleOk = live.roleFilter === "all" || roles.indexOf(live.roleFilter) !== -1;
        button.classList.toggle("is-dim", !(kindOk && roleOk));
      });
    }

    dock.addEventListener("click", function (event) {
      const button = event.target.closest(".ability-key");
      if (!button) return;
      renderCard(button.getAttribute("data-ability"));
    });

    const filters = root.querySelector("[data-filters]");
    if (filters) {
      filters.addEventListener("click", function (event) {
        const button = event.target.closest("button");
        if (!button) return;
        const group = button.closest("[data-filter-group]");
        group.querySelectorAll("button").forEach(function (item) {
          item.setAttribute("aria-pressed", item === button ? "true" : "false");
        });
        if (group.getAttribute("data-filter-group") === "kind") live.kindFilter = button.getAttribute("data-filter");
        else live.roleFilter = button.getAttribute("data-filter");
        applyFilter();
      });
    }

    live.onKey = function (event) {
      if (event.target.matches("input, textarea, select")) return;
      const n = Number(event.key);
      if (!n) return;
      const ability = hero.abilities.find(function (item) { return String(item.slot) === String(n); }) || hero.abilities[n - 1];
      if (ability) {
        renderCard(ability.id);
        const section = document.getElementById("abilities");
        if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    document.addEventListener("keydown", live.onKey);

    const lore = root.querySelector("[data-lore]");
    if (mode === "edit") {
      lore.innerHTML = "<h2>Lore</h2>" +
        '<textarea data-field="lore" rows="10" placeholder="Write the hero&#39;s backstory. Blank lines start a new paragraph.">' + esc((hero.lore || []).join("\n\n")) + "</textarea>" +
        '<p class="hint">Separate paragraphs with a blank line.</p>';
    } else if (!hero.lore.length) {
      lore.innerHTML = "<h2>Lore</h2>" + missing("No lore recorded yet.");
    } else {
      lore.innerHTML = "<h2>Lore</h2>" + hero.lore.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("");
    }

    const historyEl = root.querySelector("[data-stats]");
    const historyItems = history.length ? history : [{ versionLabel: hero.currentVersion, summary: "No saved drafts yet.", timestamp: hero.updatedAt }];
    historyEl.innerHTML =
      "<h2>Draft history</h2>" +
      '<p class="hint">Read from this hero’s file in the data folder.</p>' +
      '<div class="history"><ol>' +
      historyItems.slice(0, 8).map(function (entry) {
        return "<li><strong>" + esc(entry.versionLabel || entry.version) + "</strong><span>" + esc(entry.summary || entry.note || "") + "</span></li>";
      }).join("") +
      "</ol></div>" +
      '<p><a class="text-link" href="#/hero/' + encodeURIComponent(hero.id) + '/history">Open full history</a></p>';

    const related = root.querySelector("[data-related]");
    const cards = (hero.related || []).map(function (item) {
      const result = resolveRelated(item, heroes);
      return relatedCard(item, result.resolved, result.broken, hero.contentStatus === "sample");
    });
    const backs = backlinks(hero, heroes).map(function (item) {
      return relatedCard({ type: "Backlink", name: item.name, note: item.note }, { name: item.name, href: item.href }, false);
    });
    const relatedHtml = cards.join("") + backs.join("");
    related.innerHTML = relatedHtml || missing("No linked entries yet.");
    if (mode === "edit") {
      related.insertAdjacentHTML("beforebegin", '<div class="edit-row"><button type="button" class="btn" data-edit-links>Edit linked entries</button></div>');
    }

    const banner = root.querySelector("[data-banner]");
    if (banner) {
      if (mode === "history") {
        banner.hidden = false;
        banner.innerHTML = '<strong>Historical view</strong> Version ' + esc(options.versionLabel || hero.currentVersion) + " — read only. Restoring creates a new draft.";
      } else banner.hidden = true;
    }

    if (live.activeId) renderCard(live.activeId);
    applyFilter();
    live.renderCard = renderCard;
    live.hero = hero;
    return live;
  }

  Codex.heroPage = {
    render: render,
    destroy: destroy,
    getLive: function () { return live; }
  };
})();
