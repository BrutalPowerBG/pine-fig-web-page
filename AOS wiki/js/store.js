(function () {
  const Codex = window.Codex = window.Codex || {};
  const cache = {
    catalog: null,
    taxonomy: null,
    settings: null,
    setup: null,
    heroes: {}
  };
  const state = { ready: false, writable: false };

  function safeId(id) {
    const text = String(id || "");
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,80}$/.test(text)) {
      throw new Error("This id cannot be stored as a file name.");
    }
    return text;
  }

  function heroPath(id) { return "data/heroes/" + safeId(id) + ".json"; }
  function historyPath(id) { return "data/history/" + safeId(id) + ".json"; }
  function snapshotPath(id, tenths) { return "data/history/" + safeId(id) + "/" + String(Number(tenths)) + ".json"; }

  function extFor(mime, filename) {
    const match = String(filename || "").toLowerCase().match(/\.([a-z0-9]+)$/);
    const allowed = { png: "png", jpg: "jpg", jpeg: "jpg", webp: "webp", gif: "gif", svg: "svg" };
    if (match && allowed[match[1]]) return allowed[match[1]];
    const types = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
      "image/svg+xml": "svg"
    };
    return types[mime] || "png";
  }

  function imagePathFor(id, mime, filename) {
    return "data/images/" + safeId(id) + "." + extFor(mime, filename);
  }

  function clearCache() {
    cache.catalog = null;
    cache.taxonomy = null;
    cache.settings = null;
    cache.setup = null;
    cache.heroes = {};
  }

  function bundled(path) {
    const files = window.CodexFiles;
    const clean = String(path || "").split("?")[0].replace(/^\//, "");
    if (!files || !Object.prototype.hasOwnProperty.call(files, clean)) return undefined;
    return Codex.schema.clone(files[clean]);
  }

  async function readJson(path, fallback) {
    if (location.protocol !== "file:") {
      try {
        const res = await fetch(path + (path.indexOf("?") === -1 ? "?" : "&") + "t=" + Date.now(), { cache: "no-store" });
        if (res.status === 404) return fallback;
        if (!res.ok) throw new Error("Could not read " + path + ".");
        return res.json();
      } catch (err) {
        const copy = bundled(path);
        if (copy !== undefined) return copy;
        throw err;
      }
    }
    const copy = bundled(path);
    return copy === undefined ? fallback : copy;
  }

  async function commit(payload) {
    if (!state.writable) {
      throw new Error("This copy cannot write the data folder. From the AOS wiki folder, run python server.py and use the page that command is serving.");
    }
    const res = await fetch("/__codex/commit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    let body = {};
    try { body = await res.json(); } catch (err) { body = {}; }
    if (!res.ok || !body.ok) throw new Error(body.error || "Could not write the data folder.");
    return body;
  }

  async function open() {
    if (state.ready) return;
    state.writable = false;
    if (location.protocol !== "file:") {
      try {
        const res = await fetch("/__codex/status", { cache: "no-store" });
        const body = await res.json();
        state.writable = !!(res.ok && body.ok);
      } catch (err) {
        state.writable = false;
      }
    }
    if (state.writable) {
      try {
        await migrateFromIndexedDb();
      } catch (err) {
        console.error("IndexedDB migration skipped", err);
      }
    } else if (bundled("data/catalog.json") === undefined) {
      let readable = false;
      if (location.protocol !== "file:") {
        try {
          const probe = await fetch("data/catalog.json", { cache: "no-store" });
          readable = probe.ok;
        } catch (err) {
          readable = false;
        }
      }
      if (!readable) {
        throw new Error("The design files in the data folder could not be read.");
      }
    }
    await readSetup();
    state.ready = true;
  }

  async function listHeroes() {
    if (cache.catalog === null) {
      const data = await readJson("data/catalog.json", []);
      cache.catalog = Array.isArray(data) ? data : [];
    }
    return cache.catalog.map(function (card) { return Codex.schema.clone(card); });
  }

  async function getHero(id) {
    if (!id) return null;
    try { safeId(id); } catch (err) { return null; }
    if (!cache.heroes[id]) {
      const data = await readJson(heroPath(id), null);
      if (!data) return null;
      cache.heroes[id] = data;
    }
    return Codex.schema.normalizeHero(cache.heroes[id]);
  }

  async function loadDossiers() {
    const cards = await listHeroes();
    const heroes = await Promise.all(cards.map(function (card) { return getHero(card.id); }));
    return heroes.filter(Boolean);
  }

  async function listTaxonomy() {
    if (cache.taxonomy === null) {
      const data = await readJson("data/taxonomy.json", []);
      cache.taxonomy = Array.isArray(data) ? data : [];
    }
    return cache.taxonomy.map(function (item) { return Codex.schema.clone(item); });
  }

  async function readSettings() {
    if (cache.settings === null) {
      const data = await readJson("data/settings.json", {});
      cache.settings = data && typeof data === "object" && !Array.isArray(data) ? data : {};
    }
    return cache.settings;
  }

  // Shared design setup: movement board, stat names, colour themes. Applied to the schema on read.
  async function readSetup() {
    if (cache.setup === null) {
      const data = await readJson("data/setup.json", null);
      cache.setup = Codex.schema.applySetup(data);
      cache.setupStored = !!data;
    }
    return Codex.schema.clone(cache.setup);
  }

  function hasStoredSetup() { return !!cache.setupStored; }

  async function writeSetup(raw) {
    const clean = Codex.schema.normalizeSetup(raw);
    await commit({ files: [{ path: "data/setup.json", json: clean }] });
    cache.setup = Codex.schema.applySetup(clean);
    cache.setupStored = true;
    return Codex.schema.clone(clean);
  }

  async function getMeta(key) {
    const settings = await readSettings();
    if (!Object.prototype.hasOwnProperty.call(settings, key)) return undefined;
    return { key: key, value: settings[key] };
  }

  async function setMeta(key, value) {
    const settings = Codex.schema.clone(await readSettings());
    settings[key] = value;
    await commit({ files: [{ path: "data/settings.json", json: settings }] });
    cache.settings = settings;
  }

  function imageRef(image) {
    if (!image || image.kind === "pending") return { kind: "path", value: "" };
    return { kind: image.kind || "path", value: image.value || image.src || "" };
  }

  function toCard(hero) {
    return {
      id: hero.id,
      name: hero.name || "",
      epithet: hero.epithet || "",
      productionStateId: hero.productionStateId || "",
      tierId: hero.tierId || "",
      allegianceId: hero.allegianceId || "",
      roleIds: (hero.roleIds || []).slice(),
      tagIds: (hero.tagIds || []).slice(),
      stats: (hero.stats || []).map(function (stat) {
        return { id: stat.id, value: stat.value };
      }),
      artwork: imageRef(hero.artwork),
      updatedAt: hero.updatedAt || "",
      createdAt: hero.createdAt || "",
      currentVersion: hero.currentVersion || "",
      versionTenths: hero.versionTenths || 1,
      abilities: (hero.abilities || []).map(function (ability) {
        return { id: ability.id, name: ability.name || "", tagIds: (ability.tagIds || []).slice() };
      }),
      related: Codex.schema.clone(hero.related || [])
    };
  }

  function upsertCard(catalog, hero) {
    const next = catalog.filter(function (card) { return card.id !== hero.id; });
    next.push(toCard(hero));
    next.sort(function (a, b) { return String(a.name || "").localeCompare(String(b.name || "")); });
    return next;
  }

  async function writeHero(hero) {
    const clean = Codex.schema.sanitizeForStorage(Codex.schema.normalizeHero(hero));
    safeId(clean.id);
    const catalog = upsertCard(await listHeroes(), clean);
    await commit({
      files: [
        { path: heroPath(clean.id), json: clean },
        { path: "data/catalog.json", json: catalog }
      ]
    });
    cache.heroes[clean.id] = clean;
    cache.catalog = catalog;
    return clean;
  }

  async function writeTaxonomy(items) {
    const clean = (items || []).map(function (item) { return Codex.schema.clone(item); });
    await commit({ files: [{ path: "data/taxonomy.json", json: clean }] });
    cache.taxonomy = clean;
    return clean;
  }

  async function saveTaxonomyItem(item) {
    const items = (await listTaxonomy()).filter(function (row) { return row.id !== item.id; });
    items.push(item);
    items.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    await writeTaxonomy(items);
    return item;
  }

  async function deleteTaxonomyItem(id) {
    const heroes = await listHeroes();
    const used = heroes.some(function (hero) {
      return hero.productionStateId === id
        || hero.tierId === id
        || hero.allegianceId === id
        || (hero.roleIds || []).indexOf(id) !== -1
        || (hero.tagIds || []).indexOf(id) !== -1
        || (hero.abilities || []).some(function (ability) { return (ability.tagIds || []).indexOf(id) !== -1; });
    });
    if (used) {
      const err = new Error("This definition is still assigned to one or more heroes.");
      err.code = "in-use";
      throw err;
    }
    const items = (await listTaxonomy()).filter(function (item) { return item.id !== id; });
    await writeTaxonomy(items);
  }

  async function listHistory(heroId) {
    const rows = await readJson(historyPath(heroId), []);
    return (Array.isArray(rows) ? rows : []).slice().sort(function (a, b) {
      return b.versionTenths - a.versionTenths;
    });
  }

  function getSnapshot(heroId, versionTenths) {
    return readJson(snapshotPath(heroId, versionTenths), null);
  }

  async function saveHero(proposedRaw, options) {
    options = options || {};
    if (Codex.store.failNextSave) {
      Codex.store.failNextSave = false;
      throw new Error("Save failed");
    }
    const tax = await listTaxonomy();
    const proposed = Codex.schema.sanitizeForStorage(Codex.schema.normalizeHero(proposedRaw));
    safeId(proposed.id);
    const prev = await getHero(proposed.id);
    const now = new Date().toISOString();

    if (!prev) {
      proposed.versionTenths = 1;
      proposed.currentVersion = "0.1";
      proposed.createdAt = proposed.createdAt || now;
      proposed.updatedAt = now;
      const entry = {
        heroId: proposed.id,
        versionTenths: 1,
        versionLabel: "0.1",
        timestamp: now,
        productionStateId: proposed.productionStateId,
        summary: options.restoreFrom ? "Restored from v" + options.restoreFrom : "Hero created.",
        changeGroups: [{ type: "created", title: "Hero Created", changes: [{ field: "name", prev: "", next: proposed.name }] }]
      };
      const catalog = upsertCard(await listHeroes(), proposed);
      await commit({
        files: [
          { path: heroPath(proposed.id), json: proposed },
          { path: historyPath(proposed.id), json: [entry] },
          { path: snapshotPath(proposed.id, 1), json: { heroId: proposed.id, versionTenths: 1, hero: Codex.schema.clone(proposed) } },
          { path: "data/catalog.json", json: catalog }
        ]
      });
      cache.heroes[proposed.id] = proposed;
      cache.catalog = catalog;
      return { saved: true, created: true, hero: proposed, version: "0.1", entry: entry };
    }

    const diff = Codex.diff.diffHeroes(prev, proposed, tax);
    if (!diff.hasChanges) return { saved: false, reason: "no-changes", hero: prev };

    const tenths = Codex.version.nextTenths(prev.versionTenths);
    proposed.versionTenths = tenths;
    proposed.currentVersion = Codex.version.tenthsToString(tenths);
    proposed.createdAt = prev.createdAt;
    proposed.updatedAt = now;
    let summary = diff.summary;
    if (options.restoreFrom) summary = "Restored from v" + options.restoreFrom + ". " + summary;
    const entry = {
      heroId: proposed.id,
      versionTenths: tenths,
      versionLabel: proposed.currentVersion,
      timestamp: now,
      productionStateId: proposed.productionStateId,
      summary: summary,
      summaryLines: diff.summaryLines,
      changeGroups: diff.groups
    };
    const history = await listHistory(proposed.id);
    history.unshift(entry);
    const catalog = upsertCard(await listHeroes(), proposed);
    await commit({
      files: [
        { path: heroPath(proposed.id), json: proposed },
        { path: historyPath(proposed.id), json: history },
        { path: snapshotPath(proposed.id, tenths), json: { heroId: proposed.id, versionTenths: tenths, hero: Codex.schema.clone(proposed) } },
        { path: "data/catalog.json", json: catalog }
      ]
    });
    cache.heroes[proposed.id] = proposed;
    cache.catalog = catalog;
    return { saved: true, created: false, hero: proposed, version: proposed.currentVersion, entry: entry, diff: diff };
  }

  function ownedImagePaths(hero, into) {
    if (!hero) return;
    function take(image) {
      const value = image && image.kind === "path" ? String(image.value || "") : "";
      if (value.indexOf("data/images/") === 0) into[value] = true;
    }
    take(hero.artwork);
    (hero.abilities || []).forEach(function (ability) { take(ability.image); });
  }

  async function deleteHero(id) {
    safeId(id);
    const hero = await getHero(id);
    const history = await listHistory(id);
    const snapshots = await Promise.all(history.map(function (row) { return getSnapshot(id, row.versionTenths); }));
    const images = {};
    ownedImagePaths(hero, images);
    snapshots.forEach(function (snap) { if (snap) ownedImagePaths(snap.hero, images); });
    const deletes = [heroPath(id), historyPath(id)].concat(history.map(function (row) {
      return snapshotPath(id, row.versionTenths);
    })).concat(Object.keys(images));
    const catalog = (await listHeroes()).filter(function (card) { return card.id !== id; });
    await commit({
      files: [{ path: "data/catalog.json", json: catalog }],
      delete: deletes
    });
    delete cache.heroes[id];
    cache.catalog = catalog;
  }

  async function putImage(record) {
    const path = imagePathFor(record.id, record.mime, record.filename);
    const base64 = await blobToBase64(record.blob);
    await commit({ binaries: [{ path: path, base64: base64 }] });
    return { id: record.id, path: path, mime: record.mime || "" };
  }

  function getImage() {
    return Promise.resolve(null);
  }

  function applyImageMap(hero, map) {
    if (!hero) return hero;
    const next = Codex.schema.clone(hero);
    function point(image) {
      if (image && image.kind === "blob" && map[image.value]) return { kind: "path", value: map[image.value] };
      return image;
    }
    next.artwork = point(next.artwork);
    (next.abilities || []).forEach(function (ability) { ability.image = point(ability.image); });
    return next;
  }

  async function listDataFiles() {
    const res = await fetch("/__codex/list", { cache: "no-store" });
    const body = await res.json();
    if (!res.ok || !body.ok) throw new Error(body.error || "Could not list the data folder.");
    return body.files || [];
  }

  async function exportBackup() {
    const [heroes, taxonomy, setup] = await Promise.all([loadDossiers(), listTaxonomy(), readSetup()]);
    const historyIndex = [];
    const historySnapshots = [];
    for (let i = 0; i < heroes.length; i += 1) {
      const rows = await listHistory(heroes[i].id);
      historyIndex.push.apply(historyIndex, rows);
      for (let n = 0; n < rows.length; n += 1) {
        const snap = await getSnapshot(heroes[i].id, rows[n].versionTenths);
        if (snap) historySnapshots.push(snap);
      }
    }
    const paths = {};
    heroes.forEach(function (hero) { ownedImagePaths(hero, paths); });
    historySnapshots.forEach(function (snap) { ownedImagePaths(snap.hero, paths); });
    const images = [];
    const keys = Object.keys(paths);
    for (let i = 0; i < keys.length; i += 1) {
      const path = keys[i];
      const res = await fetch(path, { cache: "no-store" });
      if (!res.ok) continue;
      const blob = await res.blob();
      const filename = path.split("/").pop();
      images.push({
        id: filename.replace(/\.[^.]+$/, ""),
        path: path,
        mime: blob.type || "application/octet-stream",
        filename: filename,
        data: await blobToBase64(blob)
      });
    }
    return {
      format: "aos-codex-backup",
      version: 1,
      storedIn: "Copy of the data folder. The live encyclopedia is the files under data/.",
      exportedAt: new Date().toISOString(),
      heroes: heroes,
      historyIndex: historyIndex,
      historySnapshots: historySnapshots,
      taxonomy: taxonomy,
      setup: setup,
      images: images
    };
  }

  async function importBackup(payload) {
    if (!payload || payload.format !== "aos-codex-backup") {
      throw new Error("This file is not an Allure of the Supernal codex backup.");
    }
    const map = {};
    const binaries = [];
    (payload.images || []).forEach(function (img) {
      const path = img.path && String(img.path).indexOf("data/images/") === 0
        ? img.path
        : imagePathFor(img.id, img.mime, img.filename);
      map[img.id] = path;
      if (img.data) binaries.push({ path: path, base64: img.data });
    });
    const heroes = (payload.heroes || []).map(function (hero) { return applyImageMap(hero, map); });
    const byHero = {};
    (payload.historyIndex || []).forEach(function (row) {
      if (!byHero[row.heroId]) byHero[row.heroId] = [];
      byHero[row.heroId].push(row);
    });
    const files = [
      { path: "data/taxonomy.json", json: payload.taxonomy || [] },
      { path: "data/setup.json", json: Codex.schema.normalizeSetup(payload.setup) },
      { path: "data/catalog.json", json: heroes.map(toCard).sort(function (a, b) { return String(a.name).localeCompare(String(b.name)); }) }
    ];
    heroes.forEach(function (hero) {
      safeId(hero.id);
      files.push({ path: heroPath(hero.id), json: hero });
      const rows = (byHero[hero.id] || []).slice().sort(function (a, b) { return b.versionTenths - a.versionTenths; });
      files.push({ path: historyPath(hero.id), json: rows });
    });
    (payload.historySnapshots || []).forEach(function (snap) {
      const hero = applyImageMap(snap.hero, map);
      files.push({
        path: snapshotPath(snap.heroId, snap.versionTenths),
        json: { heroId: snap.heroId, versionTenths: snap.versionTenths, hero: hero }
      });
    });
    const keep = { "data/settings.json": true };
    files.forEach(function (file) { keep[file.path] = true; });
    binaries.forEach(function (file) { keep[file.path] = true; });
    const existing = await listDataFiles();
    const remove = existing.filter(function (path) { return !keep[path]; });
    await commit({ files: files, binaries: binaries, delete: remove });
    clearCache();
    await setMeta("seeded", { version: 2 });
  }

  function blobToBase64(blob) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        const result = String(reader.result || "");
        resolve(result.split(",")[1] || "");
      };
      reader.onerror = function () { reject(reader.error); };
      reader.readAsDataURL(blob);
    });
  }

  function idbAll(db, name) {
    return new Promise(function (resolve, reject) {
      if (!db.objectStoreNames.contains(name)) { resolve([]); return; }
      const request = db.transaction(name, "readonly").objectStore(name).getAll();
      request.onsuccess = function () { resolve(request.result || []); };
      request.onerror = function () { reject(request.error); };
    });
  }

  function openLegacy() {
    return new Promise(function (resolve, reject) {
      const request = indexedDB.open("aos-codex", 1);
      request.onupgradeneeded = function () {
        const next = request.result;
        if (!next.objectStoreNames.contains("heroes")) next.createObjectStore("heroes", { keyPath: "id" });
        if (!next.objectStoreNames.contains("historyIndex")) next.createObjectStore("historyIndex", { keyPath: ["heroId", "versionTenths"] });
        if (!next.objectStoreNames.contains("historySnapshots")) next.createObjectStore("historySnapshots", { keyPath: ["heroId", "versionTenths"] });
        if (!next.objectStoreNames.contains("images")) next.createObjectStore("images", { keyPath: "id" });
        if (!next.objectStoreNames.contains("taxonomy")) next.createObjectStore("taxonomy", { keyPath: "id" });
        if (!next.objectStoreNames.contains("meta")) next.createObjectStore("meta", { keyPath: "key" });
      };
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error); };
    });
  }

  async function migrateFromIndexedDb() {
    if (!window.indexedDB) return;
    if (indexedDB.databases) {
      const names = (await indexedDB.databases()).map(function (item) { return item.name; });
      if (names.indexOf("aos-codex") === -1) return;
    }
    const db = await openLegacy();
    try {
      const [heroes, historyIndex, snapshots, images, taxonomy, meta] = await Promise.all([
        idbAll(db, "heroes"),
        idbAll(db, "historyIndex"),
        idbAll(db, "historySnapshots"),
        idbAll(db, "images"),
        idbAll(db, "taxonomy"),
        idbAll(db, "meta")
      ]);
      if (!heroes.length && !taxonomy.length) return;
      const map = {};
      const binaries = [];
      for (let i = 0; i < images.length; i += 1) {
        const img = images[i];
        if (!img || !img.blob) continue;
        try {
          const path = imagePathFor(img.id, img.mime, img.filename);
          map[img.id] = path;
          binaries.push({ path: path, base64: await blobToBase64(img.blob) });
        } catch (err) {
          console.error(err);
        }
      }
      const files = [];
      const diskCards = await listHeroes();
      const catalog = diskCards.map(function (card) { return Codex.schema.clone(card); });
      for (let i = 0; i < heroes.length; i += 1) {
        const raw = applyImageMap(heroes[i], map);
        let clean;
        try { clean = Codex.schema.sanitizeForStorage(Codex.schema.normalizeHero(raw)); } catch (err) { continue; }
        try { safeId(clean.id); } catch (err) { continue; }
        const onDisk = await getHero(clean.id);
        if (onDisk && String(onDisk.updatedAt || "") >= String(clean.updatedAt || "")) continue;
        files.push({ path: heroPath(clean.id), json: clean });
        const rows = historyIndex.filter(function (row) { return row.heroId === clean.id; })
          .sort(function (a, b) { return b.versionTenths - a.versionTenths; });
        files.push({ path: historyPath(clean.id), json: rows });
        snapshots.filter(function (snap) { return snap.heroId === clean.id; }).forEach(function (snap) {
          files.push({
            path: snapshotPath(clean.id, snap.versionTenths),
            json: { heroId: clean.id, versionTenths: snap.versionTenths, hero: applyImageMap(snap.hero, map) }
          });
        });
        const cardIndex = catalog.findIndex(function (card) { return card.id === clean.id; });
        const card = toCard(clean);
        if (cardIndex === -1) catalog.push(card);
        else catalog[cardIndex] = card;
      }
      catalog.sort(function (a, b) { return String(a.name || "").localeCompare(String(b.name || "")); });
      if (files.length) files.push({ path: "data/catalog.json", json: catalog });
      const diskTax = await listTaxonomy();
      if (!diskTax.length && taxonomy.length) files.push({ path: "data/taxonomy.json", json: taxonomy });
      const settings = Codex.schema.clone(await readSettings());
      let settingsChanged = false;
      meta.forEach(function (row) {
        if (!row || (row.key !== "seeded" && row.key !== "autosave")) return;
        if (settings[row.key] == null) {
          settings[row.key] = row.value;
          settingsChanged = true;
        }
      });
      if (settingsChanged) files.push({ path: "data/settings.json", json: settings });
      if (!files.length && !binaries.length) return;
      await commit({ files: files, binaries: binaries });
      clearCache();
    } finally {
      db.close();
    }
  }

  Codex.store = {
    open: open,
    canWrite: function () { return state.writable; },
    getHero: getHero,
    listHeroes: listHeroes,
    loadDossiers: loadDossiers,
    saveHero: saveHero,
    writeHero: writeHero,
    deleteHero: deleteHero,
    listTaxonomy: listTaxonomy,
    readSetup: readSetup,
    writeSetup: writeSetup,
    hasStoredSetup: hasStoredSetup,
    writeTaxonomy: writeTaxonomy,
    saveTaxonomyItem: saveTaxonomyItem,
    deleteTaxonomyItem: deleteTaxonomyItem,
    getImage: getImage,
    putImage: putImage,
    listHistory: listHistory,
    getSnapshot: getSnapshot,
    getMeta: getMeta,
    setMeta: setMeta,
    exportBackup: exportBackup,
    importBackup: importBackup,
    failNextSave: false
  };
})();
