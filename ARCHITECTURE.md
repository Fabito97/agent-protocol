# AGENT PROTOCOL: System Architecture Document

> **Project:** Agent Protocol  
> **Target Platform:** [start.ng](https://start.ng) (`agent-protocol.start.ng`)  
> **Specification Version:** 1.0.0  
> **Tech Stack:** Modular Vanilla ES6+, Canvas 2D, Web Audio API, Modern CSS3 Design Tokens  

---

## 1. Architectural Philosophy & Design Principles

1. **Zero-Build, Zero-Dependency Runtime:**
   * Operates completely in native browser standards (ES6 Modules, Canvas 2D, Web Audio API).
   * No compilation or bundling required. A simple `git push` triggers start.ng's automated deployment pipeline with 100% fidelity.
2. **Decoupled Simulation & Presentation:**
   * **60 FPS Simulation Layer:** High-frequency game loop, spatial collision detection, agent perception, and particle emitters execute on a dedicated Canvas rendering surface.
   * **Reactive DOM HUD Layer:** The Agent Thought Stream, Terminal, Leaderboard Drawer, and start.ng Profile Card run in a GPU-accelerated HTML5/CSS3 glassmorphic interface, communicating via a lightweight event bus.
3. **Explicit Agentic Modeling:**
   * AI behavior is not hardcoded scripts; it explicitly models the standard **Perception $\rightarrow$ Reasoning $\rightarrow$ Context Augmentation (RAG) $\rightarrow$ Tool Calling** pipeline used in modern autonomous agent frameworks.
4. **start.ng First-Class Integration:**
   * 100% compliant with the start.ng Character Rule, Leaderboard Protocol (`startng.json`), and Connect Bridge (`postMessage`).

---

## 2. System Architecture Diagram

```mermaid
graph TB
    subgraph Browser DOM
        UI[Glassmorphic UI & Thought Stream HUD]
        IFRAME["Hidden start.ng Connect Iframe<br/>(https://start.ng/connect)"]
        CANVAS[HTML5 Canvas 60 FPS Viewport]
    end

    subgraph Core Engine Modules
        GAME[Game Controller & Loop<br/>js/game.js]
        STARTNG[start.ng SDK Bridge<br/>js/startng.js]
        AGENTS[Agent Swarm Engine<br/>js/agents.js]
        RAG[Vector DB & RAG Pipeline<br/>js/rag.js]
        RENDER[Canvas 2D Renderer<br/>js/renderer.js]
        AUDIO[Procedural Audio Synth<br/>js/audio.js]
    end

    STARTNG <-->|postMessage (whoami, scores)| IFRAME
    STARTNG -->|Avatar Style & Profile| RENDER
    STARTNG -->|Profile Card & Auth State| UI

    GAME -->|Tick: DeltaTime| AGENTS
    GAME -->|Tick: Collisions, Entities| RAG
    GAME -->|Render Pipeline| RENDER
    GAME -->|Trigger SFX| AUDIO

    AGENTS -->|Live Reasoning Logs| UI
    AGENTS -->|Request Semantic Search| RAG
    RAG -->|Augment Context Window| AGENTS
    AGENTS -->|Execute Tool Actions| GAME

    RENDER -->|Draw Actors, Shards, Lasers| CANVAS
```

---

## 3. Directory & File Organization

```
c:\Users\hp\Documents\hng\gme\
├── ARCHITECTURE.md     # System Architecture & Technical Specifications
├── GDD.md              # Game Design Document & Lore
├── README.md           # Project Overview & Quickstart Guide
├── index.html          # Semantic HTML shell, Canvas canvas, Glassmorphic HUD
├── style.css           # Cyber-terminal styling, design tokens, glassmorphism
├── startng.json        # start.ng Leaderboard column schema
├── cover.png           # 16:10 High-res game card cover image (1600x1000)
└── js/
    ├── startng.js      # start.ng Bridge: whoami, character parsing, leaderboard
    ├── audio.js        # Web Audio API procedural sound effects synthesizer
    ├── rag.js          # Vector DB simulation, embedding similarity, context augmentation
    ├── agents.js       # Autonomous agent perception, BDI reasoning, tool calling
    ├── renderer.js     # Canvas drawing: Humanoid actors, particles, glow effects
    └── game.js         # Master game loop, state machine, input handling
```

---

## 4. Subsystem Deep-Dives

### 4.1 Subsystem: start.ng Integration Bridge (`js/startng.js`)
* **Role:** Manages authentication state, parses player avatar styling, handles score persistence, and queries global leaderboards.
* **Mechanism:**
  * Injects a hidden `<iframe>` pointing to `https://start.ng/connect`.
  * Employs strict origin filtering: `if (e.origin !== 'https://start.ng') return;`.
* **Avatar Style Mapping:**
  ```typescript
  interface CharacterStyle {
    body: 'female' | 'male';
    skinColor: string;       // e.g. "#8d5524"
    hairColor: string;       // e.g. "#17120f"
    hair: 'short' | 'afro' | 'braids' | 'bun' | 'ponytail' | 'dreads' | 'bald';
    hat: 'none' | 'cap' | 'beanie' | 'tophat' | 'crown';
    accessory: 'none' | 'glasses' | 'earrings' | 'beard' | 'scarf' | 'backpack';
    primaryColor: string;    // Top / Torso color
    secondaryColor: string;  // Trousers / Skirt color
  }
  ```
* **Score & Leaderboard API:**
  * Dispatches `startng:score` with stats matching `startng.json`.
  * Fetches `startng:leaderboard` data to populate the global leaderboard drawer.

---

### 4.2 Subsystem: The Agent Swarm Engine (`js/agents.js`)
* **Role:** Drives the autonomous behaviors of the 3 subagents (**Recon-01**, **Vector-02**, **Striker-03**).
* **Agent Architecture (Perception-Reasoning-Action Loop):**
  1. **Perception:**
     * Agents scan a radius around themselves and the Lead Architect.
     * Filter entities into `Threats`, `KnowledgeShards`, `FirewallNodes`, and `Allies`.
  2. **Reasoning (Belief-Desire-Intention / Utility AI):**
     * Evaluate priority weights:
       $$\text{Utility} = w_1 \cdot \text{ThreatDistance} + w_2 \cdot \text{BossShieldActive} + w_3 \cdot \text{ArchitectHealth}$$
     * Set active intention: `INVESTIGATE`, `RETRIEVE_SHARD`, `DEFEND_CORE`, `ENGAGE_TARGET`.
  3. **Tool Execution (`call_tool`):**
     * Each agent possesses a suite of tools with cooldowns and compute costs:
       * **Recon-01:** `ping_sector()`, `reveal_vulnerability()`, `deploy_decoy()`
       * **Vector-02:** `query_vector_db()`, `extract_shard()`, `broadcast_context()`
       * **Striker-03:** `laser_pulse()`, `resonance_emp()`, `quantum_barrier()`, `tachyon_blast()`
  4. **Thought Stream Event Bus:**
     * Dispatches real-time structured logs to the UI:
       `{ agent: 'Vector-02', type: 'reasoning', message: 'Unknown boss protocol detected. Initiating RAG retrieval.' }`

---

### 4.3 Subsystem: The RAG Vector Pipeline (`js/rag.js`)
* **Role:** Simulates high-dimensional vector embeddings, semantic search, and context augmentation.
* **Vector Knowledge Base:**
  * Stores modular vulnerability documents containing:
    ```javascript
    {
      id: "doc_emp_01",
      title: "Resonance EMP Countermeasure",
      vector: [0.82, -0.41, 0.95, 0.12], // Normalized embedding vector
      blueprint: "Bypasses Phase-3 Quantum Shields by matching harmonic frequency",
      unlockedTool: "resonance_emp",
      effectiveness: 3.5
    }
    ```
* **Similarity Retrieval Algorithm:**
  * When an unknown boss shield spawns with feature vector $\mathbf{v}_{\text{boss}}$, the RAG agent calculates Cosine Similarity against retrieved knowledge shards:
    $$\text{Similarity}(\mathbf{A}, \mathbf{B}) = \frac{\mathbf{A} \cdot \mathbf{B}}{\|\mathbf{A}\| \|\mathbf{B}\|}$$
  * A similarity match ($\ge 0.75$) triggers **Context Augmentation**, loading the unlocked tool directly into Striker-03's active combat loadout.

---

### 4.4 Subsystem: The Canvas 2D Renderer (`js/renderer.js`)
* **Role:** Renders all entities at 60 FPS with modern cyber aesthetics.
* **Render Pipeline Order:**
  1. **Background Grid:** Dynamic vector matrix with scrolling grid lines and ambient glow.
  2. **Tether & Connection Rays:** Glowing lines connecting the Lead Architect to their subagents and vector shards.
  3. **World Entities:** Data shards, quantum firewall barriers, rogue glitch nodes, boss anomalies.
  4. **Humanoid Operatives:**
     * **Procedural Humanoid Drawer:** Draws torso, limbs, skin tone, animated walk cycle, hairstyle geometry (afro, braids, dreads, etc.), hat accessories, and clothing colors.
     * Distinct visual styles for player avatar vs. cyber-operatives (Recon, Vector, Striker).
  5. **VFX & Projectiles:**
     * Lasers, EMP shockwaves, particle bursts, and shield ripples using `ctx.globalCompositeOperation = 'lighter'`.
  6. **HUD Floaters:** Floating combat status, damage numbers, and "+CONTEXT" notifications.

---

### 4.5 Subsystem: Procedural Web Audio Engine (`js/audio.js`)
* **Role:** Zero-asset, synthesized sci-fi sound effects and ambient soundtrack via the browser's native `AudioContext`.
* **Sound Generators:**
  * `playLaser(freq, duration)`: Frequency-swept square/saw wave with lowpass filtering.
  * `playRagChime()`: Arpeggiated high-frequency sine triad signaling vector match.
  * `playShieldHit()`: Resonance modulated white noise burst with soft clipping.
  * `playExplosion()`: Deep sub-bass decay with frequency drop and noise tail.
  * `startAmbientDrone()`: Sub-audible dual-oscillator drone for atmospheric tension.

---

### 4.6 Subsystem: Game State Manager (`js/game.js`)
* **Role:** Orchestrates the game loop, input handling, sector progression, roguelite upgrades, and game-over state.
* **State Machine:**
  ```
  BOOT -> TITLE_MENU -> SECTOR_INFILTRATION -> COMBAT_LOOP 
       -> (BOSS_ENCOUNTER -> RAG_AUGMENTATION) 
       -> SECTOR_PURGED -> UPGRADE_DRAFT -> NEXT_SECTOR 
       -> (MISSION_FAILED -> SCORE_SUBMISSION -> LEADERBOARD)
  ```

---

## 5. Performance & Resource Specifications

1. **Target Framerate:** 60 FPS sustained on desktop and mobile.
2. **Object Pooling:** Projectiles, particle bursts, and floating damage numbers utilize fixed-size object pools to eliminate Garbage Collection (GC) pauses.
3. **Memory Footprint:** Under 15 MB heap usage.
4. **Total Assets Size:** Under 1.5 MB total (dominated primarily by the high-res 16:10 cover artwork).

---

## 6. Verification & Quality Assurance Gate

Before publishing to start.ng, the architecture must pass:
1. **Rule Verification:** Relative paths, supported file extensions, no secrets, no external unapproved scripts.
2. **Pre-flight API Verification:** `POST https://api.start.ng/games/check` returns `200 OK` with zero errors.
3. **Character Rule Compliance:** Avatar renders correctly for both signed-in start.ng users and default Guests.
4. **Leaderboard Compliance:** Runs save properly and query the top-10 board via `startng:score` and `startng:leaderboard`.
