(function () {
  const Codex = window.Codex = window.Codex || {};

  function same(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  function labelOf(value) {
    if (value == null || value === "") return "(empty)";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  }

  function change(field, prev, next, extra) {
    const row = { field: field, prev: prev, next: next };
    if (extra) Object.keys(extra).forEach(function (key) { row[key] = extra[key]; });
    return row;
  }

  function imageLabel(image) {
    if (!image || (!image.value && !image.src)) return "(none)";
    if (image.kind === "svg") return "Inline icon";
    if (image.kind === "blob") return "Uploaded image (" + image.value + ")";
    return image.value || image.src || "(none)";
  }

  function listDiff(prevList, nextList) {
    const prev = prevList || [];
    const next = nextList || [];
    const changes = [];
    const max = Math.max(prev.length, next.length);
    for (let i = 0; i < max; i += 1) {
      if (prev[i] !== next[i]) {
        if (prev[i] == null) changes.push(change("Added", "", next[i], { index: i }));
        else if (next[i] == null) changes.push(change("Removed", prev[i], "", { index: i }));
        else changes.push(change("Item " + (i + 1), prev[i], next[i], { index: i }));
      }
    }
    return changes;
  }

  function idsLabel(ids, taxMap) {
    return (ids || []).map(function (id) {
      return (taxMap && taxMap[id] && taxMap[id].name) || id;
    }).join(", ") || "(none)";
  }

  function squareSet(squares) {
    const set = {};
    (squares || []).forEach(function (sq) { set[Codex.schema.squareKey(sq)] = sq; });
    return set;
  }

  function diffHeroes(prevRaw, nextRaw, tax) {
    const prev = Codex.schema.normalizeHero(prevRaw);
    const next = Codex.schema.normalizeHero(nextRaw);
    const taxMap = Codex.schema.taxMap(tax || []);
    const groups = [];

    const info = [];
    ["name", "epithet", "code", "summary", "phase", "contentStatus"].forEach(function (field) {
      if (prev[field] !== next[field]) info.push(change(field, prev[field], next[field]));
    });
    if (prev.productionStateId !== next.productionStateId) {
      info.push(change("production state",
        Codex.schema.taxName(tax, prev.productionStateId, prev.productionStateId),
        Codex.schema.taxName(tax, next.productionStateId, next.productionStateId),
        { prevId: prev.productionStateId, nextId: next.productionStateId }));
    }
    if (prev.tierId !== next.tierId) {
      info.push(change("tier",
        Codex.schema.taxName(tax, prev.tierId, prev.tierId),
        Codex.schema.taxName(tax, next.tierId, next.tierId),
        { prevId: prev.tierId, nextId: next.tierId }));
    }
    if (!same(prev.roleIds, next.roleIds)) {
      info.push(change("roles", idsLabel(prev.roleIds, taxMap), idsLabel(next.roleIds, taxMap)));
    }
    if (!same(prev.tagIds, next.tagIds)) {
      info.push(change("tags", idsLabel(prev.tagIds, taxMap), idsLabel(next.tagIds, taxMap)));
    }
    if (!same(prev.artwork, next.artwork)) {
      info.push(change("artwork", imageLabel(prev.artwork), imageLabel(next.artwork), {
        prevImage: prev.artwork,
        nextImage: next.artwork
      }));
    }
    if ((prev.allegianceId || "") !== (next.allegianceId || "")) {
      info.push(change("allegiance", Codex.schema.taxName(tax, prev.allegianceId, "None"), Codex.schema.taxName(tax, next.allegianceId, "None")));
    }
    if (info.length) {
      groups.push({ type: "heroInfo", title: "Hero Information Changed", changes: info });
    }

    const statChanges = [];
    Codex.schema.statDefs().forEach(function (def) {
      const a = prev.stats.find(function (s) { return s.id === def.id; }) || {};
      const b = next.stats.find(function (s) { return s.id === def.id; }) || {};
      if (a.value !== b.value) {
        statChanges.push(change(def.name, a.value, b.value, { statId: def.id }));
      }
    });
    if (statChanges.length) {
      groups.push({ type: "stats", title: "Stats Changed", changes: statChanges });
    }

    const moveChanges = [];
    const pm = prev.movement;
    const nm = next.movement;
    if (!same(pm.intermediateMustBeEmpty, nm.intermediateMustBeEmpty)) {
      moveChanges.push(change("intermediateMustBeEmpty", pm.intermediateMustBeEmpty, nm.intermediateMustBeEmpty));
    }
    if (!same(pm.directions, nm.directions)) moveChanges.push(change("directions", (pm.directions || []).join(", "), (nm.directions || []).join(", ")));
    if (!same(pm.conditions, nm.conditions)) moveChanges.push(change("conditions", (pm.conditions || []).join("; "), (nm.conditions || []).join("; ")));
    const prevSet = squareSet(pm.squares);
    const nextSet = squareSet(nm.squares);
    const added = [];
    const removed = [];
    Object.keys(nextSet).forEach(function (key) { if (!prevSet[key]) added.push(key); });
    Object.keys(prevSet).forEach(function (key) { if (!nextSet[key]) removed.push(key); });
    if (added.length) moveChanges.push(change("squares added", "", added.join(" · "), { squares: added }));
    if (removed.length) moveChanges.push(change("squares removed", removed.join(" · "), "", { squares: removed }));
    if (moveChanges.length) {
      groups.push({ type: "movement", title: "Movement Changed", changes: moveChanges });
    }

    if (!same(prev.lore, next.lore)) {
      groups.push({
        type: "lore",
        title: "Lore Changed",
        changes: [change("lore", (prev.lore || []).join("\n\n"), (next.lore || []).join("\n\n"), {
          prevText: (prev.lore || []).join("\n\n"),
          nextText: (next.lore || []).join("\n\n")
        })]
      });
    }

    const prevAbs = {};
    const nextAbs = {};
    prev.abilities.forEach(function (ab) { prevAbs[ab.id] = ab; });
    next.abilities.forEach(function (ab) { nextAbs[ab.id] = ab; });
    const abilityIds = [];
    Object.keys(prevAbs).forEach(function (id) { if (abilityIds.indexOf(id) === -1) abilityIds.push(id); });
    Object.keys(nextAbs).forEach(function (id) { if (abilityIds.indexOf(id) === -1) abilityIds.push(id); });
    abilityIds.forEach(function (id) {
      const a = prevAbs[id];
      const b = nextAbs[id];
      if (!a && b) {
        groups.push({
          type: "ability",
          title: "Ability Added — " + b.name,
          abilityId: id,
          abilityName: b.name,
          changes: [change("ability", "", b.name, { added: true })]
        });
        return;
      }
      if (a && !b) {
        groups.push({
          type: "ability",
          title: "Ability Removed — " + a.name,
          abilityId: id,
          abilityName: a.name,
          changes: [change("ability", a.name, "", { removed: true })]
        });
        return;
      }
      const changes = [];
      ["name", "slot", "kind", "cooldown", "cost", "range", "summary", "lore", "damage", "healing", "scaling", "duration", "charges", "aoe"].forEach(function (field) {
        if (a[field] !== b[field]) changes.push(change(field, a[field], b[field]));
      });
      if (!same(a.tagIds, b.tagIds)) changes.push(change("tags", idsLabel(a.tagIds, taxMap), idsLabel(b.tagIds, taxMap)));
      if (!same(a.image, b.image)) {
        changes.push(change("image", imageLabel(a.image), imageLabel(b.image), { prevImage: a.image, nextImage: b.image }));
      }
      ["effects", "statusEffects", "variants"].forEach(function (field) {
        const rows = listDiff(a[field], b[field]);
        rows.forEach(function (row) { row.field = field + " · " + row.field; changes.push(row); });
      });
      if (!same(a.linkedEntryIds, b.linkedEntryIds)) {
        changes.push(change("linked entries", (a.linkedEntryIds || []).join(", "), (b.linkedEntryIds || []).join(", ")));
      }
      if (changes.length) {
        groups.push({
          type: "ability",
          title: "Ability Changed — " + b.name,
          abilityId: id,
          abilityName: b.name,
          changes: changes
        });
      }
    });

    if (!same(prev.related, next.related)) {
      groups.push({
        type: "related",
        title: "Linked Entries Changed",
        changes: [change("linked entries", JSON.stringify(prev.related), JSON.stringify(next.related), {
          prevList: prev.related,
          nextList: next.related
        })]
      });
    }

    const summaryLines = groups.map(function (group) {
      const bullets = (group.changes || []).slice(0, 4).map(function (row) {
        if (row.added) return "Added " + labelOf(row.next);
        if (row.removed) return "Removed " + labelOf(row.prev);
        return row.field + ": " + labelOf(row.prev) + " → " + labelOf(row.next);
      });
      return group.title + (bullets.length ? " — " + bullets.join("; ") : "");
    });

    return {
      hasChanges: groups.length > 0,
      groups: groups,
      summary: summaryLines[0] || "No changes",
      summaryLines: summaryLines
    };
  }

  Codex.diff = { diffHeroes: diffHeroes, labelOf: labelOf, imageLabel: imageLabel };
})();
