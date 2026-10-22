/* Sample dossier only. None of this is canonical Allure of the Supernal design. */
window.SAMPLE_HERO = {
  game: "Allure of the Supernal",
  studio: "Pine Fig",
  contentStatus: "sample",
  hero: {
    id: "sample-hero-01",
    name: "Sample Hero",
    epithet: "Design Exemplar",
    code: "SH-01",
    status: "Draft",
    phase: "Pre-production sample",
    roles: ["Vanguard", "Controller"],
    tier: 3,
    summary: "Sample layout text. This page shows how a hero dossier should feel: cinematic art, a readable stat sheet, and ability cards large enough to scan at a distance. None of the numbers or names below are game design.",
    /* Put each hero portrait in images/heroes/, named after hero.id. */
    artwork: {
      src: "images/heroes/sample-hero-01.jpg"
    },
    theme: {
      accent: "#f0c67a",
      accent2: "#ff7340",
      glow: "rgba(240, 198, 122, 0.45)"
    },
    stats: [
      [
        { code: "HP", name: "Health", value: "120" },
        { code: "HPR", name: "Regen", value: "4" }
      ],
      [
        { code: "AD", name: "Attack", value: "18" },
        { code: "ATR", name: "Range", value: "2" }
      ],
      [
        { code: "ARM", name: "Armor", value: "12" },
        { code: "CRIT", name: "Crit", value: "8%" }
      ]
    ],
    movement: {
      label: "Movement",
      note: "Squares marked + can be reached in one turn.",
      size: 7
    },
    lore: [
      "Sample. This paragraph exists so the lore column can be judged for measure, contrast, and pace. It is not backstory for Allure of the Supernal.",
      "Sample. A second paragraph shows how longer reading text sits beside the draft history. Replace both blocks with real writing after this layout is approved."
    ],
    history: [
      { version: "0.3", note: "Sample edit. Ability costs on this page were changed to test the history list." },
      { version: "0.2", note: "Sample edit. Lore column added." },
      { version: "0.1", note: "Sample edit. Dossier opened for visual review." }
    ],
    related: [
      { type: "Hero", name: "Sample Rival", note: "Linked entity. No page yet — held until this layout is approved." },
      { type: "Item", name: "Ember Phylactery", note: "Sample item referenced by the ultimate. Not a real item." },
      { type: "Map", name: "Choir Steps", note: "Sample battlefield name used only to show a cross-link." }
    ]
  },
  abilities: [
    {
      id: "a1",
      slot: "1",
      kind: "passive",
      tags: ["damage"],
      name: "Unwritten Mark",
      cooldown: "—",
      cost: "None",
      range: "—",
      summary: "Sample. Damaging a hostile unit places a Mark for 4 seconds. Marked units take increased damage from this hero’s abilities.",
      effects: ["Mark lasts 4 seconds (sample).", "Marked units take +8% damage from this hero (sample)."],
      upgrades: ["No ranks. This passive is always on in the sample."],
      interactions: ["Ability 4 consumes Mark to add a stun.", "Sample item Ember Phylactery does not affect this passive."]
    },
    {
      id: "a2",
      slot: "2",
      kind: "active",
      tags: ["damage", "control"],
      name: "Gilded Arc",
      cooldown: "9s",
      cost: "40 Focus",
      range: "3 tiles",
      summary: "Sample. A sweeping arc in front of the hero. Units hit are slowed briefly.",
      effects: ["Damage: 80 / 120 / 160 / 200 (sample).", "Slow: 20% for 1.5 seconds (sample)."],
      upgrades: ["Later ranks shorten the cooldown (sample)."],
      interactions: ["Applies Unwritten Mark.", "Does not break the sample root from Binding Halo."]
    },
    {
      id: "a3",
      slot: "3",
      kind: "active",
      tags: ["movement"],
      name: "Step Between",
      cooldown: "14s",
      cost: "30 Focus",
      range: "2 tiles",
      summary: "Sample. The hero shifts a short distance and leaves an afterimage that draws attention for a moment.",
      effects: ["Dash up to 2 tiles (sample).", "Afterimage taunts for 2 seconds (sample)."],
      upgrades: ["A later rank lets the dash cross one blocking edge (sample)."],
      interactions: ["Can be cast during the sample slow from Gilded Arc."]
    },
    {
      id: "a4",
      slot: "4",
      kind: "active",
      tags: ["control"],
      name: "Binding Halo",
      cooldown: "12s",
      cost: "50 Focus",
      range: "Self",
      summary: "Sample. A ring expands around the hero. Hostile units that remain inside are rooted.",
      effects: ["Ring radius: 2 tiles (sample).", "Root: 1.25 seconds after standing in the ring for 1 second (sample)."],
      upgrades: ["A later rank increases the radius (sample)."],
      interactions: ["Marked units inside the ring take the bonus from Unwritten Mark."]
    }
  ]
};
