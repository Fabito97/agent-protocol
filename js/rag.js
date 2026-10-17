/**
 * RAG (Retrieval-Augmented Generation) Vector Engine for Agent Protocol
 * Simulates high-dimensional vector embeddings, semantic retrieval, and context augmentation.
 */

export class RagEngine {
  constructor() {
    // Knowledge Base Documents with simulated 4D normalized vector embeddings
    this.knowledgeBase = [
      {
        id: 'doc_emp_res',
        title: 'Resonance EMP Protocol',
        toolName: 'resonance_emp',
        vector: [0.92, -0.38, 0.45, 0.12],
        blueprint: 'Discharges harmonic frequency burst. Shatters Phase-1 & 2 Quantum Shields.',
        computeCost: 15
      },
      {
        id: 'doc_tachyon_pulse',
        title: 'Tachyon Overload Beam',
        toolName: 'tachyon_blast',
        vector: [-0.41, 0.88, 0.22, 0.65],
        blueprint: 'Accelerates subatomic particles. Melts heavy firewall nodes instantly.',
        computeCost: 20
      },
      {
        id: 'doc_quantum_barrier',
        title: 'Defensive Firewall Matrix',
        toolName: 'quantum_barrier',
        vector: [0.15, 0.35, -0.91, 0.42],
        blueprint: 'Deploys 360-degree deflection barrier absorbing incoming corrupted packets.',
        computeCost: 12
      },
      {
        id: 'doc_overclock_sync',
        title: 'Swarm Overclock Routine',
        toolName: 'overclock_sync',
        vector: [0.65, 0.65, 0.30, -0.25],
        blueprint: 'Synchronizes all agent microprocessors. 2x attack rate for 6 seconds.',
        computeCost: 25
      }
    ];

    // Context Window: holds retrieved knowledge blueprints for the swarm
    this.contextWindow = [];
    this.maxContextSlots = 4;
    this.totalRetrievals = 0;
  }

  /**
   * Calculates Cosine Similarity between two N-dimensional vectors:
   * (A · B) / (||A|| * ||B||)
   */
  cosineSimilarity(vecA, vecB) {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Performs Semantic Search against the Vector Knowledge Base
   * @param {Array<number>} queryVector - Vector generated from enemy shield frequency
   */
  searchVectorDb(queryVector) {
    let bestDoc = null;
    let bestSimilarity = -1;

    for (const doc of this.knowledgeBase) {
      const sim = this.cosineSimilarity(queryVector, doc.vector);
      if (sim > bestSimilarity) {
        bestSimilarity = sim;
        bestDoc = doc;
      }
    }

    return {
      doc: bestDoc,
      similarity: Math.max(0, bestSimilarity)
    };
  }

  /**
   * Augments the Swarm's active context window with a retrieved blueprint
   */
  augmentContext(doc) {
    if (!doc) return false;

    // Check if already in context
    const exists = this.contextWindow.find(item => item.id === doc.id);
    if (!exists) {
      // FIFO eviction if context window is full
      if (this.contextWindow.length >= this.maxContextSlots) {
        this.contextWindow.shift();
      }
      this.contextWindow.push(doc);
      this.totalRetrievals++;
      return true;
    }
    return false;
  }

  /**
   * Checks if a specific tool capability is currently present in active context
   */
  hasInContext(toolName) {
    return this.contextWindow.some(doc => doc.toolName === toolName);
  }

  /**
   * Clears context window (e.g. On entering a new sector)
   */
  resetContext() {
    this.contextWindow = [];
  }
}
