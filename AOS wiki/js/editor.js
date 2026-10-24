(function () {
  const Codex = window.Codex = window.Codex || {};
  const editor = {
    draft: null,
    originalId: "",
    dirty: false,
    saving: false,
    autosave: false,
    autosaveTimer: 0,
    unloadBound: false,
    leaveAfterSave: false
  };

  function draft() { return editor.draft; }

  function setDraft(hero) {
    editor.draft = hero;
    markDirty();
  }

  function markDirty() {
    editor.dirty = true;
    updateBar();
    if (editor.autosave) scheduleAutosave();
  }

  function markClean() {
    editor.dirty = false;
    updateBar();
  }

  function updateBar() {
    const bar = document.querySelector("[data-edit-bar]");
    if (!bar) return;
    bar.classList.toggle("is-dirty", editor.dirty && !editor.saving);
    bar.classList.toggle("is-saving", editor.saving);
    const dot = bar.querySelector("[data-dirty-dot]");
    if (dot) {
      dot.textContent = editor.saving ? "Saving…"
        : editor.dirty ? "Unsaved changes"
        : "All changes saved";
    }
  }

  function scheduleAutosave() {
    if (editor.autosaveTimer) window.clearTimeout(editor.autosaveTimer);
    editor.autosaveTimer = window.setTimeout(function () {
      if (editor.dirty && editor.ctx) saveDraft(editor.ctx, { silent: true });
    }, 1500);
  }

  function bindUnload() {
    if (editor.unloadBound) return;
    editor.unloadBound = true;
    window.addEventListener("beforeunload", function (event) {
      if (editor.dirty) {
        event.preventDefault();
        event.returnValue = "You have unsaved draft changes.";
        return event.returnValue;
      }
    });
  }

  function syncField(hero, field, value) {
    hero[field] = value;
  }

  function bindHero(root) {
    if (root.dataset.codexBound === "1") return;
    root.dataset.codexBound = "1";
    root.addEventListener("input", function (event) {
      const hero = editor.draft;
      const ctx = editor.ctx;
      if (!hero || !ctx) return;
      const t = event.target;
      if (t.matches("[data-field]")) {
        const field = t.getAttribute("data-field");
        if (field === "lore") {
          hero.lore = t.value.split(/\n\s*\n/).map(function (p) { return p.trim(); }).filter(Boolean);
        } else {
          hero[field] = t.value;
        }
        markDirty();
      }
      if (t.matches("[data-stat-id]")) {
        const stat = hero.stats.find(function (s) { return s.id === t.getAttribute("data-stat-id"); });
        if (stat) { stat.value = t.value; markDirty(); }
      }
      if (t.matches("[data-move]")) {
        const key = t.getAttribute("data-move");
        hero.movement[key] = t.value;
        markDirty();
      }
    });

    root.addEventListener("change", function (event) {
      const hero = editor.draft;
      if (!hero) return;
      const t = event.target;
      if (t.matches("[data-role-id]")) {
        toggleId(hero.roleIds, t.getAttribute("data-role-id"), t.checked);
        markDirty();
      }
      if (t.matches("[data-tag-id]")) {
        toggleId(hero.tagIds, t.getAttribute("data-tag-id"), t.checked);
        markDirty();
      }
      if (t.matches('[data-field="tierId"], [data-field="productionStateId"]')) {
        hero[t.getAttribute("data-field")] = t.value;
        markDirty();
      }
      if (t.matches("[data-move-flag]")) {
        hero.movement[t.getAttribute("data-move-flag")] = t.checked;
        markDirty();
      }
    });

    root.addEventListener("click", async function (event) {
      const hero = editor.draft;
      const ctx = editor.ctx;
      if (!hero || !ctx) return;
      const cell = event.target.closest(".is-edit-cell");
      if (cell) {
        if (root.dataset.edit !== "on") return;
        const row = Number(cell.getAttribute("data-row"));
        const col = Number(cell.getAttribute("data-col"));
        const key = row + "," + col;
        const idx = hero.movement.squares.findIndex(function (sq) { return Codex.schema.squareKey(sq) === key; });
        if (idx === -1) hero.movement.squares.push({ row: row, col: col });
        else hero.movement.squares.splice(idx, 1);
        markDirty();
        cell.classList.toggle("reach");
        cell.textContent = cell.classList.contains("reach") ? "+" : "";
        return;
      }
      if (event.target.closest("[data-upload-art]")) {
        pickFile("image/png,image/jpeg,image/webp", function (file) {
          if (!okImage(file)) return Codex.ui.toast("Use PNG, JPG, or WebP.", "err");
          hero.artwork = Codex.ui.fileToPending(file, hero.id);
          markDirty();
          rerenderHero(ctx);
        });
      }
      if (event.target.closest("[data-remove-art]")) {
        const ok = await Codex.ui.confirm("Remove artwork?", "The current portrait will be cleared in the next saved draft.", "Remove");
        if (!ok) return;
        hero.artwork = { kind: "path", value: "" };
        markDirty();
        rerenderHero(ctx);
      }
      if (event.target.closest("[data-import-stats]")) openStatImport(hero, ctx);
      if (event.target.closest("[data-add-ability]")) {
        const ability = Codex.schema.defaultAbility(String((hero.abilities.length || 0) + 1));
        hero.abilities.push(ability);
        markDirty();
        rerenderHero(ctx);
        openAbilityModal(hero, ability, ctx);
      }
      const editAb = event.target.closest("[data-edit-ability]");
      if (editAb) {
        const ability = hero.abilities.find(function (ab) { return ab.id === editAb.getAttribute("data-edit-ability"); });
        if (ability) openAbilityModal(hero, ability, ctx);
      }
      const importAb = event.target.closest("[data-ab-import-one]");
      if (importAb) {
        const ability = hero.abilities.find(function (ab) { return ab.id === importAb.getAttribute("data-ab-import-one"); });
        if (!ability) return;
        pickFile(".csv,text/csv", async function (file) {
          const preview = Codex.csv.previewAbility(await file.text(), ability);
          if (!preview.ok) return Codex.ui.toast((preview.errors[0] || "Could not import."), "err");
          preview.mappings.forEach(function (map) { ability[map.field] = map.next; });
          markDirty();
          rerenderHero(ctx);
          Codex.ui.toast("Ability fields applied to this draft.", "ok");
        });
      }
      const delAb = event.target.closest("[data-delete-ability]");
      if (delAb) {
        const id = delAb.getAttribute("data-delete-ability");
        const ability = hero.abilities.find(function (ab) { return ab.id === id; });
        const ok = await Codex.ui.confirm("Delete this ability?", (ability && ability.name) + " will be removed on the next saved draft.", "Delete");
        if (!ok) return;
        hero.abilities = hero.abilities.filter(function (ab) { return ab.id !== id; });
        markDirty();
        rerenderHero(ctx);
      }
      const moveAb = event.target.closest("[data-move-ability]");
      if (moveAb) {
        const dir = moveAb.getAttribute("data-move-ability");
        const live = Codex.heroPage.getLive();
        const idx = hero.abilities.findIndex(function (ab) { return ab.id === live.activeId; });
        if (idx < 0) return;
        const swap = dir === "left" ? idx - 1 : idx + 1;
        if (swap < 0 || swap >= hero.abilities.length) return;
        const tmp = hero.abilities[idx];
        hero.abilities[idx] = hero.abilities[swap];
        hero.abilities[swap] = tmp;
        markDirty();
        rerenderHero(ctx);
      }
      if (event.target.closest("[data-edit-links]")) openLinksModal(hero, ctx);
      const newTax = event.target.closest("[data-new-tax]");
      if (newTax) {
        const item = await Codex.taxonomy.promptNew(newTax.getAttribute("data-new-tax"));
        if (item) {
          ctx.tax = await Codex.store.listTaxonomy();
          if (item.type === "role") toggleId(hero.roleIds, item.id, true);
          if (item.type === "tag") toggleId(hero.tagIds, item.id, true);
          markDirty();
          rerenderHero(ctx);
        }
      }
    });
  }

  function toggleId(list, id, on) {
    const i = list.indexOf(id);
    if (on && i === -1) list.push(id);
    if (!on && i !== -1) list.splice(i, 1);
  }

  function okImage(file) {
    return file && /image\/(png|jpeg|jpg|webp)/i.test(file.type || "") || /\.(png|jpe?g|webp)$/i.test(file.name || "");
  }

  function pickFile(accept, cb) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.addEventListener("change", function () {
      const file = input.files && input.files[0];
      if (file) cb(file);
    });
    input.click();
  }

  async function rerenderHero(ctx) {
    editor.ctx = ctx;
    const mount = document.getElementById("view");
    const activeId = Codex.heroPage.getLive() && Codex.heroPage.getLive().activeId;
    hydrateHero(mount, true);
    paintEditChrome(mount, ctx);
    await Codex.heroPage.render({
      mount: mount,
      hero: editor.draft,
      tax: ctx.tax,
      heroes: ctx.heroes,
      history: ctx.history,
      mode: "edit",
      highlightAbilityId: activeId
    });
    if (Codex.router.fillHeroChrome) Codex.router.fillHeroChrome(editor.draft, "edit");
  }

  function hydrateHero(mount, keepBar) {
    const bar = keepBar ? mount.querySelector("[data-edit-bar]") : null;
    const tpl = document.getElementById("tpl-hero");
    mount.innerHTML = "";
    if (bar) mount.appendChild(bar);
    mount.appendChild(tpl.content.cloneNode(true));
  }

  function paintEditChrome(mount, ctx) {
    let bar = mount.querySelector("[data-edit-bar]");
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "edit-bar";
      bar.setAttribute("data-edit-bar", "");
      mount.prepend(bar);
    }
    bar.innerHTML =
      '<div class="edit-bar-copy">' +
        '<strong>Edit mode</strong>' +
        '<span>Save Draft writes this hero into the data folder on this PC.</span>' +
      "</div>" +
      '<div class="edit-bar-actions">' +
        '<span class="dirty-dot" data-dirty-dot>All changes saved</span>' +
        '<label class="autosave" title="Automatically save a draft 1.5 s after your last edit."><input type="checkbox" data-autosave' + (editor.autosave ? " checked" : "") + "> Auto-save</label>" +
        '<span class="kb-hint"><kbd>Ctrl</kbd>+<kbd>S</kbd> save · <kbd>Esc</kbd> cancel</span>' +
        '<button type="button" class="btn ghost" data-cancel-edit>Cancel</button>' +
        '<button type="button" class="btn primary" data-save-draft>Save Draft</button>' +
      "</div>";
    bar.querySelector("[data-cancel-edit]").onclick = async function () {
      if (editor.dirty) {
        const ok = await Codex.ui.confirm("Discard unsaved changes?", "Pending edits in this draft will be lost.", "Discard");
        if (!ok) return;
      }
      editor.draft = null;
      markClean();
      location.hash = "#/hero/" + encodeURIComponent(ctx.hero.id);
    };
    bar.querySelector("[data-save-draft]").onclick = function () { saveDraft(ctx, { leaveEdit: true }); };
    const toggle = bar.querySelector("[data-autosave]");
    if (toggle) {
      toggle.onchange = async function () {
        editor.autosave = toggle.checked;
        await Codex.store.setMeta("autosave", editor.autosave);
        Codex.ui.toast(editor.autosave ? "Auto-save on. Draft saves 1.5 s after your last edit." : "Auto-save off.", "ok");
        if (editor.autosave && editor.dirty) scheduleAutosave();
      };
    }
    bindUnload();
    updateBar();
  }

  function leaveEdit(heroId) {
    editor.leaveAfterSave = false;
    if (editor.autosaveTimer) {
      window.clearTimeout(editor.autosaveTimer);
      editor.autosaveTimer = 0;
    }
    const id = heroId || (editor.ctx && editor.ctx.hero && editor.ctx.hero.id);
    editor.draft = null;
    editor.saving = false;
    markClean();
    if (!id) return;
    const next = "#/hero/" + encodeURIComponent(id);
    if (location.hash === next) Codex.router.refresh();
    else location.hash = next;
  }

  async function saveDraft(ctx, options) {
    options = options || {};
    if (options.leaveEdit) editor.leaveAfterSave = true;
    const hero = editor.draft;
    if (!hero) {
      if (editor.leaveAfterSave) leaveEdit();
      return;
    }
    if (editor.saving) return;
    const errors = Codex.schema.validateHero(hero);
    if (errors.length) {
      editor.leaveAfterSave = false;
      if (!options.silent) Codex.ui.toast(errors[0], "err");
      return;
    }
    editor.saving = true;
    updateBar();
    try {
      const ready = await Codex.ui.commitHeroImages(hero);
      const result = await Codex.store.saveHero(ready);
      editor.saving = false;
      const heroId = (result.hero && result.hero.id) || hero.id;
      const exit = editor.leaveAfterSave || options.leaveEdit;
      if (!result.saved && result.reason === "no-changes") {
        markClean();
        if (!options.silent) Codex.ui.toast("No changes to save.", "ok");
        if (exit) leaveEdit(heroId);
        return;
      }
      if (options.silent && !exit) {
        markClean();
        editor.draft = Codex.schema.normalizeHero(result.hero);
        Codex.ui.toast("Auto-saved v" + result.version + " into the data folder.", "ok");
        rerenderHero(ctx);
        return;
      }
      Codex.ui.toast("Saved v" + result.version + " into the data folder.", "ok");
      leaveEdit(heroId);
    } catch (err) {
      editor.saving = false;
      editor.leaveAfterSave = false;
      updateBar();
      Codex.ui.toast(err.message || "Save failed. No version was recorded.", "err");
    }
  }

  function openAbilityModal(hero, ability, ctx) {
    const esc = Codex.schema.escapeHtml;
    const tax = ctx.tax;
    const tags = Codex.schema.taxByType(tax, "tag").map(function (item) {
      return '<label class="check"><input type="checkbox" data-ab-tag="' + esc(item.id) + '"' + (ability.tagIds.indexOf(item.id) !== -1 ? " checked" : "") + "> " + esc(item.name) + "</label>";
    }).join("");
    const field = function (field, label, placeholder) {
      return '<label>' + esc(label || field) + ' <input data-ab="' + field + '" value="' + esc(ability[field] || "") + '"' + (placeholder ? ' placeholder="' + esc(placeholder) + '"' : "") + "></label>";
    };
    const box = Codex.ui.modal(
      "<h3>Edit ability</h3>" +
      '<p class="hint">Fields apply to the current draft when you press Apply. Save Draft commits them to a new version.</p>' +

      '<div class="modal-section"><h4>Identity</h4><div class="form-grid">' +
        field("name", "Name") +
        field("slot", "Slot") +
        '<label>Type <select data-ab="kind"><option value="active"' + (ability.kind === "active" ? " selected" : "") + '>Active</option><option value="passive"' + (ability.kind === "passive" ? " selected" : "") + ">Passive</option></select></label>" +
        '<div><span class="mini-label">Icon</span><div class="edit-row"><button type="button" class="btn" data-ab-image>Upload icon (PNG/JPG/WebP)</button></div></div>' +
      "</div></div>" +

      '<div class="modal-section"><h4>Combat</h4><div class="form-grid">' +
        field("cooldown", "Cooldown", "e.g. 9s or 2 turns") +
        field("cost", "Resource cost", "e.g. 40 Focus") +
        field("range", "Range", "e.g. 3 tiles") +
        field("damage", "Damage") +
        field("healing", "Healing") +
        field("scaling", "Scaling / stat deps") +
        field("duration", "Duration") +
        field("charges", "Charges") +
        field("aoe", "Area of effect") +
      "</div></div>" +

      '<div class="modal-section"><h4>Description</h4><div class="form-grid">' +
        '<label class="wide">Summary <textarea data-ab="summary" rows="3" placeholder="What the ability does.">' + esc(ability.summary || "") + "</textarea></label>" +
        '<label class="wide">Lore <textarea data-ab="lore" rows="2" placeholder="Optional flavour text.">' + esc(ability.lore || "") + "</textarea></label>" +
      "</div></div>" +

      '<div class="modal-section"><h4>Effects</h4>' +
        '<label>One effect per line<textarea data-ab-list="effects" rows="4" placeholder="e.g. Damage: 80 / 120 / 160">' + esc((ability.effects || []).join("\n")) + "</textarea></label>" +
      "</div>" +

      '<div class="modal-section"><h4>Tags</h4><div class="chip-picks">' + tags + "</div></div>" +

      '<div class="edit-row">' +
        '<button type="button" class="btn ghost" data-ab-import>Import ability CSV</button>' +
      "</div>" +
      '<div class="modal-actions"><button type="button" class="btn ghost" data-dismiss>Close</button><button type="button" class="btn primary" data-apply-ab>Apply to draft</button></div>'
    );
    box.el.querySelector("[data-ab-image]").addEventListener("click", function () {
      pickFile("image/png,image/jpeg,image/webp", function (file) {
        if (!okImage(file)) return Codex.ui.toast("Use PNG, JPG, or WebP.", "err");
        ability.image = Codex.ui.fileToPending(file, ability.id);
        Codex.ui.toast("Icon queued. Save Draft to keep it.", "ok");
      });
    });
    box.el.querySelector("[data-ab-import]").addEventListener("click", function () {
      pickFile(".csv,text/csv", async function (file) {
        const preview = Codex.csv.previewAbility(await file.text(), ability);
        if (!preview.ok) return Codex.ui.toast((preview.errors[0] || "Could not import."), "err");
        preview.mappings.forEach(function (map) { ability[map.field] = map.next; });
        markDirty();
        box.close();
        openAbilityModal(hero, ability, ctx);
      });
    });
    box.el.querySelector("[data-apply-ab]").addEventListener("click", function () {
      box.el.querySelectorAll("[data-ab]").forEach(function (input) {
        ability[input.getAttribute("data-ab")] = input.value;
      });
      box.el.querySelectorAll("[data-ab-list]").forEach(function (input) {
        ability[input.getAttribute("data-ab-list")] = input.value.split("\n").map(function (line) { return line.trim(); }).filter(Boolean);
      });
      ability.tagIds = [];
      box.el.querySelectorAll("[data-ab-tag]").forEach(function (input) {
        if (input.checked) ability.tagIds.push(input.getAttribute("data-ab-tag"));
      });
      markDirty();
      box.close();
      rerenderHero(ctx);
    });
  }

  function openLinksModal(hero, ctx) {
    const esc = Codex.schema.escapeHtml;
    function rows() {
      return (hero.related || []).map(function (item, index) {
        const heroOpts = ctx.heroes.map(function (h) {
          return '<option value="' + esc(h.id) + '"' + (item.targetType === "hero" && item.targetId === h.id ? " selected" : "") + ">" + esc(h.name) + "</option>";
        }).join("");
        const abilityOpts = ctx.heroes.map(function (h) {
          return (h.abilities || []).map(function (ab) {
            return '<option value="' + esc(ab.id) + '"' + (item.targetType === "ability" && item.targetId === ab.id ? " selected" : "") + ">" + esc(ab.name + " · " + h.name) + "</option>";
          }).join("");
        }).join("");
        return '<div class="link-row" data-link-index="' + index + '">' +
          '<select data-link-type><option value="hero"' + (item.targetType === "hero" ? " selected" : "") + '>Hero</option><option value="ability"' + (item.targetType === "ability" ? " selected" : "") + '>Ability</option><option value="external"' + (item.targetType === "external" ? " selected" : "") + ">External</option></select>" +
          (item.targetType === "hero" ? '<select data-link-target>' + heroOpts + "</select>" : "") +
          (item.targetType === "ability" ? '<select data-link-target>' + abilityOpts + "</select>" : "") +
          '<input data-link-name placeholder="Label" value="' + esc(item.name || "") + '">' +
          '<input data-link-note placeholder="Note" value="' + esc(item.note || "") + '">' +
          '<button type="button" class="btn tiny ghost" data-del-link>Remove</button>' +
        "</div>";
      }).join("");
    }
    const box = Codex.ui.modal(
      "<h3>Linked entries</h3><div data-link-list>" + rows() + "</div>" +
      '<div class="edit-row"><button type="button" class="btn" data-add-link>Add link</button></div>' +
      '<div class="modal-actions"><button type="button" class="btn ghost" data-dismiss>Close</button><button type="button" class="btn primary" data-apply-links>Apply to draft</button></div>'
    );
    function bindList() {
      box.el.querySelector("[data-link-list]").innerHTML = rows();
      box.el.querySelectorAll(".link-row").forEach(function (row) {
        const index = Number(row.getAttribute("data-link-index"));
        const item = hero.related[index];
        row.querySelector("[data-link-type]").addEventListener("change", function (event) {
          item.targetType = event.target.value;
          item.targetId = "";
          bindList();
        });
        const target = row.querySelector("[data-link-target]");
        if (target) target.addEventListener("change", function (event) { item.targetId = event.target.value; });
        row.querySelector("[data-link-name]").addEventListener("input", function (event) { item.name = event.target.value; });
        row.querySelector("[data-link-note]").addEventListener("input", function (event) { item.note = event.target.value; });
        row.querySelector("[data-del-link]").addEventListener("click", function () {
          hero.related.splice(index, 1);
          bindList();
        });
      });
    }
    bindList();
    box.el.querySelector("[data-add-link]").addEventListener("click", function () {
      hero.related.push({ id: Codex.schema.uid("link"), targetType: "external", targetId: "", name: "", note: "", type: "External" });
      bindList();
    });
    box.el.querySelector("[data-apply-links]").addEventListener("click", function () {
      markDirty();
      box.close();
      rerenderHero(ctx);
    });
  }

  function openStatImport(hero, ctx) {
    pickFile(".csv,text/csv", async function (file) {
      const text = await file.text();
      const preview = Codex.csv.previewStats(text, hero);
      const esc = Codex.schema.escapeHtml;
      const box = Codex.ui.modal(
        "<h3>Import stats</h3>" +
        (preview.errors.length ? "<ul class=\"warn\">" + preview.errors.map(function (e) { return "<li>" + esc(e) + "</li>"; }).join("") + "</ul>" : "") +
        (preview.warnings.length ? "<ul class=\"warn\">" + preview.warnings.map(function (e) { return "<li>" + esc(e) + "</li>"; }).join("") + "</ul>" : "") +
        '<table class="preview-table"><thead><tr><th>Stat</th><th>Current</th><th>Incoming</th></tr></thead><tbody>' +
        preview.mappings.map(function (row) {
          return "<tr><td>" + esc(row.code + " " + row.name) + "</td><td>" + esc(row.current) + "</td><td>" + esc(row.next) + "</td></tr>";
        }).join("") + "</tbody></table>" +
        '<div class="modal-actions"><button type="button" class="btn ghost" data-dismiss>Cancel</button>' +
        (preview.ok ? '<button type="button" class="btn primary" data-apply-csv>Apply to draft</button>' : "") + "</div>"
      );
      const apply = box.el.querySelector("[data-apply-csv]");
      if (apply) apply.addEventListener("click", function () {
        const next = Codex.csv.applyStats(hero, preview.mappings);
        hero.stats = next.stats;
        markDirty();
        box.close();
        rerenderHero(ctx);
      });
    });
  }

  async function start(ctx) {
    editor.ctx = ctx;
    editor.draft = Codex.schema.normalizeHero(ctx.hero);
    editor.originalId = ctx.hero.id;
    editor.dirty = false;
    editor.saving = false;
    const autoPref = await Codex.store.getMeta("autosave");
    editor.autosave = !!(autoPref && autoPref.value);
    const mount = document.getElementById("view");
    hydrateHero(mount, false);
    paintEditChrome(mount, ctx);
    await Codex.heroPage.render({
      mount: mount,
      hero: editor.draft,
      tax: ctx.tax,
      heroes: ctx.heroes,
      history: ctx.history,
      mode: "edit"
    });
    if (!editor.boundOnce) {
      editor.boundOnce = true;
      bindHero(mount);
    }
    measureNavHeight();
    markClean();
  }

  function isSaveChord(event) {
    if (!(event.ctrlKey || event.metaKey) || event.altKey) return false;
    if (event.key === "s" || event.key === "S") return true;
    return event.code === "KeyS";
  }

  function onEditorKey(event) {
    if (isSaveChord(event)) {
      if (!editor.draft || !document.querySelector("[data-edit-bar]")) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (typeof event.stopPropagation === "function") event.stopPropagation();
      saveDraft(editor.ctx, { leaveEdit: true });
      return;
    }
    if (event.key === "Escape" && editor.draft && !document.querySelector("#modal-root.open")) {
      const cancel = document.querySelector("[data-cancel-edit]");
      if (cancel) cancel.click();
    }
  }

  if (!editor.shortcutsBound) {
    editor.shortcutsBound = true;
    window.addEventListener("keydown", onEditorKey, true);
  }

  function measureNavHeight() {
    const nav = document.querySelector(".nav");
    if (!nav) return;
    const height = nav.getBoundingClientRect().height;
    document.documentElement.style.setProperty("--nav-full-h", Math.round(height) + "px");
  }
  window.addEventListener("resize", measureNavHeight);

  function renderCreate(mount, tax, heroes) {
    const esc = Codex.schema.escapeHtml;
    const draftHero = Codex.schema.emptyHero();
    draftHero.id = "new";
    draftHero.movement.squares = [];
    editor.draft = draftHero;
    let step = 1;
    function paint() {
      const existing = mount.querySelector("[data-wizard]");
      if (existing) collect(existing);
      const steps = ["Identity", "Combat", "Abilities & lore", "Classification"];
      mount.innerHTML =
        '<section class="page-block wrap">' +
          '<div class="crumbs"><a href="#/">Directory</a><span>/</span><span>Create New Hero</span></div>' +
          "<h1>Create New Hero</h1>" +
          '<p class="lede">Starts at version 0.1. The original sample hero is not copied.</p>' +
          '<ol class="wizard-steps">' + steps.map(function (label, i) {
            return '<li class="' + (step === i + 1 ? "is-on" : "") + '">' + esc(label) + "</li>";
          }).join("") + "</ol>" +
          '<form class="wizard" data-wizard></form>' +
          '<div class="edit-row">' +
            (step > 1 ? '<button type="button" class="btn ghost" data-prev>Back</button>' : "") +
            (step < 4 ? '<button type="button" class="btn primary" data-next>Next</button>' : '<button type="button" class="btn primary" data-create>Save draft</button>') +
          "</div>" +
        "</section>";
      const form = mount.querySelector("[data-wizard]");
      if (step === 1) {
        form.innerHTML =
          '<label>Name <input name="name" required value="' + esc(draftHero.name) + '"></label>' +
          '<label>Epithet <input name="epithet" value="' + esc(draftHero.epithet) + '"></label>' +
          '<label>Code <input name="code" value="' + esc(draftHero.code) + '"></label>' +
          '<label>Summary <textarea name="summary" rows="3">' + esc(draftHero.summary) + "</textarea></label>" +
          '<div class="edit-row"><button type="button" class="btn" data-upload-create-art>Upload artwork</button>' +
          (draftHero.artwork && (draftHero.artwork.previewUrl || draftHero.artwork.value) ? '<img class="art-preview" src="' + esc(draftHero.artwork.previewUrl || draftHero.artwork.value) + '" alt="">' : "") +
          "</div>";
      }
      if (step === 2) {
        form.innerHTML =
          '<div class="wide wizard-section-head">Six stats</div>' +
          Codex.schema.STAT_DEFS.map(function (def) {
            const stat = draftHero.stats.find(function (s) { return s.id === def.id; });
            return '<label>' + esc(def.code + " — " + def.name) + ' <input data-stat-id="' + def.id + '" value="' + esc(stat.value) + '"></label>';
          }).join("") +
          '<div class="wide wizard-section-head">Movement pattern</div>' +
          '<div class="wide"><p class="hint">Click a square to mark where this hero can reach in one turn. The centre square is the hero.</p>' +
          '<div class="movement" data-create-move>' + renderMiniBoard(draftHero.movement) + "</div></div>";
      }
      if (step === 3) {
        form.innerHTML =
          '<div class="wide wizard-section-head">Abilities</div>' +
          '<div class="wide"><p class="hint">Add at least one, or save first and add abilities later.</p>' +
          '<div class="edit-row"><button type="button" class="btn" data-add-create-ab>Add ability</button></div>' +
          "<ul>" + draftHero.abilities.map(function (ab) { return "<li>" + esc(ab.slot + " · " + ab.name) + "</li>"; }).join("") + "</ul></div>" +
          '<div class="wide wizard-section-head">Lore</div>' +
          '<label class="wide"><textarea name="lore" rows="6" placeholder="Backstory, world-fit, flavour. Blank lines separate paragraphs.">' + esc((draftHero.lore || []).join("\n\n")) + "</textarea></label>";
      }
      if (step === 4) {
        form.innerHTML =
          '<label>Tier <select name="tierId">' + Codex.schema.taxByType(tax, "tier").map(function (item) {
            return '<option value="' + esc(item.id) + '"' + (item.id === draftHero.tierId ? " selected" : "") + ">" + esc(item.name) + "</option>";
          }).join("") + "</select></label>" +
          '<label>Production state <select name="productionStateId">' + Codex.schema.taxByType(tax, "productionState").map(function (item) {
            return '<option value="' + esc(item.id) + '"' + (item.id === draftHero.productionStateId ? " selected" : "") + ">" + esc(item.name) + "</option>";
          }).join("") + "</select></label>" +
          '<div><span class="mini-label">Roles</span><div class="chip-picks">' + Codex.schema.taxByType(tax, "role").map(function (item) {
            return '<label class="check"><input type="checkbox" data-role-id="' + esc(item.id) + '"' + (draftHero.roleIds.indexOf(item.id) !== -1 ? " checked" : "") + "> " + esc(item.name) + "</label>";
          }).join("") + "</div></div>" +
          '<div><span class="mini-label">Tags</span><div class="chip-picks">' + Codex.schema.taxByType(tax, "tag").map(function (item) {
            return '<label class="check"><input type="checkbox" data-tag-id="' + esc(item.id) + '"' + (draftHero.tagIds.indexOf(item.id) !== -1 ? " checked" : "") + "> " + esc(item.name) + "</label>";
          }).join("") + "</div></div>";
      }
      collect(form);
      const next = mount.querySelector("[data-next]");
      const prev = mount.querySelector("[data-prev]");
      const create = mount.querySelector("[data-create]");
      if (next) next.onclick = function () { collect(form); if (step === 1 && !draftHero.name.trim()) return Codex.ui.toast("Enter a hero name.", "err"); step += 1; paint(); };
      if (prev) prev.onclick = function () { collect(form); step -= 1; paint(); };
      if (create) create.onclick = function () { collect(form); finishCreate(draftHero, heroes); };
      const up = mount.querySelector("[data-upload-create-art]");
      if (up) up.onclick = function () {
        pickFile("image/png,image/jpeg,image/webp", function (file) {
          if (!okImage(file)) return Codex.ui.toast("Use PNG, JPG, or WebP.", "err");
          draftHero.artwork = Codex.ui.fileToPending(file, "new");
          paint();
        });
      };
      const addAb = mount.querySelector("[data-add-create-ab]");
      if (addAb) addAb.onclick = function () {
        collect(form);
        const ability = Codex.schema.defaultAbility(String(draftHero.abilities.length + 1));
        ability.name = "New Ability " + ability.slot;
        draftHero.abilities.push(ability);
        paint();
      };
      const board = mount.querySelector("[data-create-move]");
      if (board) board.addEventListener("click", function (event) {
        const cell = event.target.closest("[data-row]");
        if (!cell || cell.classList.contains("origin")) return;
        const row = Number(cell.getAttribute("data-row"));
        const col = Number(cell.getAttribute("data-col"));
        const key = row + "," + col;
        const idx = draftHero.movement.squares.findIndex(function (sq) { return Codex.schema.squareKey(sq) === key; });
        if (idx === -1) draftHero.movement.squares.push({ row: row, col: col });
        else draftHero.movement.squares.splice(idx, 1);
        paint();
      });
    }
    function collect(form) {
      const data = new FormData(form);
      if (data.has("name")) draftHero.name = String(data.get("name") || "");
      if (data.has("epithet")) draftHero.epithet = String(data.get("epithet") || "");
      if (data.has("code")) draftHero.code = String(data.get("code") || "");
      if (data.has("summary")) draftHero.summary = String(data.get("summary") || "");
      if (data.has("lore")) draftHero.lore = String(data.get("lore") || "").split(/\n\s*\n/).map(function (p) { return p.trim(); }).filter(Boolean);
      if (data.has("tierId")) draftHero.tierId = String(data.get("tierId"));
      if (data.has("productionStateId")) draftHero.productionStateId = String(data.get("productionStateId"));
      form.querySelectorAll("[data-stat-id]").forEach(function (input) {
        const stat = draftHero.stats.find(function (s) { return s.id === input.getAttribute("data-stat-id"); });
        if (stat) stat.value = input.value;
      });
      form.querySelectorAll("[data-role-id]").forEach(function (input) { toggleId(draftHero.roleIds, input.getAttribute("data-role-id"), input.checked); });
      form.querySelectorAll("[data-tag-id]").forEach(function (input) { toggleId(draftHero.tagIds, input.getAttribute("data-tag-id"), input.checked); });
    }
    paint();
  }

  function renderMiniBoard(movement) {
    const size = movement.size || 7;
    const origin = movement.origin;
    const reach = {};
    (movement.squares || []).forEach(function (sq) { reach[Codex.schema.squareKey(sq)] = true; });
    let html = '<p class="mini-label">Click squares this hero can reach.</p><div class="board" style="grid-template-columns:repeat(' + size + ',minmax(0,1fr))">';
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        const isOrigin = row === origin.row && col === origin.col;
        const isReach = !!reach[row + "," + col];
        html += '<span class="' + (isOrigin ? "origin" : isReach ? "reach is-edit-cell" : "is-edit-cell") + '" data-row="' + row + '" data-col="' + col + '">' + (isReach && !isOrigin ? "+" : "") + "</span>";
      }
    }
    return html + "</div>";
  }

  async function finishCreate(hero, heroes) {
    const base = Codex.schema.slugify(hero.name) || "hero";
    let id = base;
    let n = 2;
    const ids = heroes.map(function (h) { return h.id; });
    while (ids.indexOf(id) !== -1) { id = base + "-" + n; n += 1; }
    hero.id = id;
    if (!hero.code) hero.code = id.toUpperCase().slice(0, 8);
    const errors = Codex.schema.validateHero(hero, ids);
    if (errors.length) return Codex.ui.toast(errors[0], "err");
    try {
      const ready = await Codex.ui.commitHeroImages(hero);
      const result = await Codex.store.saveHero(ready);
      Codex.ui.toast("Created " + result.hero.name + " as v0.1 in the data folder.", "ok");
      location.hash = "#/hero/" + encodeURIComponent(result.hero.id);
    } catch (err) {
      Codex.ui.toast(err.message || "Could not create the hero.", "err");
    }
  }

  Codex.editor = {
    start: start,
    renderCreate: renderCreate,
    saveDraft: saveDraft,
    getDraft: draft,
    setDraft: setDraft
  };
  Object.defineProperty(Codex.editor, "draft", {
    get: function () { return editor.draft; },
    set: function (value) { editor.draft = value; }
  });
})();
