/**
 * start.ng Bridge for Agent Protocol
 * Complies strictly with https://start.ng/docs.md
 */

const START_NG = 'https://start.ng';
const API_URL = 'https://api.start.ng';
const GAME_NAME = 'agent-protocol';

let connectFramePromise = null;
let currentUser = null;
let currentGuest = null;

/**
 * Initializes and returns the hidden iframe connected to start.ng
 */
export function connectFrame() {
  if (!connectFramePromise) {
    connectFramePromise = new Promise((resolve) => {
      // If running on file:// or non-start.ng during local dev, handle gracefully
      const el = document.createElement('iframe');
      el.src = `${START_NG}/connect`;
      el.hidden = true;
      el.setAttribute('aria-hidden', 'true');
      el.style.display = 'none';

      let resolved = false;
      el.onload = () => {
        if (!resolved) {
          resolved = true;
          resolve(el);
        }
      };

      el.onerror = () => {
        if (!resolved) {
          resolved = true;
          console.warn('[start.ng] Connect iframe failed or blocked; operating in standalone mode.');
          resolve(null);
        }
      };

      // Safety timeout in case start.ng is unreachable
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(el);
        }
      }, 4000);

      document.body.appendChild(el);
    });
  }
  return connectFramePromise;
}

/**
 * Sends a message to start.ng connect frame and awaits the typed response
 */
export async function askStartNg(message, replyType, timeoutMs = 4000) {
  try {
    const el = await connectFrame();
    if (!el || !el.contentWindow) return null;

    return new Promise((resolve) => {
      const requestId = Math.random().toString(36).slice(2);
      let timer = null;

      function onMessage(e) {
        if (e.origin !== START_NG || e.source !== el.contentWindow) return;
        if (e.data?.type === replyType && e.data.requestId === requestId) {
          clearTimeout(timer);
          window.removeEventListener('message', onMessage);
          resolve(e.data);
        }
      }

      timer = setTimeout(() => {
        window.removeEventListener('message', onMessage);
        resolve(null);
      }, timeoutMs);

      window.addEventListener('message', onMessage);
      el.contentWindow.postMessage({ ...message, requestId }, START_NG);
    });
  } catch (err) {
    console.warn('[start.ng] askStartNg error:', err);
    return null;
  }
}

/**
 * Default fallback appearance for Guest / offline testing
 */
export const DEFAULT_STYLE = {
  body: 'male',
  primaryColor: '#00f2fe',
  secondaryColor: '#1a1f2c',
  skinColor: '#8d5524',
  hairColor: '#17120f',
  hair: 'short',
  hat: 'none',
  accessory: 'none'
};

/**
 * Fetches the active player (or default Guest if signed out)
 */
export async function getPlayer() {
  const reply = await askStartNg({ type: 'startng:whoami' }, 'startng:user');
  
  if (reply) {
    currentUser = reply.user || null;
    currentGuest = reply.guest || {
      name: 'Guest Operative',
      style: DEFAULT_STYLE,
      face: ''
    };
  } else {
    // Local / Offline fallback
    currentGuest = {
      name: 'Guest Operative',
      style: DEFAULT_STYLE,
      face: ''
    };
  }

  const active = currentUser || currentGuest;
  // Ensure style has safe fallbacks
  if (active && (!active.style || typeof active.style !== 'object')) {
    active.style = { ...DEFAULT_STYLE };
  }

  return {
    user: currentUser,
    guest: currentGuest,
    active: active,
    isSignedIn: !!currentUser
  };
}

/**
 * Triggers start.ng sign-in redirect
 */
export function signIn() {
  const returnTo = encodeURIComponent(window.location.origin + window.location.pathname);
  window.location.href = `${START_NG}/?return_to=${returnTo}`;
}

/**
 * Saves a completed run's stats to the start.ng leaderboard
 * @param {Object} stats - { sectors: number, rag_retrievals: number, efficiency: number, time: number }
 */
export async function saveScore(stats) {
  // Whole numbers verification per start.ng rules
  const sanitized = {
    sectors: Math.max(0, Math.floor(stats.sectors || 0)),
    rag_retrievals: Math.max(0, Math.floor(stats.rag_retrievals || 0)),
    efficiency: Math.max(0, Math.floor(stats.efficiency || 0)),
    time: Math.max(0, Math.floor(stats.time || 0))
  };

  const saved = await askStartNg({ type: 'startng:score', stats: sanitized }, 'startng:scoreSaved');
  if (saved && saved.ok) {
    return { ok: true, result: saved.result };
  }

  // Also support HTTP API session token if present
  const session = sessionStorage.getItem('startng_session');
  if (session) {
    try {
      const res = await fetch(`${API_URL}/games/${GAME_NAME}/scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session}`
        },
        body: JSON.stringify({ stats: sanitized })
      });
      if (res.ok) {
        const result = await res.json();
        return { ok: true, result };
      }
    } catch (e) {
      console.warn('[start.ng] HTTP score post error:', e);
    }
  }

  return { ok: false, error: saved?.error || 'Sign in to save your score to the official leaderboard' };
}

/**
 * Reads top leaderboard entries
 * @param {number} limit 
 */
export async function getLeaderboard(limit = 10) {
  const board = await askStartNg({ type: 'startng:leaderboard', limit }, 'startng:leaderboardData');
  if (board && board.ok && Array.isArray(board.entries)) {
    return board.entries;
  }

  // Fallback to public HTTP API
  try {
    const res = await fetch(`${API_URL}/games/${GAME_NAME}/leaderboard?limit=${limit}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // Ignore network error in local dev
  }

  return [];
}

/**
 * Listen for session token in URL hash on redirect return
 */
export function handleRedirectSession() {
  if (window.location.hash.includes('startng_session=')) {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get('startng_session');
    if (token) {
      sessionStorage.setItem('startng_session', token);
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }
}
