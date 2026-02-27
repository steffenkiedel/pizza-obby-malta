# Design: Mobile-Steuerung & Landscape Mode

**Datum:** 27.02.2026
**Status:** Genehmigt
**Scope:** `game.js` — Steuerung + Scale Manager

---

## Problem

1. **Buttons zu klein**: Drei 85×85px Quadrate — kaum per Daumen treffbar
2. **Kein Landscape-Support**: Canvas-Größe wird einmalig bei `window.innerWidth/Height` gesetzt; beim Drehen des Handys bleibt Canvas in alter Größe
3. **Button-Repositionierung fehlt**: HUD und Buttons haben fixe Pixel-Positionen, die bei Orientation-Change nicht aktualisiert werden

---

## Lösung

### 1. Unsichtbare Multi-Touch-Zonen (ersetzt Buttons)

```
┌──────────────────────────────────────┐
│                                      │
│          [ Spielwelt ]               │
│                                      │
│   Links halten    │   Rechts halten  │
│   = läuft links   │   = läuft rechts │
│                   │                  │
│ ← 50% Bildschirm  │  50% Bildschirm →│
└──────────────────────────────────────┘
   Zweiter Finger (egal wo) = SPRUNG
   Swipe nach unten auf aktivem Touch = DUCKEN
```

**Regeln:**
- Finger auf linker Hälfte (x < W/2): `controls.left = true` solange gehalten
- Finger auf rechter Hälfte (x >= W/2): `controls.right = true` solange gehalten
- Zweiter Finger down während erster aktiv: einmaliger Sprung
- Finger up: entsprechende Richtung = false
- Swipe nach unten (deltaY > 40px auf demselben Pointer): Duck

**Tutorial-Overlay:**
- Erscheint beim ersten Spielstart für 3 Sekunden
- Text: `← LAUFEN  •  SPRINGEN  •  LAUFEN →`
- Fade-out via Tween (alpha 1 → 0)

### 2. Phaser Scale.RESIZE (Landscape Fix)

**Konfiguration:**
```javascript
// Aus config entfernen:
// width: window.innerWidth,
// height: window.innerHeight,

// Neu in config:
scale: {
  mode: Phaser.Scale.RESIZE,
  autoCenter: Phaser.Scale.CENTER_BOTH
}
```

**HUD-Repositionierung:**
- Alle HUD-Texte bekommen Named References: `this.pizzaText`, `this.cpText`
- `this.scale.on('resize', (gameSize) => { ... })` in `create()` registrieren
- Bei resize: x/y der HUD-Elemente auf neue `gameSize.width/height` setzen

---

## Betroffene Stellen in game.js

| Bereich | Zeilen (ca.) | Änderung |
|---------|-------------|---------|
| `config` | 1215–1228 | `width/height` → `scale: { mode: RESIZE }` |
| `createTouchControls()` | 688–730 | Buttons löschen → Zonen-Input |
| `create()` in GameScene | ~300 | `this.pizzaText` / `this.cpText` als Instanzvariablen |
| `create()` | Ende | `this.scale.on('resize', ...)` Handler |
| `update()` | ~1080 | `controls` Nutzung bleibt gleich (kein Breaking Change) |

---

## Was sich NICHT ändert

- Keyboard-Steuerung (Pfeiltasten, WASD) bleibt erhalten
- `this.controls.left/right` Interface bleibt identisch → `update()` muss nicht geändert werden
- Sprung-Logik in `update()` bleibt (nur Trigger wechselt)
- Alle Hindernisse, Level-Logik, Checkpoints — unberührt
