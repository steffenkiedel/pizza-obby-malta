# PROGRESS — Pizza Obby Malta (Browser)

**Projekt-Start:** 25. Februar 2026
**Aktueller Status:** 🟡 Brainstorming läuft

---

## Phase 0: Planung ✅ Abgeschlossen

- [x] Spielkonzept entschieden (2D Side-Scroller, Touch-Steuerung, Einzelspieler)
- [x] Tech-Stack gewählt: Phaser.js + GitHub Pages
- [x] Brainstorming abgeschlossen
- [x] Design-Dokument geschrieben (`docs/plans/2026-02-25-browserspiel-design.md`)
- [x] Implementierungsplan erstellt (`docs/plans/2026-02-25-implementation-plan.md`)

---

## Phase 1: Setup ✅ Abgeschlossen (25.02.2026)

**Aufgaben:**
- [x] Phaser.js 3.60.0 lokal heruntergeladen (`phaser.min.js`, 1.1 MB)
- [x] `index.html` erstellt
- [x] `game.js` erstellt (alle 5 Szenen: Boot, Menu, Game, GameOver, Win)
- [x] Git-Repository initialisiert (erster Commit: `88dc300`)
- [x] VS Code geöffnet
- [ ] GitHub-Repository auf GitHub.com erstellt
- [ ] GitHub Pages Deployment eingerichtet
- [ ] Link auf Handy getestet

---

## Phase 2: Core Gameplay ✅ Bereits in Phase 1 implementiert!

**Aufgaben:**
- [x] Spieler-Charakter läuft und springt
- [x] Schwerkraft und Kollision funktioniert (Arcade Physics)
- [x] Touch-Steuerung (◀ ▶ JUMP-Buttons) implementiert
- [x] Kamera folgt dem Spieler (Parallax-Hintergrund)

---

## Phase 3: Level 1 bauen ✅ Bereits in Phase 1 implementiert!

**Aufgaben:**
- [x] Plattform-Lücken (Sektion 1) — 8 Plattformen
- [x] Checkpoint 1 — Maltesische Kreuzfahne
- [x] Bewegliche Blöcke (Sektion 2) — 5 Tweens
- [x] Schmale Balken (Sektion 3) — 4 Plattformen
- [x] Checkpoint 2 — Maltesische Kreuzfahne
- [x] Laser-Hindernisse (Sektion 4) — 3 blinkende Laser
- [x] Ritter-NPCs (Sektion 4) — 3 patroullierende Ritter
- [x] Kombinations-Sektion (Sektion 5)
- [x] Ziel-Plattform (Gold)
- [x] Pizza-Collectibles (10 Stück verteilt, mit Sternwertung)

---

## Phase 3b: Level-Feinschliff ✅ Abgeschlossen (26.02.2026)

**Aufgaben:**
- [x] Sektion 2 enger gezogen (6 Plattformen, range 60-70 statt 100-150)
- [x] Rote Hindernisbalken (createMovingBars) in Sektion 2 hinzugefügt — töten Spieler bei Berührung
- [x] Maltafahne korrekt (✠ Unicode auf rotem Rechteck)
- [x] Spieler fällt korrekt (`setCollideWorldBounds(false)`, Todesdetektion per y > H+100)

---

## Phase 4: UI + Audio + Polish ✅ Abgeschlossen (26.02.2026)

**Aufgaben:**
- [x] Pizza-Zähler (HUD) — 🍕 0/25
- [x] Checkpoint-Anzeige — 7 Checkpoints
- [x] Malta-Design: Pixel-Art Malta-Skyline (drawMaltaSkyline)
- [x] Pixel-Art Sprites: Spieler (drawPlayer), Ritter (drawKnight), Pizza, Cannonball, Sword, Shark, Bird
- [x] Hintergrundmusik (Web Audio API, synthetisierte 16-Beat-Melodie in C-Dur, 140 BPM)
- [x] Pizza-Sammel-Sound (Cookie-Monster-Stil: Säge + Sinus-Nomnom)
- [ ] Spiel auf Handy getestet

## Phase 4b: Level-Erweiterung ✅ Abgeschlossen (26.02.2026)

**Inhalt:**
- [x] WORLD_WIDTH: 8000 → 35000 px (4× mehr Level)
- [x] 7 Checkpoints (war: 2 + Ziel)
- [x] 5 neue Hindernistypen:
  - Aufzüge (vertikal, Tween yoyo) — Sektion 6
  - Kanonenkugeln (horizontal rollend) — Sektion 7
  - Fallende Schwerter (vertikal repeat) — Sektion 8
  - Haie (springen aus dem Wasser) — Sektion 9
  - Vögel (horizontal, flappe-Animation per sin()) — Sektion 10
- [x] Grand Mix (Sektion 11) + Finales Gauntlet (Sektion 12)
- [x] 25 Pizzas total (10 alte + 15 neue)
- [x] Duck-Bug behoben: `if (!onGround && !this.isDucking)` statt `if (!onGround)`

---

## Phase 5: Veröffentlichung ✅ Abgeschlossen (27.02.2026)

**URL:** https://steffenkiedel.github.io/pizza-obby-malta/

**Aufgaben:**
- [x] GitHub Repository erstellt: https://github.com/steffenkiedel/pizza-obby-malta
- [x] GitHub Pages aktiviert (Branch: main, Root: /)
- [ ] Link getestet (iOS Safari, Chrome)
- [ ] Link an Freunde/Familie verschickt

---

## Phase 6: Erweiterungen (nach v1) 🔲 Zukunft

- [ ] Level 2
- [ ] Globale Bestenliste (Highscores)
- [ ] Power-Up Items
- [ ] Charakter-Auswahl

---

## Offene Fragen / Probleme

- Handy-Test noch ausstehend (Link testen + an Freunde schicken)

---

## Bugs & Fehlerbehebung

| Datum | Problem | Ursache | Fix |
|-------|---------|---------|-----|
| 25.02 | Spiel reagiert nicht auf Klick | `file://` blockiert Pointer-Events im Browser | Python HTTP-Server: `python3 -m http.server 8080` |
| 25.02 | `this.physics.add.rectangle()` → Fehler | Methode existiert in Phaser 3 nicht | `this.add.rectangle()` + `this.physics.add.existing()` |
| 25.02 | Keyboard funktioniert nicht | `createLasers/Knights/Pizzas` vor `this.player` aufgerufen → Silent Crash | Spieler-Erstellung VOR Hindernis-Methoden |
| 25.02 | Spieler fällt nicht in Abgründe | `setCollideWorldBounds(true)` blockiert Herunterfallen | `false` setzen + Todesdetektion per `y > H+100` |
| 25.02 | Schweizer Kreuz statt Maltafahne | Falsches Symbol | ✠ Unicode auf rotem Rechteck via `this.add.text()` |
| 26.02 | Sektion 2 Lücken zu groß | Range 100-150 → Plattformen driften weit weg | Range auf 60-70 reduziert, 6. Plattform hinzugefügt |
| 26.02 | Bewegliche Plattformen/Balken fallen aus dem Bild | `group.add()` überschreibt `setAllowGravity(false)` intern | `setAllowGravity(false)` + `setImmovable(true)` immer NACH `group.add()` aufrufen |
| 26.02 | Ducken lässt Spieler durch den Boden fallen | `setSize(40,30)` hebt Body 15px an → `onGround=false` → `setVelocityY(700)` | `if (!onGround && !this.isDucking)` als Guard vor Fast-Fall |

## Learnings & Notizen

- Phaser.js lokal bündeln (nicht CDN) → offline nach erstem Laden
- `setScrollFactor(0)` für HUD-Elemente die immer auf dem Bildschirm bleiben
- `setScrollFactor(0.2)` für Parallax-Hintergrund (scrollt langsamer als Welt)
- Bewegliche Plattformen/Balken: `onUpdate: () => body.reset(x,y)` für korrekte Kollision
- `physics.add.existing(obj, true)` = statisch; `false` = dynamisch
- `defaultMode: acceptEdits` in `.claude/settings.json` für auto-approve Datei-Edits
- Hindernisbalken (createMovingBars): gleiche Technik wie Ritter/Plattformen, aber mit roter Farbe und overlap → respawn
- Plattform-x-Koordinate ist MITTE des Rechtecks → Lückenberechnung: gap = (next.x - 65) - (prev.x + 65)

---

## Letzte Änderung

**27.02.2026** — Mobile-Steuerung: Alte Buttons durch unsichtbare Multi-Touch-Zonen ersetzt. Links halten = läuft links, rechts halten = läuft rechts, 2. Finger = Springen. Phaser Scale.RESIZE für Landscape-Support. Tutorial-Overlay 3s beim Start. GitHub Pages live: https://steffenkiedel.github.io/pizza-obby-malta/

**26.02.2026 (3)** — Massive Level-Erweiterung: WORLD_WIDTH 35000px, 7 Checkpoints, 5 neue Hindernistypen (Aufzüge, Kanonenkugeln, Schwerter, Haie, Vögel), 25 Pizzas, Hintergrundmusik + Nom-Nom-Sound (Web Audio API). Duck-Bug behoben.
