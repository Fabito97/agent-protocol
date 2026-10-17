/**
 * Autonomous Agent Swarm Engine for Agent Protocol
 * Implements Perception, BDI Reasoning, Dynamic Tool Calling, and Live Thought Streaming
 */

export class AgentSwarm {
  constructor(ragEngine, audio, logCallback) {
    this.rag = ragEngine;
    this.audio = audio;
    this.log = logCallback;

    // Define the 3 Autonomous Humanoid Subagents
    this.agents = [
      {
        id: 'recon_01',
        name: 'RECON-01',
        type: 'recon',
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        angle: 0,
        offsetAngle: -0.75,
        distance: 105,
        speed: 3.8,
        isMoving: false,
        primaryColor: '#00f2fe',
        colorAlpha: 'rgba(0, 242, 254, 0.35)',
        skinColor: '#8d5524',
        hair: 'short',
        hairColor: '#17120f',
        hat: 'none',
        accessory: 'glasses',
        scanCooldown: 0,
        status: 'SCANNING PERIMETER'
      },
      {
        id: 'vector_02',
        name: 'VECTOR-02',
        type: 'vector',
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        angle: 0,
        offsetAngle: 0.75,
        distance: 105,
        speed: 4.2,
        isMoving: false,
        isQuerying: false,
        primaryColor: '#9b51e0',
        colorAlpha: 'rgba(155, 81, 224, 0.35)',
        skinColor: '#e0ac69',
        hair: 'braids',
        hairColor: '#1a1008',
        hat: 'none',
        accessory: 'earrings',
        queryCooldown: 0,
        status: 'STANDBY (COSINE 0.00)'
      },
      {
        id: 'striker_03',
        name: 'STRIKER-03',
        type: 'striker',
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        angle: 0,
        offsetAngle: Math.PI,
        distance: 95,
        speed: 3.6,
        isMoving: false,
        primaryColor: '#ffaa00',
        colorAlpha: 'rgba(255, 170, 0, 0.35)',
        skinColor: '#5c3826',
        hair: 'afro',
        hairColor: '#0a0a0a',
        hat: 'none',
        accessory: 'backpack',
        attackCooldown: 0,
        status: 'TOOL: LASER_PULSE'
      }
    ];

    this.cooldowns = {
      thoughtLog: 0,
      reconPing: 0
    };
  }

  initPositions(playerX, playerY) {
    this.agents.forEach(agent => {
      agent.x = playerX + Math.cos(agent.offsetAngle) * agent.distance;
      agent.y = playerY + Math.sin(agent.offsetAngle) * agent.distance;
    });
  }

  /**
   * Main Agent Swarm Update Loop (Executed every 60 FPS frame)
   */
  update(gameState, dt) {
    const player = gameState.player;
    const enemies = gameState.enemies;
    const shards = gameState.shards;
    const projectiles = gameState.projectiles;

    // 1. Maintain Formation & Movement around Lead Architect
    this.agents.forEach(agent => {
      // Base formation target around player
      const formX = player.x + Math.cos(agent.offsetAngle + player.facingAngle) * agent.distance;
      const formY = player.y + Math.sin(agent.offsetAngle + player.facingAngle) * agent.distance;

      // Smooth navigation towards target
      const dx = formX - agent.x;
      const dy = formY - agent.y;
      const dist = Math.hypot(dx, dy);

      agent.isMoving = dist > 4;
      if (agent.isMoving) {
        agent.x += (dx / dist) * Math.min(dist, agent.speed * 60 * dt);
        agent.y += (dy / dist) * Math.min(dist, agent.speed * 60 * dt);
      }
      agent.angle = player.facingAngle;
    });

    // 2. Recon-01: Perception Loop
    this.updateRecon(this.agents[0], enemies, shards, dt);

    // 3. Vector-02: RAG Vector Retrieval Loop
    this.updateVector(this.agents[1], player, enemies, shards, dt);

    // 4. Striker-03: Reasoning & Dynamic Tool Calling Loop
    this.updateStriker(this.agents[2], player, enemies, projectiles, dt);
  }

  /**
   * RECON-01 PERCEPTION LOGIC
   */
  updateRecon(recon, enemies, shards, dt) {
    recon.scanCooldown -= dt;
    if (recon.scanCooldown <= 0) {
      recon.scanCooldown = 2.5;

      const boss = enemies.find(e => e.isBoss);
      if (boss && boss.shieldActive) {
        recon.status = 'ALERT: BOSS SHIELD DETECTED';
        this.log('recon', 'Perceived: Encrypted Quantum Firewall. Shield frequency outside base knowledge cutoff!');
      } else if (enemies.length > 0) {
        recon.status = `TRACKING: ${enemies.length} THREATS`;
        if (Math.random() < 0.35) {
          this.log('recon', `Perception scan: ${enemies.length} active corrupted nodes detected in sector.`);
        }
      } else {
        recon.status = 'PERIMETER SECURE';
      }
    }
  }

  /**
   * VECTOR-02 RAG RETRIEVAL LOGIC
   */
  updateVector(vector, player, enemies, shards, dt) {
    vector.queryCooldown -= dt;

    // Check proximity to knowledge shards
    for (let i = shards.length - 1; i >= 0; i--) {
      const shard = shards[i];
      const distToVector = Math.hypot(shard.x - vector.x, shard.y - vector.y);
      const distToPlayer = Math.hypot(shard.x - player.x, shard.y - player.y);

      // If Vector-02 or player is close to a shard, extract it!
      if (distToVector < 48 || distToPlayer < 48) {
        vector.isQuerying = true;
        this.audio.playRagChime();

        // Perform RAG Vector Search
        const queryVec = shard.vector || [0.9, -0.4, 0.4, 0.1];
        const searchResult = this.rag.searchVectorDb(queryVec);

        if (searchResult.doc) {
          const augmented = this.rag.augmentContext(searchResult.doc);
          vector.status = `AUGMENTED: ${searchResult.doc.toolName.toUpperCase()}`;

          this.log('vector', `Vector DB match! Cosine similarity: ${searchResult.similarity.toFixed(2)}. Retrieved: [${searchResult.doc.title}]. Context augmented!`);
        }

        // Remove extracted shard
        shards.splice(i, 1);
        setTimeout(() => { vector.isQuerying = false; }, 800);
        break;
      }
    }
  }

  /**
   * STRIKER-03 REASONING & DYNAMIC TOOL EXECUTION
   */
  updateStriker(striker, player, enemies, projectiles, dt) {
    striker.attackCooldown -= dt;
    if (striker.attackCooldown > 0) return;

    if (enemies.length === 0) return;

    // Find nearest target
    let nearestEnemy = null;
    let nearestDist = Infinity;

    enemies.forEach(e => {
      const d = Math.hypot(e.x - striker.x, e.y - striker.y);
      if (d < nearestDist) {
        nearestDist = d;
        nearestEnemy = e;
      }
    });

    if (!nearestEnemy || nearestDist > 320) return;

    // Check if target is a Boss with an encrypted shield
    if (nearestEnemy.isBoss && nearestEnemy.shieldActive) {
      // Does our active context have the countermeasure tool (resonance_emp)?
      if (this.rag.hasInContext('resonance_emp')) {
        // CALL TOOL: resonance_emp
        striker.attackCooldown = 2.0;
        striker.status = 'EXECUTING: RESONANCE_EMP';
        this.audio.playEmpBlast();

        projectiles.push({
          type: 'emp',
          x: striker.x,
          y: striker.y,
          radius: 10,
          maxRadius: 180,
          speed: 300,
          life: 1.0,
          damage: 150
        });

        this.log('striker', 'Context blueprint verified. Executing tool: resonance_emp(). OVERLOADING SHIELD MATRIX!');
        return;
      } else {
        // Unknown shield frequency without RAG augmentation
        striker.status = 'WAITING FOR RAG CONTEXT';
        striker.attackCooldown = 1.0;
        this.audio.playShieldDeflect();
        this.log('striker', 'Target shield frequency unknown (Knowledge Cutoff). Standard attacks would fail! Need Vector-02 RAG retrieval.');
        return;
      }
    }

    // Standard Attack: Laser Pulse Tool
    striker.attackCooldown = 0.45;
    striker.status = 'EXECUTING: LASER_PULSE';
    this.audio.playLaser(750, 0.1);

    const angle = Math.atan2(nearestEnemy.y - striker.y, nearestEnemy.x - striker.x);
    projectiles.push({
      type: 'laser',
      x: striker.x,
      y: striker.y,
      vx: Math.cos(angle) * 450,
      vy: Math.sin(angle) * 450,
      damage: 35,
      color: '#ffaa00'
    });
  }
}
