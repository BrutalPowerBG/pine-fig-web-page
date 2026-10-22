(function () {
  const data = window.SAMPLE_HERO;
  if (!data) return;

  const hero = data.hero;
  const root = document.documentElement;
  root.style.setProperty("--accent", hero.theme.accent);
  root.style.setProperty("--accent-2", hero.theme.accent2);
  root.style.setProperty("--glow", hero.theme.glow);

  const icons = {
    a1: '<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><circle cx="32" cy="32" r="18" stroke="#f0c67a" stroke-width="2.4"/><circle cx="32" cy="32" r="6" fill="#ff7340"/><path d="M32 8v8M32 48v8M8 32h8M48 32h8" stroke="#f6f0e6" stroke-width="2" stroke-linecap="round"/></svg>',
    a2: '<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M14 46c10-22 26-28 40-24" stroke="#f0c67a" stroke-width="3" stroke-linecap="round"/><path d="M18 28l-8 6 8 2z" fill="#ff7340"/><path d="M46 18l8-2-2 8z" fill="#f6f0e6"/></svg>',
    a3: '<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M18 22l14-8 14 8" stroke="#f0c67a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 38l14-8 14 8" stroke="#ff7340" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 52l14-8 14 8" stroke="#f6f0e6" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    a4: '<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><circle cx="32" cy="32" r="16" stroke="#f0c67a" stroke-width="2.4"/><circle cx="32" cy="32" r="7" stroke="#ff7340" stroke-width="2.4"/><circle cx="32" cy="32" r="2.2" fill="#f6f0e6"/></svg>'
  };

  document.title = hero.name + " — Sample Hero · " + data.game + " Codex";

  const portrait = document.querySelector("[data-portrait]");
  portrait.innerHTML = '<img src="' + hero.artwork.src + '" alt="">';
  const wash = document.querySelector("[data-wash]");
  wash.innerHTML = '<img src="' + hero.artwork.src + '" alt="">';
  const washImg = wash.querySelector("img");

  function alignWash() {
    if (!washImg.naturalWidth) return;
    const row = document.querySelector(".profile-row");
    const frame = document.querySelector("[data-portrait]");
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

  washImg.addEventListener("load", alignWash);
  window.addEventListener("resize", alignWash);
  if (washImg.complete) alignWash();

  document.querySelector("[data-kicker]").innerHTML =
    '<span class="chip">Sample content</span>' +
    '<span class="chip ghost">' + hero.status + "</span>" +
    '<span class="chip ember">' + hero.phase + "</span>" +
    '<span class="chip ghost">' + hero.code + "</span>";

  document.querySelector("[data-name]").textContent = hero.name;
  document.querySelector("[data-epithet]").textContent = hero.epithet;
  const tier = Math.max(1, Math.min(5, hero.tier));
  const roman = ["", "I", "II", "III", "IV", "V"][tier];
  document.querySelector("[data-tier]").innerHTML =
    '<span class="tier-line"><span class="tier-word">Tier</span><span class="tier-num">' + roman + '</span></span>' +
    '<div class="role-stack">' + hero.roles.map(function (role) {
      return '<span class="chip ghost">' + role + "</span>";
    }).join("") + "</div>";

  document.querySelector("[data-snapshot]").innerHTML = hero.stats.map(function (row) {
    return '<div class="stat-row">' + row.map(function (stat) {
      return '<div class="stat-pill"><span><span class="code">' + stat.code + '</span><span class="name">' + stat.name + '</span></span><strong>' + stat.value + "</strong></div>";
    }).join("") + "</div>";
  }).join("");

  const boardSize = hero.movement.size || 7;
  const center = Math.floor(boardSize / 2);
  const cells = [];
  for (let row = 0; row < boardSize; row += 1) {
    for (let col = 0; col < boardSize; col += 1) {
      const rowStep = Math.abs(row - center);
      const colStep = Math.abs(col - center);
      const isOrigin = rowStep === 0 && colStep === 0;
      const isQueen = rowStep === 0 || colStep === 0 || rowStep === colStep;
      cells.push(isOrigin ? 2 : isQueen ? 1 : 0);
    }
  }
  document.querySelector("[data-movement]").innerHTML =
    "<div><h3>" + hero.movement.label + "</h3><p data-move-tip>" + hero.movement.note + '</p></div><div class="board" role="img" aria-label="' + hero.movement.note + '">' +
    cells.map(function (cell) {
      if (cell === 2) return '<span class="origin" aria-hidden="true"></span>';
      if (cell === 1) return '<span class="reach" aria-hidden="true">+</span>';
      return '<span aria-hidden="true"></span>';
    }).join("") +
    "</div>";
  const movement = document.querySelector("[data-movement]");
  const tip = movement.querySelector("[data-move-tip]");
  movement.addEventListener("mousemove", function (event) {
    tip.style.left = event.clientX + "px";
    tip.style.top = event.clientY + "px";
  });

  const dock = document.querySelector("[data-dock]");
  dock.innerHTML = data.abilities.map(function (ability, index) {
    return (
      '<button class="ability-key" type="button" data-ability="' + ability.id + '" data-kind="' + ability.kind + '" data-roles="' + ability.tags.join(" ") + '" aria-pressed="' + (index === 0 ? "true" : "false") + '">' +
        '<span class="icon"><span class="slot-square">' + ability.slot + "</span>" + icons[ability.id] + "</span>" +
        '<span class="tag-groups"><span class="tag-row"><span class="kind">' + ability.kind + "</span></span>" +
        '<span class="tag-row">' + ability.tags.map(function (tag) { return '<span class="tag tag-' + tag + '">' + tag + "</span>"; }).join("") + "</span></span>" +
        '<span class="ability-name">' + ability.name + "</span>" +
        '<span class="ability-cd">' + ability.cooldown + "</span>" +
      "</button>"
    );
  }).join("");

  const card = document.querySelector("[data-card]");
  let activeId = data.abilities[0].id;
  let kindFilter = "all";
  let roleFilter = "all";
  let paint = 0;

  function list(items) {
    return "<ul>" + items.map(function (item) { return "<li>" + item + "</li>"; }).join("") + "</ul>";
  }

  function renderCard(id) {
    const ability = data.abilities.find(function (item) { return item.id === id; });
    if (!ability) return;
    activeId = id;
    const token = ++paint;
    card.classList.add("is-fading");
    window.setTimeout(function () {
      if (token !== paint) return;
      card.innerHTML =
        '<div class="hero-icon">' + icons[ability.id] + "</div>" +
        "<div>" +
          "<h3>" + ability.name + "</h3>" +
          '<div class="meta">' +
            "<span>Ability <strong>" + ability.slot + "</strong></span>" +
            "<span><strong>" + ability.kind.charAt(0).toUpperCase() + ability.kind.slice(1) + "</strong></span>" +
            "<span><strong>" + ability.tags.join(" · ") + "</strong></span>" +
            "<span>Cooldown <strong>" + ability.cooldown + "</strong></span>" +
            "<span>Cost <strong>" + ability.cost + "</strong></span>" +
            "<span>Range <strong>" + ability.range + "</strong></span>" +
          "</div>" +
          '<p class="desc">' + ability.summary + "</p>" +
          '<div class="detail-grid">' +
            "<div><h4>Effects</h4>" + list(ability.effects) + "</div>" +
            "<div><h4>Upgrades</h4>" + list(ability.upgrades) + "</div>" +
            "<div><h4>Interactions</h4>" + list(ability.interactions) + "</div>" +
          "</div>" +
        "</div>";
      card.classList.remove("is-fading");
    }, 120);

    dock.querySelectorAll(".ability-key").forEach(function (button) {
      button.setAttribute("aria-pressed", button.getAttribute("data-ability") === id ? "true" : "false");
    });
  }

  function applyFilter() {
    dock.querySelectorAll(".ability-key").forEach(function (button) {
      const kind = button.getAttribute("data-kind");
      const roles = button.getAttribute("data-roles").split(" ");
      const kindOk = kindFilter === "all" || kind === kindFilter;
      const roleOk = roleFilter === "all" || roles.indexOf(roleFilter) !== -1;
      button.classList.toggle("is-dim", !(kindOk && roleOk));
    });
  }

  dock.addEventListener("click", function (event) {
    const button = event.target.closest(".ability-key");
    if (!button) return;
    renderCard(button.getAttribute("data-ability"));
  });

  document.querySelector("[data-filters]").addEventListener("click", function (event) {
    const button = event.target.closest("button");
    if (!button) return;
    const group = button.closest("[data-filter-group]");
    group.querySelectorAll("button").forEach(function (item) {
      item.setAttribute("aria-pressed", item === button ? "true" : "false");
    });
    if (group.getAttribute("data-filter-group") === "kind") kindFilter = button.getAttribute("data-filter");
    else roleFilter = button.getAttribute("data-filter");
    applyFilter();
  });

  document.addEventListener("keydown", function (event) {
    if (event.target.matches("input, textarea")) return;
    const map = { "1": "a1", "2": "a2", "3": "a3", "4": "a4" };
    const id = map[event.key];
    if (id) renderCard(id);
  });

  document.querySelector("[data-lore]").innerHTML =
    "<h2>Lore layout</h2>" +
    hero.lore.map(function (paragraph) { return "<p>" + paragraph + "</p>"; }).join("");

  document.querySelector("[data-stats]").innerHTML =
    "<h2>Draft history</h2>" +
    '<div class="history"><ol>' +
    hero.history.map(function (entry) {
      return "<li><strong>" + entry.version + "</strong><span>" + entry.note + "</span></li>";
    }).join("") +
    "</ol></div>";

  document.querySelector("[data-related]").innerHTML = hero.related.map(function (item) {
    return (
      "<article><div class=\"type\">" + item.type + " · sample</div><h3>" + item.name + "</h3><p>" + item.note + "</p></article>"
    );
  }).join("");

  const search = document.querySelector("[data-search]");
  const results = document.querySelector("[data-results]");
  const entries = data.abilities.map(function (ability) {
    return { kind: "Ability", label: ability.slot + "  " + ability.name, id: ability.id };
  }).concat([
    { kind: "Section", label: "Lore layout", id: "lore" },
    { kind: "Section", label: "Movement", id: "overview" },
    { kind: "Section", label: "HP Health", id: "overview" },
    { kind: "Section", label: "Draft history", id: "stats" }
  ]);

  function closeSearch() { results.classList.remove("open"); results.innerHTML = ""; }

  search.addEventListener("input", function () {
    const query = search.value.trim().toLowerCase();
    if (!query) { closeSearch(); return; }
    const matches = entries.filter(function (entry) {
      return entry.label.toLowerCase().indexOf(query) !== -1 || entry.kind.toLowerCase().indexOf(query) !== -1;
    });
    if (!matches.length) {
      results.innerHTML = "<button type=\"button\" disabled>No sample matches</button>";
      results.classList.add("open");
      return;
    }
    results.innerHTML = matches.map(function (entry) {
      return '<button type="button" data-jump="' + entry.id + '"><small>' + entry.kind + "</small>" + entry.label + "</button>";
    }).join("");
    results.classList.add("open");
  });

  results.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-jump]");
    if (!button) return;
    const id = button.getAttribute("data-jump");
    if (data.abilities.some(function (ability) { return ability.id === id; })) {
      renderCard(id);
      document.getElementById("abilities").scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      document.getElementById(id).scrollIntoView({ behavior: "smooth", block: "start" });
    }
    closeSearch();
    search.value = "";
  });

  document.addEventListener("click", function (event) {
    if (!event.target.closest(".search")) closeSearch();
  });

  renderCard(activeId);
})();
