(function () {
  const Codex = window.Codex = window.Codex || {};

  async function createItem(type, name) {
    const label = Codex.schema.labelCase(name);
    if (!label) throw new Error("Enter a name.");
    const tax = await Codex.store.listTaxonomy();
    const existing = tax.find(function (item) {
      return item.type === type && item.name.toLowerCase() === label.toLowerCase();
    });
    if (existing) return existing;
    const prefix = type === "productionState" ? "state" : type;
    const item = {
      id: prefix + "-" + Codex.schema.slugify(label) + "-" + Codex.schema.uid("").slice(-4),
      type: type,
      name: label,
      order: tax.filter(function (row) { return row.type === type; }).length + 1
    };
    if (type === "tier") item.value = item.order;
    if (type === "tag" && /damage|movement|control/.test(Codex.schema.slugify(label))) {
      item.color = Codex.schema.slugify(label);
    }
    await Codex.store.saveTaxonomyItem(item);
    return item;
  }

  async function promptNew(type) {
    const box = Codex.ui.modal(
      "<h3>New " + Codex.schema.escapeHtml(type) + "</h3>" +
      '<label>Name <input data-tax-name></label>' +
      '<div class="modal-actions"><button type="button" class="btn ghost" data-dismiss>Cancel</button><button type="button" class="btn primary" data-save-tax>Create</button></div>'
    );
    const input = box.el.querySelector("[data-tax-name]");
    input.focus();
    return new Promise(function (resolve) {
      box.el.querySelector("[data-save-tax]").addEventListener("click", async function () {
        try {
          const item = await createItem(type, input.value);
          box.close();
          Codex.ui.toast("Created " + item.name + ".", "ok");
          resolve(item);
        } catch (err) {
          Codex.ui.toast(err.message, "err");
        }
      });
      box.el.querySelector("[data-dismiss]").addEventListener("click", function () { resolve(null); });
    });
  }

  async function render(mount, tax, heroes) {
    const esc = Codex.schema.escapeHtml;
    const groups = [
      ["role", "Roles"],
      ["tag", "Tags"],
      ["tier", "Hero tiers"],
      ["allegiance", "Allegiances"],
      ["productionState", "Production states"]
    ];
    mount.innerHTML =
      '<section class="page-block wrap">' +
        '<div class="crumbs"><a href="#/">Directory</a><span>/</span><span>Tags &amp; states</span></div>' +
        "<h1>Shared definitions</h1>" +
        '<p class="lede">Heroes store IDs, not copied names. Renaming a definition updates every assigned hero.</p>' +
        groups.map(function (pair) {
          const items = Codex.schema.taxByType(tax, pair[0]);
          return '<div class="tax-block"><div class="section-head tight"><h2>' + esc(pair[1]) + '</h2><button type="button" class="btn" data-add-tax="' + pair[0] + '">Add</button></div>' +
            '<ul class="tax-list">' + items.map(function (item) {
              const used = heroes.filter(function (hero) {
                return hero.productionStateId === item.id || hero.tierId === item.id || hero.allegianceId === item.id
                  || (hero.roleIds || []).indexOf(item.id) !== -1
                  || (hero.tagIds || []).indexOf(item.id) !== -1
                  || (hero.abilities || []).some(function (ab) { return (ab.tagIds || []).indexOf(item.id) !== -1; });
              }).length;
              return '<li><strong>' + esc(item.name) + "</strong><span>" + used + " linked</span>" +
                '<button type="button" class="btn tiny" data-rename="' + esc(item.id) + '">Rename</button>' +
                '<button type="button" class="btn tiny ghost" data-delete-tax="' + esc(item.id) + '">Delete</button></li>';
            }).join("") + "</ul></div>";
        }).join("") +
      "</section>";

    mount.querySelectorAll("[data-add-tax]").forEach(function (btn) {
      btn.addEventListener("click", async function () {
        await promptNew(btn.getAttribute("data-add-tax"));
        Codex.router.refresh();
      });
    });
    mount.querySelectorAll("[data-rename]").forEach(function (btn) {
      btn.addEventListener("click", async function () {
        const id = btn.getAttribute("data-rename");
        const item = tax.find(function (row) { return row.id === id; });
        const box = Codex.ui.modal(
          "<h3>Rename</h3><label>Name <input data-tax-name value=\"" + esc(item.name) + "\"></label>" +
          '<div class="modal-actions"><button type="button" class="btn ghost" data-dismiss>Cancel</button><button type="button" class="btn primary" data-save-tax>Save</button></div>'
        );
        box.el.querySelector("[data-save-tax]").addEventListener("click", async function () {
          const name = Codex.schema.labelCase(box.el.querySelector("[data-tax-name]").value);
          if (!name) return Codex.ui.toast("Enter a name.", "err");
          item.name = name;
          await Codex.store.saveTaxonomyItem(item);
          box.close();
          Codex.ui.toast("Renamed. Hero links still use this ID.", "ok");
          Codex.router.refresh();
        });
      });
    });
    mount.querySelectorAll("[data-delete-tax]").forEach(function (btn) {
      btn.addEventListener("click", async function () {
        const id = btn.getAttribute("data-delete-tax");
        const ok = await Codex.ui.confirm("Delete this definition?", "It can only be deleted if no hero or ability still references it.", "Delete");
        if (!ok) return;
        try {
          await Codex.store.deleteTaxonomyItem(id);
          Codex.ui.toast("Deleted.", "ok");
          Codex.router.refresh();
        } catch (err) {
          Codex.ui.toast(err.message, "err");
        }
      });
    });
  }

  Codex.taxonomy = { render: render, createItem: createItem, promptNew: promptNew };
})();
