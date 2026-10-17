/**
 * High-Performance 60 FPS Canvas 2D Renderer for Agent Protocol
 * Features High-Resolution Procedural Humanoid Characters, Glowing Radar Rings, and Cyber-Combat VFX
 */

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.particles = [];
    this.floatingTexts = [];
    this.camera = { x: 0, y: 0 };
    this.isCameraInit = false;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    if (!this.isCameraInit) {
      this.camera.x = -this.width / 2;
      this.camera.y = -this.height / 2;
    }
  }

  centerCamera(x = 0, y = 0) {
    this.camera.x = x - this.width / 2;
    this.camera.y = y - this.height / 2;
    this.isCameraInit = true;
  }

  /**
   * Main Render Frame
   */
  render(gameState, playerStyle) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Smooth camera tracking
    const targetCamX = gameState.player.x - this.width / 2;
    const targetCamY = gameState.player.y - this.height / 2;
    this.camera.x += (targetCamX - this.camera.x) * 0.12;
    this.camera.y += (targetCamY - this.camera.y) * 0.12;

    ctx.save();
    ctx.translate(-this.camera.x, -this.camera.y);

    try {
      // 1. Grid Background & Arena Borders
      this.drawArena(ctx, gameState.sector);

      // 2. Neural Tether Rays
      this.drawSwarmTethers(ctx, gameState.player, gameState.agents);

      // 3. Knowledge Shards (Vector DB Data Nodes)
      this.drawKnowledgeShards(ctx, gameState.shards, gameState.gameTime);

      // 4. Energy Tokens & Health Drops
      this.drawPickups(ctx, gameState.pickups, gameState.gameTime);

      // 5. Enemies & Quantum Firewall Boss
      this.drawEnemies(ctx, gameState.enemies, gameState.gameTime);

      // 6. Subagents (Recon, Vector, Striker)
      this.drawSubagents(ctx, gameState.agents, gameState.gameTime);

      // 7. Lead Core Architect (Player Humanoid)
      this.drawLeadArchitect(ctx, gameState.player, playerStyle, gameState.gameTime);

      // 8. Lasers, EMP Shockwaves & Projectiles
      this.drawProjectiles(ctx, gameState.projectiles);

      // 9. Particle Bursts
      this.drawParticles(ctx);

      // 10. Floating Combat Text
      this.drawFloatingTexts(ctx);

    } catch (err) {
      console.error('[Render Error]', err);
    } finally {
      ctx.restore();
    }

    // 11. Screen-space Radar Arrows (points to off-screen enemies & shards)
    this.drawRadarArrows(ctx, gameState);
  }

  /**
   * Draw Arena Bounds & Cyber Grid
   */
  drawArena(ctx, sector) {
    const gridSize = 80;
    const startX = Math.floor(this.camera.x / gridSize) * gridSize;
    const startY = Math.floor(this.camera.y / gridSize) * gridSize;
    const endX = startX + this.width + gridSize;
    const endY = startY + this.height + gridSize;

    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.08)';

    ctx.beginPath();
    for (let x = startX; x <= endX; x += gridSize) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();

    // Intersection dots
    ctx.fillStyle = 'rgba(0, 242, 254, 0.25)';
    for (let x = startX; x <= endX; x += gridSize * 2) {
      for (let y = startY; y <= endY; y += gridSize * 2) {
        ctx.fillRect(x - 2, y - 2, 4, 4);
      }
    }

    // Outer Sector Boundary Ring
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.3)';
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 12]);
    ctx.beginPath();
    ctx.arc(0, 0, 950, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Glowing Neural Tether Lines
   */
  drawSwarmTethers(ctx, player, agents) {
    if (!agents || !Array.isArray(agents) || !player) return;
    ctx.save();
    agents.forEach(agent => {
      const dist = Math.hypot(player.x - agent.x, player.y - agent.y);
      if (dist < 2) return;

      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(agent.x, agent.y);

      try {
        const grad = ctx.createLinearGradient(player.x, player.y, agent.x, agent.y);
        grad.addColorStop(0, 'rgba(0, 242, 254, 0.35)');
        grad.addColorStop(1, agent.colorAlpha || 'rgba(155, 81, 224, 0.25)');
        ctx.strokeStyle = grad;
      } catch (e) {
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.3)';
      }

      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
    });
    ctx.restore();
  }

  /**
   * PROCEDURAL HUMANOID DRAWER (Scaled 2.2x for High Legibility)
   */
  drawHumanoid(ctx, x, y, opts) {
    const {
      scale = 2.2,
      skinColor = '#8d5524',
      hair = 'short',
      hairColor = '#17120f',
      hat = 'none',
      accessory = 'none',
      primaryColor = '#00f2fe',
      secondaryColor = '#1a1f2c',
      isWalking = false,
      walkCycle = 0,
      facingAngle = 0,
      weaponGlow = null
    } = opts;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // 1. Soft Shadow on Floor
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(0, 20, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Animated Legs (Secondary Color)
    const legOffset = isWalking ? Math.sin(walkCycle) * 5 : 0;
    ctx.fillStyle = secondaryColor || '#1a1f2c';
    // Left Leg
    ctx.fillRect(-7, 7, 5, 13 + legOffset);
    // Right Leg
    ctx.fillRect(2, 7, 5, 13 - legOffset);

    // Boots (Black with Neon Accent)
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(-8, 18 + legOffset, 7, 4);
    ctx.fillRect(1, 18 - legOffset, 7, 4);
    ctx.fillStyle = primaryColor;
    ctx.fillRect(-8, 20 + legOffset, 7, 1);
    ctx.fillRect(1, 20 - legOffset, 7, 1);

    // 3. Torso / Jacket (Primary Color)
    ctx.fillStyle = primaryColor || '#00f2fe';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(-9, -7, 18, 15, 3);
    } else {
      ctx.rect(-9, -7, 18, 15);
    }
    ctx.fill();

    // Chest Core / Armor Plate
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillRect(-2, -4, 4, 7);

    // 4. Arms
    ctx.fillStyle = primaryColor || '#00f2fe';
    ctx.fillRect(-12, -5 - legOffset * 0.4, 3.5, 11);
    ctx.fillRect(8.5, -5 + legOffset * 0.4, 3.5, 11);

    // Hands
    ctx.fillStyle = skinColor || '#8d5524';
    ctx.fillRect(-12, 6 - legOffset * 0.4, 3.5, 3.5);
    ctx.fillRect(8.5, 6 + legOffset * 0.4, 3.5, 3.5);

    // Handheld Cyber Weapon (Aims in facing direction)
    if (weaponGlow) {
      ctx.save();
      ctx.fillStyle = '#222';
      ctx.fillRect(8, 2, 9, 3);
      ctx.fillStyle = weaponGlow;
      ctx.shadowColor = weaponGlow;
      ctx.shadowBlur = 8;
      ctx.fillRect(15, 1.5, 3, 4);
      ctx.restore();
    }

    // 5. Head / Neck (Skin Color)
    ctx.fillStyle = skinColor || '#8d5524';
    ctx.fillRect(-2.5, -10, 5, 4); // Neck
    ctx.beginPath();
    ctx.arc(0, -16, 9, 0, Math.PI * 2);
    ctx.fill();

    // Face Details: Cyber Eyes
    ctx.fillStyle = '#00f2fe';
    ctx.fillRect(1, -17, 2, 2);
    ctx.fillRect(5, -17, 2, 2);

    // 6. Hair Rendering
    ctx.fillStyle = hairColor || '#17120f';
    if (hair === 'afro') {
      ctx.beginPath();
      ctx.arc(0, -18, 13, 0, Math.PI * 2);
      ctx.fill();
      // Re-fill face over base
      ctx.fillStyle = skinColor;
      ctx.beginPath();
      ctx.arc(1, -15, 8.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#00f2fe';
      ctx.fillRect(2, -16, 2, 2);
      ctx.fillRect(6, -16, 2, 2);
    } else if (hair === 'braids') {
      ctx.fillRect(-9, -23, 19, 7);
      ctx.fillRect(-10, -18, 4, 15);
      ctx.fillRect(7, -18, 4, 15);
      ctx.fillRect(-3, -24, 7, 5);
    } else if (hair === 'dreads') {
      ctx.fillRect(-10, -23, 20, 7);
      ctx.fillRect(-11, -17, 4, 17);
      ctx.fillRect(7, -17, 4, 17);
      ctx.fillRect(-7, -15, 3.5, 18);
    } else if (hair === 'bun') {
      ctx.beginPath();
      ctx.arc(0, -19, 9, Math.PI, 0);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -27, 5.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (hair === 'ponytail') {
      ctx.beginPath();
      ctx.arc(0, -18, 9, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(5, -23, 5, 14);
    } else if (hair === 'short') {
      ctx.beginPath();
      ctx.arc(0, -18, 9.5, Math.PI, 0);
      ctx.fill();
    }

    // 7. Hats
    if (hat === 'crown') {
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath();
      ctx.moveTo(-8, -22);
      ctx.lineTo(-8, -28);
      ctx.lineTo(-4, -25);
      ctx.lineTo(0, -30);
      ctx.lineTo(4, -25);
      ctx.lineTo(8, -28);
      ctx.lineTo(8, -22);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ff0055';
      ctx.fillRect(-1.5, -26, 3, 3);
    } else if (hat === 'beanie') {
      ctx.fillStyle = '#ff007f';
      ctx.beginPath();
      ctx.arc(0, -21, 9.5, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(-9, -22, 18, 3.5);
    } else if (hat === 'cap') {
      ctx.fillStyle = '#00f2fe';
      ctx.beginPath();
      ctx.arc(0, -20, 9.5, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(1, -21, 12, 3);
    } else if (hat === 'tophat') {
      ctx.fillStyle = '#111';
      ctx.fillRect(-11, -21, 22, 3);
      ctx.fillRect(-6, -32, 12, 11);
      ctx.fillStyle = '#00f2fe';
      ctx.fillRect(-6, -23, 12, 2);
    }

    // 8. Accessories
    if (accessory === 'glasses') {
      ctx.fillStyle = 'rgba(0, 242, 254, 0.9)';
      ctx.fillRect(0, -18, 4, 3);
      ctx.fillRect(5, -18, 4, 3);
    } else if (accessory === 'earrings') {
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath();
      ctx.arc(-8.5, -14, 1.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (accessory === 'backpack') {
      ctx.fillStyle = '#333';
      ctx.fillRect(-11, -5, 3.5, 12);
    }

    ctx.restore();
  }

  /**
   * Draw the Player / Lead Core Architect with Floating Health Bar and Target Line
   */
  drawLeadArchitect(ctx, player, playerStyle, time) {
    // 1. Glowing Floor Pedestal
    ctx.save();
    ctx.translate(player.x, player.y);

    // Double Ring
    ctx.beginPath();
    ctx.arc(0, 18, 34, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 18, 26, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 242, 254, 0.08)';
    ctx.fill();

    // Aiming Laser Guide
    const aimLength = 65;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(player.facingAngle) * aimLength, Math.sin(player.facingAngle) * aimLength);
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();

    ctx.restore();

    // 2. Draw Humanoid Character
    this.drawHumanoid(ctx, player.x, player.y, {
      scale: 2.3,
      skinColor: playerStyle?.skinColor || '#8d5524',
      hair: playerStyle?.hair || 'short',
      hairColor: playerStyle?.hairColor || '#17120f',
      hat: playerStyle?.hat || 'none',
      accessory: playerStyle?.accessory || 'none',
      primaryColor: playerStyle?.primaryColor || '#00f2fe',
      secondaryColor: playerStyle?.secondaryColor || '#1a1f2c',
      isWalking: player.isMoving,
      walkCycle: time * 12,
      facingAngle: player.facingAngle,
      weaponGlow: '#00f2fe'
    });

    // 3. Overhead Name & Health / Shield Bar
    ctx.save();
    ctx.translate(player.x, player.y);

    // Name Tag
    ctx.font = '800 11px monospace';
    ctx.fillStyle = '#00f2fe';
    ctx.textAlign = 'center';
    ctx.fillText('YOU [ARCHITECT]', 0, -48);

    // Shield Bar (Cyan)
    const maxShield = player.maxShield || 100;
    const curShield = player.shield != null ? Math.max(0, player.shield) : maxShield;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(-28, -42, 56, 4);
    ctx.fillStyle = '#00f2fe';
    ctx.fillRect(-28, -42, Math.min(1, curShield / maxShield) * 56, 4);

    // Health Bar (Green)
    const maxHp = player.maxHp || 100;
    const curHp = player.hp != null ? Math.max(0, player.hp) : maxHp;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(-28, -36, 56, 4);
    ctx.fillStyle = curHp > 30 ? '#00ff87' : '#ff3366';
    ctx.fillRect(-28, -36, Math.min(1, curHp / maxHp) * 56, 4);

    ctx.restore();
  }

  /**
   * Draw the 3 Autonomous Humanoid Subagents with Pedestals & Perception Cones
   */
  drawSubagents(ctx, agents, time) {
    if (!agents || !Array.isArray(agents)) return;
    agents.forEach(agent => {
      ctx.save();
      ctx.translate(agent.x, agent.y);

      // Floor Pedestal Ring
      ctx.beginPath();
      ctx.arc(0, 16, 26, 0, Math.PI * 2);
      ctx.strokeStyle = agent.colorAlpha || 'rgba(0, 242, 254, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Recon-01 Perception Radar Cone
      if (agent.type === 'recon') {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 200, agent.angle - 0.55, agent.angle + 0.55);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 242, 254, 0.07)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.25)';
        ctx.stroke();
      }

      // Vector-02 RAG Aura
      if (agent.type === 'vector' && agent.isQuerying) {
        ctx.beginPath();
        ctx.arc(0, 0, 42 + Math.sin(time * 8) * 8, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(155, 81, 224, 0.8)';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Overhead Tag
      ctx.font = '800 10px monospace';
      ctx.fillStyle = agent.primaryColor;
      ctx.textAlign = 'center';
      ctx.fillText(agent.name, 0, -42);

      ctx.restore();

      // Draw Subagent Humanoid
      this.drawHumanoid(ctx, agent.x, agent.y, {
        scale: 1.9,
        skinColor: agent.skinColor,
        hair: agent.hair,
        hairColor: agent.hairColor,
        hat: agent.hat,
        accessory: agent.accessory,
        primaryColor: agent.primaryColor,
        secondaryColor: '#0c0f18',
        isWalking: agent.isMoving,
        walkCycle: time * 10,
        facingAngle: agent.angle,
        weaponGlow: agent.primaryColor
      });
    });
  }

  /**
   * Draw Knowledge Shards (Large Glowing Vector DB Crystals)
   */
  drawKnowledgeShards(ctx, shards, time) {
    shards.forEach(shard => {
      ctx.save();
      ctx.translate(shard.x, shard.y);

      // Outer Pulse Ring
      const pulse = Math.sin(time * 4) * 6;
      ctx.beginPath();
      ctx.arc(0, 0, 36 + pulse, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(155, 81, 224, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();

      // Rotating Crystal Diamond
      ctx.rotate(time * 1.8);
      ctx.fillStyle = 'rgba(155, 81, 224, 0.35)';
      ctx.strokeStyle = '#9b51e0';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(20, 0);
      ctx.lineTo(0, 20);
      ctx.lineTo(-20, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.rotate(-time * 1.8);

      // Holographic Nameplate
      ctx.font = '800 11px monospace';
      ctx.fillStyle = '#00f2fe';
      ctx.textAlign = 'center';
      ctx.fillText(`[V-SHARD: ${shard.toolName}]`, 0, -32);
      ctx.font = '700 9px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('MOVE VECTOR-02 HERE', 0, 34);

      ctx.restore();
    });
  }

  /**
   * Draw Distinct Robotic Cyber Enemies & Boss
   */
  drawEnemies(ctx, enemies, time) {
    enemies.forEach(enemy => {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);

      if (enemy.isBoss) {
        // Quantum Firewall Boss
        // Segmented Rotating Shield Arcs
        if (enemy.shieldActive) {
          ctx.save();
          ctx.rotate(time * 1.2);
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(0, 0, 68, i * 2.1, i * 2.1 + 1.6);
            ctx.strokeStyle = enemy.vulnerable ? '#00ff87' : '#ff007f';
            ctx.lineWidth = 6;
            ctx.stroke();
          }
          ctx.restore();
        }

        // Monolith Chassis
        ctx.fillStyle = '#120b1c';
        ctx.strokeStyle = enemy.shieldActive ? '#ff007f' : '#00ff87';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          const px = Math.cos(a) * 44;
          const py = Math.sin(a) * 44;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Pulsing Core Eye
        ctx.fillStyle = enemy.shieldActive ? '#ff0055' : '#00ff87';
        ctx.beginPath();
        ctx.arc(0, 0, 16 + Math.sin(time * 8) * 4, 0, Math.PI * 2);
        ctx.fill();

        // Boss Health & Shield Bar
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(-50, -68, 100, 8);
        ctx.fillStyle = '#ff3366';
        ctx.fillRect(-50, -68, (enemy.hp / enemy.maxHp) * 100, 8);

        // Banner Status
        ctx.font = '800 11px monospace';
        ctx.fillStyle = enemy.shieldActive ? '#ff007f' : '#00ff87';
        ctx.textAlign = 'center';
        ctx.fillText(enemy.shieldActive ? 'SHIELD: FREQUENCY UNKNOWN (RAG REQUIRED)' : 'SHIELD SHATTERED! ATTACK CORE', 0, -76);

      } else {
        // Corrupted Combat Drones
        ctx.save();
        ctx.rotate(time * 2);

        // Drone Chassis
        ctx.fillStyle = '#1c0e18';
        ctx.strokeStyle = '#ff3366';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(-16, -16, 32, 32);
        ctx.fill();
        ctx.stroke();

        ctx.restore();

        // Red Menace Eye in Center
        ctx.fillStyle = '#ff0055';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();

        // Drone Health Bar
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(-18, -26, 36, 4);
        ctx.fillStyle = '#ff3366';
        ctx.fillRect(-18, -26, (enemy.hp / enemy.maxHp) * 36, 4);
      }

      ctx.restore();
    });
  }

  /**
   * Draw Pickups (Compute Tokens & Health Packs)
   */
  drawPickups(ctx, pickups, time) {
    if (!pickups) return;
    pickups.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);

      if (p.type === 'health') {
        // Green Cross
        ctx.fillStyle = '#00ff87';
        ctx.fillRect(-8, -3, 16, 6);
        ctx.fillRect(-3, -8, 6, 16);
      } else {
        // Gold Token Diamond
        ctx.rotate(time * 3);
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(-5, -5, 10, 10);
      }
      ctx.restore();
    });
  }

  /**
   * Draw Projectiles & Lasers
   */
  drawProjectiles(ctx, projectiles) {
    ctx.save();
    projectiles.forEach(p => {
      if (p.type === 'emp') {
        // EMP Blast Ring
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 242, 254, ${p.life})`;
        ctx.lineWidth = 5;
        ctx.stroke();
      } else {
        // Plasma Laser Bolt
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius || 6, 0, Math.PI * 2);
        ctx.fillStyle = p.color || '#00f2fe';
        ctx.shadowColor = p.color || '#00f2fe';
        ctx.shadowBlur = 12;
        ctx.fill();
      }
    });
    ctx.restore();
  }

  /**
   * Particles
   */
  addParticleBurst(x, y, color = '#00f2fe', count = 14) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 1;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 4 + 1.5,
        life: 1.0,
        decay: Math.random() * 0.04 + 0.02
      });
    }
  }

  drawParticles(ctx) {
    ctx.save();
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.restore();
  }

  /**
   * Floating Combat Notifications
   */
  addFloatingText(x, y, text, color = '#00f2fe') {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      life: 1.0,
      vy: -1.4
    });
  }

  drawFloatingTexts(ctx) {
    ctx.save();
    ctx.font = '800 13px monospace';
    ctx.textAlign = 'center';

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.life -= 0.022;

      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }

      ctx.fillStyle = ft.color;
      ctx.globalAlpha = ft.life;
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.restore();
  }

  /**
   * Screen-space Radar Arrows (points to off-screen objectives)
   */
  drawRadarArrows(ctx, gameState) {
    const margin = 40;
    const cx = this.width / 2;
    const cy = this.height / 2;

    // Point to off-screen Shards
    gameState.shards.forEach(s => {
      const screenX = s.x - this.camera.x;
      const screenY = s.y - this.camera.y;

      if (screenX < 0 || screenX > this.width || screenY < 0 || screenY > this.height) {
        const angle = Math.atan2(screenY - cy, screenX - cx);
        const clampX = Math.max(margin, Math.min(this.width - margin, cx + Math.cos(angle) * (cx - margin)));
        const clampY = Math.max(margin, Math.min(this.height - margin, cy + Math.sin(angle) * (cy - margin)));

        ctx.save();
        ctx.translate(clampX, clampY);
        ctx.rotate(angle);
        ctx.fillStyle = '#9b51e0';
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(-6, -6);
        ctx.lineTo(-6, 6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    });
  }
}
