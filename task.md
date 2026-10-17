# AGENT PROTOCOL: Development Task Tracker

> **Repository:** `agent-protocol`  
> **Target:** [start.ng](https://start.ng) (`agent-protocol.start.ng`)  
> **Status:** Phase 1 Complete • Core Engine Built  

---

## 📋 Master Phase Checklist

- [x] **Phase 1: Foundation & start.ng Integration Bridge**
- [x] **Phase 2: Canvas Rendering Engine & Humanoid Character System**
- [x] **Phase 3: Procedural Web Audio Engine**
- [x] **Phase 4: Autonomous Agent Swarm Engine**
- [x] **Phase 5: RAG Vector Pipeline & Boss Mechanics**
- [x] **Phase 6: Game State, Roguelite Upgrades & Leaderboard Sync**
- [x] **Phase 7: Artwork & start.ng Pre-Flight Compliance**
- [x] **Phase 8: GitHub Deployment & Live Publishing**

---

## 🔍 Phase 8: GitHub Deployment & Live Publishing

### 1. Published Details
* **Repository:** `https://github.com/Fabito97/agent-protocol`
* **Game Name:** `agent-protocol`
* **Target Address:** `https://agent-protocol.start.ng`
* **Pre-flight Check (`POST /games/check`):** Passed with 0 errors and 0 warnings.
* **Publish Status:** Pending Owner One-Time Approval
* **Approve Link:** `https://start.ng/approve/abzLPJ5bQUzxgHof`


---

## 🔍 Phase 1: Foundation & start.ng Integration Bridge

### 1. Objective
Establish the foundational infrastructure, file schema, cybernetic glassmorphic design system, and bidirectional communication bridge with the [start.ng](https://start.ng) platform per `https://start.ng/docs.md`.

---

### 2. Implemented Components

#### 📄 `startng.json` (Leaderboard Specification)
* Configured 4 custom leaderboard stats adhering to start.ng naming rules:
  * `sectors`: Sectors Purged (order: `highest`, format: `number`)
  * `rag_retrievals`: Vector Shards Retrieved (order: `highest`, format: `number`)
  * `efficiency`: Compute Efficiency (order: `highest`, format: `number`)
  * `time`: Mission Duration (order: `lowest`, format: `time`)

#### 🔌 `js/startng.js` (Bridge Module)
* Implemented hidden connect `<iframe>` (`https://start.ng/connect`) lifecycle.
* Established origin-validated `postMessage` protocol with unique request ID resolution.
* Built player identity extractor (`startng:whoami`) supporting signed-in user and guest profiles.
* Implemented start.ng sign-in redirect flow with `return_to` parameter.
* Built run persistence (`startng:score` and HTTP `/games/agent-protocol/scores`) with whole-number sanitization.
* Implemented global leaderboard fetch (`startng:leaderboard` and HTTP `/games/agent-protocol/leaderboard`).

#### 🖥️ `index.html` (Semantic Shell & Cyber HUD)
* Zero-dependency HTML5 layout hosting the 60 FPS viewport.
* Built floating start.ng **Profile Card** with avatar frame, display name, `@account`, and 1-click sign-in button.
* Built top vitals bar: Sector counter, animated health bar, compute token counter, audio toggle, and leaderboard launcher.
* Built **Agent Thought Stream HUD** terminal container with live status indicators.
* Built bottom **Agent Squad Dock** tracking Recon-01, Vector-02, and Striker-03 status.
* Built modal dialogs: Start briefing, Roguelite Upgrade selection, Mission Debrief (Game Over), and Global Leaderboard table.

#### 🎨 `style.css` (Glassmorphic Design System)
* Implemented cyberpunk neon design tokens (`--neon-cyan`, `--neon-purple`, `--neon-amber`, `--neon-green`, `--neon-danger`).
* Built GPU-accelerated glassmorphism using `backdrop-filter: blur(16px)` and subtle glowing borders.
* Added animated CRT scanline overlay and edge vignette.
* Styled the scrolling Thought Stream terminal with color-coded agent tags.
* Built responsive layout rules for desktop and mobile touch viewports.

---

### 3. Acceptance Criteria & Verification

| Criteria | Expected Behavior | Status |
| :--- | :--- | :---: |
| **AC-1.1: Relative Paths** | All scripts, stylesheets, and images load via relative paths (`./style.css`, `./js/...`, `./cover.png`) | ✅ PASSED |
| **AC-1.2: File Rule Compliance** | All file extensions (`html`, `css`, `js`, `json`, `png`, `md`) are on the start.ng served list. Zero forbidden files or `.env`. | ✅ PASSED |
| **AC-1.3: Character Rule** | Game detects player identity or falls back to Guest, displaying avatar image, name, and account handle. | ✅ PASSED |
| **AC-1.4: Sign-In Flow** | Guest view displays a functional "Sign in" button that safely redirects to `https://start.ng/?return_to=...`. | ✅ PASSED |
| **AC-1.5: Leaderboard Schema** | `startng.json` strictly adheres to max 5 stats, whole numbers, valid keys, and formats (`number`, `time`). | ✅ PASSED |
| **AC-1.6: Origin Security** | `js/startng.js` enforces `if (e.origin !== 'https://start.ng') return;` on all postMessage traffic. | ✅ PASSED |
| **AC-1.7: Glassmorphic Aesthetics** | HUD displays high-contrast dark theme with glowing neon accents and responsive mobile layout. | ✅ PASSED |

---

## 🚀 Next Milestone: Phase 8 (GitHub Deployment & Live Publishing)

1. Verify public GitHub repository.
2. Run pre-flight check: `POST https://api.start.ng/games/check`.
3. Publish game: `POST https://api.start.ng/games/publish`.
4. Surface the one-time `approve_url` to put `https://agent-protocol.start.ng` live!
