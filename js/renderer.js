/**
 * High-Performance 60 FPS Canvas 2D Renderer for Agent Protocol
 * Includes Procedural Humanoid Character Drawing matching start.ng Avatar Specs
 */

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.particles = [];
    this.floatingTexts = [];
    this.gridOffset = { x: 0, y: 0 };
    this.camera = { x: -this.width / 2, y: -this.height / 2 };

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  centerCamera(x = 0, y = 0) {
    this.camera.x = x - this.width / 2;
    this.camera.y = y - this.height / 2;
  }

  /**
   * Main Render Frame
   */
  render(gameState, playerStyle) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Update camera to smoothly track Lead Architect
    const targetCamX = gameState.player.x - this.width / 2;
    const targetCamY = gameState.player.y - this.height / 2;
    this.camera.x += (targetCamX - this.camera.x) * 0.15;
    this.camera.y += (targetCamY - this.camera.y) * 0.15;

    ctx.save();
    ctx.translate(-this.camera.x, -this.camera.y);

    try {
      // 1. Cyber Matrix Grid Background
      this.drawBackgroundGrid(ctx, gameState.sector);

      // 2. Swarm Tether Lines
      this.drawSwarmTethers(ctx, gameState.player, gameState.agents);

      // 3. Knowledge Shards (Vector DB Data Nodes)
      this.drawKnowledgeShards(ctx, gameState.shards, gameState.gameTime);

      // 4. Enemies & Bosses
      this.drawEnemies(ctx, gameState.enemies, gameState.gameTime);

      // 5. Autonomous Subagents (Humanoid Operatives)
      this.drawSubagents(ctx, gameState.agents, gameState.gameTime);

      // 6. Lead Core Architect (Player Humanoid matching start.ng avatar)
      this.drawLeadArchitect(ctx, gameState.player, playerStyle, gameState.gameTime);

      // 7. Lasers, Beams & Projectiles
      this.drawProjectiles(ctx, gameState.projectiles);

      // 8. Particles & Explosions
      this.drawParticles(ctx);

      // 9. Floating Combat Notifications (+CONTEXT, CRITICAL)
      this.drawFloatingTexts(ctx);
    } catch (e) {
      console.error('[Renderer Error]', e);
    } finally {
      ctx.restore();
    }
  }

  /**
   * Procedural Cyberpunk Vector Grid with Sector Themes
   */
  drawBackgroundGrid(ctx, sector) {
    const gridSize = 64;
    const startX = Math.floor(this.camera.x / gridSize) * gridSize;
    const startY = Math.floor(this.camera.y / gridSize) * gridSize;
    const endX = startX + this.width + gridSize;
    const endY = startY + this.height + gridSize;

    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.05)';

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

    // Subtle crosshairs on grid intersections
    ctx.fillStyle = 'rgba(0, 242, 254, 0.12)';
    for (let x = startX; x <= endX; x += gridSize * 2) {
      for (let y = startY; y <= endY; y += gridSize * 2) {
        ctx.fillRect(x - 2, y - 2, 4, 4);
      }
    }
    ctx.restore();
  }

  /**
   * Glowing Neural Tether Lines between Architect and Agents
   */
  drawSwarmTethers(ctx, player, agents) {
    ctx.save();
    agents.forEach(agent => {
      if (Math.abs(player.x - agent.x) < 0.1 && Math.abs(player.y - agent.y) < 0.1) return;
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(agent.x, agent.y);

      try {
        const grad = ctx.createLinearGradient(player.x, player.y, agent.x, agent.y);
        grad.addColorStop(0, 'rgba(0, 242, 254, 0.25)');
        grad.addColorStop(1, agent.colorAlpha || 'rgba(155, 81, 224, 0.15)');
        ctx.strokeStyle = grad;
      } catch (e) {
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.25)';
      }

      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
    });
    ctx.restore();
  }

  /**
   * PROCEDURAL HUMANOID DRAWER
   * Dynamically renders body, skin, hair, hat, clothing, and accessories
   * Strictly complies with start.ng character styling attributes
   */
  drawHumanoid(ctx, x, y, opts) {
    const {
      scale = 1,
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
      roleBadge = ''
    } = opts;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Soft drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 22, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Leg walk cycle offset
    const legOffset = isWalking ? Math.sin(walkCycle) * 6 : 0;

    // 1. Legs / Trousers (Secondary Color)
    ctx.fillStyle = secondaryColor || '#1a1f2c';
    // Left Leg
    ctx.fillRect(-8, 8, 6, 14 + legOffset);
    // Right Leg
    ctx.fillRect(2, 8, 6, 14 - legOffset);

    // Boots (Darker trim)
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(-9, 20 + legOffset, 8, 4);
    ctx.fillRect(1, 20 - legOffset, 8, 4);

    // 2. Torso / Jacket (Primary Color)
    ctx.fillStyle = primaryColor || '#00f2fe';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(-10, -6, 20, 16, 4);
    } else {
      ctx.rect(-10, -6, 20, 16);
    }
    ctx.fill();

    // Cyber Chest Emblem / Core line
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(-2, -3, 4, 8);

    // 3. Arms (with slight swing)
    ctx.fillStyle = primaryColor || '#00f2fe';
    ctx.fillRect(-13, -4 - legOffset * 0.5, 4, 12);
    ctx.fillRect(9, -4 + legOffset * 0.5, 4, 12);

    // Hands (Skin color)
    ctx.fillStyle = skinColor || '#8d5524';
    ctx.fillRect(-13, 8 - legOffset * 0.5, 4, 4);
    ctx.fillRect(9, 8 + legOffset * 0.5, 4, 4);

    // 4. Head / Neck (Skin Color)
    ctx.fillRect(-3, -10, 6, 4); // Neck
    ctx.beginPath();
    ctx.arc(0, -16, 10, 0, Math.PI * 2);
    ctx.fill();

    // 5. Hair Rendering (Afro, Braids, Bun, Ponytail, Dreads, Short, Bald)
    ctx.fillStyle = hairColor || '#17120f';
    if (hair === 'afro') {
      ctx.beginPath();
      ctx.arc(0, -18, 14, 0, Math.PI * 2);
      ctx.fill();
      // Re-draw face over afro base
      ctx.fillStyle = skinColor;
      ctx.beginPath();
      ctx.arc(0, -15, 9, 0, Math.PI * 2);
      ctx.fill();
    } else if (hair === 'braids') {
      // Braided locks
      ctx.fillRect(-11, -22, 22, 8);
      ctx.fillRect(-12, -18, 4, 16);
      ctx.fillRect(8, -18, 4, 16);
      ctx.fillRect(-4, -24, 8, 6);
    } else if (hair === 'dreads') {
      ctx.fillRect(-12, -22, 24, 8);
      ctx.fillRect(-13, -16, 5, 18);
      ctx.fillRect(8, -16, 5, 18);
      ctx.fillRect(-10, -14, 4, 20);
    } else if (hair === 'bun') {
      ctx.beginPath();
      ctx.arc(0, -19, 10, Math.PI, 0); // Front fringe
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -28, 6, 0, Math.PI * 2); // Top bun
      ctx.fill();
    } else if (hair === 'ponytail') {
      ctx.beginPath();
      ctx.arc(0, -18, 10, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(6, -24, 6, 16); // High ponytail tail
    } else if (hair === 'short') {
      ctx.beginPath();
      ctx.arc(0, -18, 10.5, Math.PI, 0);
      ctx.fill();
    }
    // 'bald' renders no extra hair geometry

    // 6. Hats (Crown, Beanie, Cap, Tophat)
    if (hat === 'crown') {
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath();
      ctx.moveTo(-9, -23);
      ctx.lineTo(-9, -30);
      ctx.lineTo(-4, -26);
      ctx.lineTo(0, -32);
      ctx.lineTo(4, -26);
      ctx.lineTo(9, -30);
      ctx.lineTo(9, -23);
      ctx.closePath();
      ctx.fill();
      // Ruby gem
      ctx.fillStyle = '#ff0055';
      ctx.fillRect(-2, -27, 4, 4);
    } else if (hat === 'beanie') {
      ctx.fillStyle = '#ff007f';
      ctx.beginPath();
      ctx.arc(0, -22, 10, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(-10, -23, 20, 4);
    } else if (hat === 'cap') {
      ctx.fillStyle = '#00f2fe';
      ctx.beginPath();
      ctx.arc(0, -21, 10, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(0, -22, 14, 3); // Cap visor
    } else if (hat === 'tophat') {
      ctx.fillStyle = '#111';
      ctx.fillRect(-12, -22, 24, 3); // Brim
      ctx.fillRect(-7, -34, 14, 12); // Cylinder
      ctx.fillStyle = '#00f2fe';
      ctx.fillRect(-7, -24, 14, 2); // Cyan band
    }

    // 7. Accessories (Glasses, Earrings, Backpack, Scarf, Beard)
    if (accessory === 'glasses') {
      ctx.fillStyle = 'rgba(0, 242, 254, 0.85)';
      ctx.fillRect(-7, -18, 5, 3);
      ctx.fillRect(2, -18, 5, 3);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.strokeRect(-7, -18, 5, 3);
      ctx.strokeRect(2, -18, 5, 3);
    } else if (accessory === 'earrings') {
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath();
      ctx.arc(-10, -14, 2, 0, Math.PI * 2);
      ctx.arc(10, -14, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (accessory === 'backpack') {
      ctx.fillStyle = '#444';
      ctx.fillRect(-12, -4, 4, 14);
    } else if (accessory === 'scarf') {
      ctx.fillStyle = '#ff3366';
      ctx.fillRect(-8, -8, 16, 5);
      ctx.fillRect(4, -8, 5, 12); // Trailing end
    }

    // Role Indicator Badge
    if (roleBadge) {
      ctx.font = '800 8px monospace';
      ctx.fillStyle = primaryColor || '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(roleBadge, 0, -36);
    }

    ctx.restore();
  }

  /**
   * Draw the Player / Lead Core Architect
   */
  drawLeadArchitect(ctx, player, playerStyle, time) {
    this.drawHumanoid(ctx, player.x, player.y, {
      scale: 1.15,
      skinColor: playerStyle?.skinColor || '#8d5524',
      hair: playerStyle?.hair || 'short',
      hairColor: playerStyle?.hairColor || '#17120f',
      hat: playerStyle?.hat || 'none',
      accessory: playerStyle?.accessory || 'none',
      primaryColor: playerStyle?.primaryColor || '#00f2fe',
      secondaryColor: playerStyle?.secondaryColor || '#1a1f2c',
      isWalking: player.isMoving,
      walkCycle: time * 12,
      roleBadge: 'ARCHITECT'
    });

    // Pulse core aura beneath player
    ctx.save();
    ctx.beginPath();
    ctx.arc(player.x, player.y + 12, 22, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 6]);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Draw the 3 Autonomous Humanoid Subagents
   */
  drawSubagents(ctx, agents, time) {
    agents.forEach(agent => {
      // 1. Perception Cone for Recon-01
      if (agent.type === 'recon') {
        ctx.save();
        ctx.translate(agent.x, agent.y);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 160, agent.angle - 0.5, agent.angle + 0.5);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 242, 254, 0.08)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.25)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }

      // 2. Vector Aura for Vector-02
      if (agent.type === 'vector' && agent.isQuerying) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(agent.x, agent.y, 30 + Math.sin(time * 8) * 6, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(155, 81, 224, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      // 3. Draw Subagent Humanoid
      this.drawHumanoid(ctx, agent.x, agent.y, {
        scale: 0.95,
        skinColor: agent.skinColor || '#d4aa7d',
        hair: agent.hair || 'short',
        hairColor: agent.hairColor || '#222',
        hat: agent.hat || 'none',
        accessory: agent.accessory || 'glasses',
        primaryColor: agent.primaryColor,
        secondaryColor: '#0a0d14',
        isWalking: agent.isMoving,
        walkCycle: time * 10,
        roleBadge: agent.name
      });
    });
  }

  /**
   * Draw Knowledge Shards (Vector DB Data Nodes)
   */
  drawKnowledgeShards(ctx, shards, time) {
    shards.forEach(shard => {
      ctx.save();
      ctx.translate(shard.x, shard.y);

      // Rotating diamond
      const rot = time * 2;
      ctx.rotate(rot);

      ctx.fillStyle = 'rgba(0, 242, 254, 0.25)';
      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(14, 0);
      ctx.lineTo(0, 14);
      ctx.lineTo(-14, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.rotate(-rot); // Reset rotation for text

      // Holographic label
      ctx.font = '800 10px monospace';
      ctx.fillStyle = '#00f2fe';
      ctx.textAlign = 'center';
      ctx.fillText(`[V-SHARD: ${shard.toolName}]`, 0, -22);

      ctx.restore();
    });
  }

  /**
   * Draw Enemies and Quantum Firewall Boss
   */
  drawEnemies(ctx, enemies, time) {
    enemies.forEach(enemy => {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);

      if (enemy.isBoss) {
        // Quantum Firewall Boss
        // 1. Rotating Shield Rings
        if (enemy.shieldActive) {
          ctx.save();
          ctx.rotate(time * 1.5);
          ctx.strokeStyle = enemy.vulnerable ? '#00ff87' : '#ff007f';
          ctx.lineWidth = 4;
          ctx.setLineDash([12, 10]);
          ctx.beginPath();
          ctx.arc(0, 0, 48, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // 2. Boss Hexagonal Core
        ctx.fillStyle = '#1c0b24';
        ctx.strokeStyle = enemy.shieldActive ? '#ff007f' : '#00f2fe';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          const px = Math.cos(a) * 32;
          const py = Math.sin(a) * 32;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 3. Boss Health & Shield Bar
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(-35, -50, 70, 6);
        ctx.fillStyle = '#ff3366';
        ctx.fillRect(-35, -50, (enemy.hp / enemy.maxHp) * 70, 6);

        // Status tag
        ctx.font = '800 9px monospace';
        ctx.fillStyle = enemy.shieldActive ? '#ff007f' : '#00ff87';
        ctx.textAlign = 'center';
        ctx.fillText(enemy.shieldActive ? 'SHIELD: ENCRYPTED' : 'OVERLOADED: ATTACK!', 0, -56);

      } else {
        // Standard Corrupted Motes / Glitch Nodes
        ctx.fillStyle = '#ff3366';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 51, 102, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 16 + Math.sin(time * 10) * 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    });
  }

  /**
   * Draw Projectiles, Lasers, and EMP Waves
   */
  drawProjectiles(ctx, projectiles) {
    ctx.save();
    projectiles.forEach(p => {
      ctx.beginPath();
      if (p.type === 'emp') {
        // Expanding EMP Ring
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 242, 254, ' + p.life + ')';
        ctx.lineWidth = 4;
        ctx.stroke();
      } else {
        // Laser Pulse
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = p.color || '#00f2fe';
        ctx.shadowColor = p.color || '#00f2fe';
        ctx.shadowBlur = 10;
        ctx.fill();
      }
    });
    ctx.restore();
  }

  /**
   * Add and Draw Particles
   */
  addParticleBurst(x, y, color = '#00f2fe', count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 3 + 1,
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
      vy: -1.2
    });
  }

  drawFloatingTexts(ctx) {
    ctx.save();
    ctx.font = '800 12px monospace';
    ctx.textAlign = 'center';

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.life -= 0.025;

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
}
