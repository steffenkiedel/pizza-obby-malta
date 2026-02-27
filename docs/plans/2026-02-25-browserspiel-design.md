# Design-Dokument: "Pizza Obby Malta" (Browser-Version)

**Datum:** 25. Februar 2026
**Version:** 1.0 (Proof of Concept)
**Status:** Genehmigt ✅
**Basis:** Roblox-Design (`../../Roblox/docs/plans/2026-02-22-handyspiel-design.md`)

---

## 1. Spielkonzept

### Spielname
"Pizza Obby Malta" *(Browser-Version)*

### Spielbeschreibung
Ein 2D Side-Scroller Parcours-Spiel im Obby-Stil. Der Spieler läuft von links nach rechts, springt über Hindernisse, weicht Lasern und Ritter-NPCs aus — und sammelt dabei Pizzas. Das Spiel spielt über den Wolken Vallettas und ist optimiert für Touch-Steuerung auf dem Handy.

### Unterschiede zur Roblox-Version
| Merkmal | Roblox | Browser |
|---|---|---|
| Dimension | 3D | 2D Side-Scroller |
| Engine | Roblox Studio (Lua) | Phaser.js (JavaScript) |
| Steuerung | Roblox Touch-Controls | Eigene Touch-Buttons |
| Hosting | Roblox-Plattform | GitHub Pages (kostenlos) |
| Offline | Nein | Ja (nach erstem Laden) |

---

## 2. Plattform & Technologie

| Merkmal | Wahl |
|---|---|
| **Engine** | Phaser.js 3 (lokal gebündelt) |
| **Sprache** | JavaScript |
| **Zielplattform** | Handy/Tablet (iOS Safari, Chrome) |
| **Steuerung** | Touch-Buttons (Links, Rechts, Springen) |
| **Hosting** | GitHub Pages |
| **Offline** | Ja — nach erstem Laden, kein Internet nötig |
| **Kosten** | 0 € |

### Tech-Stack Details
- **Phaser.js 3** — lokal als Datei im Projekt, kein CDN
- **Arcade Physics** — Phaser's eingebaute Physik (Schwerkraft, Kollision, Velocity)
- **GitHub Pages** — automatisches Deployment per `git push`

---

## 3. Dateistruktur

```
Browserspiel/
├── index.html                  ← Startseite (öffnet das Spiel)
├── game.js                     ← Gesamter Spielcode
├── phaser.min.js               ← Phaser.js Engine (lokal, offline-fähig)
├── assets/
│   ├── referenzbilder/         ← Eigene Fotos als Vorlagen
│   │   ├── hintergrund/        ← Valletta, Meer, Wolken
│   │   ├── spieler/            ← Vorlage Spieler-Charakter
│   │   ├── ritter/             ← Vorlage Ritter-NPCs
│   │   ├── plattformen/        ← Mauerwerk, Steine, Texturen
│   │   └── sonstiges/          ← Pizza, Flaggen, Deko
│   ├── sprites/                ← Fertige Pixel Art Sprites (PNG)
│   └── sounds/                 ← Musik + Sound-Effekte
└── docs/plans/                 ← Dieses Dokument
```

---

## 4. Spielmechaniken

### Steuerung (Touch, Handy)
```
┌─────────────────────────────────┐
│                                 │
│        [Spielbereich]           │
│                                 │
│  [◀] [▶]              [JUMP]   │
└─────────────────────────────────┘
```
- **◀ / ▶** — Spieler läuft links/rechts
- **JUMP** — Spieler springt (kein Doppelsprung)
- Buttons sind dauerhaft sichtbar, groß genug für Finger

### Kern-Mechaniken
- **Laufen + Springen** — Phaser Arcade Physics
- **Schwerkraft** — Spieler fällt automatisch
- **Tod** — Spieler fällt unter den Bildschirmrand → Respawn am letzten Checkpoint
- **Checkpoints** — Maltesisches Kreuz als Flagge, leuchtet auf wenn berührt
- **Pizzas sammeln** — Berühren = +1, Pizza verschwindet, HUD aktualisiert sich
- **Kamera** — folgt dem Spieler horizontal (scrollt mit)

### Hindernistypen
| Typ | Verhalten |
|---|---|
| Plattform-Lücken | Keine Plattform — Spieler fällt durch |
| Bewegliche Blöcke | Plattform bewegt sich horizontal oder vertikal (Phaser Tweens) |
| Schmale Balken | Sehr kurze, dünne Plattform |
| Laser | Roter Balken, blinkt rhythmisch an/aus (Timer) |
| Ritter-NPC | Sprite patrouilliert hin und her, tötet bei Berührung |

---

## 5. Level-Design: Level 1 — "Über den Wolken Vallettas"

### Aufbau
```
START ──► [S1: Lücken] ──► ✅CP1 ──► [S2: Blöcke] ──► [S3: Balken]
                  ──► ✅CP2 ──► [S4: Laser+Ritter] ──► [S5: Finale] ──► 🎯
```

### Sektionen
| Sektion | Inhalt | Pizzas | Schwierigkeit |
|---|---|---|---|
| Start | Große Startplattform, Einführungstext | 0 | — |
| S1: Lücken | 8-10 Plattformen mit Lücken | 2 | Einfach |
| Checkpoint 1 | Maltesisches Kreuz, leuchtet auf | — | — |
| S2: Bewegliche Blöcke | 5-6 Plattformen bewegen sich | 3 | Mittel |
| S3: Schmale Balken | 4 sehr dünne Plattformen | 1 | Mittel |
| Checkpoint 2 | Maltesisches Kreuz, leuchtet auf | — | — |
| S4: Laser + Ritter | 3 Ritter-NPCs, Laser-Hindernisse | 2 | Schwer |
| S5: Finale | Kombination aus allem | 2 | Sehr schwer |
| Ziel | Goldene Plattform, Feuerwerk | — | — |
| **Gesamt** | | **10** | |

---

## 6. Visuelles Design

### Szenen-Struktur (Phaser Scenes)
| Szene | Inhalt |
|---|---|
| `BootScene` | Lädt alle Assets (Ladebalken) |
| `MenuScene` | Startbildschirm mit "Spielen"-Button |
| `GameScene` | Das eigentliche Spiel |
| `GameOverScene` | "Gestorben" — Retry-Button |
| `WinScene` | "Level geschafft!" — Pizza-Ergebnis |

### Hintergrund (Parallax-Scrolling)
Drei Ebenen scrollebn unterschiedlich schnell — gibt Tiefeneffekt:
1. **Himmel** — Mittelmeer-Blau (`#1E88E5`)
2. **Valletta-Silhouette** — Burgmauer im Hintergrund (aus eigenem Foto → Pixel Art)
3. **Wolken** — weiß, langsam

### Farbpalette (aus Roblox-Design übernommen)
| Farbe | Hex | Verwendung |
|---|---|---|
| Mittelmeer-Blau | `#1E88E5` | Himmel, Hintergrund |
| Wolken-Weiß | `#F5F5F5` | Startplattform |
| Malta-Ocker | `#D4A843` | Plattformen S3 |
| Terrakotta | `#C0643A` | Mauerwerk, Plattformen |
| Maltesisch Rot | `#D32F2F` | Ritter, Laser |
| Pizza-Orange | `#FF9800` | Pizza-Collectibles |
| Ziel-Gold | `#FFD700` | Ziel-Plattform, Checkpoints |

### Grafik-Workflow (eigene Fotos → Pixel Art)
1. Eigene Fotos in `assets/referenzbilder/` ablegen (nach Kategorie sortiert)
2. Fotos gemeinsam besprechen und Stil festlegen
3. KI-Tool (ChatGPT/DALL-E o.ä.) oder Piskel wandelt Fotos in Pixel Art um
4. Fertige Sprites als PNG in `assets/sprites/` speichern
5. Phaser.js lädt sie als normale Bild-Assets

---

## 7. Audio

### Hintergrundmusik
- Genre: Hip-Hop / Parkour / Lo-Fi — energetisch
- Quelle: freie Musik (z.B. OpenGameArt.org) oder selbst hochgeladen
- Format: MP3 oder OGG

### Sound-Effekte
| Event | Sound |
|---|---|
| Pizza einsammeln | Positiver kurzer Ton ("pling") |
| Checkpoint erreicht | Kurze Fanfare |
| Spieler stirbt | Kurzer Fall-Sound |
| Level abgeschlossen | Victorious Jingle |
| Laser an/aus | Sci-Fi Summton |

---

## 8. HUD (Head-Up Display)

```
┌────────────────────────────────────────┐
│ 🍕 3/10          Checkpoint 1 ✅       │
│                                        │
│         [Spielbereich]                 │
│                                        │
│  [◀] [▶]                    [JUMP]    │
└────────────────────────────────────────┘
```

- Pizza-Zähler oben links
- Aktueller Checkpoint oben rechts
- Touch-Buttons immer unten sichtbar

---

## 9. Erweiterungs-Roadmap

### Version 1.0 — Proof of Concept (aktuell)
- 1 Level, 10 Pizzas, 2 Checkpoints
- 4 Hindernistypen
- Touch-Steuerung, GitHub Pages Hosting

### Version 1.5 — Polishing
- Eigene Pixel Art Sprites (aus Fotos)
- Hintergrundmusik + Sound-Effekte
- Parallax-Hintergrund mit Valletta-Silhouette
- PWA (auf Homescreen installierbar, 100% offline)

### Version 2.0 — Mehr Inhalte
- Level 2
- Globale Bestenliste (Highscores via einfacher Backend-Dienst)
- Power-Up Items

---

## 10. Nächste Schritte

1. GitHub-Repository anlegen
2. Phaser.js lokal herunterladen
3. Grundstruktur (index.html + game.js) aufsetzen
4. Spieler-Charakter: läuft, springt, Kamera folgt
5. Level 1 Schritt für Schritt aufbauen

Fortschritt wird in `../../PROGRESS.md` (Browserspiel) verfolgt.
