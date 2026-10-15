import type { Timer } from '../types/timer.ts';

// 30分前予告は設定時間がこの秒数を超えるタイマーのみ対象
const LONG_TIMER_THRESHOLD = 3600;
const PREVIEW_30_MIN = 1800;
const PREVIEW_10_MIN = 600;

export type TimerEvent =
  | { type: 'preview'; timerId: string; label: string; remainingMinutes: number }
  | { type: 'complete'; timerId: string; label: string };

/**
 * 経過時間（ミリ秒）を算出する。秒への丸めは表示時のみ行い、累積値には誤差を持ち込まない。
 */
export const getElapsedMs = (timer: Timer, now: number): number => {
  const running = timer.status === 'running' && timer.startedAt !== undefined;
  return timer.accumulatedElapsedMs + (running ? now - timer.startedAt! : 0);
};

const getRemainingSeconds = (timer: Timer, now: number): number =>
  Math.max(0, timer.duration - Math.floor(getElapsedMs(timer, now) / 1000));

// 開始時点で既に過ぎている予告は不要なため、あらかじめ予告済みフラグを立てる
const initialPreviewFlags = (duration: number) => ({
  voiced30Min: duration <= PREVIEW_30_MIN,
  voiced10Min: duration <= PREVIEW_10_MIN,
  voicedEnd: false,
});

export const createTimer = (
  id: string,
  label: string,
  duration: number,
  autoStart: boolean,
  now: number
): Timer => ({
  id,
  label,
  duration,
  remaining: duration,
  status: autoStart ? 'running' : 'paused',
  createdAt: now,
  startedAt: autoStart ? now : undefined,
  accumulatedElapsedMs: 0,
  ...initialPreviewFlags(duration),
});

export const pauseTimer = (timer: Timer, now: number): Timer => {
  if (timer.status !== 'running') return timer;
  return {
    ...timer,
    status: 'paused',
    startedAt: undefined,
    accumulatedElapsedMs: getElapsedMs(timer, now),
  };
};

export const resumeTimer = (timer: Timer, now: number): Timer => {
  if (timer.status !== 'paused') return timer;
  return { ...timer, status: 'running', startedAt: now };
};

export const resetTimer = (timer: Timer, autoStart: boolean, now: number): Timer => ({
  ...timer,
  remaining: timer.duration,
  status: autoStart ? 'running' : 'paused',
  startedAt: autoStart ? now : undefined,
  accumulatedElapsedMs: 0,
  ...initialPreviewFlags(timer.duration),
});

/**
 * 現在時刻に合わせてタイマーを進め、発生した予告・完了イベントを返す。
 * 変化がなければ同じオブジェクト参照を返す。
 * @param silent true の場合、フラグだけ更新してイベントを発生させない（復元時用）
 */
export const tickTimer = (
  timer: Timer,
  now: number,
  silent = false
): { timer: Timer; events: TimerEvent[] } => {
  if (timer.status !== 'running') return { timer, events: [] };

  const remaining = getRemainingSeconds(timer, now);
  if (remaining === timer.remaining) return { timer, events: [] };

  const events: TimerEvent[] = [];

  if (remaining <= 0) {
    if (!timer.voicedEnd && !silent) {
      events.push({ type: 'complete', timerId: timer.id, label: timer.label });
    }
    return {
      timer: {
        ...timer,
        remaining: 0,
        status: 'completed',
        startedAt: undefined,
        accumulatedElapsedMs: timer.duration * 1000,
        voiced30Min: true,
        voiced10Min: true,
        voicedEnd: true,
      },
      events,
    };
  }

  const reached30 =
    timer.duration > LONG_TIMER_THRESHOLD && remaining <= PREVIEW_30_MIN && !timer.voiced30Min;
  const reached10 = remaining <= PREVIEW_10_MIN && !timer.voiced10Min;

  // バックグラウンドでの間引きで判定が遅れても、両方を同時に読み上げず実際の残り時間を伝える
  if ((reached30 || reached10) && !silent) {
    events.push({
      type: 'preview',
      timerId: timer.id,
      label: timer.label,
      remainingMinutes: Math.ceil(remaining / 60),
    });
  }

  return {
    timer: {
      ...timer,
      remaining,
      voiced30Min: timer.voiced30Min || reached30 || reached10,
      voiced10Min: timer.voiced10Min || reached10,
    },
    events,
  };
};
