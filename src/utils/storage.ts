import type { Timer } from '../types/timer.ts';

const TIMERS_KEY = 'time-secretary:timers';
const VOICE_ENABLED_KEY = 'time-secretary:voice-enabled';

// 旧バージョン（agy_ 接頭辞）で使っていたキー。互換性は持たず削除する
const LEGACY_KEYS = ['agy_timers', 'agy_timers_saved_at', 'agy_voice_enabled'];

const STATUSES: ReadonlyArray<Timer['status']> = ['running', 'paused', 'completed'];

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isTimer = (value: unknown): value is Timer => {
  if (typeof value !== 'object' || value === null) return false;
  const t = value as Record<string, unknown>;
  return (
    typeof t.id === 'string' &&
    typeof t.label === 'string' &&
    isFiniteNumber(t.duration) &&
    t.duration > 0 &&
    isFiniteNumber(t.remaining) &&
    STATUSES.includes(t.status as Timer['status']) &&
    isFiniteNumber(t.createdAt) &&
    (t.startedAt === undefined || isFiniteNumber(t.startedAt)) &&
    (t.status !== 'running' || t.startedAt !== undefined) &&
    isFiniteNumber(t.accumulatedElapsedMs) &&
    typeof t.voiced30Min === 'boolean' &&
    typeof t.voiced10Min === 'boolean' &&
    typeof t.voicedEnd === 'boolean'
  );
};

/**
 * 保存データを解析し、形式が正しいタイマーだけを返す
 */
export const parseStoredTimers = (raw: string | null): Timer[] => {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isTimer) : [];
  } catch {
    return [];
  }
};

// プライベートモード等で localStorage が使えない場合も動作を継続する
const getItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const setItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`Failed to save ${key} to localStorage`, e);
  }
};

export const removeLegacyStorage = () => {
  try {
    LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    // localStorage が使えない場合は何もしない
  }
};

export const loadTimers = (): Timer[] => parseStoredTimers(getItem(TIMERS_KEY));

export const saveTimers = (timers: Timer[]) => setItem(TIMERS_KEY, JSON.stringify(timers));

export const loadVoiceEnabled = (): boolean => getItem(VOICE_ENABLED_KEY) !== 'false';

export const saveVoiceEnabled = (enabled: boolean) => setItem(VOICE_ENABLED_KEY, String(enabled));
