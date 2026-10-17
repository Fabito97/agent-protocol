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
      speed: 210,
      hp: 100,
      maxHp: 100,
      isMoving: false,
      facingAngle: 0
    };

    this.enemies = [];
    this.shards = [];
    this.projectiles = [];
    this.keys = {};

    this.setupUI();
    this.setupInput();
    this.initStartNg();
    this.startLoop();
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
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Mouse aiming
    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left + this.renderer.camera.x;
      const mouseY = e.clientY - rect.top + this.renderer.camera.y;
      this.player.facingAngle = Math.atan2(mouseY - this.player.y, mouseX - this.player.x);
    });
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
    this.enemies = [];
    this.shards = [];
    this.projectiles = [];
    this.startTime = performance.now();

    this.renderer.centerCamera(this.player.x, this.player.y);
    this.swarm.initPositions(this.player.x, this.player.y);

    document.getElementById('hud-sector').textContent = String(this.sector).padStart(2, '0');
    this.updateHUD();

    this.logThought('system', `Infiltrating Sector ${this.sector}... Neural matrix initialized.`);

    // Spawn Knowledge Shard for Vector-02
    this.shards.push({
      x: 140,
      y: -120,
      toolName: 'EMP_RESONANCE',
      vector: [0.92, -0.38, 0.45, 0.12]
    });

    // Spawn Corrupted Minions
    const minionCount = 4 + this.sector * 2;
    for (let i = 0; i < minionCount; i++) {
      const angle = (i / minionCount) * Math.PI * 2;
      const dist = 340 + Math.random() * 120;
      this.enemies.push({
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        hp: 40 + this.sector * 10,
        maxHp: 40 + this.sector * 10,
        speed: 70 + Math.random() * 20,
        isBoss: false
      });
    }

    // Spawn Quantum Firewall Boss in Sector
    const bossAngle = Math.random() * Math.PI * 2;
    this.enemies.push({
      x: Math.cos(bossAngle) * 450,
      y: Math.sin(bossAngle) * 450,
      hp: 300 + this.sector * 120,
      maxHp: 300 + this.sector * 120,
      speed: 35,
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
   * Update Player Movement & Bounds
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
  }

  /**
   * Update Enemy Movement & Attack Logic
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

      // Damage player on contact
      if (dist < 28) {
        this.player.hp -= 15 * dt;
        this.renderer.addParticleBurst(this.player.x, this.player.y, '#ff3366', 3);
        if (this.player.hp <= 0) {
          this.gameOver();
          return;
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

          if (dist < (e.isBoss ? 40 : 18)) {
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
    document.getElementById('hud-health-bar').style.width = `${healthPercent}%`;
    document.getElementById('hud-health-text').textContent = `${healthPercent}%`;
    document.getElementById('hud-tokens').textContent = this.computeTokens;

    // Agent status in dock
    document.getElementById('status-recon').textContent = this.swarm.agents[0].status;
    document.getElementById('status-vector').textContent = this.swarm.agents[1].status;
    document.getElementById('status-striker').textContent = this.swarm.agents[2].status;
  }
}

// Boot Game Controller when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.game = new GameController();
});
