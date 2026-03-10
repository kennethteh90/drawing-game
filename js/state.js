// ==================== STATE MANAGEMENT (localStorage) ====================
const KEY = 'drawbounce_v1';

function defaultState() {
  return {
    currentLevel: 0,          // index of last played level
    completed: [],            // array of completed level indices
    attempts: {},             // { levelIdx: count }
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    return Object.assign(defaultState(), JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable — fail silently
  }
}

export function markLevelComplete(state, levelIdx) {
  if (!state.completed.includes(levelIdx)) {
    state.completed.push(levelIdx);
  }
  saveState(state);
}

export function incrementAttempts(state, levelIdx) {
  state.attempts[levelIdx] = (state.attempts[levelIdx] || 0) + 1;
  saveState(state);
}

export function resetProgress() {
  try { localStorage.removeItem(KEY); } catch {}
  return defaultState();
}
