# Pizza Obby Malta (Browser) — Implementierungsplan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ein spielbares 2D Side-Scroller Obby-Spiel im Browser, optimiert für Touch auf dem Handy, deployed via GitHub Pages.

**Architecture:** Phaser.js 3 (lokal gebündelt) mit Arcade Physics. Fünf Szenen: Boot → Menu → Game → GameOver → Win. Level 1 ist eine lange horizontale Welt mit scrollender Kamera.

**Tech Stack:** HTML, JavaScript, Phaser.js 3, GitHub Pages

**Hinweis für Claude:** Der Nutzer hat keine Programmierkenntnisse. Erkläre jeden Schritt verständlich. Zeige vollständigen Code zum Copy-Pasten. Beschreibe genau was nach jedem Schritt im Browser zu sehen sein soll.

---

## Vorbereitung: Tools installieren

### Task 0: VS Code & GitHub einrichten

**Ziel:** Entwicklungsumgebung ist bereit.

**Schritt 1: VS Code installieren**
- Download: https://code.visualstudio.com
- Installieren, öffnen

**Schritt 2: GitHub-Account**
- Falls noch keiner: https://github.com → "Sign up"
- Neues Repository anlegen: `pizza-obby-malta`
- "Add a README file" anhaken
- Repository klonen (grüner Button "Code" → "Open with GitHub Desktop" oder URL kopieren)

**Schritt 3: Ordner in VS Code öffnen**
- VS Code → File → Open Folder → Den geklonten `pizza-obby-malta` Ordner wählen

**Erfolgskriterium:** VS Code zeigt den leeren `pizza-obby-malta` Ordner in der Seitenleiste.

---

## Phase 1: Grundgerüst

### Task 1: Phaser.js herunterladen & index.html erstellen

**Dateien:**
- Erstellen: `index.html`
- Erstellen: `game.js`
- Download: `phaser.min.js` (von https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js → Rechtsklick → Speichern unter → in den Projektordner)

**Schritt 1: index.html erstellen**

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Pizza Obby Malta</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; overflow: hidden; }
    canvas { display: block; }
  </style>
</head>
<body>
  <script src="phaser.min.js"></script>
  <script src="game.js"></script>
</body>
</html>
```

**Schritt 2: game.js erstellen**

```javascript
const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#1E88E5',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 800 }, debug: false }
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene, WinScene]
};

// Platzhalter-Szenen (werden in den nächsten Tasks gefüllt)
class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }
  preload() {}
  create() { this.scene.start('MenuScene'); }
}

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }
  create() {
    this.add.text(
      config.width / 2, config.height / 2,
      'Pizza Obby Malta\n\nTippe zum Starten',
      { fontSize: '32px', fill: '#fff', align: 'center' }
    ).setOrigin(0.5);
    this.input.once('pointerdown', () => this.scene.start('GameScene'));
  }
}

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }
  create() {
    this.add.text(20, 20, 'Game läuft! (kommt bald)', { fontSize: '24px', fill: '#fff' });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }
  create() {
    this.add.text(config.width/2, config.height/2, 'Game Over', { fontSize: '40px', fill: '#fff' }).setOrigin(0.5);
    this.input.once('pointerdown', () => this.scene.start('GameScene'));
  }
}

class WinScene extends Phaser.Scene {
  constructor() { super('WinScene'); }
  create() {
    this.add.text(config.width/2, config.height/2, 'Du hast gewonnen!', { fontSize: '40px', fill: '#fff' }).setOrigin(0.5);
  }
}

const game = new Phaser.Game(config);
```

**Schritt 3: Testen**
- `index.html` im Browser öffnen (Doppelklick auf die Datei)
- Oder in VS Code: Rechtsklick → "Open with Live Server" (Extension installieren falls nicht vorhanden)

**Erfolgskriterium:** Blauer Bildschirm mit Text "Pizza Obby Malta — Tippe zum Starten". Tippen wechselt zur GameScene mit "Game läuft!".

---

## Phase 2: Spieler & Bewegung

### Task 2: Spieler-Charakter mit Physik

**Dateien:**
- Modifizieren: `game.js` — GameScene

**Ziel:** Ein farbiges Rechteck als Spieler erscheint, fällt durch die Schwerkraft, und landet auf Plattformen.

**Schritt 1: GameScene komplett ersetzen**

```javascript
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    // Weltgröße (breiter als der Bildschirm — das Level scrollt)
    const WORLD_WIDTH = 8000;
    const WORLD_HEIGHT = config.height;

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Kamera
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Hintergrund (wird später durch Grafik ersetzt)
    this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, 0x1E88E5)
      .setScrollFactor(0.2); // Parallax: Hintergrund scrollt langsamer

    // Statische Plattform-Gruppe
    this.platforms = this.physics.add.staticGroup();

    // Startplattform
    this.makePlatform(0, WORLD_HEIGHT - 60, 800, 60, 0xC0643A);

    // Spieler (vorerst als buntes Rechteck)
    this.player = this.physics.add.rectangle(100, WORLD_HEIGHT - 150, 40, 60, 0xFF9800);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);

    // Kollision Spieler ↔ Plattformen
    this.physics.add.collider(this.player, this.platforms);

    // Kamera folgt Spieler
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Touch-Buttons
    this.createTouchControls();

    // HUD (bleibt immer an gleicher Stelle)
    this.pizzaText = this.add.text(20, 20, '🍕 0/10', {
      fontSize: '28px', fill: '#fff', stroke: '#000', strokeThickness: 4
    }).setScrollFactor(0);
  }

  makePlatform(x, y, width, height, color = 0xD4A843) {
    const plat = this.add.rectangle(x + width / 2, y + height / 2, width, height, color);
    this.physics.add.existing(plat, true); // true = statisch
    this.platforms.add(plat);
    return plat;
  }

  createTouchControls() {
    const btnSize = 80;
    const margin = 20;
    const y = config.height - margin - btnSize / 2;

    // Links-Button
    this.btnLeft = this.add.rectangle(margin + btnSize / 2, y, btnSize, btnSize, 0x000000, 0.5)
      .setScrollFactor(0).setInteractive();
    this.add.text(margin + btnSize / 2, y, '◀', { fontSize: '36px' })
      .setOrigin(0.5).setScrollFactor(0);

    // Rechts-Button
    this.btnRight = this.add.rectangle(margin * 2 + btnSize * 1.5, y, btnSize, btnSize, 0x000000, 0.5)
      .setScrollFactor(0).setInteractive();
    this.add.text(margin * 2 + btnSize * 1.5, y, '▶', { fontSize: '36px' })
      .setOrigin(0.5).setScrollFactor(0);

    // Sprung-Button
    const jumpX = config.width - margin - btnSize / 2;
    this.btnJump = this.add.rectangle(jumpX, y, btnSize, btnSize, 0xFF9800, 0.7)
      .setScrollFactor(0).setInteractive();
    this.add.text(jumpX, y, 'JUMP', { fontSize: '22px', fill: '#fff' })
      .setOrigin(0.5).setScrollFactor(0);

    // Button-Status
    this.controls = { left: false, right: false };

    this.btnLeft.on('pointerdown', () => { this.controls.left = true; });
    this.btnLeft.on('pointerup', () => { this.controls.left = false; });
    this.btnLeft.on('pointerout', () => { this.controls.left = false; });

    this.btnRight.on('pointerdown', () => { this.controls.right = true; });
    this.btnRight.on('pointerup', () => { this.controls.right = false; });
    this.btnRight.on('pointerout', () => { this.controls.right = false; });

    this.btnJump.on('pointerdown', () => {
      if (this.player.body.blocked.down) {
        this.player.body.setVelocityY(-600);
      }
    });
  }

  update() {
    const speed = 300;

    if (this.controls.left) {
      this.player.body.setVelocityX(-speed);
    } else if (this.controls.right) {
      this.player.body.setVelocityX(speed);
    } else {
      this.player.body.setVelocityX(0);
    }

    // Tod durch Fallen
    if (this.player.y > config.height + 100) {
      this.scene.start('GameOverScene');
    }
  }
}
```

**Erfolgskriterium:** Oranges Rechteck erscheint, fällt auf die braune Plattform. Tippen auf ◀/▶ bewegt es. Tippen auf JUMP lässt es springen. Fällt man von der Plattform → GameOver Bildschirm.

---

## Phase 3: Level 1 aufbauen

### Task 3: Alle Plattformen & Sektionen

**Dateien:**
- Modifizieren: `game.js` — GameScene.create()

**Ziel:** Das komplette Level ist begehbar — alle 5 Sektionen mit Lücken, Balken, Abständen.

**Schritt 1: Plattform-Layout in create() hinzufügen (nach der Startplattform)**

```javascript
// === SEKTION 1: Lücken ===
this.makePlatform(900, WORLD_HEIGHT - 120, 150, 20, 0xF5F5F5);
this.makePlatform(1120, WORLD_HEIGHT - 160, 120, 20, 0xF5F5F5);
this.makePlatform(1310, WORLD_HEIGHT - 120, 130, 20, 0xF5F5F5);
this.makePlatform(1510, WORLD_HEIGHT - 170, 110, 20, 0xF5F5F5);
this.makePlatform(1700, WORLD_HEIGHT - 130, 140, 20, 0xF5F5F5);
this.makePlatform(1900, WORLD_HEIGHT - 160, 120, 20, 0xF5F5F5);
this.makePlatform(2080, WORLD_HEIGHT - 120, 150, 20, 0xF5F5F5);
this.makePlatform(2290, WORLD_HEIGHT - 150, 130, 20, 0xF5F5F5);

// Checkpoint 1
this.makePlatform(2500, WORLD_HEIGHT - 80, 300, 20, 0xFFD700);
this.checkpoint1 = { x: 2650, y: WORLD_HEIGHT - 80, reached: false };

// === SEKTION 2: Bewegliche Blöcke (Platzhalter — werden in Task 4 animiert) ===
this.makePlatform(2900, WORLD_HEIGHT - 160, 130, 20, 0xD4A843);
this.makePlatform(3200, WORLD_HEIGHT - 200, 130, 20, 0xD4A843);
this.makePlatform(3500, WORLD_HEIGHT - 160, 130, 20, 0xD4A843);
this.makePlatform(3800, WORLD_HEIGHT - 220, 130, 20, 0xD4A843);
this.makePlatform(4100, WORLD_HEIGHT - 180, 130, 20, 0xD4A843);

// === SEKTION 3: Schmale Balken ===
this.makePlatform(4400, WORLD_HEIGHT - 160, 60, 15, 0xC0643A);
this.makePlatform(4530, WORLD_HEIGHT - 200, 55, 15, 0xC0643A);
this.makePlatform(4660, WORLD_HEIGHT - 170, 60, 15, 0xC0643A);
this.makePlatform(4790, WORLD_HEIGHT - 210, 55, 15, 0xC0643A);

// Checkpoint 2
this.makePlatform(5000, WORLD_HEIGHT - 80, 300, 20, 0xFFD700);
this.checkpoint2 = { x: 5150, y: WORLD_HEIGHT - 80, reached: false };

// === SEKTION 4: Laser + Ritter (Platzhalter) ===
this.makePlatform(5400, WORLD_HEIGHT - 160, 200, 20, 0xC0643A);
this.makePlatform(5700, WORLD_HEIGHT - 200, 180, 20, 0xC0643A);
this.makePlatform(6000, WORLD_HEIGHT - 170, 200, 20, 0xC0643A);

// === SEKTION 5: Finale ===
this.makePlatform(6300, WORLD_HEIGHT - 200, 130, 20, 0xD4A843);
this.makePlatform(6550, WORLD_HEIGHT - 260, 100, 20, 0xD4A843);
this.makePlatform(6800, WORLD_HEIGHT - 220, 120, 20, 0xD4A843);

// Ziel-Plattform
this.makePlatform(7100, WORLD_HEIGHT - 150, 400, 30, 0xFFD700);
this.goalX = 7300;
```

**Schritt 2: Checkpoint-Logik in create() hinzufügen**

```javascript
// Respawn-Position (startet am Anfang)
this.respawnX = 100;
this.respawnY = WORLD_HEIGHT - 150;
```

**Schritt 3: Checkpoint-Check in update() hinzufügen**

```javascript
// Checkpoint 1
if (!this.checkpoint1.reached && this.player.x > this.checkpoint1.x) {
  this.checkpoint1.reached = true;
  this.respawnX = this.checkpoint1.x;
  this.respawnY = this.checkpoint1.y - 80;
  this.showMessage('Checkpoint 1 ✅');
}

// Checkpoint 2
if (!this.checkpoint2.reached && this.player.x > this.checkpoint2.x) {
  this.checkpoint2.reached = true;
  this.respawnX = this.checkpoint2.x;
  this.respawnY = this.checkpoint2.y - 80;
  this.showMessage('Checkpoint 2 ✅');
}

// Ziel erreicht
if (this.player.x > this.goalX) {
  this.scene.start('WinScene');
}
```

**Schritt 4: Tod-Logik anpassen (Respawn statt GameOver nach Checkpoint)**

```javascript
// Tod durch Fallen — in update() ersetzen
if (this.player.y > config.height + 100) {
  this.player.setPosition(this.respawnX, this.respawnY);
  this.player.body.setVelocity(0, 0);
}
```

**Schritt 5: showMessage() Hilfsfunktion hinzufügen**

```javascript
showMessage(text) {
  const msg = this.add.text(config.width / 2, 100, text, {
    fontSize: '28px', fill: '#FFD700', stroke: '#000', strokeThickness: 4
  }).setOrigin(0.5).setScrollFactor(0);
  this.time.delayedCall(2000, () => msg.destroy());
}
```

**Erfolgskriterium:** Man kann durch alle 5 Sektionen laufen. Checkpoints werden gespeichert (Meldung erscheint). Nach dem Fall respawnt man am letzten Checkpoint. Am Ziel erscheint der Win-Screen.

---

## Phase 4: Hindernisse

### Task 4: Bewegliche Plattformen (Sektion 2)

**Dateien:**
- Modifizieren: `game.js` — GameScene

**Ziel:** Die Plattformen in Sektion 2 bewegen sich hin und her.

**Schritt 1: Statische Plattformen in Sektion 2 durch dynamische ersetzen**

In create(), die Sektion-2-Plattformen ersetzen mit:

```javascript
// Bewegliche Plattformen-Gruppe
this.movingPlatforms = this.physics.add.group();

const movingData = [
  { x: 2900, y: WORLD_HEIGHT - 160, range: 120 },
  { x: 3200, y: WORLD_HEIGHT - 200, range: 100 },
  { x: 3500, y: WORLD_HEIGHT - 160, range: 150 },
  { x: 3800, y: WORLD_HEIGHT - 220, range: 120 },
  { x: 4100, y: WORLD_HEIGHT - 180, range: 100 },
];

movingData.forEach(data => {
  const plat = this.add.rectangle(data.x, data.y, 130, 20, 0xD4A843);
  this.physics.add.existing(plat, false);
  plat.body.setAllowGravity(false);
  plat.body.setImmovable(true);
  this.movingPlatforms.add(plat);

  this.tweens.add({
    targets: plat,
    x: data.x + data.range,
    duration: 1500,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
    onUpdate: () => plat.body.reset(plat.x, plat.y)
  });
});

this.physics.add.collider(this.player, this.movingPlatforms);
```

**Erfolgskriterium:** Die 5 Plattformen in Sektion 2 bewegen sich gleichmäßig hin und her. Der Spieler kann auf ihnen stehen und wird mitgezogen.

---

### Task 5: Laser-Hindernisse (Sektion 4)

**Dateien:**
- Modifizieren: `game.js` — GameScene

**Ziel:** Rote Laserbalken blinken rhythmisch an und aus. Berühren = Tod.

**Schritt 1: Laser in create() hinzufügen**

```javascript
this.lasers = this.physics.add.staticGroup();

const laserPositions = [
  { x: 5550, y: WORLD_HEIGHT - 200 },
  { x: 5850, y: WORLD_HEIGHT - 240 },
  { x: 6150, y: WORLD_HEIGHT - 210 },
];

laserPositions.forEach(pos => {
  const laser = this.add.rectangle(pos.x, pos.y, 8, 100, 0xD32F2F);
  this.physics.add.existing(laser, true);
  this.lasers.add(laser);

  // Blinken: An/Aus im Rhythmus
  this.time.addEvent({
    delay: Phaser.Math.Between(800, 1200),
    loop: true,
    callback: () => {
      laser.setVisible(!laser.visible);
      laser.body.enable = laser.visible;
    }
  });
});

// Spieler berührt Laser → Tod
this.physics.add.overlap(this.player, this.lasers, () => {
  if (this.lasers.getChildren().some(l => l.visible && this.physics.overlap(this.player, l))) {
    this.player.setPosition(this.respawnX, this.respawnY);
    this.player.body.setVelocity(0, 0);
  }
});
```

**Erfolgskriterium:** Rote vertikale Balken blinken. Berührt man einen aktiven Laser, respawnt man am letzten Checkpoint.

---

### Task 6: Ritter-NPCs (Sektion 4)

**Dateien:**
- Modifizieren: `game.js` — GameScene

**Ziel:** Ritter (rote Rechtecke) patrouillieren hin und her. Berühren = Tod.

**Schritt 1: Ritter in create() hinzufügen**

```javascript
this.knights = this.physics.add.group();

const knightData = [
  { x: 5450, y: WORLD_HEIGHT - 200, range: 150 },
  { x: 5750, y: WORLD_HEIGHT - 240, range: 130 },
  { x: 6050, y: WORLD_HEIGHT - 210, range: 140 },
];

knightData.forEach(data => {
  const knight = this.physics.add.rectangle(data.x, data.y, 35, 55, 0xB22222);
  knight.body.setAllowGravity(false);
  knight.body.setImmovable(true);
  this.knights.add(knight);

  this.tweens.add({
    targets: knight,
    x: data.x + data.range,
    duration: 1200,
    yoyo: true,
    repeat: -1,
    ease: 'Linear',
    onUpdate: () => knight.body.reset(knight.x, knight.y)
  });
});

// Spieler berührt Ritter → Tod
this.physics.add.overlap(this.player, this.knights, () => {
  this.player.setPosition(this.respawnX, this.respawnY);
  this.player.body.setVelocity(0, 0);
});
```

**Erfolgskriterium:** Rote Rechtecke (Ritter) patrouillieren. Berühren tötet den Spieler.

---

## Phase 5: Collectibles & HUD

### Task 7: Pizza-Collectibles

**Dateien:**
- Modifizieren: `game.js` — GameScene

**Ziel:** 10 Pizzas sind im Level verteilt. Einsammeln erhöht den Zähler.

**Schritt 1: Pizzas in create() hinzufügen**

```javascript
this.pizzaCount = 0;
this.pizzas = this.physics.add.staticGroup();

const pizzaPositions = [
  // S1: 2 Pizzas
  { x: 1120, y: WORLD_HEIGHT - 200 },
  { x: 1700, y: WORLD_HEIGHT - 180 },
  // S2: 3 Pizzas
  { x: 2900, y: WORLD_HEIGHT - 220 },
  { x: 3500, y: WORLD_HEIGHT - 230 },
  { x: 4100, y: WORLD_HEIGHT - 240 },
  // S3: 1 Pizza
  { x: 4660, y: WORLD_HEIGHT - 230 },
  // S4: 2 Pizzas
  { x: 5550, y: WORLD_HEIGHT - 280 },
  { x: 5850, y: WORLD_HEIGHT - 300 },
  // S5: 2 Pizzas
  { x: 6550, y: WORLD_HEIGHT - 320 },
  { x: 7200, y: WORLD_HEIGHT - 250 },
];

pizzaPositions.forEach(pos => {
  const pizza = this.add.circle(pos.x, pos.y, 15, 0xFF9800);
  this.physics.add.existing(pizza, true);
  this.pizzas.add(pizza);
  // Kleiner Kreis in der Mitte (Pizza-Look)
  this.add.circle(pos.x, pos.y, 8, 0xD32F2F);
});

// Einsammeln
this.physics.add.overlap(this.player, this.pizzas, (player, pizza) => {
  pizza.destroy();
  this.pizzaCount++;
  this.pizzaText.setText(`🍕 ${this.pizzaCount}/10`);
  this.showMessage('+1 🍕');
});
```

**Erfolgskriterium:** Orangefarbene Kreise erscheinen im Level. Berühren lässt sie verschwinden und erhöht den Zähler oben links.

---

## Phase 6: Szenen fertigstellen

### Task 8: WinScene mit Pizza-Ergebnis

**Dateien:**
- Modifizieren: `game.js` — WinScene

**Ziel:** Der Win-Screen zeigt wie viele Pizzas gesammelt wurden.

```javascript
class WinScene extends Phaser.Scene {
  constructor() { super('WinScene'); }
  create() {
    const pizzas = this.scene.get('GameScene').pizzaCount || 0;

    this.add.rectangle(config.width/2, config.height/2, config.width, config.height, 0x1a1a2e)
      .setOrigin(0.5);

    this.add.text(config.width/2, config.height/2 - 100,
      '🎉 Level Geschafft! 🎉',
      { fontSize: '36px', fill: '#FFD700', stroke: '#000', strokeThickness: 4 }
    ).setOrigin(0.5);

    this.add.text(config.width/2, config.height/2,
      `🍕 ${pizzas}/10 Pizzas gesammelt`,
      { fontSize: '28px', fill: '#fff' }
    ).setOrigin(0.5);

    this.add.text(config.width/2, config.height/2 + 100,
      'Tippe zum Neustart',
      { fontSize: '22px', fill: '#aaa' }
    ).setOrigin(0.5);

    this.input.once('pointerdown', () => this.scene.start('GameScene'));
  }
}
```

**Erfolgskriterium:** Win-Screen zeigt die korrekte Pizza-Anzahl.

---

## Phase 7: Audio

### Task 9: Hintergrundmusik & Sound-Effekte

**Dateien:**
- Herunterladen: Musik-Datei (MP3) in `assets/sounds/music.mp3`
- Herunterladen: Sound-Effekte in `assets/sounds/`
- Modifizieren: `game.js`

**Freie Musik-Quellen:**
- https://opengameart.org (Suche: "platformer", "parkour")
- https://freesound.org

**Schritt 1: Assets in BootScene laden**

```javascript
class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }
  preload() {
    // Ladebalken
    const bar = this.add.rectangle(config.width/2 - 200, config.height/2, 0, 30, 0xFFD700);
    this.load.on('progress', v => bar.width = 400 * v);

    // Audio
    this.load.audio('music', 'assets/sounds/music.mp3');
    this.load.audio('collect', 'assets/sounds/collect.mp3');
    this.load.audio('checkpoint', 'assets/sounds/checkpoint.mp3');
    this.load.audio('win', 'assets/sounds/win.mp3');
  }
  create() { this.scene.start('MenuScene'); }
}
```

**Schritt 2: Musik in GameScene starten**

```javascript
// In create():
this.music = this.sound.add('music', { loop: true, volume: 0.4 });
this.music.play();

// Pizza einsammeln — Sound abspielen:
this.sound.play('collect');

// Checkpoint erreicht:
this.sound.play('checkpoint');
```

**Schritt 3: WinScene**

```javascript
// In WinScene.create():
this.sound.play('win');
```

**Erfolgskriterium:** Musik läuft im Hintergrund. Pizza-Einsammeln und Checkpoint haben eigene Sounds.

---

## Phase 8: Deployment

### Task 10: GitHub Pages veröffentlichen

**Ziel:** Das Spiel ist unter einem öffentlichen Link erreichbar.

**Schritt 1: Alle Dateien committen**

```bash
git add .
git commit -m "feat: Pizza Obby Malta v1.0"
git push
```

**Schritt 2: GitHub Pages aktivieren**
- GitHub.com → Repository öffnen
- Settings → Pages
- Source: "Deploy from a branch"
- Branch: `main` / Ordner: `/ (root)`
- Save

**Schritt 3: Warten (~1 Minute), dann Link öffnen**

```
https://DEIN-USERNAME.github.io/pizza-obby-malta
```

**Schritt 4: Auf Handy testen**
- Link auf Handy öffnen (iOS Safari oder Chrome)
- Prüfen: Touch-Buttons funktionieren, Spiel läuft flüssig

**Erfolgskriterium:** Das Spiel läuft auf dem Handy via Link. Link kann verschickt werden.

---

## Phase 9: Pixel Art & Grafik (nach v1)

### Task 11: Eigene Grafiken einbauen

**Ziel:** Eigene Pixel Art Sprites ersetzen die farbigen Rechtecke.

**Workflow:**
1. Referenzfotos sind bereits in `assets/referenzbilder/` abgelegt
2. Gemeinsam mit Claude: Fotos in Pixel Art umwandeln (KI-Tool)
3. Sprites als PNG in `assets/sprites/` speichern
4. In BootScene laden: `this.load.image('player', 'assets/sprites/player.png');`
5. Im GameScene: `this.add.image(x, y, 'player')` statt `this.add.rectangle(...)`

**Reihenfolge der Sprites:**
1. Spieler-Charakter (+ Lauf-Animation)
2. Hintergrund / Valletta-Silhouette
3. Plattform-Textur (Mauerwerk)
4. Ritter-NPC
5. Pizza

---

## Zusammenfassung: Zeitschätzung

| Phase | Inhalt | Aufwand |
|---|---|---|
| 0 | Setup (VS Code, GitHub) | 1 Session |
| 1–2 | Grundgerüst + Spieler | 1 Session |
| 3 | Level aufbauen | 1 Session |
| 4 | Hindernisse | 1 Session |
| 5–6 | Pizzas + Szenen | 1 Session |
| 7 | Audio | 1 Session |
| 8 | Deployment | 30 Minuten |
| 9 | Pixel Art (optional) | 2–3 Sessions |

**Gesamtaufwand v1.0 (spielbar, ohne Pixel Art):** ~5–6 Sessions à 1–2 Stunden
