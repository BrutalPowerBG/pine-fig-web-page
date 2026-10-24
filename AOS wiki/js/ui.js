(function () {
  const Codex = window.Codex = window.Codex || {};
  const objectUrls = [];

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function toast(message, kind) {
    const root = qs("#toast-root");
    if (!root) return;
    const el = document.createElement("div");
    el.className = "toast" + (kind ? " toast-" + kind : "");
    el.textContent = message;
    root.appendChild(el);
    window.setTimeout(function () {
      el.classList.add("is-out");
      window.setTimeout(function () { el.remove(); }, 280);
    }, 3200);
  }

  function modal(html) {
    const root = qs("#modal-root");
    root.innerHTML = '<div class="modal-backdrop" data-close-modal></div><div class="modal" role="dialog" aria-modal="true">' + html + "</div>";
    root.classList.add("open");
    const close = function () { root.classList.remove("open"); root.innerHTML = ""; };
    root.querySelector("[data-close-modal]").addEventListener("click", close);
    root.querySelectorAll("[data-dismiss]").forEach(function (btn) {
      btn.addEventListener("click", close);
    });
    return { root: root, close: close, el: root.querySelector(".modal") };
  }

  function confirmModal(title, body, confirmLabel) {
    return new Promise(function (resolve) {
      let done = false;
      const box = modal(
        "<h3>" + Codex.schema.escapeHtml(title) + "</h3>" +
        "<p>" + Codex.schema.escapeHtml(body) + "</p>" +
        '<div class="modal-actions">' +
          '<button type="button" class="btn ghost" data-dismiss>Cancel</button>' +
          '<button type="button" class="btn danger" data-confirm>' + Codex.schema.escapeHtml(confirmLabel || "Confirm") + "</button>" +
        "</div>"
      );
      const finish = function (value) {
        if (done) return;
        done = true;
        box.close();
        resolve(value);
      };
      box.el.querySelector("[data-confirm]").addEventListener("click", function () { finish(true); });
      box.el.querySelector("[data-dismiss]").addEventListener("click", function () { finish(false); });
      box.root.querySelector("[data-close-modal]").addEventListener("click", function () { finish(false); });
    });
  }

  async function resolveSrc(image) {
    if (!image) return "";
    if (image.previewUrl) return image.previewUrl;
    if (image.kind === "blob" && image.value) {
      const rec = await Codex.store.getImage(image.value);
      if (rec && rec.blob) {
        const url = URL.createObjectURL(rec.blob);
        objectUrls.push(url);
        return url;
      }
    }
    return image.value || image.src || "";
  }

  function revokeUrls() {
    objectUrls.splice(0).forEach(function (url) { URL.revokeObjectURL(url); });
  }

  function abilityIconHtml(ability, src) {
    if (ability && ability.image && ability.image.kind === "svg" && ability.image.value) {
      return ability.image.value;
    }
    if (src) return '<img src="' + Codex.schema.escapeHtml(src) + '" alt="">';
    return Codex.schema.ABILITY_ICONS.default;
  }

  function fileToPending(file, owner) {
    const url = URL.createObjectURL(file);
    objectUrls.push(url);
    return {
      kind: "pending",
      value: "",
      previewUrl: url,
      file: file,
      owner: owner || ""
    };
  }

  async function commitPendingImage(image, ownerHeroId, ownerAbilityId) {
    if (!image || image.kind !== "pending" || !image.file) return image;
    const id = Codex.schema.uid("img");
    const saved = await Codex.store.putImage({
      id: id,
      blob: image.file,
      mime: image.file.type || "application/octet-stream",
      filename: image.file.name || id,
      ownerHeroId: ownerHeroId || "",
      ownerAbilityId: ownerAbilityId || ""
    });
    return { kind: "path", value: saved.path };
  }

  async function commitHeroImages(hero) {
    const next = Codex.schema.clone(hero);
    next.artwork = hero.artwork && hero.artwork.kind === "pending"
      ? await commitPendingImage(hero.artwork, hero.id, "")
      : hero.artwork;
    next.abilities = [];
    for (let i = 0; i < (hero.abilities || []).length; i += 1) {
      const ability = Codex.schema.clone(hero.abilities[i]);
      if (hero.abilities[i].image && hero.abilities[i].image.kind === "pending") {
        ability.image = await commitPendingImage(hero.abilities[i].image, hero.id, ability.id);
      } else {
        ability.image = hero.abilities[i].image;
      }
      next.abilities.push(ability);
    }
    return next;
  }

  function downloadJson(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function navCurrent(routeName) {
    document.querySelectorAll(".nav-links [data-nav]").forEach(function (link) {
      if (link.getAttribute("data-nav") === routeName) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  async function bindChrome() {
    const skip = document.querySelector(".skip");
    if (skip) {
      skip.addEventListener("click", function (event) {
        event.preventDefault();
        const target = document.getElementById("overview") || document.getElementById("view");
        if (target) {
          target.setAttribute("tabindex", "-1");
          target.focus();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }
    const exportBtn = qs("[data-export]");
    const importBtn = qs("[data-import]");
    const importInput = qs("[data-import-file]");
    if (exportBtn) {
      exportBtn.addEventListener("click", async function () {
        try {
          const backup = await Codex.store.exportBackup();
          downloadJson("aos-codex-backup.json", backup);
          toast("Downloaded a JSON copy of the data folder.", "ok");
        } catch (err) {
          toast(err.message || "Export failed.", "err");
        }
      });
    }
    if (importBtn && importInput) {
      importBtn.addEventListener("click", function () { importInput.click(); });
      importInput.addEventListener("change", async function () {
        const file = importInput.files && importInput.files[0];
        importInput.value = "";
        if (!file) return;
        const ok = await confirmModal("Replace encyclopedia data?", "Importing a backup replaces heroes, images, and history in the data folder.", "Import");
        if (!ok) return;
        try {
          const text = await file.text();
          await Codex.store.importBackup(JSON.parse(text));
          toast("Backup imported into the data folder.", "ok");
          Codex.router.refresh();
        } catch (err) {
          toast(err.message || "Import failed.", "err");
        }
      });
    }
  }

  function applyTheme(theme) {
    const root = document.documentElement.style;
    root.setProperty("--accent", theme.accent);
    root.setProperty("--accent-2", theme.accent2);
    root.setProperty("--glow", Codex.schema.glowFor(theme.accent));
  }

  Codex.ui = {
    applyTheme: applyTheme,
    qs: qs,
    toast: toast,
    modal: modal,
    confirm: confirmModal,
    resolveSrc: resolveSrc,
    revokeUrls: revokeUrls,
    abilityIconHtml: abilityIconHtml,
    fileToPending: fileToPending,
    commitHeroImages: commitHeroImages,
    downloadJson: downloadJson,
    navCurrent: navCurrent,
    bindChrome: bindChrome
  };
})();
