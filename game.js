// ============================================================
// Pizza Obby Malta — Browserspiel
// Engine: Phaser.js 3
// ============================================================

// --- Szenen-Klassen (werden unten in config registriert) ---

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    // Ladebalken
    const bar = this.add.rectangle(
      window.innerWidth / 2 - 200, window.innerHeight / 2,
      0, 30, 0xFFD700
    );
    this.load.on('progress', v => { bar.width = 400 * v; });

    // Alle Grafiken werden per Code gezeichnet (Pixel Art) — kein Bildladen nötig
  }

  create() {
    this.scene.start('MenuScene');
  }
}

// ------------------------------------------------------------

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Hintergrund: Pixel-Art Malta-Skyline (vereinfacht, unter dunklem Overlay)
    const bg = this.add.graphics();
    bg.fillStyle(0x1A5F9E, 1); bg.fillRect(0, 0, W, H);
    bg.fillStyle(0x3B87C0, 1); bg.fillRect(0, H * 0.30, W, H * 0.32);
    bg.fillStyle(0x0C3A72, 1); bg.fillRect(0, H * 0.60, W, H * 0.40);
    bg.fillStyle(0xFFCC00, 1); bg.fillCircle(W * 0.82, H * 0.10, 22);
    bg.fillStyle(0xD4A95C, 1);
    bg.fillRect(0, H*0.40, W*0.14, H*0.20);
    bg.fillRect(W*0.12, H*0.45, W*0.10, H*0.15);
    bg.fillRect(W*0.38, H*0.42, W*0.12, H*0.18);
    bg.fillRect(W*0.60, H*0.40, W*0.13, H*0.20);
    bg.fillRect(W*0.80, H*0.44, W*0.20, H*0.16);
    bg.fillStyle(0xCC3300, 1); bg.fillEllipse(W*0.27, H*0.34, 58, 32);
    bg.fillStyle(0xD4A95C, 1); bg.fillEllipse(W*0.27, H*0.37, 48, 24);
    bg.fillRect(W*0.24, H*0.46, 68, H*0.14);
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55);

    // Titel
    this.add.text(W / 2, H / 2 - 80, 'Pizza Obby Malta', {
      fontSize: '40px',
      fill: '#FFD700',
      stroke: '#000',
      strokeThickness: 6,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Untertitel
    this.add.text(W / 2, H / 2, '🍕 Sammle Pizzas!\n🛡️ Vermeide Ritter!', {
      fontSize: '22px',
      fill: '#fff',
      align: 'center'
    }).setOrigin(0.5);

    // Start-Hinweis (blinkt)
    const startText = this.add.text(W / 2, H / 2 + 100, 'Tippe zum Starten', {
      fontSize: '26px',
      fill: '#fff',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: 0,
      duration: 700,
      yoyo: true,
      repeat: -1
    });

    // Unsichtbares interaktives Rechteck über den ganzen Bildschirm
    const clickZone = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0)
      .setInteractive();

    clickZone.on('pointerdown', () => {
      // AudioContext HIER erstellen (innerhalb der User-Geste → iOS-kompatibel)
      if (!window._gameAudio) {
        window._gameAudio = new (window.AudioContext || window.webkitAudioContext)();
      }
      this.scene.start('GameScene');
    });

    // Fallback: auch auf Tastatur-Leertaste reagieren
    this.input.keyboard.once('keydown-SPACE', () => {
      if (!window._gameAudio) {
        window._gameAudio = new (window.AudioContext || window.webkitAudioContext)();
      }
      this.scene.start('GameScene');
    });
  }
}

// ------------------------------------------------------------

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const WORLD_WIDTH = 35000;

    // Physik-Weltgrenzen
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, H);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, H);

    // Hintergrund: Pixel-Art Malta-Skyline (einmalig gezeichnet, scrollFactor 0 = fixiert)
    // W/ZOOM und H/ZOOM kompensiert den Camera-Zoom, damit der Hintergrund den ganzen Screen füllt
    const ZOOM = 0.75;
    this.skylineBg = this.drawMaltaSkyline(W / ZOOM, H / ZOOM);

    // --- Plattform-Gruppen ---
    this.platforms = this.physics.add.staticGroup();
    this.movingPlatforms = this.physics.add.group();

    // Respawn-Position (wird bei Checkpoints aktualisiert)
    this.respawnX = 100;
    this.respawnY = H - 150;

    // Pizza-Zähler
    this.pizzaCount = 0;
    // Daten-Arrays für neue Hindernisse (Body + Grafik)
    this.cannonballData = [];
    this.swordData      = [];
    this.sharkData      = [];
    this.birdData       = [];

    // === STARTBEREICH ===
    this.makePlatform(0, H - 60, 800, 60, 0xC0643A);

    // === SEKTION 1: Lücken ===
    const s1 = [[900, H-120,150], [1120, H-160,120], [1310, H-120,130],
                [1510, H-170,110], [1700, H-130,140], [1900, H-160,120],
                [2080, H-120,150], [2290, H-150,130]];
    s1.forEach(([x,y,w]) => this.makePlatform(x, y, w, 20, 0xF5F5F5));

    // === CHECKPOINT 1 ===
    this.makePlatform(2500, H-80, 300, 20, 0xFFD700);
    this.checkpoint1 = { x: 2650, y: H-160, reached: false };
    this.makeCheckpointFlag(2620, H-80);

    // === SEKTION 2: Bewegliche Blöcke (enger, mit Hindernisbalken) ===
    [[2880,H-160,60],[3080,H-195,70],[3280,H-165,60],
     [3490,H-210,70],[3700,H-175,60],[3950,H-190,65]].forEach(([x,y,range]) => {
      this.makeMovingPlatform(x, y, range);
    });

    // === SEKTION 3: Schmale Balken (näher zusammen) ===
    [[4300,H-160], [4420,H-195], [4540,H-165], [4660,H-200]].forEach(([x,y]) => {
      this.makePlatform(x, y, 70, 15, 0xC0643A);
    });

    // === CHECKPOINT 2 ===
    this.makePlatform(4820, H-80, 300, 20, 0xFFD700);
    this.checkpoint2 = { x: 4970, y: H-160, reached: false };
    this.makeCheckpointFlag(4940, H-80);

    // === SEKTION 4: Laser + Ritter (Plattformen) ===
    [[5220,H-160,200], [5500,H-200,180], [5760,H-170,200]].forEach(([x,y,w]) => {
      this.makePlatform(x, y, w, 20, 0xC0643A);
    });

    // === SEKTION 5: Finale (engere Abstände) ===
    [[6050,H-200,130], [6250,H-250,110], [6440,H-210,120]].forEach(([x,y,w]) => {
      this.makePlatform(x, y, w, 20, 0xD4A843);
    });

    // === CHECKPOINT 3 (Halbzeit) ===
    this.makePlatform(6650, H-150, 400, 30, 0xFFD700);
    this.checkpoint3 = { x: 6800, y: H-260, reached: false };
    this.makeCheckpointFlag(6750, H-150);
    this.add.text(6850, H-210, '⭐ HALBZEIT ⭐', {
      fontSize: '20px', fill: '#FFD700', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);

    // === BRÜCKE + CHECKPOINT 4 (Aufzüge) ===
    this.makePlatform(7100, H-60, 700, 30, 0xFFD700);
    this.checkpoint4 = { x: 7400, y: H-160, reached: false };
    this.makeCheckpointFlag(7400, H-60);

    // === SEKTION 6: AUFZÜGE ===
    // Feste Plattformen (Zielstationen für die Aufzüge)
    [[8050, H-260, 200], [8800, H-100, 200],
     [9520, H-280, 200], [10200, H-100, 200], [10800, H-200, 300]].forEach(
      ([x, y, w]) => this.makePlatform(x, y, w, 20, 0xCD853F)
    );

    // === CHECKPOINT 5 + BRÜCKE (Kanonenkugeln) ===
    this.makePlatform(11300, H-60, 700, 30, 0xFFD700);
    this.checkpoint5 = { x: 11550, y: H-160, reached: false };
    this.makeCheckpointFlag(11550, H-60);

    // === SEKTION 7: KANONENKUGELN ===
    // Breite flache Plattformen, auf denen Kugeln rollen
    [[12100, H-80, 700], [13000, H-130, 700], [13900, H-80, 700]].forEach(
      ([x, y, w]) => this.makePlatform(x, y, w, 25, 0xA0522D)
    );
    // Verbindungssprünge zwischen den Kanonen-Plattformen
    [[12050, H-80, 50], [12950, H-130, 50], [13850, H-80, 50]].forEach(
      ([x, y, w]) => this.makePlatform(x, y, w, 20, 0x777777)
    );

    // === SEKTION 8: FALLENDE SCHWERTER ===
    [[14700, H-120, 220], [15100, H-160, 220], [15500, H-120, 220],
     [15900, H-160, 220], [16300, H-120, 220], [16700, H-160, 220]].forEach(
      ([x, y, w]) => this.makePlatform(x, y, w, 20, 0x707070)
    );

    // === CHECKPOINT 6 + BRÜCKE (Hai-Zone) ===
    this.makePlatform(17300, H-60, 700, 30, 0xFFD700);
    this.checkpoint6 = { x: 17550, y: H-160, reached: false };
    this.makeCheckpointFlag(17550, H-60);

    // === SEKTION 9: HAI-ZONE (Sprungsteine über dem Wasser) ===
    [[18100, H-200, 150], [18400, H-230, 130], [18700, H-200, 150],
     [19000, H-230, 130], [19300, H-200, 150], [19600, H-230, 130],
     [19900, H-200, 150], [20200, H-230, 130]].forEach(
      ([x, y, w]) => this.makePlatform(x, y, w, 20, 0x4682B4)
    );

    // === SEKTION 10: VÖGEL ===
    [[20700, H-180, 200], [21000, H-220, 180], [21300, H-180, 200],
     [21600, H-220, 180], [21900, H-180, 200], [22200, H-220, 180],
     [22500, H-180, 200], [22800, H-220, 180]].forEach(
      ([x, y, w]) => this.makePlatform(x, y, w, 20, 0x228B22)
    );

    // === CHECKPOINT 7 + BRÜCKE (Grand Mix) ===
    this.makePlatform(23400, H-60, 700, 30, 0xFFD700);
    this.checkpoint7 = { x: 23650, y: H-160, reached: false };
    this.makeCheckpointFlag(23650, H-60);

    // === SEKTION 11: GRAND MIX (alle Hindernisse kombiniert) ===
    [[24100, H-140, 200], [24400, H-180, 180], [24700, H-220, 160],
     [25000, H-180, 180], [25300, H-140, 200], [25600, H-180, 180],
     [25900, H-140, 200], [26200, H-180, 180]].forEach(
      ([x, y, w]) => this.makePlatform(x, y, w, 20, 0xDC143C)
    );

    // === SEKTION 12: FINALES GAUNTLET ===
    [[26800, H-160, 180], [27050, H-200, 160], [27280, H-250, 150],
     [27520, H-200, 160], [27760, H-160, 180], [28000, H-120, 200],
     [28240, H-160, 180], [28480, H-200, 160], [28720, H-250, 140],
     [28960, H-200, 160], [29200, H-160, 180], [29450, H-120, 200],
     [29700, H-160, 180], [29950, H-200, 160], [30200, H-250, 150],
     [30450, H-200, 160], [30700, H-160, 180], [30950, H-120, 200]].forEach(
      ([x, y, w]) => this.makePlatform(x, y, w, 20, 0xB8860B)
    );

    // === NEUE ZIEL-PLATTFORM ===
    this.makePlatform(31300, H-120, 700, 30, 0xFFD700);
    this.goalX = 31650;
    this.add.text(31650, H-180, '🎯 ZIEL', {
      fontSize: '28px', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5);

    // --- Spieler (muss vor Hindernissen erstellt werden!) ---
    // Unsichtbarer Physik-Body + Pixel-Art Grafik
    this.player = this.add.rectangle(100, H - 150, 40, 60, 0x000000, 0);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(false);
    this.playerGfx = this.add.graphics().setDepth(5);
    this.isDucking  = false;
    this.facingRight = true;

    // Kollisionen mit Plattformen
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, this.movingPlatforms);

    // --- Hindernisse & Collectibles ---
    this.createMovingBars(H);
    this.createLasers(H);
    this.createKnights(H);
    this.createPizzas(H);
    // Neue Hindernistypen
    this.createElevators(H);
    this.createCannonballs(H);
    this.createFallingSwords(H);
    this.createSharks(H);
    this.createBirds(H);

    // Kamera: Zoom + Spieler links+oben positionieren (mehr Spielfeld voraus, weniger Himmel)
    this.cameras.main.setZoom(ZOOM);
    // lerpX 0.25: Kamera zieht flott nach
    // Negativer X-Offset: Kamerazentrum links vom Spieler → Spieler erscheint im linken Drittel
    this.cameras.main.startFollow(this.player, true, 0.25, 0.12);
    this.cameras.main.setFollowOffset(
      -(this.scale.width  / ZOOM) * 0.2,  // Spieler bei ~30% von links (mehr Welt voraus sichtbar)
      (this.scale.height / ZOOM) * 0.15   // Spieler bei ~35% von oben (weniger Himmel)
    );

    // --- HUD ---
    this.pizzaText = this.add.text(20, 20, '🍕 0/25', {
      fontSize: '28px', fill: '#fff', stroke: '#000', strokeThickness: 4
    }).setScrollFactor(0).setDepth(10);

    this.checkpointText = this.add.text(W - 20, 20, '', {
      fontSize: '22px', fill: '#FFD700', stroke: '#000', strokeThickness: 3
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(10);

    // --- Touch-Steuerung ---
    this.createTouchControls();

    // Resize-Handler: Hintergrund neuzeichnen + HUD + Kamera-Offset aktualisieren
    this.scale.on('resize', (gameSize) => {
      if (this.skylineBg) { this.skylineBg.destroy(); }
      this.skylineBg = this.drawMaltaSkyline(gameSize.width / ZOOM, gameSize.height / ZOOM);

      if (this.checkpointText) {
        this.checkpointText.setPosition(gameSize.width - 20, 20);
      }
      this.cameras.main.setFollowOffset(
        -(gameSize.width  / ZOOM) * 0.2,
        (gameSize.height / ZOOM) * 0.15
      );
    }, this);

    // --- Tastatur-Steuerung (Desktop) ---
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      down:  Phaser.Input.Keyboard.KeyCodes.S
    });

    // --- Audio ---
    this.initAudio();
  }

  // ── Hilfsfunktionen ──────────────────────────────────────

  makePlatform(x, y, width, height, color) {
    const plat = this.add.rectangle(x + width / 2, y + height / 2, width, height, color);
    this.physics.add.existing(plat, true);
    this.platforms.add(plat);
    return plat;
  }

  makeMovingPlatform(x, y, range) {
    const plat = this.add.rectangle(x, y, 130, 20, 0xD4A843);
    this.physics.add.existing(plat, false);
    this.movingPlatforms.add(plat);
    // WICHTIG: nach group.add() setzen, da add() body.moves überschreibt!
    plat.body.setAllowGravity(false);
    plat.body.setImmovable(true);
    this.tweens.add({
      targets: plat,
      x: x + range,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: () => plat.body.reset(plat.x, plat.y)
    });
  }

  makeCheckpointFlag(x, y) {
    // Fahnenstange
    this.add.rectangle(x, y - 42, 5, 84, 0x777777);
    // Rotes Flaggenfeld
    this.add.rectangle(x + 24, y - 74, 48, 34, 0xCC0000);
    // Malteserkreuz (✠) in Weiß
    this.add.text(x + 24, y - 74, '✠', {
      fontSize: '22px', fill: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);
  }

  createLasers(H) {
    this.lasers = this.physics.add.staticGroup();
    [[5370, H-230], [5640, H-270], [5910, H-240]].forEach(([x, y]) => {
      const laser = this.add.rectangle(x, y, 8, 100, 0xD32F2F);
      this.physics.add.existing(laser, true);
      this.lasers.add(laser);
      // Blinken
      this.time.addEvent({
        delay: Phaser.Math.Between(800, 1400),
        loop: true,
        callback: () => {
          laser.setVisible(!laser.visible);
          laser.body.enable = laser.visible;
        }
      });
    });

    this.physics.add.overlap(this.player, this.lasers, () => this.respawn());
  }

  createKnights(H) {
    this.knights = this.physics.add.group();
    this.knightData = []; // [{body, gfx}] für Pixel-Art Zeichnung in update()
    [[5270, H-195, 130], [5550, H-235, 110], [5810, H-205, 130]].forEach(([x, y, range]) => {
      // Unsichtbarer Physik-Body
      const body = this.add.rectangle(x, y, 36, 56, 0x000000, 0);
      this.physics.add.existing(body, false);
      this.knights.add(body);
      // WICHTIG: nach group.add() setzen!
      body.body.setAllowGravity(false);
      body.body.setImmovable(true);
      const gfx = this.add.graphics().setDepth(5);
      this.knightData.push({ body, gfx });
      this.tweens.add({
        targets: body,
        x: x + range,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Linear',
        onUpdate: () => body.body.reset(body.x, body.y)
      });
    });

    this.physics.add.overlap(this.player, this.knights, () => this.respawn());
  }

  createMovingBars(H) {
    // Rote Hindernisbalken in Sektion 2 — bewegen sich links/rechts, töten den Spieler
    this.movingBars = this.physics.add.group();
    [
      [3080, H-295,  90],   // über P2 (Mitte S2)
      [3490, H-310, 100],   // über P4 (zweite Hälfte S2)
    ].forEach(([x, y, range]) => {
      const bar = this.add.rectangle(x, y, 85, 14, 0xCC0000);
      this.physics.add.existing(bar, false);
      this.movingBars.add(bar);
      // WICHTIG: nach group.add() setzen!
      bar.body.setAllowGravity(false);
      bar.body.setImmovable(true);
      this.tweens.add({
        targets: bar,
        x: x + range,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        onUpdate: () => bar.body.reset(bar.x, bar.y)
      });
    });
    this.physics.add.overlap(this.player, this.movingBars, () => this.respawn());
  }

  createPizzas(H) {
    this.pizzas = this.physics.add.staticGroup();
    [
      [1120, H-200], [1700, H-180],          // S1
      [2880, H-215], [3280, H-220], [3950, H-245], // S2
      [4540, H-220],                          // S3
      [5370, H-260], [5640, H-290],           // S4
      [6250, H-310], [6750, H-220],           // S5
      [8800, H-200], [10200, H-200],          // S6: Aufzüge
      [12500, H-180], [13500, H-230],         // S7: Kanonenkugeln
      [15300, H-260], [16500, H-260],         // S8: Fallende Schwerter
      [18400, H-330], [19300, H-300],         // S9: Hai-Zone
      [21000, H-320], [22200, H-320],         // S10: Vögel
      [24400, H-280], [25000, H-280], [25900, H-240], // S11: Grand Mix
      [27280, H-350], [28480, H-300]          // S12: Finales Gauntlet
    ].forEach(([x, y]) => {
      // Pixel-Art Pizza: goldener Rand, roter Belag, Käse-Flecken
      const gfx = this.add.graphics().setDepth(3);
      gfx.fillStyle(0xC8860A, 1); gfx.fillCircle(x, y, 16); // goldene Kruste
      gfx.fillStyle(0xCC2200, 1); gfx.fillCircle(x, y, 12); // Tomatensauce
      gfx.fillStyle(0xF5C518, 1); gfx.fillCircle(x-4, y-3, 4); // Käse
      gfx.fillStyle(0xF5C518, 1); gfx.fillCircle(x+4, y+2, 4); // Käse
      gfx.fillStyle(0xFF4500, 1); gfx.fillCircle(x+1, y-6, 3); // Topping
      gfx.fillStyle(0xFF4500, 1); gfx.fillCircle(x-5, y+4, 2); // Topping
      // Unsichtbarer Physik-Körper (Kreis-Approximation als Rechteck)
      const pizza = this.add.rectangle(x, y, 28, 28, 0x000000, 0);
      this.physics.add.existing(pizza, true);
      // Grafik bei der Pizza speichern für destroy()
      pizza.pizzaGfx = gfx;
      this.pizzas.add(pizza);
    });

    this.physics.add.overlap(this.player, this.pizzas, (_player, pizza) => {
      if (pizza.pizzaGfx) pizza.pizzaGfx.destroy();
      pizza.destroy();
      this.pizzaCount++;
      this.pizzaText.setText(`🍕 ${this.pizzaCount}/25`);
      this.showMessage('+1 🍕');
      this.playPizzaSound();
    });
  }

  createElevators(H) {
    // Vertikale Aufzug-Plattformen (Sektion 6) — Spieler muss mitfahren
    [
      [7900, H-100, H-280, 2000],
      [8600, H-280, H-80,  1800],
      [9280, H-80,  H-300, 2200],
      [10000, H-280, H-80, 1900],
    ].forEach(([x, startY, endY, dur]) => {
      const plat = this.add.rectangle(x, startY, 140, 22, 0xD2691E);
      // Aufzug-Streifen als optische Dekoration
      const stripe = this.add.rectangle(x, startY, 140, 8, 0x8B3A0F);
      this.physics.add.existing(plat, false);
      this.movingPlatforms.add(plat);
      plat.body.setAllowGravity(false);
      plat.body.setImmovable(true);
      this.tweens.add({
        targets: [plat, stripe],
        y: endY,
        duration: dur,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        onUpdate: () => plat.body.reset(plat.x, plat.y)
      });
    });
  }

  createCannonballs(H) {
    this.cannonballs = this.physics.add.group();
    // Kugeln auf Sektion 7 + Grand Mix + Finale
    const configs = [
      // [startX, y] — rollen von rechts nach links auf ihrer Plattform
      { sx: 12750, y: H-110 }, { sx: 12450, y: H-110 },  // S7 Plattform 1
      { sx: 13650, y: H-160 }, { sx: 13350, y: H-160 },  // S7 Plattform 2
      { sx: 14550, y: H-110 }, { sx: 14250, y: H-110 },  // S7 Plattform 3
      { sx: 25600, y: H-175 }, { sx: 25250, y: H-175 },  // S11
      { sx: 29450, y: H-155 }, { sx: 29100, y: H-155 },  // S12
      { sx: 30700, y: H-175 }, { sx: 30400, y: H-175 },  // S12
    ];
    configs.forEach(({ sx, y }, i) => {
      const ball = this.add.rectangle(sx, y, 28, 28, 0x000000, 0);
      this.physics.add.existing(ball, false);
      this.cannonballs.add(ball);
      ball.body.setAllowGravity(false);
      ball.body.setImmovable(true);
      const gfx = this.add.graphics().setDepth(4);
      this.cannonballData.push({ body: ball, gfx });
      const endX = sx - 580;
      this.tweens.add({
        targets: ball,
        x: endX,
        duration: 2800 + (i % 3) * 300,
        delay: i * 350,
        repeat: -1,
        ease: 'Linear',
        onRepeat: () => { ball.x = sx; ball.body.reset(sx, ball.y); },
        onUpdate: () => ball.body.reset(ball.x, ball.y)
      });
    });
    this.physics.add.overlap(this.player, this.cannonballs, () => this.respawn());
  }

  createFallingSwords(H) {
    this.swords = this.physics.add.group();
    // Schwerter fallen senkrecht herab — Sektion 8 + S11 + Finale
    const xPositions = [
      14800, 15050, 15300, 15550, 15800, 16050, 16300, 16550, 16800, // S8
      24200, 24550, 24900, 25250,                                      // S11
      27400, 27800, 28200, 28800, 29300, 29900, 30400, 30900,         // S12
    ];
    xPositions.forEach((x, i) => {
      const startY = -70;
      const sword = this.add.rectangle(x, startY, 10, 52, 0x000000, 0);
      this.physics.add.existing(sword, false);
      this.swords.add(sword);
      sword.body.setAllowGravity(false);
      const gfx = this.add.graphics().setDepth(4);
      this.swordData.push({ body: sword, gfx });
      this.tweens.add({
        targets: sword,
        y: H + 80,
        duration: 1100 + (i % 5) * 180,
        delay: (i % 7) * 280,
        repeat: -1,
        ease: 'Linear',
        onRepeat: () => { sword.y = startY; sword.body.reset(sword.x, startY); },
        onUpdate: () => sword.body.reset(sword.x, sword.y)
      });
    });
    this.physics.add.overlap(this.player, this.swords, () => this.respawn());
  }

  createSharks(H) {
    this.sharks = this.physics.add.group();
    // Haie springen aus dem Wasser — Sektion 9 + S11 + Finale
    const xPositions = [
      18250, 18600, 18950, 19300, 19650, 19950, 20150, // S9
      24300, 24750, 25200,                              // S11
      28150, 28700, 29250, 29800, 30350,                // S12
    ];
    xPositions.forEach((x, i) => {
      const startY = H + 90;
      const shark = this.add.rectangle(x, startY, 44, 58, 0x000000, 0);
      this.physics.add.existing(shark, false);
      this.sharks.add(shark);
      shark.body.setAllowGravity(false);
      shark.body.setImmovable(true);
      const gfx = this.add.graphics().setDepth(4);
      this.sharkData.push({ body: shark, gfx });
      this.tweens.add({
        targets: shark,
        y: H - 190,
        duration: 850,
        delay: i * 550,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeOut',
        onUpdate: () => shark.body.reset(shark.x, shark.y)
      });
    });
    this.physics.add.overlap(this.player, this.sharks, () => this.respawn());
  }

  createBirds(H) {
    this.birds = this.physics.add.group();
    // Vögel fliegen horizontal — Sektion 10 + S11 + Finale
    const configs = [
      [20900, H-260, 480], [21300, H-300, 520], [21700, H-260, 490],
      [22100, H-280, 510], [22500, H-260, 470], [22900, H-300, 530], // S10
      [24200, H-240, 460], [24700, H-270, 500], [25400, H-250, 480], // S11
      [27200, H-260, 490], [27900, H-290, 510], [28500, H-260, 480],
      [29200, H-280, 500], [29800, H-260, 470], [30500, H-300, 520], // S12
    ];
    configs.forEach(([x, y, range], i) => {
      const bird = this.add.rectangle(x, y, 46, 26, 0x000000, 0);
      this.physics.add.existing(bird, false);
      this.birds.add(bird);
      bird.body.setAllowGravity(false);
      bird.body.setImmovable(true);
      const gfx = this.add.graphics().setDepth(4);
      this.birdData.push({ body: bird, gfx, phase: i * 600 });
      this.tweens.add({
        targets: bird,
        x: x - range,
        duration: 1900 + i * 120,
        yoyo: true,
        repeat: -1,
        ease: 'Linear',
        onUpdate: () => bird.body.reset(bird.x, bird.y)
      });
    });
    this.physics.add.overlap(this.player, this.birds, () => this.respawn());
  }

  // ── Zeichenfunktionen neue Hindernisse ─────────────────────

  drawCannonball(gfx, x, y) {
    gfx.clear();
    gfx.fillStyle(0x222222, 1); gfx.fillCircle(x, y, 14);
    gfx.fillStyle(0x444444, 1); gfx.fillCircle(x-4, y-4, 5); // Glanzpunkt
    gfx.fillStyle(0x111111, 1); gfx.fillCircle(x+4, y+4, 4); // Schatten
  }

  drawSword(gfx, x, y) {
    gfx.clear();
    // Klinge (silber)
    gfx.fillStyle(0xC8C8D0, 1); gfx.fillRect(x-4, y-18, 8, 40);
    gfx.fillStyle(0xA0A0A8, 1); gfx.fillRect(x+1, y-18, 3, 40); // Glanzlinie
    // Spitze
    gfx.fillStyle(0xC8C8D0, 1);
    gfx.fillTriangle(x-4, y+22, x+4, y+22, x, y+32);
    // Parierstange (gold)
    gfx.fillStyle(0xD4A800, 1); gfx.fillRect(x-13, y-20, 26, 6);
    // Griff (braun)
    gfx.fillStyle(0x8B4513, 1); gfx.fillRect(x-4, y-42, 8, 24);
    // Knauf (gold)
    gfx.fillStyle(0xD4A800, 1); gfx.fillCircle(x, y-44, 6);
  }

  drawShark(gfx, x, y) {
    gfx.clear();
    gfx.fillStyle(0x6080A0, 1); gfx.fillEllipse(x, y, 64, 32);   // Körper
    gfx.fillStyle(0xB0C8D8, 1); gfx.fillEllipse(x+6, y+7, 44, 18); // Bauch
    // Rückenflosse
    gfx.fillStyle(0x506070, 1);
    gfx.fillTriangle(x, y-14, x+14, y-14, x+5, y-38);
    // Schwanzflosse
    gfx.fillTriangle(x-28, y-10, x-28, y+10, x-44, y);
    // Auge
    gfx.fillStyle(0x111111, 1); gfx.fillCircle(x+20, y-5, 4);
    gfx.fillStyle(0xFFFFFF, 1); gfx.fillCircle(x+19, y-6, 2);
    // Zähne (3 Dreiecke)
    gfx.fillStyle(0xFFFFFF, 1);
    [x+6, x+12, x+18].forEach(tx => gfx.fillTriangle(tx, y+7, tx+4, y+7, tx+2, y+14));
  }

  drawBird(gfx, x, y, phase) {
    gfx.clear();
    const flap = Math.sin((Date.now() + phase) * 0.009) > 0;
    gfx.fillStyle(0x7B5E2A, 1); gfx.fillEllipse(x, y, 30, 20);   // Körper
    gfx.fillStyle(0x7B5E2A, 1); gfx.fillCircle(x+16, y-2, 11);   // Kopf
    gfx.fillStyle(0xFFA500, 1);                                    // Schnabel
    gfx.fillTriangle(x+25, y-2, x+36, y-1, x+25, y+3);
    gfx.fillStyle(0x111111, 1); gfx.fillCircle(x+19, y-4, 3);     // Auge
    gfx.fillStyle(0xFFFFFF, 1); gfx.fillCircle(x+18, y-5, 1);
    gfx.fillStyle(0x5A4420, 1);
    if (flap) {
      gfx.fillEllipse(x-4, y-14, 38, 14); // Flügel oben
    } else {
      gfx.fillEllipse(x-4, y+10, 38, 14); // Flügel unten
    }
  }

  createTouchControls() {
    // Swipe-Runner: ein Finger steuert alles
    this.controls = { left: false, right: false, jump: false, jumpVelocity: -620, duck: false };
    this.jumpBuffer   = 0;  // Timestamp letzter Jump-Wunsch (für Input Buffer)
    this.lastOnGround = 0;  // Timestamp letztes onGround (für Coyote Time)
    this.input.addPointer(2);

    // Schwellwerte
    const SWIPE_DIST  = 12;   // px Mindestbewegung bis Geste erkannt wird
    const JUMP_ANGLE  = 30;   // °: Winkel über Horizontal → Sprung (Swipe-Toleranz)
    const TAN_JUMP    = Math.tan(JUMP_ANGLE * Math.PI / 180); // ≈ 0.577
    const JUMP_PX_MIN = 12;    // px Wischstrecke → kleiner Hop
    const JUMP_PX_MAX = 55;    // px Wischstrecke → voller Sprung
    const VEL_MIN     = -500;  // Velocity kleiner Hop
    const VEL_MAX     = -1050; // Velocity voller Sprung (hoch!)

    this.input.on('pointerdown', (pointer) => {
      // Referenzpunkt für nächste Geste
      pointer._sx     = pointer.x;
      pointer._sy     = pointer.y;
      pointer._dir    = null;    // aktuelle Laufrichtung dieses Fingers
      pointer._jumped = false;   // hat dieser Finger schon gesprungen?
    });

    this.input.on('pointermove', (pointer) => {
      if (!pointer.isDown) return;

      const dx  = pointer.x - pointer._sx;
      const dy  = pointer.y - pointer._sy;
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < SWIPE_DIST) return; // Noch kein klarer Swipe

      // ─── SPRUNG: nach oben, Winkel > 30° über Horizontal ─────────────
      if (dy < 0 && ady > adx * TAN_JUMP && !pointer._jumped) {
        const swipeUp = ady;
        const t = Math.max(0, Math.min((swipeUp - JUMP_PX_MIN) / (JUMP_PX_MAX - JUMP_PX_MIN), 1));
        this.controls.jumpVelocity = VEL_MIN + t * (VEL_MAX - VEL_MIN);
        this.controls.jump = true;
        this.jumpBuffer    = Date.now(); // Input Buffer starten
        pointer._jumped    = true;
        if (navigator.vibrate) navigator.vibrate(15);
        pointer._sx = pointer.x; pointer._sy = pointer.y; // Referenz zurücksetzen
        return;
      }

      // ─── DUCKEN: nach unten, Winkel > 30° unter Horizontal ──────────
      if (dy > 0 && ady > adx * TAN_JUMP && !pointer._jumped) {
        this.controls.duck = true;
        pointer._sx = pointer.x; pointer._sy = pointer.y;
        return;
      }

      // ─── LAUFEN: horizontaler Swipe (oder Richtungswechsel) ──────────
      const newDir = dx > 0 ? 'right' : 'left';
      if (newDir !== pointer._dir) {
        // Alte Richtung stoppen
        if (pointer._dir === 'right') this.controls.right = false;
        if (pointer._dir === 'left')  this.controls.left  = false;
        pointer._dir    = newDir;
        pointer._jumped = false; // Nach Richtungswechsel darf wieder gesprungen werden
      }
      this.controls[newDir] = true;
      this.controls.duck    = false; // Ducken beim Laufen abbrechen
      // Referenz zurücksetzen → nächste Geste relativ zur aktuellen Position
      pointer._sx = pointer.x; pointer._sy = pointer.y;
    });

    this.input.on('pointerup', (pointer) => {
      if (pointer._dir === 'right') this.controls.right = false;
      if (pointer._dir === 'left')  this.controls.left  = false;
      this.controls.duck = false;
      pointer._dir    = null;
      pointer._jumped = false;
    });

    // Tutorial-Overlay
    const W = this.scale.width;
    const H = this.scale.height;
    const hint = this.add.text(
      W / 2, H * 0.82,
      '→ wischen = laufen  •  ↑ wischen = springen  •  Richtung halten',
      { fontSize: '16px', fill: '#fff', stroke: '#000', strokeThickness: 3 }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(20).setAlpha(0.85);
    this.time.delayedCall(3000, () => {
      this.tweens.add({ targets: hint, alpha: 0, duration: 800, onComplete: () => hint.destroy() });
    });
  }

  respawn() {
    this.player.body.reset(this.respawnX, this.respawnY);
  }

  showMessage(text) {
    const msg = this.add.text(
      this.scale.width / 2, 90, text,
      { fontSize: '30px', fill: '#FFD700', stroke: '#000', strokeThickness: 5 }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(20);
    this.time.delayedCall(1800, () => msg.destroy());
  }

  // ── Audio ─────────────────────────────────────────────────

  initAudio() {
    try {
      // AudioContext über Szenen-Neustarts hinweg wiederverwenden (global gespeichert)
      this.audioCtx = window._gameAudio ||
        new (window.AudioContext || window.webkitAudioContext)();
      window._gameAudio = this.audioCtx;
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.value = 0.22;
      this.masterGain.connect(this.audioCtx.destination);

      // Aufräumen beim Szene-Ende (z.B. Game Over, Neustart)
      this.events.on('shutdown', () => {
        clearTimeout(this._bgTimer);
        if (this.masterGain) this.masterGain.disconnect();
      });

      this.bgMusicLoop();
    } catch (e) {
      console.warn('Web Audio nicht verfügbar:', e);
      this.audioCtx = null;
    }
  }

  // Spielt eine einzelne synthetisierte Note
  playNote(freq, startT, dur, vol = 0.10, type = 'sine') {
    const ctx  = this.audioCtx;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, startT);
    gain.gain.exponentialRampToValueAtTime(0.0001, startT + dur);
    osc.start(startT);
    osc.stop(startT + dur + 0.02);
  }

  bgMusicLoop() {
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime + 0.05;
    const B   = 60 / 140; // Beat-Länge bei 140 BPM

    // Melodie: [Frequenz Hz, Beats] — mediterrane Pixel-Art-Weise in C-Dur
    const melody = [
      [523, 0.5], [659, 0.5], [784, 1],   // C5 E5 G5
      [659, 0.5], [523, 0.5], [440, 1],   // E5 C5 A4
      [392, 0.5], [494, 0.5], [587, 1],   // G4 B4 D5
      [523, 2],                            // C5 (lang)
      [698, 0.5], [880, 0.5], [1047, 1],  // F5 A5 C6
      [880, 0.5], [698, 0.5], [587, 1],   // A5 F5 D5
      [494, 0.5], [587, 0.5], [698, 1],   // B4 D5 F5
      [523, 2],                            // C5 (lang)
    ];
    // Begleitbass (leiser, tiefe Sinus-Welle)
    const bass = [
      [131, 2], [131, 2],  // C3 (Phrase 1)
      [110, 2], [131, 2],  // A2 C3
      [175, 2], [175, 2],  // F3 (Phrase 2)
      [196, 2], [131, 2],  // G3 C3
    ];

    let t = now;
    melody.forEach(([f, b]) => {
      this.playNote(f, t, b * B * 0.78, 0.09, 'triangle');
      t += b * B;
    });
    t = now;
    bass.forEach(([f, b]) => {
      this.playNote(f, t, b * B * 0.65, 0.07, 'sine');
      t += b * B;
    });

    // Loop: kurz vor Ende des letzten Tons neu planen
    const totalMs = melody.reduce((s, [, b]) => s + b, 0) * B * 1000;
    this._bgTimer = setTimeout(() => {
      if (this.audioCtx && this.sys && this.sys.isActive()) this.bgMusicLoop();
    }, totalMs - 150);
  }

  playPizzaSound() {
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;
    const t   = ctx.currentTime;

    // 3 schnelle "Nom"-Laute (Sägezahn = knusprig-grummelig wie Krümelmonster)
    [0, 0.11, 0.22].forEach((dt, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(380 - i * 30, t + dt);
      osc.frequency.exponentialRampToValueAtTime(70, t + dt + 0.09);
      gain.gain.setValueAtTime(0.32, t + dt);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.11);
      osc.start(t + dt);
      osc.stop(t + dt + 0.13);
    });

    // Zufriedenes "Mmm~" danach (tiefer Sinus, fallende Tonhöhe)
    const osc2  = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(310, t + 0.36);
    osc2.frequency.exponentialRampToValueAtTime(190, t + 0.58);
    gain2.gain.setValueAtTime(0.14, t + 0.36);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.58);
    osc2.start(t + 0.36);
    osc2.stop(t + 0.60);
  }

  // ── Pixel-Art Zeichenfunktionen ───────────────────────────

  drawMaltaSkyline(W, H) {
    // Kein setScrollFactor(0) — Position wird in update() mit Kamera synchronisiert
    const g = this.add.graphics().setDepth(-1);

    // Himmel (3 Farbband-Ebenen — Pixel-Art-Tiefenwirkung statt Foto-Gradient)
    g.fillStyle(0x1A5F9E, 1); g.fillRect(0, 0, W, H * 0.42);
    g.fillStyle(0x3B87C0, 1); g.fillRect(0, H * 0.32, W, H * 0.22);
    g.fillStyle(0x6AADCE, 1); g.fillRect(0, H * 0.47, W, H * 0.13);

    // Sonne (obere rechte Ecke)
    g.fillStyle(0xFFF3AA, 1); g.fillCircle(W * 0.81, H * 0.11, 30);
    g.fillStyle(0xFFCC00, 1); g.fillCircle(W * 0.81, H * 0.11, 20);

    // Wolken (3 Pixel-Art-Puffballs aus Ellipsen)
    [[W*0.09, H*0.07], [W*0.38, H*0.05], [W*0.65, H*0.09]].forEach(([cx, cy]) => {
      g.fillStyle(0xEEF8FF, 1);
      g.fillEllipse(cx, cy, 68, 22);
      g.fillEllipse(cx - 20, cy + 6, 42, 18);
      g.fillEllipse(cx + 20, cy + 5, 42, 18);
      g.fillEllipse(cx + 4, cy - 8, 46, 20);
    });

    // Mittelmeer / Grand Harbour
    g.fillStyle(0x0C3A72, 1); g.fillRect(0, H * 0.57, W, H * 0.43);
    g.fillStyle(0x1565C0, 1); g.fillRect(0, H * 0.57, W, H * 0.04);
    g.fillStyle(0x5B9BD4, 0.45);
    for (let i = 0; i < 7; i++) g.fillRect(i * W / 7 + W * 0.03, H * 0.62, W * 0.055, 3);

    // Festungsmauer / Bastionen (Valletta-typisch, mit Zinnen)
    g.fillStyle(0x8C6E3C, 1); g.fillRect(0, H * 0.51, W, H * 0.08);
    g.fillStyle(0xA88050, 1);
    for (let i = 0; i < Math.ceil(W / 30); i++) {
      g.fillRect(i * 30 + 4, H * 0.48, 18, H * 0.04);
    }

    // Farbkonstanten
    const s  = 0xD4A95C; // Malteser Kalkstein (honey-colored)
    const ds = 0xA87A3C; // Schattierter Stein
    const wn = 0x2A3040; // Fenster dunkel
    const wh = 0x6B9BB5; // Fenster-Reflexion (hellblau)

    // Fenster-Helfer (schließt über g, wn, wh)
    const W$ = (gx, gy, fw = 14, fh = 22) => {
      g.fillStyle(wn, 1); g.fillRect(gx, gy, fw, fh);
      g.fillStyle(wh, 1); g.fillRect(gx + 1, gy + 1, Math.floor(fw * 0.45), Math.floor(fh * 0.38));
    };

    // — Gebäude A: Ganz links, breit —
    const aW = Math.floor(W * 0.14);
    g.fillStyle(s, 1); g.fillRect(0, H * 0.36, aW, H * 0.17);
    g.fillStyle(ds, 1); g.fillRect(0, H * 0.36, aW, 6);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
      W$(10 + c * Math.floor(aW / 3.3), H * 0.36 + 12 + r * 30);
    }

    // — Glockenturm T1 (links, hoch, mit Uhr) —
    const t1x = Math.floor(W * 0.16), t1y = Math.floor(H * 0.26);
    g.fillStyle(0xC8A060, 1); g.fillRect(t1x - 11, t1y, 22, H * 0.27);
    g.fillStyle(ds, 1);
    [-15, -3, 9].forEach(ox => g.fillRect(t1x + ox, t1y - 10, 8, 12));
    W$(t1x - 5, t1y + 10, 10, 16);
    g.fillStyle(0xF5F5DC, 1); g.fillCircle(t1x, t1y + 40, 7);
    g.fillStyle(0x333333, 1); g.fillRect(t1x, t1y + 34, 1, 7); g.fillRect(t1x, t1y + 38, 5, 1);

    // — Kuppelkirche (zentral, ikonisch für Valletta) —
    const cx = Math.floor(W * 0.28), cy = Math.floor(H * 0.30);
    g.fillStyle(s, 1); g.fillRect(cx - 38, cy + 24, 76, H * 0.25);
    g.fillStyle(ds, 1); g.fillRect(cx - 38, cy + 24, 76, 6);
    g.fillStyle(0xCC3300, 1); g.fillEllipse(cx, cy + 8, 66, 40);  // Kuppel außen (rot)
    g.fillStyle(s, 1);         g.fillEllipse(cx, cy + 12, 56, 32); // Kuppel innen (Stein)
    g.fillStyle(ds, 1);        g.fillRect(cx - 5, cy - 10, 10, 22);// Laterne
    g.fillStyle(0xFFD700, 1);  g.fillCircle(cx, cy - 12, 5);       // Kugel
    g.fillStyle(wn, 1);        g.fillRect(cx - 10, cy + 32, 20, 30); // Portal
    g.fillStyle(0xD4C880, 1);  g.fillEllipse(cx, cy + 32, 22, 15); // Torbogen
    W$(cx - 30, cy + 38, 12, 18); W$(cx + 18, cy + 38, 12, 18);

    // — Gebäude B: Mitte —
    const bBx = Math.floor(W * 0.40), bBw = Math.floor(W * 0.12);
    g.fillStyle(0xCDA050, 1); g.fillRect(bBx, H * 0.39, bBw, H * 0.19);
    g.fillStyle(ds, 1); g.fillRect(bBx, H * 0.39, bBw, 6);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
      W$(bBx + 10 + c * Math.floor(bBw / 2.3), H * 0.39 + 12 + r * 30);
    }

    // — Gebäude C: Mitte-rechts —
    const bCx = Math.floor(W * 0.60), bCw = Math.floor(W * 0.13);
    g.fillStyle(s, 1); g.fillRect(bCx, H * 0.37, bCw, H * 0.21);
    g.fillStyle(ds, 1); g.fillRect(bCx, H * 0.37, bCw, 6);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
      W$(bCx + 12 + c * Math.floor(bCw / 2.2), H * 0.37 + 12 + r * 30);
    }

    // — Glockenturm T2 (rechts, mit Uhr) —
    const t2x = Math.floor(W * 0.75), t2y = Math.floor(H * 0.28);
    g.fillStyle(0xC0A460, 1); g.fillRect(t2x - 12, t2y, 24, H * 0.27);
    g.fillStyle(ds, 1);
    [-15, -3, 9].forEach(ox => g.fillRect(t2x + ox, t2y - 10, 8, 12));
    W$(t2x - 5, t2y + 10, 10, 15);
    g.fillStyle(0xF5F5DC, 1); g.fillCircle(t2x, t2y + 38, 7);
    g.fillStyle(0x333333, 1); g.fillRect(t2x, t2y + 32, 1, 7); g.fillRect(t2x, t2y + 36, 5, 1);

    // — Gebäude D: Ganz rechts —
    g.fillStyle(0xD0A060, 1); g.fillRect(W * 0.80, H * 0.41, W * 0.20, H * 0.17);
    g.fillStyle(ds, 1); g.fillRect(W * 0.80, H * 0.41, W * 0.20, 6);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
      W$(W * 0.80 + 8 + c * Math.floor(W * 0.20 / 3.3), H * 0.41 + 10 + r * 28, 13, 20);
    }
    return g;
  }

  drawPlayer(x, y, ducking, facingRight) {
    // Glatzkopf-Mann: bald, Stoppelbart, grauer Pulli
    const g = this.playerGfx;
    g.clear();
    const d = facingRight ? 1 : -1;

    if (ducking) {
      // Schuhe
      g.fillStyle(0x111111, 1); g.fillRect(x - d*16, y+17, 14, 7); g.fillRect(x+d*3, y+17, 11, 7);
      // Hose
      g.fillStyle(0x2d3748, 1); g.fillRect(x-13, y+6, 26, 14);
      // Torso
      g.fillStyle(0x607080, 1); g.fillRect(x-17, y-4, 34, 13);
      // Arm
      g.fillStyle(0x708090, 1); g.fillRect(x+d*15, y-4, 8, 13);
      // Kopf kahl, nach vorne geneigt
      g.fillStyle(0xE8C490, 1); g.fillCircle(x+d*13, y-6, 13);
      g.fillStyle(0xF2D8A0, 1); g.fillCircle(x+d*14, y-14, 5); // Glanz
      // Stoppelbart
      g.fillStyle(0x6a5030, 1); g.fillRect(x+d*6, y+1, 9, 4);
      // Auge
      g.fillStyle(0xffffff, 1); g.fillCircle(x+d*19, y-9, 4);
      g.fillStyle(0x607D8B, 1); g.fillCircle(x+d*20, y-9, 2);
      g.fillStyle(0x111, 1);    g.fillCircle(x+d*20, y-9, 1);
    } else {
      // === Stehend ===
      // Schuhe (dunkel)
      g.fillStyle(0x111111, 1);
      g.fillRect(x-17, y+23, 14, 7); g.fillRect(x+3, y+23, 14, 7);
      // Hose (dunkelblau)
      g.fillStyle(0x2d3748, 1);
      g.fillRect(x-13, y+8, 11, 17); g.fillRect(x+2, y+8, 11, 17);
      // Torso (grauer Pulli)
      g.fillStyle(0x607080, 1); g.fillRect(x-17, y-22, 34, 32);
      // Kragen (dunkleres Grau)
      g.fillStyle(0x455060, 1); g.fillRect(x-17, y-22, 34, 6);
      // Arme
      g.fillStyle(0x708090, 1);
      g.fillRect(x-d*25, y-17, 9, 22); // hinterer Arm
      g.fillRect(x+d*16, y-17, 9, 22); // vorderer Arm
      // Kopf (kahl)
      g.fillStyle(0xE8C490, 1); g.fillCircle(x, y-33, 17);
      // Glatze-Glanz (kleines helles Oval oben)
      g.fillStyle(0xF5DEB3, 1); g.fillEllipse(x-d*4, y-44, 10, 6);
      // Ohren
      g.fillStyle(0xD8A870, 1); g.fillCircle(x-16, y-32, 5); g.fillCircle(x+16, y-32, 5);
      // Augenbrauen (kräftig, dunkel)
      g.fillStyle(0x3a2510, 1);
      g.fillRect(x+d*2, y-42, 11, 3); g.fillRect(x-d*14, y-42, 9, 3);
      // Augen
      g.fillStyle(0xffffff, 1);
      g.fillCircle(x+d*7, y-36, 5); g.fillCircle(x-d*3, y-36, 4);
      g.fillStyle(0x607D8B, 1);
      g.fillCircle(x+d*7, y-36, 3); g.fillCircle(x-d*3, y-36, 2);
      g.fillStyle(0x111111, 1);
      g.fillCircle(x+d*7, y-36, 1);
      // Nase
      g.fillStyle(0xC8905A, 1); g.fillRect(x+d*2, y-31, 4, 5);
      // Stoppelbart (mehrere kleine Rechtecke)
      g.fillStyle(0x5a3a20, 1);
      g.fillRect(x-9, y-28, 18, 3); // Schnurrbart-Zone
      g.fillRect(x-7, y-25, 14, 5); // Kinn-Bart
      g.fillStyle(0x7a5030, 1); g.fillRect(x-5, y-23, 10, 3); // Kinn
      // Mund
      g.fillStyle(0xC07060, 1); g.fillRect(x-4, y-26, 8, 2);
    }
  }

  drawKnight(gfx, x, y, facingRight) {
    // Malta-Ritterin: blonde Haare, Ohrring, roter Umhang mit weißem Kreuz
    gfx.clear();
    const d = facingRight ? 1 : -1;

    // Schuhe
    gfx.fillStyle(0x111111, 1); gfx.fillRect(x-14, y+22, 11, 7); gfx.fillRect(x+3, y+22, 11, 7);
    // Beine (dunkelrot, Rüstung)
    gfx.fillStyle(0x8B0000, 1); gfx.fillRect(x-11, y+8, 9, 16); gfx.fillRect(x+2, y+8, 9, 16);
    // Torso (roter Umhang)
    gfx.fillStyle(0xCC0000, 1); gfx.fillRect(x-16, y-22, 32, 32);
    // Weißes Malteser-Kreuz auf der Brust
    gfx.fillStyle(0xFFFFFF, 1);
    gfx.fillRect(x-2, y-20, 4, 18); // vertikaler Balken
    gfx.fillRect(x-9, y-15, 18, 4); // horizontaler Balken
    // Arme
    gfx.fillStyle(0xAA0000, 1);
    gfx.fillRect(x-d*23, y-17, 8, 20); gfx.fillRect(x+d*15, y-17, 8, 20);
    // Kopf
    gfx.fillStyle(0xFFD5B8, 1); gfx.fillCircle(x, y-32, 15);
    // Blonde Haare (oben + Seiten)
    gfx.fillStyle(0xD4A010, 1);
    gfx.fillRect(x-14, y-46, 28, 12); // oberer Haarschopf
    gfx.fillRect(x-16, y-42, 7, 14); // linke Seite
    gfx.fillRect(x+9,  y-42, 7, 14); // rechte Seite
    // Augen
    gfx.fillStyle(0xffffff, 1);
    gfx.fillCircle(x+d*5, y-35, 4); gfx.fillCircle(x-d*3, y-35, 3);
    gfx.fillStyle(0x5599CC, 1);
    gfx.fillCircle(x+d*5, y-35, 2); gfx.fillCircle(x-d*3, y-35, 2);
    gfx.fillStyle(0x222222, 1); gfx.fillRect(x+d*1, y-40, 10, 2); // Wimpern
    // Kleiner Ohrring (goldenes Pünktchen)
    gfx.fillStyle(0xFFD700, 1); gfx.fillCircle(x-d*13, y-29, 3);
    // Mund
    gfx.fillStyle(0xD06060, 1); gfx.fillRect(x-4, y-26, 8, 2);
  }

  // ── Update-Loop ──────────────────────────────────────────

  update() {
    const SPEED = 300;

    const COYOTE_MS   = 80;   // ms nach Plattformende darf noch gesprungen werden
    const BUFFER_MS   = 120;  // ms: zu früher Sprung wird bei Landung ausgeführt
    const now = Date.now();

    const goLeft  = this.controls.left  || this.cursors.left.isDown  || this.wasd.left.isDown;
    const goRight = this.controls.right || this.cursors.right.isDown || this.wasd.right.isDown;
    const jumpNow = this.controls.jump  || this.cursors.up.isDown || this.cursors.space.isDown || this.wasd.up.isDown;
    const downKey = this.cursors.down.isDown || this.wasd.down.isDown || this.controls.duck;

    if (goRight) this.facingRight = true;
    if (goLeft)  this.facingRight = false;

    if (goLeft) {
      this.player.body.setVelocityX(-SPEED);
    } else if (goRight) {
      this.player.body.setVelocityX(SPEED);
    } else {
      this.player.body.setVelocityX(0);
    }

    const onGround = this.player.body.blocked.down;

    // Coyote Time: letzte Zeit am Boden merken
    if (onGround) this.lastOnGround = now;
    const coyoteOk = (now - this.lastOnGround) < COYOTE_MS;

    // Input Buffer: Sprungwunsch der kurz vor Landung kam
    if (jumpNow) this.jumpBuffer = now;
    const bufferOk = (now - this.jumpBuffer) < BUFFER_MS;

    // Springen: onGround ODER Coyote Time, Input ODER Buffer
    const canJump = (onGround || coyoteOk) && !this.isDucking;
    if (canJump && bufferOk) {
      this.player.body.setVelocityY(this.controls.jumpVelocity);
      this.jumpBuffer   = 0;   // Buffer verbraucht
      this.lastOnGround = 0;   // Coyote Time zurücksetzen
      if (jumpNow && navigator.vibrate) navigator.vibrate(15); // Haptic: Sprung
    }
    this.controls.jump         = false;
    this.controls.jumpVelocity = -820; // Tastatur-Default (voller Sprung)

    // Landungs-Vibration
    if (onGround && !this._wasOnGround && navigator.vibrate) navigator.vibrate(8);
    this._wasOnGround = onGround;

    // Schnellfall / Ducken
    // Duck-Fix: setOffset(0,30) hält die untere Körperkante an gleicher Position,
    // damit der Body nicht 15px nach oben schwimmt und onGround=false wird.
    if (downKey) {
      if (!onGround && !this.isDucking) {
        this.player.body.setVelocityY(700); // Schnellfall in der Luft
      } else if (onGround && !this.isDucking) {
        this.isDucking = true;
        this.player.body.setSize(40, 30);
        this.player.body.setOffset(0, 30); // untere Kante bleibt auf Bodenhöhe!
      }
    } else if (this.isDucking) {
      this.isDucking = false;
      this.player.body.setSize(40, 60);  // reset inkl. offset (center=true setzt offset=0)
    }

    // Hintergrund immer mit Kamera-Viewport synchronisieren (scrollFactor-Alternative)
    if (this.skylineBg) {
      this.skylineBg.setPosition(this.cameras.main.scrollX, this.cameras.main.scrollY);
    }

    // Alle Pixel-Art Charaktere und Hindernisse zeichnen
    this.drawPlayer(this.player.x, this.player.y, this.isDucking, this.facingRight);
    this.knightData.forEach(({body, gfx}) => this.drawKnight(gfx, body.x, body.y, true));
    this.cannonballData.forEach(({body, gfx}) => this.drawCannonball(gfx, body.x, body.y));
    this.swordData.forEach(({body, gfx}) => this.drawSword(gfx, body.x, body.y));
    this.sharkData.forEach(({body, gfx}) => this.drawShark(gfx, body.x, body.y));
    this.birdData.forEach(({body, gfx, phase}) => this.drawBird(gfx, body.x, body.y, phase));

    // Checkpoints (prüfen ob überschritten)
    const cps = [
      [this.checkpoint1, 'Checkpoint 1 ✅', 'Checkpoint 1 ✅'],
      [this.checkpoint2, 'Checkpoint 2 ✅', 'Checkpoint 2 ✅ — Sektion 4 geschafft!'],
      [this.checkpoint3, 'Checkpoint 3 ✅', 'Checkpoint 3 ✅ — Halbzeit!'],
      [this.checkpoint4, 'Checkpoint 4 ✅', 'Checkpoint 4 ✅ — Aufzüge!'],
      [this.checkpoint5, 'Checkpoint 5 ✅', 'Checkpoint 5 ✅ — Kanonenkugeln!'],
      [this.checkpoint6, 'Checkpoint 6 ✅', 'Checkpoint 6 ✅ — Shark-Zone!'],
      [this.checkpoint7, 'Checkpoint 7 ✅', 'Checkpoint 7 ✅ — Fast am Ziel!'],
    ];
    cps.forEach(([cp, hudText, msg]) => {
      if (!cp.reached && this.player.x > cp.x) {
        cp.reached = true;
        this.respawnX = cp.x;
        this.respawnY = cp.y;
        this.checkpointText.setText(hudText);
        this.showMessage(msg);
      }
    });

    // Ziel erreicht
    if (this.player.x > this.goalX) {
      this.scene.start('WinScene', { pizzas: this.pizzaCount });
    }

    // Tod durch Fallen
    if (this.player.y > this.scale.height + 100) {
      this.respawn();
    }
  }
}

// ------------------------------------------------------------

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.add.rectangle(W/2, H/2, W, H, 0x1a0000);

    this.add.text(W/2, H/2 - 60, '💀 Gestorben!', {
      fontSize: '42px', fill: '#D32F2F', stroke: '#000', strokeThickness: 5
    }).setOrigin(0.5);

    const retry = this.add.text(W/2, H/2 + 40, 'Nochmal versuchen', {
      fontSize: '28px', fill: '#fff', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setInteractive();

    retry.on('pointerdown', () => this.scene.start('GameScene'));

    this.tweens.add({ targets: retry, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });
  }
}

// ------------------------------------------------------------

class WinScene extends Phaser.Scene {
  constructor() { super('WinScene'); }

  create(data) {
    const W = this.scale.width;
    const H = this.scale.height;
    const pizzas = data?.pizzas ?? 0;

    this.add.rectangle(W/2, H/2, W, H, 0x1a2e1a);

    this.add.text(W/2, H/2 - 120, '🎉 Level Geschafft! 🎉', {
      fontSize: '36px', fill: '#FFD700', stroke: '#000', strokeThickness: 5
    }).setOrigin(0.5);

    this.add.text(W/2, H/2 - 40, `🍕 ${pizzas}/25 Pizzas gesammelt`, {
      fontSize: '28px', fill: '#fff', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);

    // Sternwertung (3★ = 22+, 2★ = 15+, 1★ = alles andere)
    const stars = pizzas >= 22 ? '⭐⭐⭐' : pizzas >= 15 ? '⭐⭐' : '⭐';
    this.add.text(W/2, H/2 + 30, stars, { fontSize: '48px' }).setOrigin(0.5);

    const retry = this.add.text(W/2, H/2 + 110, 'Nochmal spielen', {
      fontSize: '26px', fill: '#aaa', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setInteractive();

    retry.on('pointerdown', () => this.scene.start('GameScene'));
  }
}

// ============================================================
// Phaser-Konfiguration & Start
// ============================================================

const config = {
  type: Phaser.CANVAS,
  backgroundColor: '#1E88E5',
  scale: {
    // FIT: feste Auflösung, Phaser skaliert auf jeden Bildschirm — der Standard für HTML5-Spiele
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 570,   // ~2.25:1 — passt zu modernen iPhones im Landscape-Modus
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

const game = new Phaser.Game(config);
