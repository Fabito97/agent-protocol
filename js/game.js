/**
 * Master Game Controller & State Machine for Agent Protocol
 * Orchestrates Game Loop, Input Handling, Roguelite Upgrades, and start.ng Integration
 */

import { getPlayer, signIn, saveScore, getLeaderboard, handleRedirectSession, DEFAULT_STYLE } from './startng.js';
import { audio } from './audio.js';
import { RagEngine } from './rag.js';
import { AgentSwarm } from './agents.js';
import { Renderer } from './renderer.js';

class GameController {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.renderer = new Renderer(this.canvas);
    this.rag = new RagEngine();
    this.swarm = new AgentSwarm(this.rag, audio, (tag, msg) => this.logThought(tag, msg));

    this.playerStyle = { ...DEFAULT_STYLE };
    this.playerInfo = null;

    // Master Game State
    this.state = 'TITLE'; // TITLE, PLAYING, UPGRADE, GAMEOVER
    this.sector = 1;
    this.computeTokens = 0;
    this.gameTime = 0;
    this.startTime = 0;
    this.lastFrameTime = performance.now();

    this.player = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      speed: 220,
      hp: 100,
      maxHp: 100,
      shield: 100,
      maxShield: 100,
      invulnerableTimer: 0,
      shieldRegenTimer: 0,
      isMoving: false,
      facingAngle: 0,
      shootCooldown: 0
    };

    this.isShooting = false;
    this.enemies = [];
    this.shards = [];
    this.projectiles = [];
    this.pickups = [];
    this.keys = {};

    this.setupUI();
    this.setupInput();
    this.initStartNg();
    this.startLoop();
  }

  /**
   * Agent Swarm Subagents Getter for Renderer
   */
  get agents() {
    return this.swarm ? this.swarm.agents : [];
  }

  /**
   * Initialize start.ng player session & profile card
   */
  async initStartNg() {
    handleRedirectSession();
    try {
      const data = await getPlayer();
      this.playerInfo = data;
      const active = data.active;

      if (active) {
        this.playerStyle = active.style || { ...DEFAULT_STYLE };
        
        // Populate start.ng profile card
        const card = document.getElementById('startng-profile-card');
        const faceImg = document.getElementById('player-face-img');
        const nameEl = document.getElementById('player-display-name');
        const accountEl = document.getElementById('player-account-tag');
        const signinBtn = document.getElementById('signin-btn');

        if (active.face) {
          faceImg.src = active.face;
        } else {
          faceImg.style.display = 'none';
        }

        nameEl.textContent = active.name || 'Operative';
        accountEl.textContent = data.user?.account ? `@${data.user.account}` : 'Guest Mode';
        signinBtn.hidden = data.isSignedIn;
        signinBtn.onclick = () => signIn();

        card.hidden = false;
      }
    } catch (e) {
      console.warn('[Game] start.ng init error:', e);
    }
  }

  /**
   * Wire DOM buttons and UI listeners
   */
  setupUI() {
    // Start button
    document.getElementById('start-game-btn').onclick = () => {
      audio.init();
      audio.startAmbient();
      document.getElementById('screen-title').classList.remove('active');
      this.startSector(1);
    };

    // Retry button
    document.getElementById('retry-btn').onclick = () => {
      document.getElementById('screen-gameover').classList.remove('active');
      document.getElementById('screen-gameover').hidden = true;
      this.startSector(1);
    };

    // Leaderboard buttons
    document.getElementById('leaderboard-btn').onclick = () => this.showLeaderboard();
    document.getElementById('debrief-leaderboard-btn').onclick = () => this.showLeaderboard();
    document.getElementById('close-leaderboard-btn').onclick = () => {
      document.getElementById('screen-leaderboard').classList.remove('active');
      document.getElementById('screen-leaderboard').hidden = true;
    };

    // Audio mute button
    document.getElementById('sound-btn').onclick = () => {
      audio.init();
      const isMuted = audio.toggleMute();
      document.getElementById('sound-icon-on').style.display = isMuted ? 'none' : 'block';
      document.getElementById('sound-icon-off').style.display = isMuted ? 'block' : 'none';
    };

    // Toggle Thought Stream panel
    document.getElementById('toggle-stream-btn').onclick = () => {
      const panel = document.getElementById('thought-stream-panel');
      panel.classList.toggle('collapsed');
    };
  }

  /**
   * Keyboard & Virtual Joystick Input
   */
  setupInput() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      audio.init();
      if (e.code === 'Space') {
        this.isShooting = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (e.code === 'Space') {
        this.isShooting = false;
      }
    });

    // Mouse aiming & firing
    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left + this.renderer.camera.x;
      const mouseY = e.clientY - rect.top + this.renderer.camera.y;
      this.player.facingAngle = Math.atan2(mouseY - this.player.y, mouseX - this.player.x);
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0 && this.state === 'PLAYING') {
        this.isShooting = true;
        audio.init();
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.isShooting = false;
      }
    });

    // Touch support for mobile action button
    const touchBtn = document.getElementById('touch-rag-btn');
    if (touchBtn) {
      touchBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.isShooting = true;
        audio.init();
      });
      touchBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.isShooting = false;
      });
    }
  }

  /**
   * Append live log to the Agent Thought Stream HUD
   */
  logThought(tag, message) {
    const logContainer = document.getElementById('thought-log');
    if (!logContainer) return;

    const entry = document.createElement('div');
    entry.className = 'log-entry';

    const tagSpan = document.createElement('span');
    tagSpan.className = `log-tag ${tag.toLowerCase()}`;
    tagSpan.textContent = `[${tag.toUpperCase()}]`;

    const msgSpan = document.createElement('span');
    msgSpan.className = 'log-msg';
    msgSpan.textContent = message;

    entry.appendChild(tagSpan);
    entry.appendChild(msgSpan);
    logContainer.appendChild(entry);

    // Keep log clean (last 25 entries)
    if (logContainer.children.length > 25) {
      logContainer.removeChild(logContainer.children[0]);
    }
    logContainer.scrollTop = logContainer.scrollHeight;
  }

  /**
   * Starts or restarts a sector
   */
  startSector(sectorNum) {
    this.sector = sectorNum;
    this.state = 'PLAYING';
    this.player.x = 0;
    this.player.y = 0;
    this.player.hp = this.player.maxHp;
    this.player.shield = this.player.maxShield;
    this.player.invulnerableTimer = 0;
    this.player.shieldRegenTimer = 0;
    this.player.shootCooldown = 0;
    this.isShooting = false;

    this.enemies = [];
    this.shards = [];
    this.projectiles = [];
    this.pickups = [];
    this.startTime = performance.now();

    this.renderer.centerCamera(this.player.x, this.player.y);
    this.swarm.initPositions(this.player.x, this.player.y);

    document.getElementById('hud-sector').textContent = String(this.sector).padStart(2, '0');
    this.updateHUD();

    this.logThought('system', `Infiltrating Sector ${this.sector}... Neural matrix initialized.`);

    // Spawn Knowledge Shard for Vector-02 in visible perimeter
    this.shards.push({
      x: 180,
      y: -140,
      toolName: 'EMP_RESONANCE',
      vector: [0.92, -0.38, 0.45, 0.12]
    });

    // Spawn Corrupted Combat Drones (spawned outside camera viewport)
    const minionCount = 4 + this.sector * 2;
    for (let i = 0; i < minionCount; i++) {
      const angle = (i / minionCount) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 560 + Math.random() * 160;
      this.enemies.push({
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        hp: 35 + this.sector * 8,
        maxHp: 35 + this.sector * 8,
        speed: 45 + Math.random() * 20,
        isBoss: false
      });
    }

    // Spawn Quantum Firewall Boss in Sector
    const bossAngle = Math.random() * Math.PI * 2;
    this.enemies.push({
      x: Math.cos(bossAngle) * 660,
      y: Math.sin(bossAngle) * 660,
      hp: 300 + this.sector * 120,
      maxHp: 300 + this.sector * 120,
      speed: 30,
      isBoss: true,
      shieldActive: true,
      vulnerable: false
    });
  }

  /**
   * Main 60 FPS Game Loop
   */
  startLoop() {
    const loop = (currentTime) => {
      try {
        const dt = Math.min((currentTime - this.lastFrameTime) / 1000, 0.1);
        this.lastFrameTime = currentTime;
        this.gameTime += dt;

        if (this.state === 'PLAYING') {
          this.updatePlayer(dt);
          this.swarm.update(this, dt);
          this.updateEnemies(dt);
          this.updateProjectiles(dt);
          this.updatePickups(dt);
          this.checkSectorClear();
          this.updateHUD();
        }

        // Render Canvas
        this.renderer.render(this, this.playerStyle);
      } catch (err) {
        console.error('[Game Loop Error]', err);
      }

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /**
   * Update Player Movement & Shield & Weapon Firing
   */
  updatePlayer(dt) {
    let moveX = 0;
    let moveY = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveY -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveY += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

    const len = Math.hypot(moveX, moveY);
    this.player.isMoving = len > 0;

    if (this.player.isMoving) {
      this.player.x += (moveX / len) * this.player.speed * dt;
      this.player.y += (moveY / len) * this.player.speed * dt;
    }

    // Shield Regeneration & Invulnerability Timer
    if (this.player.invulnerableTimer > 0) {
      this.player.invulnerableTimer -= dt;
    }

    if (this.player.shieldRegenTimer > 0) {
      this.player.shieldRegenTimer -= dt;
    } else if (this.player.shield < this.player.maxShield) {
      this.player.shield = Math.min(this.player.maxShield, this.player.shield + 25 * dt);
    }

    // Weapon Cooldown & Manual Plasma Blaster
    if (this.player.shootCooldown > 0) {
      this.player.shootCooldown -= dt;
    }

    if ((this.isShooting || this.keys['Space']) && this.player.shootCooldown <= 0) {
      this.playerShoot();
      this.player.shootCooldown = 0.16; // Rapid-fire plasma blaster
    }
  }

  /**
   * Player fires manual plasma blaster
   */
  playerShoot() {
    audio.playLaser();
    const spawnDist = 26;
    const px = this.player.x + Math.cos(this.player.facingAngle) * spawnDist;
    const py = this.player.y + Math.sin(this.player.facingAngle) * spawnDist;

    this.projectiles.push({
      x: px,
      y: py,
      vx: Math.cos(this.player.facingAngle) * 640,
      vy: Math.sin(this.player.facingAngle) * 640,
      damage: 28,
      color: '#00f2fe',
      radius: 5,
      fromPlayer: true
    });

    // Muzzle blast particles
    this.renderer.addParticleBurst(px, py, '#00f2fe', 4);
  }

  /**
   * Update Energy Crystals and Nanite Pickups
   */
  updatePickups(dt) {
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      const dx = this.player.x - p.x;
      const dy = this.player.y - p.y;
      const dist = Math.hypot(dx, dy);

      // Vacuum magnetic attraction towards player
      if (dist < 180) {
        p.x += (dx / dist) * 240 * dt;
        p.y += (dy / dist) * 240 * dt;
      }

      // Collect pickup
      if (dist < 28) {
        if (p.type === 'health') {
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + 30);
          this.player.shield = Math.min(this.player.maxShield, this.player.shield + 20);
          this.renderer.addFloatingText(this.player.x, this.player.y - 30, '+NANITE REPAIR', '#00ff87');
          this.renderer.addParticleBurst(this.player.x, this.player.y, '#00ff87', 12);
        } else {
          this.computeTokens += 10;
          this.renderer.addFloatingText(this.player.x, this.player.y - 30, '+10 TOKENS', '#ffaa00');
          this.renderer.addParticleBurst(this.player.x, this.player.y, '#ffaa00', 8);
        }
        this.pickups.splice(i, 1);
      }
    }
  }

  /**
   * Update Enemy Movement & Attack Logic with Invulnerability & Knockback
   */
  updateEnemies(dt) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const dist = Math.hypot(dx, dy);

      // Enemies advance toward player/core
      if (dist > 15) {
        enemy.x += (dx / dist) * enemy.speed * dt;
        enemy.y += (dy / dist) * enemy.speed * dt;
      }

      // Damage player on contact with grace period & knockback
      if (dist < 32) {
        if (this.player.invulnerableTimer <= 0) {
          this.player.invulnerableTimer = 0.65;
          this.player.shieldRegenTimer = 4.0;

          // Absorb via shield first
          if (this.player.shield > 0) {
            const absorbed = Math.min(this.player.shield, 25);
            this.player.shield -= absorbed;
            const leftover = 25 - absorbed;
            this.player.hp -= leftover;
            audio.playShieldDeflect();
            this.renderer.addFloatingText(this.player.x, this.player.y - 20, `-${absorbed} SHIELD`, '#00f2fe');
          } else {
            this.player.hp -= 20;
            audio.playExplosion();
            this.renderer.addFloatingText(this.player.x, this.player.y - 20, '-20 HP', '#ff3366');
          }

          // Knockback enemy
          enemy.x -= (dx / (dist || 1)) * 45;
          enemy.y -= (dy / (dist || 1)) * 45;

          this.renderer.addParticleBurst(this.player.x, this.player.y, '#ff3366', 10);

          if (this.player.hp <= 0) {
            this.player.hp = 0;
            this.gameOver();
            return;
          }
        }
      }
    }
  }

  /**
   * Update Lasers and EMP Waves
   */
  updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];

      if (p.type === 'emp') {
        p.radius += p.speed * dt;
        p.life -= dt * 1.5;

        // EMP collision with enemies & boss shield
        this.enemies.forEach(e => {
          const dist = Math.hypot(e.x - p.x, e.y - p.y);
          if (dist <= p.radius + 20) {
            if (e.isBoss && e.shieldActive) {
              e.shieldActive = false;
              e.vulnerable = true;
              this.renderer.addParticleBurst(e.x, e.y, '#00ff87', 30);
              this.renderer.addFloatingText(e.x, e.y - 20, 'SHIELD SHATTERED!', '#00ff87');
              this.logThought('striker', 'Quantum shield shattered by Resonance EMP! Core exposed.');
            }
            e.hp -= p.damage * dt * 2;
          }
        });

        if (p.life <= 0) {
          this.projectiles.splice(i, 1);
        }
      } else {
        // Standard Laser
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Collision with enemies
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const e = this.enemies[j];
          const dist = Math.hypot(e.x - p.x, e.y - p.y);

          if (dist < (e.isBoss ? 45 : 22)) {
            if (e.isBoss && e.shieldActive) {
              // Attack deflected by shield
              audio.playShieldDeflect();
              this.renderer.addParticleBurst(p.x, p.y, '#ff007f', 6);
              this.renderer.addFloatingText(p.x, p.y, 'DEFLECTED', '#ff007f');
            } else {
              // Direct damage
              e.hp -= p.damage;
              audio.playExplosion();
              this.renderer.addParticleBurst(p.x, p.y, '#ffaa00', 8);

              if (e.hp <= 0) {
                this.enemies.splice(j, 1);
                this.computeTokens += e.isBoss ? 50 : 10;
                this.renderer.addFloatingText(e.x, e.y, e.isBoss ? '+50 TOKENS' : '+10 TOKENS', '#ffaa00');

                // Spawn pickups on defeat
                if (e.isBoss) {
                  for (let k = 0; k < 4; k++) {
                    this.pickups.push({
                      x: e.x + (Math.random() - 0.5) * 60,
                      y: e.y + (Math.random() - 0.5) * 60,
                      type: 'token'
                    });
                  }
                  this.pickups.push({ x: e.x, y: e.y, type: 'health' });
                } else {
                  const dropRoll = Math.random();
                  if (dropRoll < 0.65) {
                    this.pickups.push({ x: e.x, y: e.y, type: 'token' });
                  } else if (dropRoll < 0.85) {
                    this.pickups.push({ x: e.x, y: e.y, type: 'health' });
                  }
                }
              }
            }

            this.projectiles.splice(i, 1);
            break;
          }
        }
      }
    }
  }

  /**
   * Check if Sector has been cleared
   */
  checkSectorClear() {
    if (this.enemies.length === 0 && this.state === 'PLAYING') {
      audio.playVictory();
      this.state = 'UPGRADE';
      this.showUpgradeScreen();
    }
  }

  /**
   * Displays the 3 randomized Roguelite Cognitive Upgrades
   */
  showUpgradeScreen() {
    const screen = document.getElementById('screen-upgrade');
    const container = document.getElementById('upgrade-cards-container');
    container.innerHTML = '';

    const upgradePool = [
      {
        title: 'Context Window Expansion',
        desc: 'Increases swarm active context memory by +2 slots. Allows holding multiple RAG countermeasure blueprints.',
        icon: '🧠',
        tier: 'TIER II ARCHITECTURE',
        action: () => { this.rag.maxContextSlots += 2; }
      },
      {
        title: 'Embedding Accelerator',
        desc: 'Vector-02 extracts knowledge shards 50% faster and expands semantic retrieval search radius.',
        icon: '⚡',
        tier: 'TIER II RAG CORE',
        action: () => { this.swarm.agents[1].speed += 1.2; }
      },
      {
        title: 'Overclocked Emitters',
        desc: 'Striker-03 weapon fire rate boosted by 30%. Laser pulse velocity increased.',
        icon: '🔫',
        tier: 'TIER II COMBAT',
        action: () => { this.swarm.agents[2].attackCooldown = 0.25; }
      },
      {
        title: 'Perception Radar Boost',
        desc: 'Recon-01 perception cone range increased by 40%. Automatically reveals enemy weak points.',
        icon: '🛰️',
        tier: 'TIER II SENSORY',
        action: () => { this.swarm.agents[0].distance += 25; }
      }
    ];

    // Pick 3 random upgrades
    const choices = upgradePool.sort(() => 0.5 - Math.random()).slice(0, 3);
    choices.forEach(opt => {
      const card = document.createElement('div');
      card.className = 'upgrade-card';
      card.innerHTML = `
        <div class="card-icon">${opt.icon}</div>
        <div class="card-title">${opt.title}</div>
        <div class="card-desc">${opt.desc}</div>
        <span class="card-tier">${opt.tier}</span>
      `;
      card.onclick = () => {
        opt.action();
        screen.classList.remove('active');
        screen.hidden = true;
        this.startSector(this.sector + 1);
      };
      container.appendChild(card);
    });

    screen.hidden = false;
    screen.classList.add('active');
  }

  /**
   * Game Over & Leaderboard Submission
   */
  async gameOver() {
    this.state = 'GAMEOVER';
    audio.playExplosion();

    const screen = document.getElementById('screen-gameover');
    const elapsedSecs = Math.max(1, Math.floor((performance.now() - this.startTime) / 1000));
    const finalEfficiency = Math.min(1000, Math.floor((this.computeTokens * 10) / (elapsedSecs * 0.1 || 1)));

    document.getElementById('final-sectors').textContent = this.sector;
    document.getElementById('final-rag').textContent = this.rag.totalRetrievals;
    document.getElementById('final-efficiency').textContent = finalEfficiency;
    document.getElementById('final-time').textContent = `${Math.floor(elapsedSecs / 60)}:${String(elapsedSecs % 60).padStart(2, '0')}`;

    screen.hidden = false;
    screen.classList.add('active');

    // Auto-save run to start.ng leaderboard
    const statusMsg = document.getElementById('debrief-score-message');
    statusMsg.textContent = 'Submitting run to start.ng leaderboard...';

    const saveRes = await saveScore({
      sectors: this.sector,
      rag_retrievals: this.rag.totalRetrievals,
      efficiency: finalEfficiency,
      time: elapsedSecs
    });

    if (saveRes.ok) {
      statusMsg.textContent = saveRes.result?.improved
        ? `New personal best! You are ranked #${saveRes.result.rank} on start.ng!`
        : `Run recorded on start.ng leaderboard (Rank #${saveRes.result?.rank || '—'}).`;
    } else {
      statusMsg.textContent = saveRes.error || 'Play signed in on start.ng to climb the global leaderboard!';
    }
  }

  /**
   * Show Global Leaderboard Drawer
   */
  async showLeaderboard() {
    const screen = document.getElementById('screen-leaderboard');
    const tbody = document.getElementById('leaderboard-tbody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Fetching live start.ng rankings...</td></tr>';

    screen.hidden = false;
    screen.classList.add('active');

    const entries = await getLeaderboard(10);
    tbody.innerHTML = '';

    if (entries.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">No ranked scores yet. Be the first to purge a sector!</td></tr>';
      return;
    }

    entries.forEach(e => {
      const tr = document.createElement('tr');
      const isMe = this.playerInfo?.user?.id === e.player_id;
      if (isMe) tr.className = 'highlight-user';

      const stats = e.stats || {};
      const formatTime = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

      tr.innerHTML = `
        <td><b>#${e.rank}</b></td>
        <td>${e.name || 'Anonymous'}</td>
        <td class="glow-cyan">${stats.sectors ?? e.score ?? 0}</td>
        <td class="glow-purple">${stats.rag_retrievals ?? 0}</td>
        <td class="glow-gold">${stats.efficiency ?? 0}</td>
        <td>${stats.time ? formatTime(stats.time) : '0:00'}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  /**
   * Sync HUD Elements
   */
  updateHUD() {
    const healthPercent = Math.max(0, Math.floor((this.player.hp / this.player.maxHp) * 100));
    const healthEl = document.getElementById('hud-health-bar');
    const healthTextEl = document.getElementById('hud-health-text');
    if (healthEl) healthEl.style.width = `${healthPercent}%`;
    if (healthTextEl) healthTextEl.textContent = `${healthPercent}%`;

    const tokensEl = document.getElementById('hud-tokens');
    if (tokensEl) tokensEl.textContent = this.computeTokens;

    // Agent status in dock
    if (this.swarm && this.swarm.agents) {
      const reconEl = document.getElementById('status-recon');
      const vectorEl = document.getElementById('status-vector');
      const strikerEl = document.getElementById('status-striker');
      if (reconEl) reconEl.textContent = this.swarm.agents[0].status;
      if (vectorEl) vectorEl.textContent = this.swarm.agents[1].status;
      if (strikerEl) strikerEl.textContent = this.swarm.agents[2].status;
    }

    // Real-Time Dynamic Mission Objective Banner
    const objText = document.getElementById('obj-text');
    if (objText) {
      const boss = this.enemies.find(e => e.isBoss);
      if (boss && boss.shieldActive) {
        objText.innerHTML = `⚠️ <b style="color:#ff007f">BOSS FIREWALL ACTIVE:</b> Escort Vector-02 to the purple Shard [RAG] to unlock EMP Countermeasure!`;
      } else if (boss && !boss.shieldActive) {
        objText.innerHTML = `⚡ <b style="color:#00ff87">FIREWALL VULNERABLE:</b> Core exposed! All units open fire! [Click or Space to Shoot]`;
      } else {
        const remaining = this.enemies.filter(e => !e.isBoss).length;
        objText.textContent = `🎯 Sector ${this.sector}: Destroy Corrupted Drones (${remaining} Remaining) • [Click or Space to Shoot]`;
      }
    }
  }
}

// Boot Game Controller when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.game = new GameController();
});
