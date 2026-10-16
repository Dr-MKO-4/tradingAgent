// src/lib/sim/history.js : simulated sessions stored in localStorage (demo mode).
const KEY = 'live-sessions-v1';
const MAX = 50;

export function loadSessions() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export function saveSession(session) {
  if (!session || !session.id) return;
  try {
    const list = loadSessions().filter((s) => s.id !== session.id);
    list.unshift(session);
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    // storage unavailable (private mode): the history simply stays empty
  }
}

export function clearSessions() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
