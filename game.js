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

    // Hier später Assets laden (Bilder, Sounds)
    // this.load.image('player', 'assets/sprites/player.png');
    // this.load.audio('music', 'assets/sounds/music.mp3');
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

    // Hintergrund
    this.add.rectangle(W / 2, H / 2, W, H, 0x1E88E5);

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

    // Starten bei Tippen/Klicken
    this.input.once('pointerdown', () => {
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
    const WORLD_WIDTH = 8000;

    // Physik-Weltgrenzen
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, H);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, H);

    // Hintergrund (Mittelmeer-Blau, scrollt langsamer = Parallax-Effekt)
    this.add.rectangle(WORLD_WIDTH / 2, H / 2, WORLD_WIDTH, H, 0x1E88E5)
      .setScrollFactor(0.2);

    // Wolken-Deko (einfache weiße Rechtecke als Platzhalter)
    [[500, 80], [1800, 60], [3200, 90], [5000, 70], [6500, 85]].forEach(([x, y]) => {
      this.add.ellipse(x, y, 200, 80, 0xffffff, 0.6).setScrollFactor(0.4);
    });

    // --- Plattform-Gruppen ---
    this.platforms = this.physics.add.staticGroup();
    this.movingPlatforms = this.physics.add.group();

    // Respawn-Position (wird bei Checkpoints aktualisiert)
    this.respawnX = 100;
    this.respawnY = H - 150;

    // Pizza-Zähler
    this.pizzaCount = 0;

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

    // === SEKTION 2: Bewegliche Blöcke ===
    [[2900,H-160,120], [3200,H-200,100], [3500,H-160,150],
     [3800,H-220,120], [4100,H-180,100]].forEach(([x,y,range]) => {
      this.makeMovingPlatform(x, y, range);
    });

    // === SEKTION 3: Schmale Balken ===
    [[4400,H-160], [4530,H-200], [4660,H-170], [4790,H-210]].forEach(([x,y]) => {
      this.makePlatform(x, y, 60, 15, 0xC0643A);
    });

    // === CHECKPOINT 2 ===
    this.makePlatform(5000, H-80, 300, 20, 0xFFD700);
    this.checkpoint2 = { x: 5150, y: H-160, reached: false };
    this.makeCheckpointFlag(5120, H-80);

    // === SEKTION 4: Laser + Ritter (Plattformen) ===
    [[5400,H-160,200], [5700,H-200,180], [6000,H-170,200]].forEach(([x,y,w]) => {
      this.makePlatform(x, y, w, 20, 0xC0643A);
    });

    // === SEKTION 5: Finale ===
    [[6300,H-200,130], [6550,H-260,100], [6800,H-220,120]].forEach(([x,y,w]) => {
      this.makePlatform(x, y, w, 20, 0xD4A843);
    });

    // === ZIEL-PLATTFORM ===
    this.makePlatform(7100, H-150, 400, 30, 0xFFD700);
    this.goalX = 7300;
    this.add.text(7300, H-200, '🎯 ZIEL', {
      fontSize: '28px', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5);

    // --- Hindernisse ---
    this.createLasers(H);
    this.createKnights(H);

    // --- Pizzas ---
    this.createPizzas(H);

    // --- Spieler ---
    this.player = this.physics.add.rectangle(100, H - 150, 40, 60, 0xFF6B00);
    this.player.body.setCollideWorldBounds(true);

    // Kollisionen
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, this.movingPlatforms);

    // Kamera folgt Spieler
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // --- HUD ---
    this.pizzaText = this.add.text(20, 20, '🍕 0/10', {
      fontSize: '28px', fill: '#fff', stroke: '#000', strokeThickness: 4
    }).setScrollFactor(0).setDepth(10);

    this.checkpointText = this.add.text(W - 20, 20, '', {
      fontSize: '22px', fill: '#FFD700', stroke: '#000', strokeThickness: 3
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(10);

    // --- Touch-Steuerung ---
    this.createTouchControls(W, H);
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
    plat.body.setAllowGravity(false);
    plat.body.setImmovable(true);
    this.movingPlatforms.add(plat);
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
    this.add.rectangle(x, y - 40, 6, 80, 0x888888);
    // Flagge (Maltesisches Rot)
    this.add.rectangle(x + 20, y - 72, 40, 28, 0xD32F2F);
    // Weißes Kreuz
    this.add.rectangle(x + 20, y - 72, 6, 22, 0xffffff);
    this.add.rectangle(x + 20, y - 72, 22, 6, 0xffffff);
  }

  createLasers(H) {
    this.lasers = this.physics.add.staticGroup();
    [[5550, H-230], [5850, H-270], [6150, H-240]].forEach(([x, y]) => {
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
    [[5450, H-195, 140], [5750, H-235, 120], [6050, H-205, 140]].forEach(([x, y, range]) => {
      const knight = this.physics.add.rectangle(x, y, 35, 55, 0xB22222);
      knight.body.setAllowGravity(false);
      knight.body.setImmovable(true);
      this.knights.add(knight);
      this.tweens.add({
        targets: knight,
        x: x + range,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Linear',
        onUpdate: () => knight.body.reset(knight.x, knight.y)
      });
    });

    this.physics.add.overlap(this.player, this.knights, () => this.respawn());
  }

  createPizzas(H) {
    this.pizzas = this.physics.add.staticGroup();
    [
      [1120, H-200], [1700, H-180],          // S1
      [2900, H-220], [3500, H-230], [4100, H-240], // S2
      [4660, H-230],                          // S3
      [5550, H-290], [5850, H-320],           // S4
      [6550, H-320], [7200, H-250]            // S5
    ].forEach(([x, y]) => {
      const pizza = this.add.circle(x, y, 16, 0xFF9800);
      this.add.circle(x, y, 8, 0xD32F2F);    // Tomatensoße-Kern
      this.physics.add.existing(pizza, true);
      this.pizzas.add(pizza);
    });

    this.physics.add.overlap(this.player, this.pizzas, (player, pizza) => {
      pizza.destroy();
      this.pizzaCount++;
      this.pizzaText.setText(`🍕 ${this.pizzaCount}/10`);
      this.showMessage('+1 🍕');
    });
  }

  createTouchControls(W, H) {
    const SIZE = 85;
    const MARGIN = 20;
    const BTN_Y = H - MARGIN - SIZE / 2;

    // Links
    const bLeft = this.add.rectangle(MARGIN + SIZE/2, BTN_Y, SIZE, SIZE, 0x000000, 0.45)
      .setScrollFactor(0).setDepth(10).setInteractive();
    this.add.text(MARGIN + SIZE/2, BTN_Y, '◀', { fontSize: '38px' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(11);

    // Rechts
    const bRight = this.add.rectangle(MARGIN*2 + SIZE*1.5, BTN_Y, SIZE, SIZE, 0x000000, 0.45)
      .setScrollFactor(0).setDepth(10).setInteractive();
    this.add.text(MARGIN*2 + SIZE*1.5, BTN_Y, '▶', { fontSize: '38px' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(11);

    // Springen
    const bJump = this.add.rectangle(W - MARGIN - SIZE/2, BTN_Y, SIZE, SIZE, 0xFF9800, 0.7)
      .setScrollFactor(0).setDepth(10).setInteractive();
    this.add.text(W - MARGIN - SIZE/2, BTN_Y, 'JUMP', { fontSize: '20px', fill: '#fff', fontStyle: 'bold' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(11);

    this.controls = { left: false, right: false };

    bLeft.on('pointerdown', () => this.controls.left = true);
    bLeft.on('pointerup',   () => this.controls.left = false);
    bLeft.on('pointerout',  () => this.controls.left = false);

    bRight.on('pointerdown', () => this.controls.right = true);
    bRight.on('pointerup',   () => this.controls.right = false);
    bRight.on('pointerout',  () => this.controls.right = false);

    bJump.on('pointerdown', () => {
      if (this.player.body.blocked.down) {
        this.player.body.setVelocityY(-620);
      }
    });
  }

  respawn() {
    this.player.setPosition(this.respawnX, this.respawnY);
    this.player.body.setVelocity(0, 0);
  }

  showMessage(text) {
    const msg = this.add.text(
      this.scale.width / 2, 90, text,
      { fontSize: '30px', fill: '#FFD700', stroke: '#000', strokeThickness: 5 }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(20);
    this.time.delayedCall(1800, () => msg.destroy());
  }

  // ── Update-Loop ──────────────────────────────────────────

  update() {
    const SPEED = 300;

    if (this.controls.left) {
      this.player.body.setVelocityX(-SPEED);
    } else if (this.controls.right) {
      this.player.body.setVelocityX(SPEED);
    } else {
      this.player.body.setVelocityX(0);
    }

    // Checkpoint 1
    if (!this.checkpoint1.reached && this.player.x > this.checkpoint1.x) {
      this.checkpoint1.reached = true;
      this.respawnX = this.checkpoint1.x;
      this.respawnY = this.checkpoint1.y;
      this.checkpointText.setText('Checkpoint 1 ✅');
      this.showMessage('Checkpoint 1 ✅');
    }

    // Checkpoint 2
    if (!this.checkpoint2.reached && this.player.x > this.checkpoint2.x) {
      this.checkpoint2.reached = true;
      this.respawnX = this.checkpoint2.x;
      this.respawnY = this.checkpoint2.y;
      this.checkpointText.setText('Checkpoint 2 ✅');
      this.showMessage('Checkpoint 2 ✅ — Fast geschafft!');
    }

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

    this.add.text(W/2, H/2 - 40, `🍕 ${pizzas}/10 Pizzas gesammelt`, {
      fontSize: '28px', fill: '#fff', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);

    // Sternwertung
    const stars = pizzas >= 9 ? '⭐⭐⭐' : pizzas >= 6 ? '⭐⭐' : '⭐';
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
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#1E88E5',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 800 },
      debug: false        // auf true setzen um Kollisionsboxen zu sehen
    }
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene, WinScene]
};

const game = new Phaser.Game(config);
