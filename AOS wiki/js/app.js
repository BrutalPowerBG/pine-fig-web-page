(function () {
  const Codex = window.Codex = window.Codex || {};

  Codex.boot = async function () {
    const view = document.getElementById("view");
    try {
      await Codex.store.open();
      await Codex.seed.run();
      await Codex.ui.bindChrome();
      Codex.search.bindNav();
      Codex.router.start();
    } catch (err) {
      console.error(err);
      if (view) {
        view.removeAttribute("aria-busy");
        view.innerHTML = '<section class="page-block wrap"><div class="empty-state"><h2>Could not open the design files</h2><p>' +
          Codex.schema.escapeHtml(err.message || "The data folder is unavailable.") +
          "</p></div></section>";
      }
    }
  };

  document.addEventListener("DOMContentLoaded", Codex.boot);
})();
