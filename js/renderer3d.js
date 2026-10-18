/**
 * 3D WebGL Rendering Engine for Agent Protocol using Three.js
 * Implements:
 * - High-tech 3D Sci-Fi Matrix Citadel environment (reflective grid floor, cyber walls, server pillars)
 * - 3D Stylized Humanoid operatives (Lead Architect + Recon-01 + Vector-02 + Striker-03)
 * - Procedural 3D limb walk-cycle animations and directional weapon aiming
 * - Third-person over-the-shoulder follow camera with mouse look
 * - 3D Hovering Combat Drones and Quantum Firewall Boss Monolith with rotating shield plates
 * - 3D Floating Knowledge Shards, Pickups, Laser Tracers, EMP Shockwaves, and Particle FX
 */

import * as THREE from './libs/three.module.js';

export class Renderer3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // 1. Scene, Camera & WebGL Renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060810);
    this.scene.fog = new THREE.FogExp2(0x060810, 0.012);

    this.camera = new THREE.PerspectiveCamera(65, this.width / this.height, 0.1, 1000);
    
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Camera Orbit State
    this.cameraYaw = 0;       // Horizontal look angle
    this.cameraPitch = 0.22;  // Vertical look angle (slightly above shoulder)
    this.cameraDist = 7.5;    // Distance behind player
    this.cameraHeight = 3.2;  // Eye-level elevation
    this.shoulderOffset = 0.9;// Right shoulder bias

    // 3D Object Pools & Caches
    this.characterMeshes = new Map();
    this.droneMeshes = new Map();
    this.pickupMeshes = new Map();
    this.shardMeshes = new Map();
    this.projectileMeshes = new Map();
    this.bossMesh = null;
    this.bossShieldMeshes = [];
    this.particles = [];

    // Build Static Environment
    this.setupLighting();
    this.buildEnvironment();
    this.setupResizeListener();
  }

  /**
   * Sci-Fi Ambient & Dynamic Lighting
   */
  setupLighting() {
    // Cyber Ambient Fill
    const ambient = new THREE.AmbientLight(0x182438, 1.4);
    this.scene.add(ambient);

    // Directional Key Light with Soft Shadows
    this.dirLight = new THREE.DirectionalLight(0xaad4f5, 1.6);
    this.dirLight.position.set(25, 45, 25);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 120;
    this.dirLight.shadow.camera.left = -50;
    this.dirLight.shadow.camera.right = 50;
    this.dirLight.shadow.camera.top = 50;
    this.dirLight.shadow.camera.bottom = -50;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);

    // Neon Accent Point Lights
    this.cyanPoint = new THREE.PointLight(0x00f2fe, 2.5, 40);
    this.cyanPoint.position.set(0, 8, 0);
    this.scene.add(this.cyanPoint);

    this.purplePoint = new THREE.PointLight(0x9b51e0, 2.5, 45);
    this.purplePoint.position.set(0, 8, -25);
    this.scene.add(this.purplePoint);
  }

  /**
   * Procedural Sci-Fi Matrix Citadel Arena
   */
  buildEnvironment() {
    // 1. Procedural High-Tech Grid Texture
    const gridCanvas = document.createElement('canvas');
    gridCanvas.width = 256;
    gridCanvas.height = 256;
    const gctx = gridCanvas.getContext('2d');

    // Dark metallic plate base
    gctx.fillStyle = '#0a0d16';
    gctx.fillRect(0, 0, 256, 256);

    // Inner bevel tile
    gctx.fillStyle = '#0f1422';
    gctx.fillRect(4, 4, 248, 248);

    // Cyber Cyan Circuit lines
    gctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
    gctx.lineWidth = 2;
    gctx.strokeRect(4, 4, 248, 248);

    // Glowing center node
    gctx.fillStyle = '#00f2fe';
    gctx.fillRect(124, 124, 8, 8);

    const floorTexture = new THREE.CanvasTexture(gridCanvas);
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(30, 30);

    // Floor Mesh (120x120 units)
    const floorGeo = new THREE.PlaneGeometry(140, 140);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.35,
      metalness: 0.75
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // 2. Perimeter Cyber Security Walls with Glowing Neon Bands
    const wallHeight = 8;
    const arenaRadius = 65;
    const wallGeo = new THREE.BoxGeometry(140, wallHeight, 2);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x0f1524,
      roughness: 0.5,
      metalness: 0.6
    });

    const neonBandMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe });
    const neonGeo = new THREE.BoxGeometry(140, 0.25, 2.05);

    // 4 Walls: North, South, East, West
    const wallConfigs = [
      { x: 0, z: -arenaRadius, rotY: 0 },
      { x: 0, z: arenaRadius, rotY: Math.PI },
      { x: -arenaRadius, z: 0, rotY: Math.PI / 2 },
      { x: arenaRadius, z: 0, rotY: -Math.PI / 2 }
    ];

    wallConfigs.forEach(cfg => {
      const wallGroup = new THREE.Group();
      const wallMesh = new THREE.Mesh(wallGeo, wallMat);
      wallMesh.position.y = wallHeight / 2;
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      wallGroup.add(wallMesh);

      const neonMesh = new THREE.Mesh(neonGeo, neonBandMat);
      neonMesh.position.y = wallHeight - 1;
      wallGroup.add(neonMesh);

      const neonBase = new THREE.Mesh(neonGeo, neonBandMat);
      neonBase.position.y = 0.5;
      wallGroup.add(neonBase);

      wallGroup.position.set(cfg.x, 0, cfg.z);
      wallGroup.rotation.y = cfg.rotY;
      this.scene.add(wallGroup);
    });

    // 3. Cyber Monolith Pillars (Sci-Fi Server Stacks)
    const pillarPositions = [
      [-30, -30], [30, -30], [-30, 30], [30, 30],
      [-48, 0], [48, 0], [0, -48], [0, 48]
    ];

    const pillarGeo = new THREE.BoxGeometry(3.5, 12, 3.5);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x121828,
      roughness: 0.4,
      metalness: 0.8
    });
    const pillarTrimMat = new THREE.MeshBasicMaterial({ color: 0x9b51e0 });
    const pillarTrimGeo = new THREE.BoxGeometry(3.6, 0.35, 3.6);

    pillarPositions.forEach(([px, pz]) => {
      const pGroup = new THREE.Group();
      const pMesh = new THREE.Mesh(pillarGeo, pillarMat);
      pMesh.position.y = 6;
      pMesh.castShadow = true;
      pMesh.receiveShadow = true;
      pGroup.add(pMesh);

      // Glowing Rings on Pillars
      for (let y = 2; y <= 10; y += 2.5) {
        const ring = new THREE.Mesh(pillarTrimGeo, pillarTrimMat);
        ring.position.y = y;
        pGroup.add(ring);
      }

      pGroup.position.set(px, 0, pz);
      this.scene.add(pGroup);
    });

    // 4. Ambient Cyber Data Motes (Floating particles)
    const particleCount = 280;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 110;
      positions[i + 1] = Math.random() * 16 + 0.5;
      positions[i + 2] = (Math.random() - 0.5) * 110;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x00f2fe,
      size: 0.28,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });
    this.ambientParticles = new THREE.Points(particleGeo, particleMat);
    this.scene.add(this.ambientParticles);
  }

  /**
   * PROCEDURAL 3D HUMANOID OPERATIVE BUILDER
   * Creates fully animated low-poly stylized operatives with personal start.ng styling
   */
  createHumanoidMesh(opts = {}) {
    const {
      primaryColor = '#00f2fe',
      secondaryColor = '#101522',
      skinColor = '#8d5524',
      hair = 'short',
      hairColor = '#17120f',
      hat = 'none',
      accessory = 'none',
      isPlayer = false,
      tagText = 'OPERATIVE'
    } = opts;

    const rootGroup = new THREE.Group();

    // 1. Materials
    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(primaryColor),
      roughness: 0.45,
      metalness: 0.6
    });

    const armorDarkMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(secondaryColor),
      roughness: 0.5,
      metalness: 0.7
    });

    const skinMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(skinColor),
      roughness: 0.8,
      metalness: 0.1
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(hairColor),
      roughness: 0.85,
      metalness: 0.05
    });

    const visorGlowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(primaryColor)
    });

    // 2. Pelvis / Hips (Anchor for Legs)
    const pelvisGeo = new THREE.BoxGeometry(0.75, 0.35, 0.5);
    const pelvisMesh = new THREE.Mesh(pelvisGeo, armorDarkMat);
    pelvisMesh.position.y = 1.35;
    pelvisMesh.castShadow = true;
    rootGroup.add(pelvisMesh);

    // 3. Torso / Cyber Jacket
    const torsoGeo = new THREE.BoxGeometry(0.9, 1.1, 0.55);
    const torsoMesh = new THREE.Mesh(torsoGeo, bodyMat);
    torsoMesh.position.y = 2.05;
    torsoMesh.castShadow = true;
    rootGroup.add(torsoMesh);

    // Chest Core Reactor Plate
    const chestCoreGeo = new THREE.BoxGeometry(0.4, 0.45, 0.1);
    const chestCoreMesh = new THREE.Mesh(chestCoreGeo, visorGlowMat);
    chestCoreMesh.position.set(0, 2.1, 0.28);
    rootGroup.add(chestCoreMesh);

    // 4. Head & Face
    const headGeo = new THREE.BoxGeometry(0.52, 0.55, 0.52);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.position.y = 2.95;
    headMesh.castShadow = true;
    rootGroup.add(headMesh);

    // Cyber Visor / Eyes
    const visorGeo = new THREE.BoxGeometry(0.44, 0.14, 0.1);
    const visorMesh = new THREE.Mesh(visorGeo, visorGlowMat);
    visorMesh.position.set(0, 2.96, 0.27);
    rootGroup.add(visorMesh);

    // Hair Geometries
    if (hair === 'afro') {
      const afroGeo = new THREE.SphereGeometry(0.44, 10, 10);
      const afroMesh = new THREE.Mesh(afroGeo, hairMat);
      afroMesh.position.set(0, 3.12, -0.05);
      rootGroup.add(afroMesh);
    } else if (hair === 'braids' || hair === 'dreads') {
      const hairCap = new THREE.BoxGeometry(0.56, 0.25, 0.56);
      const capMesh = new THREE.Mesh(hairCap, hairMat);
      capMesh.position.set(0, 3.25, 0);
      rootGroup.add(capMesh);

      // Dropping locks
      const lockGeo = new THREE.BoxGeometry(0.12, 0.55, 0.12);
      [-0.24, 0.24].forEach(lx => {
        const lock = new THREE.Mesh(lockGeo, hairMat);
        lock.position.set(lx, 2.85, 0.05);
        rootGroup.add(lock);
      });
    } else if (hair === 'bun') {
      const hairCap = new THREE.BoxGeometry(0.56, 0.22, 0.56);
      const capMesh = new THREE.Mesh(hairCap, hairMat);
      capMesh.position.set(0, 3.22, 0);
      rootGroup.add(capMesh);

      const bunGeo = new THREE.SphereGeometry(0.2, 8, 8);
      const bunMesh = new THREE.Mesh(bunGeo, hairMat);
      bunMesh.position.set(0, 3.45, -0.15);
      rootGroup.add(bunMesh);
    } else {
      // Default Short Cut
      const shortHairGeo = new THREE.BoxGeometry(0.56, 0.2, 0.56);
      const shortHair = new THREE.Mesh(shortHairGeo, hairMat);
      shortHair.position.set(0, 3.25, 0);
      rootGroup.add(shortHair);
    }

    // Hat styling
    if (hat === 'cap') {
      const capBrim = new THREE.BoxGeometry(0.6, 0.08, 0.35);
      const capBrimMesh = new THREE.Mesh(capBrim, armorDarkMat);
      capBrimMesh.position.set(0, 3.25, 0.38);
      rootGroup.add(capBrimMesh);
    }

    // 5. Left & Right Legs (Pivots at Hips for Walking)
    const legGeo = new THREE.BoxGeometry(0.3, 0.95, 0.35);
    const bootGeo = new THREE.BoxGeometry(0.32, 0.28, 0.5);

    // Left Leg Group (Pivot at y = 1.35)
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.25, 1.25, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, armorDarkMat);
    leftLegMesh.position.y = -0.5;
    leftLegMesh.castShadow = true;
    leftLegGroup.add(leftLegMesh);

    const leftBootMesh = new THREE.Mesh(bootGeo, armorDarkMat);
    leftBootMesh.position.set(0, -0.92, 0.06);
    leftBootMesh.castShadow = true;
    leftLegGroup.add(leftBootMesh);
    rootGroup.add(leftLegGroup);

    // Right Leg Group
    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.25, 1.25, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, armorDarkMat);
    rightLegMesh.position.y = -0.5;
    rightLegMesh.castShadow = true;
    rightLegGroup.add(rightLegMesh);

    const rightBootMesh = new THREE.Mesh(bootGeo, armorDarkMat);
    rightBootMesh.position.set(0, -0.92, 0.06);
    rightBootMesh.castShadow = true;
    rightLegGroup.add(rightBootMesh);
    rootGroup.add(rightLegGroup);

    // 6. Left & Right Arms (Pivots at Shoulders)
    const armGeo = new THREE.BoxGeometry(0.26, 0.9, 0.28);

    // Left Arm
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.62, 2.45, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, bodyMat);
    leftArmMesh.position.y = -0.45;
    leftArmMesh.castShadow = true;
    leftArmGroup.add(leftArmMesh);
    rootGroup.add(leftArmGroup);

    // Right Arm with Weapon
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.62, 2.45, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, bodyMat);
    rightArmMesh.position.y = -0.45;
    rightArmMesh.castShadow = true;
    rightArmGroup.add(rightArmMesh);

    // Handheld Cyber Railgun
    const gunGeo = new THREE.BoxGeometry(0.18, 0.26, 0.85);
    const gunMat = new THREE.MeshStandardMaterial({
      color: 0x111622,
      roughness: 0.3,
      metalness: 0.9
    });
    const gunMesh = new THREE.Mesh(gunGeo, gunMat);
    gunMesh.position.set(0, -0.85, 0.35);

    const muzzleGeo = new THREE.BoxGeometry(0.12, 0.12, 0.15);
    const muzzleMesh = new THREE.Mesh(muzzleGeo, visorGlowMat);
    muzzleMesh.position.set(0, 0, 0.44);
    gunMesh.add(muzzleMesh);
    rightArmGroup.add(gunMesh);
    rootGroup.add(rightArmGroup);

    // 7. Glowing Floor Pedestal Ring
    const ringGeo = new THREE.RingGeometry(1.2, 1.35, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(primaryColor),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.05;
    rootGroup.add(ringMesh);

    // Attach limbs & animation references
    rootGroup.userData = {
      leftLeg: leftLegGroup,
      rightLeg: rightLegGroup,
      leftArm: leftArmGroup,
      rightArm: rightArmGroup,
      ring: ringMesh,
      gunMuzzle: muzzleMesh,
      walkCycle: 0,
      isPlayer: isPlayer
    };

    return rootGroup;
  }

  /**
   * PROCEDURAL 3D COMBAT DRONE BUILDER
   */
  createDroneMesh() {
    const droneGroup = new THREE.Group();

    // Quad Chassis Metal Body
    const coreGeo = new THREE.BoxGeometry(1.4, 0.4, 1.4);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x180f1d,
      roughness: 0.35,
      metalness: 0.8
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.castShadow = true;
    droneGroup.add(coreMesh);

    // Menace Red Eye in Center
    const eyeGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
    const eyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
    eyeMesh.position.set(0, 0.25, 0);
    droneGroup.add(eyeMesh);

    // 4 Rotary Thruster Pods
    const podGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.25, 12);
    const podMat = new THREE.MeshBasicMaterial({ color: 0xff3366 });
    const offsets = [
      [-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]
    ];
    offsets.forEach(([ox, oz]) => {
      const pod = new THREE.Mesh(podGeo, podMat);
      pod.position.set(ox, 0, oz);
      droneGroup.add(pod);
    });

    droneGroup.userData = { eye: eyeMesh };
    return droneGroup;
  }

  /**
   * PROCEDURAL 3D QUANTUM FIREWALL BOSS MONOLITH
   */
  createBossMesh() {
    const bossGroup = new THREE.Group();

    // Central Floating Quantum Monolith
    const coreGeo = new THREE.CylinderGeometry(2.4, 2.4, 6.5, 6);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x10081c,
      roughness: 0.25,
      metalness: 0.9
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.y = 4.5;
    coreMesh.castShadow = true;
    bossGroup.add(coreMesh);

    // Glowing Inner Energy Core
    const innerGeo = new THREE.SphereGeometry(1.6, 16, 16);
    const innerMat = new THREE.MeshBasicMaterial({ color: 0xff007f });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    innerMesh.position.y = 4.5;
    bossGroup.add(innerMesh);

    // 3 Segmented Orbiting Shield Rings
    const rings = [];
    const ringRadii = [4.2, 5.0, 5.8];
    const ringColors = [0xff007f, 0x9b51e0, 0x00f2fe];

    ringRadii.forEach((rad, idx) => {
      const rGeo = new THREE.TorusGeometry(rad, 0.22, 16, 48);
      const rMat = new THREE.MeshBasicMaterial({
        color: ringColors[idx],
        wireframe: true
      });
      const ring = new THREE.Mesh(rGeo, rMat);
      ring.position.y = 4.5;
      bossGroup.add(ring);
      rings.push(ring);
    });

    bossGroup.userData = {
      coreMesh: coreMesh,
      innerMesh: innerMesh,
      rings: rings
    };

    return bossGroup;
  }

  /**
   * Main 60 FPS 3D Render Loop
   */
  render(gameState, playerStyle) {
    const time = performance.now() * 0.001;
    const player = gameState.player;

    // 1. Synchronize Player 3D Mesh
    let playerMesh = this.characterMeshes.get('player');
    if (!playerMesh) {
      playerMesh = this.createHumanoidMesh({
        primaryColor: playerStyle?.primaryColor || '#00f2fe',
        secondaryColor: playerStyle?.secondaryColor || '#101522',
        skinColor: playerStyle?.skinColor || '#8d5524',
        hair: playerStyle?.hair || 'short',
        hairColor: playerStyle?.hairColor || '#17120f',
        hat: playerStyle?.hat || 'none',
        accessory: playerStyle?.accessory || 'none',
        isPlayer: true,
        tagText: 'YOU [ARCHITECT]'
      });
      this.scene.add(playerMesh);
      this.characterMeshes.set('player', playerMesh);
    }

    // Convert 2D logic space (x, y) to 3D space (x, 0, z)
    // Scale factor: 1 logic px = 0.06 3D units
    const to3D = 0.06;
    const playerX = player.x * to3D;
    const playerZ = player.y * to3D;

    playerMesh.position.set(playerX, 0, playerZ);
    // Smooth character rotation towards camera aiming direction
    playerMesh.rotation.y = this.cameraYaw + Math.PI;

    // Animate Player Walk Cycle
    this.updateLimbAnimation(playerMesh, player.isMoving, time);

    // 2. Synchronize Autonomous Subagents (Recon, Vector, Striker)
    if (gameState.agents && Array.isArray(gameState.agents)) {
      gameState.agents.forEach((agent, idx) => {
        const agentKey = `agent_${idx}`;
        let agentMesh = this.characterMeshes.get(agentKey);

        if (!agentMesh) {
          agentMesh = this.createHumanoidMesh({
            primaryColor: agent.primaryColor,
            secondaryColor: '#0c101a',
            skinColor: agent.skinColor,
            hair: agent.hair,
            hairColor: agent.hairColor,
            hat: agent.hat,
            accessory: agent.accessory,
            isPlayer: false,
            tagText: agent.name
          });
          this.scene.add(agentMesh);
          this.characterMeshes.set(agentKey, agentMesh);
        }

        const ax = agent.x * to3D;
        const az = agent.y * to3D;
        agentMesh.position.set(ax, 0, az);
        agentMesh.rotation.y = agent.angle ? agent.angle + Math.PI : this.cameraYaw + Math.PI;

        this.updateLimbAnimation(agentMesh, agent.isMoving, time);
      });
    }

    // 3. Synchronize Knowledge Shards
    this.updateKnowledgeShards(gameState.shards, time, to3D);

    // 4. Synchronize Enemies & Boss Monolith
    this.updateEnemies(gameState.enemies, time, to3D);

    // 5. Synchronize Pickups
    this.updatePickups(gameState.pickups, time, to3D);

    // 6. Synchronize Projectiles (Laser Tracers & EMP Rings)
    this.updateProjectiles(gameState.projectiles, time, to3D);

    // 7. Update Third-Person Over-the-Shoulder Camera
    this.updateThirdPersonCamera(playerX, playerZ);

    // 8. Animate Ambient Dust
    if (this.ambientParticles) {
      this.ambientParticles.rotation.y = time * 0.02;
    }

    // 9. Render Frame
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Procedural Walk-Cycle Limb Swings
   */
  updateLimbAnimation(charMesh, isMoving, time) {
    const data = charMesh.userData;
    if (!data.leftLeg) return;

    if (isMoving) {
      data.walkCycle += 0.22;
      const swing = Math.sin(data.walkCycle) * 0.55;
      data.leftLeg.rotation.x = swing;
      data.rightLeg.rotation.x = -swing;
      data.leftArm.rotation.x = -swing * 0.7;
      data.rightArm.rotation.x = swing * 0.3; // Right arm aims weapon
    } else {
      // Idle breathing stance
      data.leftLeg.rotation.x *= 0.85;
      data.rightLeg.rotation.x *= 0.85;
      data.leftArm.rotation.x *= 0.85;
      data.rightArm.rotation.x = 0;
    }
  }

  /**
   * Third-Person Camera Positioning (Behind Player with Mouse Look)
   */
  updateThirdPersonCamera(px, pz) {
    // Camera orbit math based on Yaw and Pitch
    const cosPitch = Math.cos(this.cameraPitch);
    const sinPitch = Math.sin(this.cameraPitch);
    const sinYaw = Math.sin(this.cameraYaw);
    const cosYaw = Math.cos(this.cameraYaw);

    // Calculate camera target in 3D world space
    const camX = px + sinYaw * cosPitch * this.cameraDist + cosYaw * this.shoulderOffset;
    const camY = this.cameraHeight + sinPitch * this.cameraDist;
    const camZ = pz + cosYaw * cosPitch * this.cameraDist - sinYaw * this.shoulderOffset;

    // Smooth camera damping
    this.camera.position.x += (camX - this.camera.position.x) * 0.15;
    this.camera.position.y += (camY - this.camera.position.y) * 0.15;
    this.camera.position.z += (camZ - this.camera.position.z) * 0.15;

    // Look at player chest elevation plus forward crosshair target
    const lookTarget = new THREE.Vector3(
      px - sinYaw * 10,
      2.0 - sinPitch * 6,
      pz - cosYaw * 10
    );
    this.camera.lookAt(lookTarget);

    // Position key directional light near player for high shadow fidelity
    if (this.dirLight) {
      this.dirLight.position.set(px + 20, 35, pz + 20);
      this.dirLight.target.position.set(px, 0, pz);
    }
  }

  /**
   * Sync Knowledge Shards in 3D Space
   */
  updateKnowledgeShards(shards, time, to3D) {
    if (!shards) return;

    shards.forEach((s, idx) => {
      const key = `shard_${idx}`;
      let mesh = this.shardMeshes.get(key);

      if (!mesh) {
        const group = new THREE.Group();
        // Octahedron faceted crystal
        const geo = new THREE.OctahedronGeometry(1.6, 0);
        const mat = new THREE.MeshStandardMaterial({
          color: 0x9b51e0,
          emissive: 0x4a1877,
          roughness: 0.15,
          metalness: 0.9,
          wireframe: false
        });
        const crystal = new THREE.Mesh(geo, mat);
        crystal.castShadow = true;
        group.add(crystal);

        // Ground holo ring
        const ringGeo = new THREE.RingGeometry(2.5, 2.7, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x9b51e0,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.6
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.05;
        group.add(ring);

        // Point light for glowing ambient
        const pLight = new THREE.PointLight(0x9b51e0, 2.5, 20);
        group.add(pLight);

        group.userData = { crystal: crystal };
        this.scene.add(group);
        mesh = group;
        this.shardMeshes.set(key, mesh);
      }

      const sx = s.x * to3D;
      const sz = s.y * to3D;
      mesh.position.set(sx, 0, sz);

      // Hover & Spin
      mesh.userData.crystal.position.y = 2.4 + Math.sin(time * 3) * 0.35;
      mesh.userData.crystal.rotation.y = time * 1.5;
      mesh.userData.crystal.rotation.x = time * 0.8;
    });
  }

  /**
   * Sync Enemies & Boss in 3D Space
   */
  updateEnemies(enemies, time, to3D) {
    if (!enemies) return;

    // Track active enemy IDs to prune dead meshes
    const activeKeys = new Set();

    enemies.forEach((enemy, idx) => {
      if (enemy.isBoss) {
        // Quantum Firewall Boss Monolith
        if (!this.bossMesh) {
          this.bossMesh = this.createBossMesh();
          this.scene.add(this.bossMesh);
        }

        const bx = enemy.x * to3D;
        const bz = enemy.y * to3D;
        this.bossMesh.position.set(bx, 0, bz);

        // Rotate Shield Rings
        const rings = this.bossMesh.userData.rings;
        if (enemy.shieldActive) {
          rings.forEach((r, i) => {
            r.visible = true;
            r.rotation.x = time * (1.2 + i * 0.4);
            r.rotation.y = time * (0.8 + i * 0.3);
          });
          this.bossMesh.userData.innerMesh.material.color.setHex(0xff0055);
        } else {
          // Shield shattered
          rings.forEach(r => { r.visible = false; });
          this.bossMesh.userData.innerMesh.material.color.setHex(0x00ff87);
        }

        this.bossMesh.userData.coreMesh.rotation.y = time * 0.5;

      } else {
        // Combat Drone
        const droneKey = `drone_${idx}`;
        activeKeys.add(droneKey);
        let drone = this.droneMeshes.get(droneKey);

        if (!drone) {
          drone = this.createDroneMesh();
          this.scene.add(drone);
          this.droneMeshes.set(droneKey, drone);
        }

        const dx = enemy.x * to3D;
        const dz = enemy.y * to3D;
        drone.position.set(dx, 1.6 + Math.sin(time * 4 + idx) * 0.25, dz);

        // Tilt & rotate towards player
        drone.rotation.y = time * 1.5;
      }
    });

    // Remove defunct drone meshes
    for (const [key, mesh] of this.droneMeshes.entries()) {
      if (!activeKeys.has(key)) {
        this.scene.remove(mesh);
        this.droneMeshes.delete(key);
      }
    }
  }

  /**
   * Sync Pickups (Tokens & Health)
   */
  updatePickups(pickups, time, to3D) {
    if (!pickups) return;
    const activeKeys = new Set();

    pickups.forEach((p, idx) => {
      const key = `pickup_${idx}`;
      activeKeys.add(key);
      let mesh = this.pickupMeshes.get(key);

      if (!mesh) {
        if (p.type === 'health') {
          // 3D Green Cross
          const group = new THREE.Group();
          const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, 0.25), new THREE.MeshBasicMaterial({ color: 0x00ff87 }));
          const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.7, 0.25), new THREE.MeshBasicMaterial({ color: 0x00ff87 }));
          group.add(b1);
          group.add(b2);
          mesh = group;
        } else {
          // 3D Golden Octahedron Token
          const geo = new THREE.OctahedronGeometry(0.5, 0);
          const mat = new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.9, roughness: 0.2 });
          mesh = new THREE.Mesh(geo, mat);
        }
        this.scene.add(mesh);
        this.pickupMeshes.set(key, mesh);
      }

      const px = p.x * to3D;
      const pz = p.y * to3D;
      mesh.position.set(px, 0.8 + Math.sin(time * 5 + idx) * 0.15, pz);
      mesh.rotation.y = time * 3;
      mesh.rotation.z = time * 1.5;
    });

    for (const [key, mesh] of this.pickupMeshes.entries()) {
      if (!activeKeys.has(key)) {
        this.scene.remove(mesh);
        this.pickupMeshes.delete(key);
      }
    }
  }

  /**
   * Sync Lasers & EMP Shockwaves in 3D
   */
  updateProjectiles(projectiles, time, to3D) {
    if (!projectiles) return;
    const activeKeys = new Set();

    projectiles.forEach((p, idx) => {
      const key = `proj_${idx}`;
      activeKeys.add(key);
      let mesh = this.projectileMeshes.get(key);

      if (!mesh) {
        if (p.type === 'emp') {
          // Expanding 3D EMP Sphere
          const geo = new THREE.SphereGeometry(1, 24, 24);
          const mat = new THREE.MeshBasicMaterial({
            color: 0x00f2fe,
            wireframe: true,
            transparent: true,
            opacity: 0.8
          });
          mesh = new THREE.Mesh(geo, mat);
        } else {
          // 3D Glowing Plasma Tracer Bolt
          const geo = new THREE.CylinderGeometry(0.12, 0.12, 1.2, 8);
          const mat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(p.color || '#00f2fe')
          });
          mesh = new THREE.Mesh(geo, mat);
          mesh.rotation.x = Math.PI / 2;
        }
        this.scene.add(mesh);
        this.projectileMeshes.set(key, mesh);
      }

      const px = p.x * to3D;
      const pz = p.y * to3D;

      if (p.type === 'emp') {
        const rad3D = p.radius * to3D;
        mesh.position.set(px, 1.5, pz);
        mesh.scale.set(rad3D, rad3D, rad3D);
        mesh.material.opacity = p.life;
      } else {
        mesh.position.set(px, 1.8, pz);
        const angle = Math.atan2(p.vx, p.vy);
        mesh.rotation.y = angle;
      }
    });

    for (const [key, mesh] of this.projectileMeshes.entries()) {
      if (!activeKeys.has(key)) {
        this.scene.remove(mesh);
        this.projectileMeshes.delete(key);
      }
    }
  }

  /**
   * Particle burst placeholder for compatibility
   */
  addParticleBurst(x, y, color = '#00f2fe', count = 10) {
    // 3D particle bursts can be instantiated or audio feedback triggered
  }

  /**
   * Floating text placeholder
   */
  addFloatingText(x, y, text, color) {
    // Optional 3D canvas billboard or HUD floating log
  }

  /**
   * Center Camera on sector start
   */
  centerCamera(x = 0, y = 0) {
    this.cameraYaw = 0;
    this.cameraPitch = 0.22;
  }

  /**
   * Window resize handler
   */
  setupResizeListener() {
    window.addEventListener('resize', () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.width, this.height);
    });
  }
}
