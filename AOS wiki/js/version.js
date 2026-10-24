(function () {
  const Codex = window.Codex = window.Codex || {};

  function tenthsToString(tenths) {
    const n = Math.max(0, Math.round(Number(tenths) || 0));
    return Math.floor(n / 10) + "." + (n % 10);
  }

  function nextTenths(tenths) {
    return Math.round(Number(tenths) || 0) + 1;
  }

  function parseVersion(label) {
    if (typeof label === "number") return Math.round(label * 10);
    const text = String(label || "").trim();
    const match = text.match(/^(\d+)\.(\d)$/);
    if (!match) return 0;
    return Number(match[1]) * 10 + Number(match[2]);
  }

  Codex.version = {
    tenthsToString: tenthsToString,
    nextTenths: nextTenths,
    parseVersion: parseVersion
  };
})();
