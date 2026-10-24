(function () {
  const Codex = window.Codex = window.Codex || {};

  function roleId(name) {
    return "role-" + Codex.schema.slugify(name);
  }

  const SEED_VERSION = 2;

  async function run() {
    if (!Codex.store.canWrite()) return;
    const seeded = await Codex.store.getMeta("seeded");
    const tax = await Codex.store.listTaxonomy();
    if (!tax.length) await Codex.store.writeTaxonomy(Codex.schema.DEFAULT_TAXONOMY);
    const seedVer = seeded && seeded.value && (typeof seeded.value === "object" ? seeded.value.version : (seeded.value === true ? 1 : seeded.value));
    if (seedVer >= SEED_VERSION) return;
    const existingSample = await Codex.store.getHero("sample-hero-01");
    if (existingSample) {
      let touched = false;
      (existingSample.abilities || []).forEach(function (ability) {
        if ((ability.upgrades && ability.upgrades.length) || (ability.interactions && ability.interactions.length)) {
          ability.effects = (ability.effects || [])
            .concat(ability.upgrades || [])
            .concat(ability.interactions || []);
          ability.upgrades = [];
          ability.interactions = [];
          touched = true;
        }
      });
      if (existingSample.movement && existingSample.movement.size !== 7) {
        existingSample.movement.size = 7;
        touched = true;
      }
      if (touched) {
        existingSample.updatedAt = new Date().toISOString();
        await Codex.store.writeHero(existingSample);
      }
      await Codex.store.setMeta("seeded", { version: SEED_VERSION });
      return;
    }

    const sample = window.SAMPLE_HERO;
    if (!sample || !sample.hero) {
      await Codex.store.setMeta("seeded", true);
      return;
    }

    const src = sample.hero;
    const pattern = Codex.schema.queenPattern((src.movement && src.movement.size) || 7);
    const flatStats = {};
    (src.stats || []).forEach(function (row) {
      (Array.isArray(row) ? row : [row]).forEach(function (stat) {
        flatStats[stat.code] = stat.value;
      });
    });

    const hero = Codex.schema.normalizeHero({
      id: src.id,
      name: src.name,
      epithet: src.epithet,
      code: src.code,
      summary: src.summary,
      phase: src.phase,
      contentStatus: sample.contentStatus || "sample",
      productionStateId: "state-draft",
      tierId: "tier-" + (src.tier || 3),
      roleIds: (src.roles || []).map(roleId),
      tagIds: [],
      artwork: { kind: "path", value: src.artwork && src.artwork.src },
      theme: src.theme,
      stats: Codex.schema.defaultStats(flatStats),
      movement: Object.assign(Codex.schema.defaultMovement(src.movement.size), {
        label: src.movement.label,
        note: src.movement.note,
        size: src.movement.size,
        origin: pattern.origin,
        squares: pattern.squares
      }),
      abilities: (sample.abilities || []).map(function (ability, index) {
        return Codex.schema.normalizeAbility({
          id: ability.id,
          slot: ability.slot,
          kind: ability.kind,
          tags: ability.tags,
          name: ability.name,
          cooldown: ability.cooldown,
          cost: ability.cost,
          range: ability.range,
          summary: ability.summary,
          effects: (ability.effects || [])
            .concat(ability.upgrades || [])
            .concat(ability.interactions || []),
          image: { kind: "svg", value: Codex.schema.ABILITY_ICONS[ability.id] || Codex.schema.ABILITY_ICONS.default }
        }, index);
      }),
      lore: src.lore,
      related: (src.related || []).map(function (item) {
        return {
          targetType: "external",
          name: item.name,
          note: item.note,
          type: item.type
        };
      })
    });

    const existing = await Codex.store.getHero(hero.id);
    if (!existing) await Codex.store.saveHero(hero);
    await Codex.store.setMeta("seeded", { version: SEED_VERSION });
  }

  Codex.seed = { run: run };
})();
