(function () {
  const Codex = window.Codex = window.Codex || {};

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;
    const src = String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    for (let i = 0; i < src.length; i += 1) {
      const ch = src[i];
      if (quoted) {
        if (ch === '"') {
          if (src[i + 1] === '"') { cell += '"'; i += 1; }
          else quoted = false;
        } else cell += ch;
      } else if (ch === '"') {
        quoted = true;
      } else if (ch === ",") {
        row.push(cell);
        cell = "";
      } else if (ch === "\n") {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      } else {
        cell += ch;
      }
    }
    if (cell.length || row.length) {
      row.push(cell);
      rows.push(row);
    }
    return rows.filter(function (item) { return item.some(function (part) { return String(part).trim() !== ""; }); });
  }

  function previewStats(csvText, hero) {
    const rows = parseCsv(csvText);
    if (!rows.length) return { ok: false, errors: ["The file is empty."], mappings: [] };
    const header = rows[0].map(function (cell) { return String(cell).trim().toLowerCase(); });
    const codeIdx = header.indexOf("code") !== -1 ? header.indexOf("code") : header.indexOf("id");
    const valueIdx = header.indexOf("value");
    const body = codeIdx !== -1 && valueIdx !== -1 ? rows.slice(1) : rows;
    const cIdx = codeIdx !== -1 ? codeIdx : 0;
    const vIdx = valueIdx !== -1 ? valueIdx : 1;
    const known = {};
    // Rows may name a stat by its id ("HP") or its display name ("Health").
    Codex.schema.statDefs().forEach(function (def) { known[def.id.toUpperCase()] = def; known[def.name.toUpperCase()] = def; });
    const seen = {};
    const mappings = [];
    const warnings = [];
    const errors = [];
    body.forEach(function (row, index) {
      const code = String(row[cIdx] || "").trim().toUpperCase();
      const value = String(row[vIdx] != null ? row[vIdx] : "").trim();
      if (!code) return;
      const def = known[code];
      if (!def) {
        warnings.push("Unknown stat identifier “" + code + "” on row " + (index + 2) + ".");
        return;
      }
      if (seen[def.id]) {
        warnings.push("Duplicate identifier “" + def.id + "”. The later row will be used.");
      }
      seen[def.id] = true;
      if (Codex.schema.parseStatNumber(value) == null) {
        errors.push(def.id + " value “" + value + "” is not numeric.");
      }
      const current = (hero.stats || []).find(function (stat) { return stat.id === def.id; });
      mappings.push({
        id: def.id,
        name: def.name,
        current: current ? current.value : "",
        next: value
      });
    });
    Codex.schema.statDefs().forEach(function (def) {
      if (!seen[def.id]) warnings.push("Missing " + def.id + " in the file. The current value will be kept.");
    });
    return { ok: errors.length === 0 && mappings.length > 0, errors: errors, warnings: warnings, mappings: mappings };
  }

  function applyStats(hero, mappings) {
    const next = Codex.schema.clone(hero);
    mappings.forEach(function (map) {
      const stat = next.stats.find(function (item) { return item.id === map.id; });
      if (stat) stat.value = map.next;
    });
    return next;
  }

  function previewAbility(csvText, ability) {
    const rows = parseCsv(csvText);
    if (!rows.length) return { ok: false, errors: ["The file is empty."], mappings: [] };
    const header = rows[0].map(function (cell) { return String(cell).trim().toLowerCase(); });
    const fieldIdx = header.indexOf("field") !== -1 ? header.indexOf("field") : 0;
    const valueIdx = header.indexOf("value") !== -1 ? header.indexOf("value") : 1;
    const allowed = ["name", "kind", "slot", "cooldown", "cost", "range", "summary", "lore", "damage", "healing", "scaling", "duration", "charges", "aoe", "effects"];
    const mappings = [];
    const warnings = [];
    const errors = [];
    const seen = {};
    rows.slice(header.indexOf("field") !== -1 ? 1 : 0).forEach(function (row, index) {
      const field = String(row[fieldIdx] || "").trim().toLowerCase();
      const value = String(row[valueIdx] != null ? row[valueIdx] : "").trim();
      if (!field) return;
      if (allowed.indexOf(field) === -1) {
        warnings.push("Unknown field “" + field + "” on row " + (index + 2) + ".");
        return;
      }
      if (seen[field]) warnings.push("Duplicate field “" + field + "”.");
      seen[field] = true;
      if (field === "kind" && value !== "active" && value !== "passive") {
        errors.push("kind must be active or passive.");
      }
      mappings.push({ field: field, current: ability[field], next: value });
    });
    return { ok: errors.length === 0 && mappings.length > 0, errors: errors, warnings: warnings, mappings: mappings };
  }

  Codex.csv = {
    parseCsv: parseCsv,
    previewStats: previewStats,
    applyStats: applyStats,
    previewAbility: previewAbility
  };
})();
