window.CodexFiles = {
  "data/catalog.json": [
    {
      "id": "sample-hero-01",
      "name": "Sample Hero",
      "epithet": "Design Exemplar",
      "productionStateId": "state-draft",
      "tierId": "tier-3",
      "roleIds": [
        "role-vanguard",
        "role-controller"
      ],
      "tagIds": [],
      "stats": [
        {
          "id": "HP",
          "value": "120"
        },
        {
          "id": "HPR",
          "value": "4"
        },
        {
          "id": "AD",
          "value": "18"
        },
        {
          "id": "ATR",
          "value": "2"
        },
        {
          "id": "ARM",
          "value": "12"
        },
        {
          "id": "CRIT",
          "value": "8%"
        }
      ],
      "artwork": {
        "kind": "path",
        "value": "images/heroes/sample-hero-01.jpg"
      },
      "updatedAt": "2026-10-22T14:24:25.058Z",
      "createdAt": "2026-10-22T14:24:25.046Z",
      "currentVersion": "0.1",
      "versionTenths": 1,
      "abilities": [
        {
          "id": "a1",
          "name": "Unwritten Mark",
          "tagIds": [
            "tag-damage"
          ]
        },
        {
          "id": "a2",
          "name": "Gilded Arc",
          "tagIds": [
            "tag-damage",
            "tag-control"
          ]
        },
        {
          "id": "a3",
          "name": "Step Between",
          "tagIds": [
            "tag-movement"
          ]
        },
        {
          "id": "a4",
          "name": "Binding Halo",
          "tagIds": [
            "tag-control"
          ]
        }
      ],
      "related": [
        {
          "id": "link-mvjmtvbq7uitgw",
          "targetType": "external",
          "targetId": "",
          "name": "Sample Rival",
          "note": "Linked entity. No page yet — held until this layout is approved.",
          "type": "Hero"
        },
        {
          "id": "link-mvjmtvbqmjha7q",
          "targetType": "external",
          "targetId": "",
          "name": "Ember Phylactery",
          "note": "Sample item referenced by the ultimate. Not a real item.",
          "type": "Item"
        },
        {
          "id": "link-mvjmtvbqwbvxbh",
          "targetType": "external",
          "targetId": "",
          "name": "Choir Steps",
          "note": "Sample battlefield name used only to show a cross-link.",
          "type": "Map"
        }
      ],
      "allegianceId": ""
    }
  ],
  "data/heroes/sample-hero-01.json": {
    "id": "sample-hero-01",
    "name": "Sample Hero",
    "epithet": "Design Exemplar",
    "code": "SH-01",
    "summary": "Sample layout text. This page shows how a hero dossier should feel: cinematic art, a readable stat sheet, and ability cards large enough to scan at a distance. None of the numbers or names below are game design.",
    "phase": "Pre-production sample",
    "contentStatus": "sample",
    "productionStateId": "state-draft",
    "tierId": "tier-3",
    "roleIds": [
      "role-vanguard",
      "role-controller"
    ],
    "tagIds": [],
    "artwork": {
      "kind": "path",
      "value": "images/heroes/sample-hero-01.jpg"
    },
    "stats": [
      {
        "id": "HP",
        "value": "120"
      },
      {
        "id": "HPR",
        "value": "4"
      },
      {
        "id": "AD",
        "value": "18"
      },
      {
        "id": "ATR",
        "value": "2"
      },
      {
        "id": "ARM",
        "value": "12"
      },
      {
        "id": "CRIT",
        "value": "8%"
      }
    ],
    "movement": {
      "squares": [
        {
          "row": 0,
          "col": 0
        },
        {
          "row": 0,
          "col": 3
        },
        {
          "row": 0,
          "col": 6
        },
        {
          "row": 1,
          "col": 1
        },
        {
          "row": 1,
          "col": 3
        },
        {
          "row": 1,
          "col": 5
        },
        {
          "row": 2,
          "col": 2
        },
        {
          "row": 2,
          "col": 3
        },
        {
          "row": 2,
          "col": 4
        },
        {
          "row": 3,
          "col": 0
        },
        {
          "row": 3,
          "col": 1
        },
        {
          "row": 3,
          "col": 2
        },
        {
          "row": 3,
          "col": 4
        },
        {
          "row": 3,
          "col": 5
        },
        {
          "row": 3,
          "col": 6
        },
        {
          "row": 4,
          "col": 2
        },
        {
          "row": 4,
          "col": 3
        },
        {
          "row": 4,
          "col": 4
        },
        {
          "row": 5,
          "col": 1
        },
        {
          "row": 5,
          "col": 3
        },
        {
          "row": 5,
          "col": 5
        },
        {
          "row": 6,
          "col": 0
        },
        {
          "row": 6,
          "col": 3
        },
        {
          "row": 6,
          "col": 6
        }
      ],
      "intermediateMustBeEmpty": true,
      "directions": [
        "orthogonal",
        "diagonal"
      ],
      "conditions": []
    },
    "abilities": [
      {
        "id": "a1",
        "slot": "1",
        "name": "Unwritten Mark",
        "kind": "passive",
        "tagIds": [
          "tag-damage"
        ],
        "image": {
          "kind": "svg",
          "value": "\u003csvg viewBox=\"0 0 64 64\" fill=\"none\" aria-hidden=\"true\">\u003ccircle cx=\"32\" cy=\"32\" r=\"18\" stroke=\"#f0c67a\" stroke-width=\"2.4\"/>\u003ccircle cx=\"32\" cy=\"32\" r=\"6\" fill=\"#ff7340\"/>\u003cpath d=\"M32 8v8M32 48v8M8 32h8M48 32h8\" stroke=\"#f6f0e6\" stroke-width=\"2\" stroke-linecap=\"round\"/>\u003c/svg>"
        },
        "cooldown": "—",
        "cost": "None",
        "range": "—",
        "summary": "Sample. Damaging a hostile unit places a Mark for 4 seconds. Marked units take increased damage from this hero’s abilities.",
        "lore": "",
        "effects": [
          "Mark lasts 4 seconds (sample).",
          "Marked units take +8% damage from this hero (sample).",
          "No ranks. This passive is always on in the sample.",
          "Ability 4 consumes Mark to add a stun.",
          "Sample item Ember Phylactery does not affect this passive."
        ],
        "upgrades": [],
        "interactions": [],
        "damage": "",
        "healing": "",
        "scaling": "",
        "duration": "",
        "charges": "",
        "aoe": "",
        "statusEffects": [],
        "variants": [],
        "linkedEntryIds": []
      },
      {
        "id": "a2",
        "slot": "2",
        "name": "Gilded Arc",
        "kind": "active",
        "tagIds": [
          "tag-damage",
          "tag-control"
        ],
        "image": {
          "kind": "svg",
          "value": "\u003csvg viewBox=\"0 0 64 64\" fill=\"none\" aria-hidden=\"true\">\u003cpath d=\"M14 46c10-22 26-28 40-24\" stroke=\"#f0c67a\" stroke-width=\"3\" stroke-linecap=\"round\"/>\u003cpath d=\"M18 28l-8 6 8 2z\" fill=\"#ff7340\"/>\u003cpath d=\"M46 18l8-2-2 8z\" fill=\"#f6f0e6\"/>\u003c/svg>"
        },
        "cooldown": "9s",
        "cost": "40 Focus",
        "range": "3 tiles",
        "summary": "Sample. A sweeping arc in front of the hero. Units hit are slowed briefly.",
        "lore": "",
        "effects": [
          "Damage: 80 / 120 / 160 / 200 (sample).",
          "Slow: 20% for 1.5 seconds (sample).",
          "Later ranks shorten the cooldown (sample).",
          "Applies Unwritten Mark.",
          "Does not break the sample root from Binding Halo."
        ],
        "upgrades": [],
        "interactions": [],
        "damage": "",
        "healing": "",
        "scaling": "",
        "duration": "",
        "charges": "",
        "aoe": "",
        "statusEffects": [],
        "variants": [],
        "linkedEntryIds": []
      },
      {
        "id": "a3",
        "slot": "3",
        "name": "Step Between",
        "kind": "active",
        "tagIds": [
          "tag-movement"
        ],
        "image": {
          "kind": "svg",
          "value": "\u003csvg viewBox=\"0 0 64 64\" fill=\"none\" aria-hidden=\"true\">\u003cpath d=\"M18 22l14-8 14 8\" stroke=\"#f0c67a\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\u003cpath d=\"M18 38l14-8 14 8\" stroke=\"#ff7340\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\u003cpath d=\"M18 52l14-8 14 8\" stroke=\"#f6f0e6\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\u003c/svg>"
        },
        "cooldown": "14s",
        "cost": "30 Focus",
        "range": "2 tiles",
        "summary": "Sample. The hero shifts a short distance and leaves an afterimage that draws attention for a moment.",
        "lore": "",
        "effects": [
          "Dash up to 2 tiles (sample).",
          "Afterimage taunts for 2 seconds (sample).",
          "A later rank lets the dash cross one blocking edge (sample).",
          "Can be cast during the sample slow from Gilded Arc."
        ],
        "upgrades": [],
        "interactions": [],
        "damage": "",
        "healing": "",
        "scaling": "",
        "duration": "",
        "charges": "",
        "aoe": "",
        "statusEffects": [],
        "variants": [],
        "linkedEntryIds": []
      },
      {
        "id": "a4",
        "slot": "4",
        "name": "Binding Halo",
        "kind": "active",
        "tagIds": [
          "tag-control"
        ],
        "image": {
          "kind": "svg",
          "value": "\u003csvg viewBox=\"0 0 64 64\" fill=\"none\" aria-hidden=\"true\">\u003ccircle cx=\"32\" cy=\"32\" r=\"16\" stroke=\"#f0c67a\" stroke-width=\"2.4\"/>\u003ccircle cx=\"32\" cy=\"32\" r=\"7\" stroke=\"#ff7340\" stroke-width=\"2.4\"/>\u003ccircle cx=\"32\" cy=\"32\" r=\"2.2\" fill=\"#f6f0e6\"/>\u003c/svg>"
        },
        "cooldown": "12s",
        "cost": "50 Focus",
        "range": "Self",
        "summary": "Sample. A ring expands around the hero. Hostile units that remain inside are rooted.",
        "lore": "",
        "effects": [
          "Ring radius: 2 tiles (sample).",
          "Root: 1.25 seconds after standing in the ring for 1 second (sample).",
          "A later rank increases the radius (sample).",
          "Marked units inside the ring take the bonus from Unwritten Mark."
        ],
        "upgrades": [],
        "interactions": [],
        "damage": "",
        "healing": "",
        "scaling": "",
        "duration": "",
        "charges": "",
        "aoe": "",
        "statusEffects": [],
        "variants": [],
        "linkedEntryIds": []
      }
    ],
    "lore": [
      "Sample. This paragraph exists so the lore column can be judged for measure, contrast, and pace. It is not backstory for Allure of the Supernal.",
      "Sample. A second paragraph shows how longer reading text sits beside the draft history. Replace both blocks with real writing after this layout is approved."
    ],
    "related": [
      {
        "id": "link-mvjmtvbq7uitgw",
        "targetType": "external",
        "targetId": "",
        "name": "Sample Rival",
        "note": "Linked entity. No page yet — held until this layout is approved.",
        "type": "Hero"
      },
      {
        "id": "link-mvjmtvbqmjha7q",
        "targetType": "external",
        "targetId": "",
        "name": "Ember Phylactery",
        "note": "Sample item referenced by the ultimate. Not a real item.",
        "type": "Item"
      },
      {
        "id": "link-mvjmtvbqwbvxbh",
        "targetType": "external",
        "targetId": "",
        "name": "Choir Steps",
        "note": "Sample battlefield name used only to show a cross-link.",
        "type": "Map"
      }
    ],
    "versionTenths": 1,
    "currentVersion": "0.1",
    "createdAt": "2026-10-22T14:24:25.046Z",
    "updatedAt": "2026-10-22T14:24:25.058Z",
    "allegianceId": ""
  },
  "data/history/sample-hero-01.json": [
    {
      "heroId": "sample-hero-01",
      "versionTenths": 1,
      "versionLabel": "0.1",
      "timestamp": "2026-10-22T14:24:25.058Z",
      "productionStateId": "state-draft",
      "summary": "Hero created.",
      "changeGroups": [
        {
          "type": "created",
          "title": "Hero Created",
          "changes": [
            {
              "field": "name",
              "prev": "",
              "next": "Sample Hero"
            }
          ]
        }
      ]
    }
  ],
  "data/history/sample-hero-01/1.json": {
    "heroId": "sample-hero-01",
    "versionTenths": 1,
    "hero": {
      "id": "sample-hero-01",
      "name": "Sample Hero",
      "epithet": "Design Exemplar",
      "code": "SH-01",
      "summary": "Sample layout text. This page shows how a hero dossier should feel: cinematic art, a readable stat sheet, and ability cards large enough to scan at a distance. None of the numbers or names below are game design.",
      "phase": "Pre-production sample",
      "contentStatus": "sample",
      "productionStateId": "state-draft",
      "tierId": "tier-3",
      "roleIds": [
        "role-vanguard",
        "role-controller"
      ],
      "tagIds": [],
      "artwork": {
        "kind": "path",
        "value": "images/heroes/sample-hero-01.jpg"
      },
      "stats": [
        {
          "id": "HP",
          "value": "120"
        },
        {
          "id": "HPR",
          "value": "4"
        },
        {
          "id": "AD",
          "value": "18"
        },
        {
          "id": "ATR",
          "value": "2"
        },
        {
          "id": "ARM",
          "value": "12"
        },
        {
          "id": "CRIT",
          "value": "8%"
        }
      ],
      "movement": {
        "squares": [
          {
            "row": 0,
            "col": 0
          },
          {
            "row": 0,
            "col": 3
          },
          {
            "row": 0,
            "col": 6
          },
          {
            "row": 1,
            "col": 1
          },
          {
            "row": 1,
            "col": 3
          },
          {
            "row": 1,
            "col": 5
          },
          {
            "row": 2,
            "col": 2
          },
          {
            "row": 2,
            "col": 3
          },
          {
            "row": 2,
            "col": 4
          },
          {
            "row": 3,
            "col": 0
          },
          {
            "row": 3,
            "col": 1
          },
          {
            "row": 3,
            "col": 2
          },
          {
            "row": 3,
            "col": 4
          },
          {
            "row": 3,
            "col": 5
          },
          {
            "row": 3,
            "col": 6
          },
          {
            "row": 4,
            "col": 2
          },
          {
            "row": 4,
            "col": 3
          },
          {
            "row": 4,
            "col": 4
          },
          {
            "row": 5,
            "col": 1
          },
          {
            "row": 5,
            "col": 3
          },
          {
            "row": 5,
            "col": 5
          },
          {
            "row": 6,
            "col": 0
          },
          {
            "row": 6,
            "col": 3
          },
          {
            "row": 6,
            "col": 6
          }
        ],
        "intermediateMustBeEmpty": true,
        "directions": [
          "orthogonal",
          "diagonal"
        ],
        "conditions": []
      },
      "abilities": [
        {
          "id": "a1",
          "slot": "1",
          "name": "Unwritten Mark",
          "kind": "passive",
          "tagIds": [
            "tag-damage"
          ],
          "image": {
            "kind": "svg",
            "value": "\u003csvg viewBox=\"0 0 64 64\" fill=\"none\" aria-hidden=\"true\">\u003ccircle cx=\"32\" cy=\"32\" r=\"18\" stroke=\"#f0c67a\" stroke-width=\"2.4\"/>\u003ccircle cx=\"32\" cy=\"32\" r=\"6\" fill=\"#ff7340\"/>\u003cpath d=\"M32 8v8M32 48v8M8 32h8M48 32h8\" stroke=\"#f6f0e6\" stroke-width=\"2\" stroke-linecap=\"round\"/>\u003c/svg>"
          },
          "cooldown": "—",
          "cost": "None",
          "range": "—",
          "summary": "Sample. Damaging a hostile unit places a Mark for 4 seconds. Marked units take increased damage from this hero’s abilities.",
          "lore": "",
          "effects": [
            "Mark lasts 4 seconds (sample).",
            "Marked units take +8% damage from this hero (sample).",
            "No ranks. This passive is always on in the sample.",
            "Ability 4 consumes Mark to add a stun.",
            "Sample item Ember Phylactery does not affect this passive."
          ],
          "upgrades": [],
          "interactions": [],
          "damage": "",
          "healing": "",
          "scaling": "",
          "duration": "",
          "charges": "",
          "aoe": "",
          "statusEffects": [],
          "variants": [],
          "linkedEntryIds": []
        },
        {
          "id": "a2",
          "slot": "2",
          "name": "Gilded Arc",
          "kind": "active",
          "tagIds": [
            "tag-damage",
            "tag-control"
          ],
          "image": {
            "kind": "svg",
            "value": "\u003csvg viewBox=\"0 0 64 64\" fill=\"none\" aria-hidden=\"true\">\u003cpath d=\"M14 46c10-22 26-28 40-24\" stroke=\"#f0c67a\" stroke-width=\"3\" stroke-linecap=\"round\"/>\u003cpath d=\"M18 28l-8 6 8 2z\" fill=\"#ff7340\"/>\u003cpath d=\"M46 18l8-2-2 8z\" fill=\"#f6f0e6\"/>\u003c/svg>"
          },
          "cooldown": "9s",
          "cost": "40 Focus",
          "range": "3 tiles",
          "summary": "Sample. A sweeping arc in front of the hero. Units hit are slowed briefly.",
          "lore": "",
          "effects": [
            "Damage: 80 / 120 / 160 / 200 (sample).",
            "Slow: 20% for 1.5 seconds (sample).",
            "Later ranks shorten the cooldown (sample).",
            "Applies Unwritten Mark.",
            "Does not break the sample root from Binding Halo."
          ],
          "upgrades": [],
          "interactions": [],
          "damage": "",
          "healing": "",
          "scaling": "",
          "duration": "",
          "charges": "",
          "aoe": "",
          "statusEffects": [],
          "variants": [],
          "linkedEntryIds": []
        },
        {
          "id": "a3",
          "slot": "3",
          "name": "Step Between",
          "kind": "active",
          "tagIds": [
            "tag-movement"
          ],
          "image": {
            "kind": "svg",
            "value": "\u003csvg viewBox=\"0 0 64 64\" fill=\"none\" aria-hidden=\"true\">\u003cpath d=\"M18 22l14-8 14 8\" stroke=\"#f0c67a\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\u003cpath d=\"M18 38l14-8 14 8\" stroke=\"#ff7340\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\u003cpath d=\"M18 52l14-8 14 8\" stroke=\"#f6f0e6\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\u003c/svg>"
          },
          "cooldown": "14s",
          "cost": "30 Focus",
          "range": "2 tiles",
          "summary": "Sample. The hero shifts a short distance and leaves an afterimage that draws attention for a moment.",
          "lore": "",
          "effects": [
            "Dash up to 2 tiles (sample).",
            "Afterimage taunts for 2 seconds (sample).",
            "A later rank lets the dash cross one blocking edge (sample).",
            "Can be cast during the sample slow from Gilded Arc."
          ],
          "upgrades": [],
          "interactions": [],
          "damage": "",
          "healing": "",
          "scaling": "",
          "duration": "",
          "charges": "",
          "aoe": "",
          "statusEffects": [],
          "variants": [],
          "linkedEntryIds": []
        },
        {
          "id": "a4",
          "slot": "4",
          "name": "Binding Halo",
          "kind": "active",
          "tagIds": [
            "tag-control"
          ],
          "image": {
            "kind": "svg",
            "value": "\u003csvg viewBox=\"0 0 64 64\" fill=\"none\" aria-hidden=\"true\">\u003ccircle cx=\"32\" cy=\"32\" r=\"16\" stroke=\"#f0c67a\" stroke-width=\"2.4\"/>\u003ccircle cx=\"32\" cy=\"32\" r=\"7\" stroke=\"#ff7340\" stroke-width=\"2.4\"/>\u003ccircle cx=\"32\" cy=\"32\" r=\"2.2\" fill=\"#f6f0e6\"/>\u003c/svg>"
          },
          "cooldown": "12s",
          "cost": "50 Focus",
          "range": "Self",
          "summary": "Sample. A ring expands around the hero. Hostile units that remain inside are rooted.",
          "lore": "",
          "effects": [
            "Ring radius: 2 tiles (sample).",
            "Root: 1.25 seconds after standing in the ring for 1 second (sample).",
            "A later rank increases the radius (sample).",
            "Marked units inside the ring take the bonus from Unwritten Mark."
          ],
          "upgrades": [],
          "interactions": [],
          "damage": "",
          "healing": "",
          "scaling": "",
          "duration": "",
          "charges": "",
          "aoe": "",
          "statusEffects": [],
          "variants": [],
          "linkedEntryIds": []
        }
      ],
      "lore": [
        "Sample. This paragraph exists so the lore column can be judged for measure, contrast, and pace. It is not backstory for Allure of the Supernal.",
        "Sample. A second paragraph shows how longer reading text sits beside the draft history. Replace both blocks with real writing after this layout is approved."
      ],
      "related": [
        {
          "id": "link-mvjmtvbq7uitgw",
          "targetType": "external",
          "targetId": "",
          "name": "Sample Rival",
          "note": "Linked entity. No page yet — held until this layout is approved.",
          "type": "Hero"
        },
        {
          "id": "link-mvjmtvbqmjha7q",
          "targetType": "external",
          "targetId": "",
          "name": "Ember Phylactery",
          "note": "Sample item referenced by the ultimate. Not a real item.",
          "type": "Item"
        },
        {
          "id": "link-mvjmtvbqwbvxbh",
          "targetType": "external",
          "targetId": "",
          "name": "Choir Steps",
          "note": "Sample battlefield name used only to show a cross-link.",
          "type": "Map"
        }
      ],
      "versionTenths": 1,
      "currentVersion": "0.1",
      "createdAt": "2026-10-22T14:24:25.046Z",
      "updatedAt": "2026-10-22T14:24:25.058Z",
      "allegianceId": ""
    }
  },
  "data/settings.json": {
    "seeded": {
      "version": 2
    }
  },
  "data/setup.json": {
    "board": {
      "label": "Movement",
      "note": "Squares marked + can be reached in one turn.",
      "size": 7,
      "origin": {
        "row": 3,
        "col": 3
      }
    },
    "stats": [
      {
        "id": "HP",
        "name": "Health",
        "description": "Hit points.",
        "defaultValue": "0"
      },
      {
        "id": "HPR",
        "name": "Regen",
        "description": "Health recovered each turn.",
        "defaultValue": "0"
      },
      {
        "id": "AD",
        "name": "Attack",
        "description": "Base attack damage.",
        "defaultValue": "0"
      },
      {
        "id": "ATR",
        "name": "Range",
        "description": "Attack reach in tiles.",
        "defaultValue": "0"
      },
      {
        "id": "ARM",
        "name": "Armor",
        "description": "Incoming damage reduction.",
        "defaultValue": "0"
      },
      {
        "id": "CRIT",
        "name": "Crit",
        "description": "Chance to deal a critical hit.",
        "defaultValue": "0%"
      }
    ],
    "themes": [
      {
        "id": "theme-default",
        "name": "Default",
        "accent": "#f0c67a",
        "accent2": "#ff7340",
        "match": {}
      }
    ]
  },
  "data/taxonomy.json": [
    {
      "id": "role-vanguard",
      "type": "role",
      "name": "Vanguard",
      "order": 1
    },
    {
      "id": "role-controller",
      "type": "role",
      "name": "Controller",
      "order": 2
    },
    {
      "id": "tag-damage",
      "type": "tag",
      "name": "Damage",
      "color": "damage",
      "order": 1
    },
    {
      "id": "tag-movement",
      "type": "tag",
      "name": "Movement",
      "color": "movement",
      "order": 2
    },
    {
      "id": "tag-control",
      "type": "tag",
      "name": "Control",
      "color": "control",
      "order": 3
    },
    {
      "id": "tier-1",
      "type": "tier",
      "name": "I",
      "value": 1,
      "order": 1
    },
    {
      "id": "tier-2",
      "type": "tier",
      "name": "II",
      "value": 2,
      "order": 2
    },
    {
      "id": "tier-3",
      "type": "tier",
      "name": "III",
      "value": 3,
      "order": 3
    },
    {
      "id": "tier-4",
      "type": "tier",
      "name": "IV",
      "value": 4,
      "order": 4
    },
    {
      "id": "tier-5",
      "type": "tier",
      "name": "V",
      "value": 5,
      "order": 5
    },
    {
      "id": "state-draft",
      "type": "productionState",
      "name": "Draft",
      "order": 1
    },
    {
      "id": "state-pre-production-sample",
      "type": "productionState",
      "name": "Pre-production sample",
      "order": 2
    },
    {
      "id": "state-concept",
      "type": "productionState",
      "name": "Concept",
      "order": 3
    },
    {
      "id": "state-design",
      "type": "productionState",
      "name": "Design",
      "order": 4
    },
    {
      "id": "state-prototype",
      "type": "productionState",
      "name": "Prototype",
      "order": 5
    },
    {
      "id": "state-in-development",
      "type": "productionState",
      "name": "In development",
      "order": 6
    },
    {
      "id": "state-playtesting",
      "type": "productionState",
      "name": "Playtesting",
      "order": 7
    },
    {
      "id": "state-approved",
      "type": "productionState",
      "name": "Approved",
      "order": 8
    },
    {
      "id": "state-deprecated",
      "type": "productionState",
      "name": "Deprecated",
      "order": 9
    }
  ]
};
