# Mobile Controls & Landscape Mode — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ersetze die 85px-Buttons durch unsichtbare Multi-Touch-Zonen und repariere Landscape Mode via Phaser Scale.RESIZE.

**Architecture:** (1) `config` bekommt `scale: { mode: RESIZE }` statt fixer Breite/Höhe. (2) `createTouchControls()` nutzt Phaser's Pointer-Events statt interactive Rectangles. (3) `update()` verarbeitet `this.controls.jump` als Einmal-Flag.

**Tech Stack:** Phaser.js 3.60.0, Phaser.Scale.RESIZE, Phaser Multi-Pointer Input

---

## Kontext

**Datei:** `Browserspiel/game.js` — alle Änderungen nur dort.

**Relevante Stellen:**
- `config` Objekt: Zeile ~1215 — `width/height` → `scale`
- `GameScene.create()`: Zeilen ~298-308 — HUD + `createTouchControls(W, H)`
- `createTouchControls(W, H)`: Zeilen ~688-726 — komplett ersetzen
- `update()`: Zeile ~1078-1080 — `jump` Flag hinzufügen

**Controls-Interface** (bleibt gleich, `update()` nutzt es bereits):
```javascript
this.controls = { left: false, right: false, jump: false }
```

---

## Task 1: Scale.RESIZE in config aktivieren

**Files:**
- Modify: `game.js` — Zeilen 1217-1218 (die `width` und `height` Zeilen)

**Schritt 1: Änderung machen**

Ersetze in der `config`-Konstante:
```javascript
// ALT (entfernen):
width: window.innerWidth,
height: window.innerHeight,

// NEU (einfügen direkt nach `backgroundColor: '#1E88E5',`):
scale: {
  mode: Phaser.Scale.RESIZE,
  autoCenter: Phaser.Scale.CENTER_BOTH
},
```

Das fertige config-Objekt sieht so aus:
```javascript
const config = {
  type: Phaser.CANVAS,
  backgroundColor: '#1E88E5',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 800 },
      debug: false
    }
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene, WinScene]
};
```

**Schritt 2: Testen (Browser, localhost:8080)**

- Spiel laden → alles sollte noch normal aussehen
- Browser-Fenster in der Breite ziehen → Canvas soll mitziehen (kein weißer Rand)
- iOS: Handy drehen → Canvas füllt jetzt den Landscape-Bildschirm

**Schritt 3: Commit**
```bash
git add game.js
git commit -m "fix: Phaser Scale.RESIZE für Landscape-Support"
```

---

## Task 2: Resize-Handler für HUD-Elemente

**Files:**
- Modify: `game.js` — nach Zeile 308 (`this.createTouchControls(W, H)`)

**Hintergrund:** `this.checkpointText` hat `setOrigin(1, 0)` und liegt bei `x = W - 20`. Wenn W sich ändert (Landscape), muss x neu gesetzt werden. `this.pizzaText` liegt bei `(20, 20)` — braucht kein Update.

**Schritt 1: Resize-Handler hinzufügen**

Direkt nach der Zeile `this.createTouchControls(W, H);` einfügen:
```javascript
// Resize-Handler: HUD bei Orientation-Change neu positionieren
this.scale.on('resize', (gameSize) => {
  if (this.checkpointText) {
    this.checkpointText.setPosition(gameSize.width - 20, 20);
  }
}, this);
```

**Schritt 2: Testen**

- Spiel starten, Pizza sammeln → Zähler oben links korrekt
- Handy drehen (oder Browser-Fenster ziehen) → Checkpoint-Text bleibt oben rechts

**Schritt 3: Commit**
```bash
git add game.js
git commit -m "fix: HUD-Repositionierung bei Orientation-Change"
```

---

## Task 3: createTouchControls() komplett ersetzen

**Files:**
- Modify: `game.js` — Zeilen 688-726 komplett ersetzen

**Schritt 1: Signatur in create() anpassen**

Zeile ~307 von:
```javascript
this.createTouchControls(W, H);
```
zu:
```javascript
this.createTouchControls();
```

**Schritt 2: Methode ersetzen**

Die komplette `createTouchControls(W, H)` Methode (Zeilen 688–726) ersetzen durch:

```javascript
createTouchControls() {
  // Multi-Touch-Zonen: links laufen | rechts laufen | 2. Finger = Springen
  this.controls = { left: false, right: false, jump: false };

  // Phaser braucht explizites Aktivieren von Multi-Touch (bis zu 3 gleichzeitige Finger)
  this.input.addPointer(2);

  // Hilfsfunktion: Scannt alle aktiven Pointer und setzt left/right
  const syncDirections = () => {
    const W = this.scale.width;
    let left = false, right = false;
    for (const p of this.input.manager.pointers) {
      if (p.isDown) {
        if (p.x < W / 2) left = true;
        else right = true;
      }
    }
    this.controls.left = left;
    this.controls.right = right;
  };

  this.input.on('pointerdown', (pointer) => {
    // Aktive Pointer VOR diesem: wenn schon einer gedrückt → Sprung
    let activeCount = 0;
    for (const p of this.input.manager.pointers) {
      if (p.isDown) activeCount++;
    }
    if (activeCount >= 2) {
      this.controls.jump = true;  // wird in update() konsumiert
    }
    syncDirections();
  });

  this.input.on('pointerup', syncDirections);
  this.input.on('pointermove', syncDirections);

  // Tutorial-Overlay: erscheint 3 Sekunden beim ersten Spielstart
  const W = this.scale.width;
  const H = this.scale.height;
  const hint = this.add.text(
    W / 2, H * 0.82,
    '← halten = laufen   •   2. Finger = springen   •   halten = laufen →',
    { fontSize: '16px', fill: '#fff', stroke: '#000', strokeThickness: 3 }
  ).setOrigin(0.5).setScrollFactor(0).setDepth(20).setAlpha(0.85);

  this.time.delayedCall(3000, () => {
    this.tweens.add({
      targets: hint, alpha: 0, duration: 800,
      onComplete: () => hint.destroy()
    });
  });
}
```

**Schritt 3: Testen**

- Im Browser mit Maus: Links-Klick auf linke Bildschirmhälfte halten → Spieler läuft links
- Rechts-Klick (oder Klick auf rechte Hälfte) → Spieler läuft rechts
- Tutorial-Text erscheint unten, blendet nach 3s aus
- Auf dem Handy: Eine Zone halten + zweiter Finger tippen → Sprung

**Schritt 4: Commit**
```bash
git add game.js
git commit -m "feat: Multi-Touch-Zonen ersetzen alte Buttons"
```

---

## Task 4: Jump-Flag in update() konsumieren

**Files:**
- Modify: `game.js` — Zeile ~1080

**Hintergrund:** Das alte Jump-Button hat direkt `setVelocityY(-620)` aufgerufen. Das neue `controls.jump` ist ein Flag, das jedes Frame zurückgesetzt werden muss, sonst springt der Spieler in einem Loop.

**Schritt 1: Jump-Bedingung in update() erweitern**

Zeile ~1080, von:
```javascript
const jump = this.cursors.up.isDown || this.cursors.space.isDown || this.wasd.up.isDown;
```
zu:
```javascript
const jump = this.controls.jump || this.cursors.up.isDown || this.cursors.space.isDown || this.wasd.up.isDown;
```

**Schritt 2: Flag nach Verbrauch zurücksetzen**

Direkt nach dem Jump-Block (nach `if (jump && onGround && !this.isDucking) { ... }`), einfügen:
```javascript
this.controls.jump = false;  // Einmal-Trigger zurücksetzen
```

Der fertige Block sieht so aus:
```javascript
if (jump && onGround && !this.isDucking) {
  this.player.body.setVelocityY(-620);
}
this.controls.jump = false;  // NEU
```

**Schritt 3: Testen (kritisch)**

- Auf dem Handy: zweiten Finger tippen → Spieler springt EINMAL (nicht loop)
- Keyboard-Leertaste: springt wie vorher
- Auf dem Boden halten + zweiter Finger: springt korrekt
- In der Luft zweiter Finger: springt NICHT (onGround-Guard)

**Schritt 4: Commit**
```bash
git add game.js
git commit -m "fix: controls.jump als Einmal-Flag in update() konsumieren"
```

---

## Task 5: Deployen + Testen auf Handy

**Schritt 1: Push zu GitHub**
```bash
cd "…/Browserspiel"
git push
```

**Schritt 2: Warten (~60 Sekunden) und öffnen**

URL: `https://steffenkiedel.github.io/pizza-obby-malta/`

**Schritt 3: Checkliste Handy-Test**

- [ ] Portrait: Spiel füllt gesamten Screen, kein weißer Rand
- [ ] Landscape: Handy drehen → Canvas füllt neuen Screen, HUD repositioniert sich
- [ ] Laufen links: Linke Bildschirmhälfte halten → läuft links
- [ ] Laufen rechts: Rechte Bildschirmhälfte halten → läuft rechts
- [ ] Springen stehend: Zweiter Finger tippen → springt
- [ ] Springen laufend: Rechte Zone halten + zweiter Finger → springt nach rechts
- [ ] Tutorial: Hinweis-Text erscheint beim Start, blendet nach 3s aus

**Schritt 4: PROGRESS.md aktualisieren**

In `PROGRESS.md` → Phase 5, Checkbox setzen:
```
- [x] Link getestet (iOS Safari, Chrome)
```

**Schritt 5: Memory aktualisieren**

In `MEMORY.md` unter "Browserspiel: Status" und neuen Abschnitt "Mobile Controls":
```
## Mobile Controls (27.02.2026)
- Multi-Touch-Zonen: links halten = left, rechts halten = right
- 2. Finger (gleichzeitig) = Sprung (controls.jump Einmal-Flag)
- Scale.RESIZE: Canvas passt sich automatisch Orientation-Change an
- Resize-Handler: this.scale.on('resize') → checkpointText.setPosition(W-20, 20)
```
