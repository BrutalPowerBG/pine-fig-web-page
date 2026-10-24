(function () {
  const Codex = window.Codex = window.Codex || {};

  const STAT_DEFS = [
    { id: "HP", code: "HP", name: "Health", description: "Hit points." },
    { id: "HPR", code: "HPR", name: "Regen", description: "Health recovered each turn." },
    { id: "AD", code: "AD", name: "Attack", description: "Base attack damage." },
    { id: "ATR", code: "ATR", name: "Range", description: "Attack reach in tiles." },
    { id: "ARM", code: "ARM", name: "Armor", description: "Incoming damage reduction." },
    { id: "CRIT", code: "CRIT", name: "Crit", description: "Chance to deal a critical hit." }
  ];

  const DEFAULT_THEME = {
    accent: "#f0c67a",
    accent2: "#ff7340",
    glow: "rgba(240, 198, 122, 0.45)"
  };

  const ABILITY_ICONS = {
    a1: '<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><circle cx="32" cy="32" r="18" stroke="#f0c67a" stroke-width="2.4"/><circle cx="32" cy="32" r="6" fill="#ff7340"/><path d="M32 8v8M32 48v8M8 32h8M48 32h8" stroke="#f6f0e6" stroke-width="2" stroke-linecap="round"/></svg>',
    a2: '<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M14 46c10-22 26-28 40-24" stroke="#f0c67a" stroke-width="3" stroke-linecap="round"/><path d="M18 28l-8 6 8 2z" fill="#ff7340"/><path d="M46 18l8-2-2 8z" fill="#f6f0e6"/></svg>',
    a3: '<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M18 22l14-8 14 8" stroke="#f0c67a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 38l14-8 14 8" stroke="#ff7340" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 52l14-8 14 8" stroke="#f6f0e6" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    a4: '<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><circle cx="32" cy="32" r="16" stroke="#f0c67a" stroke-width="2.4"/><circle cx="32" cy="32" r="7" stroke="#ff7340" stroke-width="2.4"/><circle cx="32" cy="32" r="2.2" fill="#f6f0e6"/></svg>',
    default: '<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><rect x="14" y="14" width="36" height="36" rx="8" stroke="#f0c67a" stroke-width="2.4"/><path d="M32 22v20M22 32h20" stroke="#ff7340" stroke-width="2.4" stroke-linecap="round"/></svg>'
  };

  const DEFAULT_TAXONOMY = [
    { id: "role-vanguard", type: "role", name: "Vanguard", order: 1 },
    { id: "role-controller", type: "role", name: "Controller", order: 2 },
    { id: "tag-damage", type: "tag", name: "damage", color: "damage", order: 1 },
    { id: "tag-movement", type: "tag", name: "movement", color: "movement", order: 2 },
    { id: "tag-control", type: "tag", name: "control", color: "control", order: 3 },
    { id: "tier-1", type: "tier", name: "I", value: 1, order: 1 },
    { id: "tier-2", type: "tier", name: "II", value: 2, order: 2 },
    { id: "tier-3", type: "tier", name: "III", value: 3, order: 3 },
    { id: "tier-4", type: "tier", name: "IV", value: 4, order: 4 },
    { id: "tier-5", type: "tier", name: "V", value: 5, order: 5 },
    { id: "state-draft", type: "productionState", name: "Draft", order: 1 },
    { id: "state-pre-production-sample", type: "productionState", name: "Pre-production sample", order: 2 },
    { id: "state-concept", type: "productionState", name: "Concept", order: 3 },
    { id: "state-design", type: "productionState", name: "Design", order: 4 },
    { id: "state-prototype", type: "productionState", name: "Prototype", order: 5 },
    { id: "state-in-development", type: "productionState", name: "In Development", order: 6 },
    { id: "state-playtesting", type: "productionState", name: "Playtesting", order: 7 },
    { id: "state-approved", type: "productionState", name: "Approved", order: 8 },
    { id: "state-deprecated", type: "productionState", name: "Deprecated", order: 9 }
  ];

  function uid(prefix) {
    const rand = Math.random().toString(36).slice(2, 8);
    const time = Date.now().toString(36);
    return (prefix ? prefix + "-" : "") + time + rand;
  }

  function slugify(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function parseStatNumber(value) {
    const match = String(value == null ? "" : value).match(/-?\d+(\.\d+)?/);
    return match ? Number(match[0]) : null;
  }

  function formatDate(iso) {
    if (!iso) return "";
    const date = new Date(iso);
    if (isNaN(date.getTime())) return String(iso);
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function queenPattern(size) {
    const board = Math.max(3, Number(size) || 7);
    const origin = { row: Math.floor(board / 2), col: Math.floor(board / 2) };
    const squares = [];
    for (let row = 0; row < board; row += 1) {
      for (let col = 0; col < board; col += 1) {
        if (row === origin.row && col === origin.col) continue;
        const rowStep = Math.abs(row - origin.row);
        const colStep = Math.abs(col - origin.col);
        if (rowStep === 0 || colStep === 0 || rowStep === colStep) {
          squares.push({ row: row, col: col });
        }
      }
    }
    return { origin: origin, squares: squares };
  }

  function defaultStats(values) {
    const map = values || {};
    return STAT_DEFS.map(function (def) {
      const fallback = def.id === "CRIT" ? "0%" : "0";
      return {
        id: def.id,
        code: def.code,
        name: def.name,
        description: def.description,
        value: map[def.id] != null ? String(map[def.id]) : fallback
      };
    });
  }

  function defaultMovement(size) {
    const board = size || 7;
    const pattern = queenPattern(board);
    return {
      label: "Movement",
      note: "Squares marked + can be reached in one turn.",
      size: board,
      origin: pattern.origin,
      squares: [],
      minDistance: 0,
      maxDistance: null,
      canJump: false,
      blockedByFriendly: true,
      blockedByEnemy: true,
      intermediateMustBeEmpty: true,
      directions: ["orthogonal", "diagonal"],
      conditions: []
    };
  }

  function defaultAbility(slot) {
    const n = String(slot || 1);
    return {
      id: uid("ab"),
      slot: n,
      name: "Untitled Ability",
      kind: "active",
      tagIds: [],
      image: { kind: "svg", value: ABILITY_ICONS.default },
      cooldown: "—",
      cost: "None",
      range: "—",
      summary: "",
      lore: "",
      effects: [],
      upgrades: [],
      interactions: [],
      damage: "",
      healing: "",
      scaling: "",
      duration: "",
      charges: "",
      aoe: "",
      statusEffects: [],
      variants: [],
      linkedEntryIds: []
    };
  }

  function emptyHero() {
    const now = new Date().toISOString();
    return {
      id: "",
      name: "",
      epithet: "",
      code: "",
      summary: "",
      phase: "",
      contentStatus: "",
      productionStateId: "state-concept",
      tierId: "tier-1",
      roleIds: [],
      tagIds: [],
      artwork: { kind: "path", value: "" },
      theme: clone(DEFAULT_THEME),
      stats: defaultStats(),
      movement: defaultMovement(7),
      abilities: [],
      lore: [],
      related: [],
      versionTenths: 1,
      currentVersion: "0.1",
      createdAt: now,
      updatedAt: now
    };
  }

  function squareKey(square) {
    return Number(square.row) + "," + Number(square.col);
  }

  function normalizeRelated(item) {
    if (!item) return null;
    const targetType = item.targetType || "external";
    const typeLabel = item.type
      || (targetType === "hero" ? "Hero" : targetType === "ability" ? "Ability" : "External");
    return {
      id: item.id || uid("link"),
      targetType: targetType,
      targetId: item.targetId || "",
      name: item.name || "",
      note: item.note || "",
      type: typeLabel
    };
  }

  function normalizeAbility(ability, index) {
    const slot = ability && ability.slot != null ? String(ability.slot) : String(index + 1);
    const tagIds = Array.isArray(ability && ability.tagIds)
      ? ability.tagIds.slice()
      : (ability && ability.tags || []).map(function (tag) {
        return tag.indexOf("tag-") === 0 ? tag : "tag-" + slugify(tag);
      });
    const image = ability && ability.image && ability.image.kind === "pending"
      ? ability.image
      : (ability && ability.image
        ? clone(ability.image)
        : { kind: "svg", value: ABILITY_ICONS[ability && ability.id] || ABILITY_ICONS.default });
    return {
      id: (ability && ability.id) || uid("ab"),
      slot: slot,
      name: (ability && ability.name) || "Untitled Ability",
      kind: ability && ability.kind === "passive" ? "passive" : "active",
      tagIds: tagIds,
      image: image,
      cooldown: ability && ability.cooldown != null ? String(ability.cooldown) : "—",
      cost: ability && ability.cost != null ? String(ability.cost) : "None",
      range: ability && ability.range != null ? String(ability.range) : "—",
      summary: (ability && ability.summary) || "",
      lore: (ability && ability.lore) || "",
      effects: Array.isArray(ability && ability.effects) ? ability.effects.slice() : [],
      upgrades: Array.isArray(ability && ability.upgrades) ? ability.upgrades.slice() : [],
      interactions: Array.isArray(ability && ability.interactions) ? ability.interactions.slice() : [],
      damage: (ability && ability.damage) || "",
      healing: (ability && ability.healing) || "",
      scaling: (ability && ability.scaling) || "",
      duration: (ability && ability.duration) || "",
      charges: (ability && ability.charges) || "",
      aoe: (ability && ability.aoe) || "",
      statusEffects: Array.isArray(ability && ability.statusEffects) ? ability.statusEffects.slice() : [],
      variants: Array.isArray(ability && ability.variants) ? ability.variants.slice() : [],
      linkedEntryIds: Array.isArray(ability && ability.linkedEntryIds) ? ability.linkedEntryIds.slice() : []
    };
  }

  function normalizeHero(raw) {
    const base = emptyHero();
    if (!raw) return base;
    const stats = Array.isArray(raw.stats) && raw.stats.length
      ? (Array.isArray(raw.stats[0])
        ? raw.stats.reduce(function (acc, row) { return acc.concat(row); }, [])
        : raw.stats).map(function (stat) {
          const def = STAT_DEFS.find(function (item) { return item.id === stat.id || item.code === stat.code; }) || {};
          return {
            id: stat.id || def.id || stat.code,
            code: stat.code || def.code || stat.id,
            name: stat.name || def.name || stat.code,
            description: stat.description || def.description || "",
            value: stat.value != null ? String(stat.value) : "0"
          };
        })
      : defaultStats();
    STAT_DEFS.forEach(function (def) {
      if (!stats.some(function (stat) { return stat.id === def.id; })) {
        stats.push({ id: def.id, code: def.code, name: def.name, description: def.description, value: def.id === "CRIT" ? "0%" : "0" });
      }
    });
    const ordered = STAT_DEFS.map(function (def) {
      return stats.find(function (stat) { return stat.id === def.id; });
    }).filter(Boolean);

    const movement = Object.assign(defaultMovement((raw.movement && raw.movement.size) || 7), raw.movement || {});
    if (!movement.origin) {
      const pattern = queenPattern(movement.size);
      movement.origin = pattern.origin;
    }
    movement.squares = Array.isArray(movement.squares) ? movement.squares.map(function (sq) {
      return { row: Number(sq.row), col: Number(sq.col) };
    }) : [];

    const roleIds = Array.isArray(raw.roleIds)
      ? raw.roleIds.slice()
      : (raw.roles || []).map(function (role) { return "role-" + slugify(role); });
    const tagIds = Array.isArray(raw.tagIds)
      ? raw.tagIds.slice()
      : (raw.tags || []).map(function (tag) { return "tag-" + slugify(tag); });

    return Object.assign(base, {
      id: raw.id || base.id,
      name: raw.name || "",
      epithet: raw.epithet || "",
      code: raw.code || "",
      summary: raw.summary || "",
      phase: raw.phase || "",
      contentStatus: raw.contentStatus || "",
      productionStateId: raw.productionStateId || "state-concept",
      tierId: raw.tierId || (raw.tier ? "tier-" + raw.tier : "tier-1"),
      roleIds: roleIds,
      tagIds: tagIds,
      artwork: raw.artwork && raw.artwork.kind === "pending"
        ? raw.artwork
        : (raw.artwork
          ? (raw.artwork.kind ? clone(raw.artwork) : { kind: "path", value: raw.artwork.src || raw.artwork.value || "" })
          : { kind: "path", value: "" }),
      theme: Object.assign(clone(DEFAULT_THEME), raw.theme || {}),
      stats: ordered,
      movement: movement,
      abilities: Array.isArray(raw.abilities) ? raw.abilities.map(normalizeAbility) : [],
      lore: Array.isArray(raw.lore) ? raw.lore.slice() : (raw.lore ? [String(raw.lore)] : []),
      related: Array.isArray(raw.related) ? raw.related.map(normalizeRelated).filter(Boolean) : [],
      versionTenths: raw.versionTenths != null ? Number(raw.versionTenths) : 1,
      currentVersion: raw.currentVersion || tenthsLabel(raw.versionTenths || 1),
      createdAt: raw.createdAt || base.createdAt,
      updatedAt: raw.updatedAt || base.updatedAt
    });
  }

  function tenthsLabel(tenths) {
    return Codex.version.tenthsToString(tenths);
  }

  function taxByType(list, type) {
    return (list || []).filter(function (item) { return item.type === type; })
      .sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
  }

  function taxName(list, id, fallback) {
    const hit = (list || []).find(function (item) { return item.id === id; });
    return hit ? hit.name : (fallback || "Missing");
  }

  function taxMap(list) {
    const map = {};
    (list || []).forEach(function (item) { map[item.id] = item; });
    return map;
  }

  function statPairs(stats) {
    const rows = [];
    for (let i = 0; i < stats.length; i += 2) {
      rows.push(stats.slice(i, i + 2));
    }
    return rows;
  }

  function validateHero(hero, existingIds) {
    const errors = [];
    if (!hero.name || !String(hero.name).trim()) errors.push("Enter a hero name.");
    if (!hero.id) errors.push("Hero is missing an id.");
    if (existingIds && existingIds.indexOf(hero.id) !== -1) errors.push("A hero with this id already exists.");
    hero.stats.forEach(function (stat) {
      if (parseStatNumber(stat.value) == null) {
        errors.push(stat.code + " must include a numeric value.");
      }
    });
    return errors;
  }

  function stripRuntime(value) {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach(stripRuntime);
      return;
    }
    delete value.previewUrl;
    delete value.file;
    Object.keys(value).forEach(function (key) { stripRuntime(value[key]); });
  }

  function sanitizeForStorage(hero) {
    const copy = clone(hero);
    stripRuntime(copy);
    return copy;
  }

  Codex.schema = {
    STAT_DEFS: STAT_DEFS,
    DEFAULT_THEME: DEFAULT_THEME,
    ABILITY_ICONS: ABILITY_ICONS,
    DEFAULT_TAXONOMY: DEFAULT_TAXONOMY,
    uid: uid,
    slugify: slugify,
    clone: clone,
    escapeHtml: escapeHtml,
    parseStatNumber: parseStatNumber,
    formatDate: formatDate,
    queenPattern: queenPattern,
    defaultStats: defaultStats,
    defaultMovement: defaultMovement,
    defaultAbility: defaultAbility,
    emptyHero: emptyHero,
    normalizeHero: normalizeHero,
    normalizeAbility: normalizeAbility,
    squareKey: squareKey,
    taxByType: taxByType,
    taxName: taxName,
    taxMap: taxMap,
    statPairs: statPairs,
    validateHero: validateHero,
    sanitizeForStorage: sanitizeForStorage
  };
})();
