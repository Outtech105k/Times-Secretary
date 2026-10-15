import assert from 'node:assert';
import { test } from 'node:test';
import { createTimer, pauseTimer, resetTimer, resumeTimer, tickTimer } from './timer.ts';

const T0 = 1_000_000;

test('pause/resume cycles do not lose sub-second elapsed time', () => {
  let timer = createTimer('a', 'A', 60, true, T0);
  let now = T0;
  // 0.9秒ごとに一時停止・再開を10回繰り返す → 合計9秒経過
  for (let i = 0; i < 10; i++) {
    now += 900;
    timer = pauseTimer(timer, now);
    timer = resumeTimer(timer, now);
  }
  assert.strictEqual(tickTimer(timer, now).timer.remaining, 51);
});

test('tickTimer returns the same reference when nothing changes', () => {
  const timer = createTimer('a', 'A', 60, true, T0);
  assert.strictEqual(tickTimer(timer, T0 + 500).timer, timer);
});

test('tickTimer completes the timer and emits a complete event once', () => {
  const timer = createTimer('a', 'A', 5, true, T0);
  const { timer: done, events } = tickTimer(timer, T0 + 5000);
  assert.strictEqual(done.status, 'completed');
  assert.strictEqual(done.remaining, 0);
  assert.deepStrictEqual(events, [{ type: 'complete', timerId: 'a', label: 'A' }]);
  assert.deepStrictEqual(tickTimer(done, T0 + 6000).events, []);
});

test('tickTimer emits the 30-minute preview only for timers longer than 60 minutes', () => {
  const long = createTimer('a', 'A', 3601, true, T0);
  const { events } = tickTimer(long, T0 + 1801 * 1000);
  assert.deepStrictEqual(events, [
    { type: 'preview', timerId: 'a', label: 'A', remainingMinutes: 30 },
  ]);

  const hour = createTimer('b', 'B', 3600, true, T0);
  assert.deepStrictEqual(tickTimer(hour, T0 + 1800 * 1000).events, []);
});

test('a delayed tick that skips both thresholds announces once with the actual remaining time', () => {
  const timer = createTimer('a', 'A', 7200, true, T0);
  // 残り 8分59秒 まで一気に進んだ場合
  const { timer: next, events } = tickTimer(timer, T0 + (7200 - 539) * 1000);
  assert.deepStrictEqual(events, [
    { type: 'preview', timerId: 'a', label: 'A', remainingMinutes: 9 },
  ]);
  assert.strictEqual(next.voiced30Min, true);
  assert.strictEqual(next.voiced10Min, true);
});

test('silent tick (restore) updates flags without emitting events', () => {
  const timer = createTimer('a', 'A', 60, true, T0);
  const { timer: done, events } = tickTimer(timer, T0 + 120_000, true);
  assert.strictEqual(done.status, 'completed');
  assert.strictEqual(done.voicedEnd, true);
  assert.deepStrictEqual(events, []);
});

test('resetTimer restores the initial duration', () => {
  const timer = tickTimer(createTimer('a', 'A', 60, true, T0), T0 + 60_000).timer;
  const reset = resetTimer(timer, false, T0 + 61_000);
  assert.strictEqual(reset.status, 'paused');
  assert.strictEqual(reset.remaining, 60);
  assert.strictEqual(reset.accumulatedElapsedMs, 0);
  assert.strictEqual(reset.voicedEnd, false);
});
