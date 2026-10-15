import assert from 'node:assert';
import { test } from 'node:test';
import { parseStoredTimers } from './storage.ts';
import { createTimer } from './timer.ts';

test('parseStoredTimers keeps valid timers', () => {
  const timers = [createTimer('a', 'A', 60, true, 1000), createTimer('b', 'B', 60, false, 1000)];
  assert.deepStrictEqual(parseStoredTimers(JSON.stringify(timers)), JSON.parse(JSON.stringify(timers)));
});

test('parseStoredTimers drops malformed entries', () => {
  const valid = createTimer('a', 'A', 60, false, 1000);
  // 旧形式（秒単位の accumulatedElapsed）や欠損データは破棄する
  const legacy = { ...valid, id: 'b', accumulatedElapsed: 0, accumulatedElapsedMs: undefined };
  const runningWithoutStart = { ...valid, id: 'c', status: 'running' };
  const raw = JSON.stringify([valid, legacy, runningWithoutStart, null, 'x']);
  assert.deepStrictEqual(
    parseStoredTimers(raw).map((t) => t.id),
    ['a']
  );
});

test('parseStoredTimers returns an empty list for broken input', () => {
  assert.deepStrictEqual(parseStoredTimers(null), []);
  assert.deepStrictEqual(parseStoredTimers('{not json'), []);
  assert.deepStrictEqual(parseStoredTimers('{"a":1}'), []);
});
