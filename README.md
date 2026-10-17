# 🤖 AGENT PROTOCOL

> An autonomous AI Multi-Agent Roguelite with RAG (Retrieval-Augmented Generation) mechanics, built for **[start.ng](https://start.ng)** (`agent-protocol.start.ng`).

---

## 🎮 Game Overview

**Agent Protocol** is a fast-paced, cyber-tactical browser game where you command an autonomous AI multi-agent taskforce navigating a corrupted neural mainframe.

Unlike conventional action games, you don't micro-manage every attack. Instead, you act as the **Lead Core Architect** directing high-level strategy while your autonomous subagents:
* 🛰️ **Recon-01 (Perception Agent):** Autonomously scans perimeters, tracks anomaly clusters, and identifies high-value targets.
* 📚 **Vector-02 (RAG Retrieval Agent):** Searches distributed vector knowledge shards to overcome "knowledge cutoffs" when facing encrypted boss protocols.
* ⚡ **Striker-03 (Tool Execution Agent):** Evaluates active context and dynamically calls offensive and defensive tools (`deploy_emp`, `quantum_barrier`, `resonance_laser`).

---

## 🧠 Key Features & AI Concepts

1. **Autonomous Perception-Reason-Action Loop:** Watch your agents evaluate goals, prioritize threats, and execute actions with a live, real-time **Agent Thought Stream HUD**.
2. **RAG Vector Mechanics:** Encounter unknown boss firewalls that deflect standard attacks. Deploy your RAG agent to retrieve vector blueprints from knowledge shards, augment the squad's context window, and trigger devastating countermeasure tools!
3. **start.ng Character Integration:** Your playable Lead Architect character is dynamically rendered matching your start.ng avatar's skin tone, hair, hat, clothing colors, and accessories.
4. **Global Leaderboard (`startng.json`):** Compete against other players worldwide across 4 custom stats:
   - `sectors`: Sectors Purged (Highest)
   - `rag_retrievals`: Vector Shards Retrieved (Highest)
   - `efficiency`: Token / Compute Efficiency (Highest)
   - `time`: Run Duration (Lowest)
5. **Zero External Dependencies:** Built with pure modern HTML5 Canvas, Vanilla JavaScript (ES6+), and a self-contained procedural Web Audio API synthesizer.

---

## 🛠️ Tech Stack & Architecture

* **Frontend:** HTML5, CSS3 Glassmorphism, Vanilla ES6+ JavaScript, Canvas 2D
* **Audio:** Web Audio API Procedural Synthesizer (0 external audio files)
* **Backend & Identity:** [start.ng](https://start.ng) Platform API & Connect Bridge (`postMessage`)
* **Deployment:** Public GitHub Repository with automated start.ng CI/CD syncing

---

## 🚀 How to Run Locally

Simply open `index.html` in any modern web browser or serve with any static HTTP server:

```bash
# Using Python
python -m http.server 8000

# Using Node / npx
npx serve .
```

---

*Created for the HNG / start.ng community.*
