(function () {
  const Codex = window.Codex = window.Codex || {};

  async function imagePreview(image) {
    if (!image) return "";
    if (image.kind === "svg") return image.value || "";
    const src = await Codex.ui.resolveSrc(image);
    return src ? '<img src="' + Codex.schema.escapeHtml(src) + '" alt="">' : "";
  }

  async function detailHtml(group) {
    const esc = Codex.schema.escapeHtml;
    const rows = [];
    for (let i = 0; i < (group.changes || []).length; i += 1) {
      const change = group.changes[i];
      let extra = "";
      if (change.prevText != null || change.nextText != null) {
        extra = '<div class="diff-text"><div><h5>Previous</h5><pre>' + esc(change.prevText || "") + "</pre></div><div><h5>Revised</h5><pre>" + esc(change.nextText || "") + "</pre></div></div>";
      }
      if (change.prevImage || change.nextImage) {
        extra += '<div class="diff-images"><div><h5>Previous</h5>' + (await imagePreview(change.prevImage)) + "</div><div><h5>New</h5>" + (await imagePreview(change.nextImage)) + "</div></div>";
      }
      rows.push(
        '<li><span class="diff-field">' + esc(change.field) + "</span>" +
        '<span class="diff-prev">' + esc(Codex.diff.labelOf(change.prev)) + "</span>" +
        "<span>→</span>" +
        '<span class="diff-next">' + esc(Codex.diff.labelOf(change.next)) + "</span>" + extra + "</li>"
      );
    }
    return "<ul class=\"diff-list\">" + rows.join("") + "</ul>";
  }

  async function render(mount, hero, history, tax, options) {
    const esc = Codex.schema.escapeHtml;
    options = options || {};
    const blocks = [];
    for (let i = 0; i < history.length; i += 1) {
      const entry = history[i];
      const groups = [];
      for (let g = 0; g < (entry.changeGroups || []).length; g += 1) {
        groups.push("<h4>" + esc(entry.changeGroups[g].title) + "</h4>" + await detailHtml(entry.changeGroups[g]));
      }
      blocks.push(
        '<article class="history-card">' +
          '<button type="button" class="history-summary" data-expand="' + entry.versionTenths + '">' +
            "<strong>v" + esc(entry.versionLabel) + "</strong>" +
            '<span class="chip ghost">' + esc(Codex.schema.taxName(tax, entry.productionStateId, "")) + "</span>" +
            "<time>" + esc(Codex.schema.formatDate(entry.timestamp)) + "</time>" +
            "<p>" + esc(entry.summary) + "</p>" +
          "</button>" +
          '<div class="history-detail" hidden>' + groups.join("") +
            '<div class="edit-row">' +
              '<a class="btn" href="#/hero/' + encodeURIComponent(hero.id) + "/history/" + entry.versionTenths + '">View this version</a>' +
              (options.readOnly ? "" : '<button type="button" class="btn ghost" data-restore="' + entry.versionTenths + '">Restore this version</button>') +
            "</div>" +
          "</div>" +
        "</article>"
      );
    }

    mount.innerHTML =
      '<section class="page-block wrap">' +
        '<div class="crumbs"><a href="#/">Directory</a><span>/</span><a href="#/hero/' + encodeURIComponent(hero.id) + '">' + esc(hero.name) + '</a><span>/</span><span>History</span></div>' +
        "<h1>Draft history</h1>" +
        '<p class="lede">Each saved draft is a version. Restoring copies an earlier snapshot into a new draft and leaves later versions in place.</p>' +
        (blocks.length ? '<div class="history-stack">' + blocks.join("") + "</div>" : '<div class="empty-state"><h2>No drafts yet</h2></div>') +
      "</section>";

    mount.querySelectorAll("[data-expand]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const detail = btn.parentElement.querySelector(".history-detail");
        detail.hidden = !detail.hidden;
      });
    });
    mount.querySelectorAll("[data-restore]").forEach(function (btn) {
      btn.addEventListener("click", async function () {
        const tenths = Number(btn.getAttribute("data-restore"));
        const ok = await Codex.ui.confirm("Restore this version?", "The current hero will be saved as a new version containing the restored data. Later history is kept.", "Restore");
        if (!ok) return;
        try {
          const snap = await Codex.store.getSnapshot(hero.id, tenths);
          if (!snap) throw new Error("That snapshot is missing.");
          const next = Codex.schema.normalizeHero(snap.hero);
          next.id = hero.id;
          const result = await Codex.store.saveHero(next, { restoreFrom: Codex.version.tenthsToString(tenths) });
          if (!result.saved && result.reason === "no-changes") {
            Codex.ui.toast("This version already matches the current draft.", "ok");
            return;
          }
          Codex.ui.toast("Restored as v" + result.version + ".", "ok");
          location.hash = "#/hero/" + encodeURIComponent(hero.id) + "/history";
          Codex.router.refresh();
        } catch (err) {
          Codex.ui.toast(err.message || "Restore failed.", "err");
        }
      });
    });
  }

  Codex.historyView = { render: render };
})();
