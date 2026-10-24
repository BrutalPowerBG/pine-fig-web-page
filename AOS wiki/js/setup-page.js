(function () {
  const Codex = window.Codex = window.Codex || {};
  const esc = Codex.schema.escapeHtml;
  const STAT_ID_PATTERN = /^[A-Z][A-Z0-9_]{0,15}$/;

  // Designers edit a draft of data/setup.json here; Save writes it in one commit.
  const page = { draft: null, tax: [], mount: null, dirty: false };

  function anyOption(label) {
    return '<option value="">Any ' + esc(label) + "</option>";
  }

  function taxOptions(type, selectedId, anyLabel) {
    return anyOption(anyLabel) + Codex.schema.taxByType(page.tax, type).map(function (item) {
      return '<option value="' + esc(item.id) + '"' + (item.id === selectedId ? " selected" : "") + ">" + esc(item.name) + "</option>";
    }).join("");
  }

  function boardHtml() {
    const board = page.draft.board;
    let cells = "";
    for (let row = 0; row < board.size; row += 1) {
      for (let col = 0; col < board.size; col += 1) {
        const isOrigin = row === board.origin.row && col === board.origin.col;
        cells += '<span class="' + (isOrigin ? "origin" : "is-edit-cell") + '" data-origin-row="' + row + '" data-origin-col="' + col + '"></span>';
      }
    }
    return (
      '<section class="setup-block setup-board-block">' +
        '<div class="section-head tight"><h2>Movement board</h2></div>' +
        '<p class="hint">Shared by every hero. Heroes only store which squares they can reach. Click a square to set where the hero stands.</p>' +
        '<div class="setup-board">' +
          '<div class="setup-fields">' +
            '<label>Heading <input data-board="label" value="' + esc(board.label) + '"></label>' +
            '<label>Explanation <input data-board="note" value="' + esc(board.note) + '"></label>' +
            '<label>Board size <input type="number" min="3" max="15" data-board="size" value="' + board.size + '"></label>' +
          "</div>" +
          '<div class="movement"><div class="board" data-origin-board style="grid-template-columns:repeat(' + board.size + ',minmax(0,1fr))">' + cells + "</div></div>" +
        "</div>" +
      "</section>"
    );
  }

  function statsHtml() {
    const rows = page.draft.stats.map(function (stat, index) {
      const idCell = stat.isNew
        ? '<input class="stat-id-input" data-stat-field="id" data-index="' + index + '" value="' + esc(stat.id) + '" placeholder="e.g. SPD" aria-label="Stat id">'
        : '<span class="stat-id">' + esc(stat.id) + "</span>";
      return (
        '<div class="setup-stat-row">' +
          idCell +
          '<input data-stat-field="name" data-index="' + index + '" value="' + esc(stat.name) + '" aria-label="Name" placeholder="Name">' +
          '<input data-stat-field="description" data-index="' + index + '" value="' + esc(stat.description) + '" aria-label="Description" placeholder="What it does">' +
          '<input data-stat-field="defaultValue" data-index="' + index + '" value="' + esc(stat.defaultValue) + '" aria-label="Default value for new heroes" placeholder="0">' +
          '<span class="row-actions">' +
            '<button type="button" class="btn tiny ghost" data-stat-move="-1" data-index="' + index + '"' + (index === 0 ? " disabled" : "") + ' aria-label="Move up">↑</button>' +
            '<button type="button" class="btn tiny ghost" data-stat-move="1" data-index="' + index + '"' + (index === page.draft.stats.length - 1 ? " disabled" : "") + ' aria-label="Move down">↓</button>' +
            '<button type="button" class="btn tiny ghost" data-stat-remove="' + index + '">Remove</button>' +
          "</span>" +
        "</div>"
      );
    }).join("");
    return (
      '<section class="setup-block setup-stats-block">' +
        '<div class="section-head tight"><h2>Stats</h2><button type="button" class="btn" data-stat-add>Add stat</button></div>' +
        '<p class="hint">The id is what heroes store, so it cannot change once saved. Rename freely; every hero updates.</p>' +
        '<div class="setup-stat-row setup-stat-head" aria-hidden="true"><span>Id</span><span>Name</span><span>Description</span><span>New hero value</span><span></span></div>' +
        rows +
      "</section>"
    );
  }

  function themeHtml(theme, index) {
    const isDefault = index === 0;
    const match = theme.match || {};
    return (
      '<article class="setup-theme" style="--t-accent:' + esc(theme.accent) + ";--t-accent-2:" + esc(theme.accent2) + '">' +
        '<div class="theme-swatch" aria-hidden="true"><span></span><span></span></div>' +
        '<div class="setup-fields">' +
          '<label>Name <input data-theme-field="name" data-index="' + index + '" value="' + esc(theme.name) + '"></label>' +
          '<label>Accent <input type="color" data-theme-field="accent" data-index="' + index + '" value="' + esc(theme.accent) + '"></label>' +
          '<label>Second accent <input type="color" data-theme-field="accent2" data-index="' + index + '" value="' + esc(theme.accent2) + '"></label>' +
          (isDefault
            ? '<p class="hint">Default. Used when no other theme matches a hero.</p>'
            : '<label>Tier <select data-theme-match="tierId" data-index="' + index + '">' + taxOptions("tier", match.tierId, "tier") + "</select></label>" +
              '<label>Role <select data-theme-match="roleId" data-index="' + index + '">' + taxOptions("role", match.roleId, "role") + "</select></label>" +
              '<label>Allegiance <select data-theme-match="allegianceId" data-index="' + index + '">' + taxOptions("allegiance", match.allegianceId, "allegiance") + "</select></label>" +
              '<button type="button" class="btn tiny ghost" data-theme-remove="' + index + '">Remove theme</button>') +
        "</div>" +
      "</article>"
    );
  }

  function themesHtml() {
    return (
      '<section class="setup-block setup-themes-block">' +
        '<div class="section-head tight"><h2>Colour themes</h2><button type="button" class="btn" data-theme-add>Add theme</button></div>' +
        '<p class="hint">A hero page uses the theme whose conditions all match it. When several match, the one with more conditions wins; on a tie, the higher one in this list. Add allegiances on the <a class="text-link" href="#/taxonomy">Tags</a> page.</p>' +
        '<div class="setup-themes">' + page.draft.themes.map(themeHtml).join("") + "</div>" +
      "</section>"
    );
  }

  function paint() {
    const writable = Codex.store.canWrite();
    page.mount.innerHTML =
      '<section class="page-block wrap setup-page">' +
        '<div class="crumbs"><a href="#/">Directory</a><span>/</span><span>Setup</span></div>' +
        "<h1>Setup</h1>" +
        '<p class="lede">Rules shared by every hero page: the movement board, stat names and colour themes.</p>' +
        (writable ? "" : '<div class="notice">This copy is read-only. Changes here cannot be saved.</div>') +
        boardHtml() + statsHtml() + themesHtml() +
        '<div class="setup-actions' + (page.dirty ? " is-dirty" : "") + '">' +
          '<span class="dirty-note">' + (page.dirty ? "Unsaved changes" : "All changes saved") + "</span>" +
          '<button type="button" class="btn ghost" data-setup-discard' + (page.dirty ? "" : " disabled") + ">Discard</button>" +
          '<button type="button" class="btn primary" data-setup-save' + (page.dirty && writable ? "" : " disabled") + ">Save setup</button>" +
        "</div>" +
      "</section>";
  }

  function markDirty() {
    if (page.dirty) return;
    page.dirty = true;
    const bar = page.mount.querySelector(".setup-actions");
    bar.classList.add("is-dirty");
    bar.querySelector(".dirty-note").textContent = "Unsaved changes";
    bar.querySelector("[data-setup-discard]").disabled = false;
    bar.querySelector("[data-setup-save]").disabled = !Codex.store.canWrite();
  }

  function validate(draft) {
    const ids = {};
    for (let i = 0; i < draft.stats.length; i += 1) {
      const stat = draft.stats[i];
      if (!STAT_ID_PATTERN.test(stat.id)) return "Stat ids are capital letters, digits or _, starting with a letter (e.g. SPD).";
      if (ids[stat.id]) return "Two stats use the id " + stat.id + ".";
      ids[stat.id] = true;
      if (!String(stat.name).trim()) return "Give stat " + stat.id + " a name.";
    }
    if (!draft.themes.every(function (theme) { return String(theme.name).trim(); })) return "Every theme needs a name.";
    return "";
  }

  async function save() {
    const draft = Codex.schema.clone(page.draft);
    draft.stats.forEach(function (stat) { delete stat.isNew; });
    // Only the first theme is the fallback; it never carries conditions.
    if (draft.themes[0]) draft.themes[0].match = {};
    const problem = validate(draft);
    if (problem) return Codex.ui.toast(problem, "err");
    try {
      await Codex.store.writeSetup(draft);
      page.dirty = false;
      Codex.ui.toast("Setup saved. Every hero page uses it now.", "ok");
      Codex.router.refresh();
    } catch (err) {
      Codex.ui.toast(err.message || "Could not save the setup.", "err");
    }
  }

  function bind() {
    const mount = page.mount;
    mount.addEventListener("input", function (event) {
      const t = event.target;
      const index = Number(t.getAttribute("data-index"));
      if (t.matches("[data-board]")) {
        const key = t.getAttribute("data-board");
        if (key === "size") return;
        page.draft.board[key] = t.value;
      } else if (t.matches("[data-stat-field]")) {
        const key = t.getAttribute("data-stat-field");
        page.draft.stats[index][key] = key === "id" ? t.value.toUpperCase().replace(/\s+/g, "_") : t.value;
        if (key === "id") t.value = page.draft.stats[index].id;
      } else if (t.matches("[data-theme-field]")) {
        page.draft.themes[index][t.getAttribute("data-theme-field")] = t.value;
        const card = t.closest(".setup-theme");
        card.style.setProperty("--t-accent", page.draft.themes[index].accent);
        card.style.setProperty("--t-accent-2", page.draft.themes[index].accent2);
      } else return;
      markDirty();
    });

    mount.addEventListener("change", async function (event) {
      const t = event.target;
      const index = Number(t.getAttribute("data-index"));
      if (t.matches('[data-board="size"]')) {
        const size = Codex.schema.clampBoardSize(t.value);
        if (size < page.draft.board.size) {
          const ok = await Codex.ui.confirm("Shrink the board?", "Squares heroes marked outside the smaller board stay saved but are hidden.", "Shrink");
          if (!ok) { t.value = page.draft.board.size; return; }
        }
        page.draft.board.size = size;
        const center = Math.floor(size / 2);
        page.draft.board.origin = { row: center, col: center };
        page.dirty = true;
        paint();
      } else if (t.matches("[data-theme-match]")) {
        const match = page.draft.themes[index].match;
        const key = t.getAttribute("data-theme-match");
        if (t.value) match[key] = t.value;
        else delete match[key];
        markDirty();
      }
    });

    mount.addEventListener("click", async function (event) {
      const t = event.target;
      const cell = t.closest("[data-origin-row]");
      if (cell) {
        page.draft.board.origin = { row: Number(cell.getAttribute("data-origin-row")), col: Number(cell.getAttribute("data-origin-col")) };
        page.dirty = true;
        paint();
        return;
      }
      if (t.closest("[data-stat-add]")) {
        page.draft.stats.push({ id: "", name: "", description: "", defaultValue: "0", isNew: true });
        page.dirty = true;
        paint();
        const inputs = mount.querySelectorAll('[data-stat-field="id"]');
        if (inputs.length) inputs[inputs.length - 1].focus();
        return;
      }
      const move = t.closest("[data-stat-move]");
      if (move) {
        const index = Number(move.getAttribute("data-index"));
        const to = index + Number(move.getAttribute("data-stat-move"));
        const list = page.draft.stats;
        list.splice(to, 0, list.splice(index, 1)[0]);
        page.dirty = true;
        paint();
        return;
      }
      const removeStat = t.closest("[data-stat-remove]");
      if (removeStat) {
        const stat = page.draft.stats[Number(removeStat.getAttribute("data-stat-remove"))];
        if (!stat.isNew) {
          const ok = await Codex.ui.confirm("Remove " + stat.id + "?", "Heroes keep their saved values, but the stat stops showing until it is added back with the same id.", "Remove");
          if (!ok) return;
        }
        page.draft.stats.splice(page.draft.stats.indexOf(stat), 1);
        page.dirty = true;
        paint();
        return;
      }
      if (t.closest("[data-theme-add]")) {
        const base = page.draft.themes[0] || Codex.schema.DEFAULT_SETUP.themes[0];
        page.draft.themes.push({ id: Codex.schema.uid("theme"), name: "New theme", accent: base.accent, accent2: base.accent2, match: {} });
        page.dirty = true;
        paint();
        return;
      }
      const removeTheme = t.closest("[data-theme-remove]");
      if (removeTheme) {
        page.draft.themes.splice(Number(removeTheme.getAttribute("data-theme-remove")), 1);
        page.dirty = true;
        paint();
        return;
      }
      if (t.closest("[data-setup-discard]")) {
        page.draft = Codex.schema.clone(Codex.schema.getSetup());
        page.dirty = false;
        paint();
        return;
      }
      if (t.closest("[data-setup-save]")) save();
    });
  }

  async function render(mount, tax) {
    page.mount = mount;
    page.tax = tax;
    // An unsaved draft survives leaving and coming back; Discard or Save resets it.
    if (!page.dirty || !page.draft) page.draft = Codex.schema.clone(await Codex.store.readSetup());
    paint();
    if (mount.dataset.setupBound !== "1") {
      mount.dataset.setupBound = "1";
      bind();
    }
  }

  Codex.setupPage = { render: render, isDirty: function () { return page.dirty; } };
})();
