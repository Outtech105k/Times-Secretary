import { useState, useEffect, useRef, useCallback } from 'react';
import type { Timer } from './types/timer';
import { createTimer, pauseTimer, resetTimer, resumeTimer, tickTimer, type TimerEvent } from './utils/timer';
import { TimerForm } from './components/TimerForm';
import { TimerCard } from './components/TimerCard';
import { speak, unlockSpeechSynthesis } from './utils/speech';
import { playChime, startAlarm, stopAlarm, unlockAudioContext } from './utils/audio';
import './App.css';

const TIMERS_STORAGE_KEY = 'agy_timers';

// 保存済みタイマーを読み込み、閉じていた間の経過を（発話なしで）反映する
const loadTimers = (): Timer[] => {
  const saved = localStorage.getItem(TIMERS_STORAGE_KEY);
  if (!saved) return [];
  try {
    const now = Date.now();
    return (JSON.parse(saved) as Timer[]).map((timer) => tickTimer(timer, now, true).timer);
  } catch (e) {
    console.error('Failed to parse timers from localStorage', e);
    return [];
  }
};

function App() {
  const [timers, setTimersState] = useState<Timer[]>(loadTimers);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    const saved = localStorage.getItem('agy_voice_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  // インターバル処理とユーザー操作が常に最新の状態を基に更新できるよう、ref を唯一の書き込み元とする
  const timersRef = useRef<Timer[]>(timers);
  const voiceEnabledRef = useRef(voiceEnabled);

  const updateTimers = useCallback((update: (prev: Timer[]) => Timer[]) => {
    const next = update(timersRef.current);
    if (next === timersRef.current) return;
    timersRef.current = next;
    setTimersState(next);
  }, []);

  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
    localStorage.setItem('agy_voice_enabled', voiceEnabled.toString());
  }, [voiceEnabled]);

  // タイマー状態変更時にLocalStorageに保存
  useEffect(() => {
    localStorage.setItem(TIMERS_STORAGE_KEY, JSON.stringify(timers));
  }, [timers]);

  // 高精度インターバルタイマー (200ms周期)
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const events: TimerEvent[] = [];
      let changed = false;

      const nextTimers = timersRef.current.map((timer) => {
        const result = tickTimer(timer, now);
        if (result.timer !== timer) changed = true;
        events.push(...result.events);
        return result.timer;
      });

      if (!changed) return;
      updateTimers(() => nextTimers);

      const textsToSpeak: string[] = [];
      let shouldPlaySingleChime = false;
      events.forEach((event) => {
        if (event.type === 'complete') {
          textsToSpeak.push(`${event.label}が終了しました。`);
          startAlarm(event.timerId, voiceEnabledRef.current ? 4000 : 0);
        } else {
          textsToSpeak.push(`${event.label}、残り${event.remainingMinutes}分前。`);
          shouldPlaySingleChime = true;
        }
      });

      // 予告タイミング（N分前）の場合、チャイムを1回再生
      if (shouldPlaySingleChime) {
        playChime();
      }
      // 発話を一括実行（音声読み上げが有効な場合のみ）
      if (voiceEnabledRef.current) {
        textsToSpeak.forEach((text) => speak(text));
      }
    };

    const intervalId = setInterval(tick, 200);
    // バックグラウンドではインターバルが間引かれるため、タブ復帰時に即座に判定する
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [updateTimers]);

  // 音声の事前アンロック（ブラウザの自動再生ポリシー対策）
  const unlockAudio = (silent = false) => {
    // Safariなどのブラウザ制限を解除するため、ユーザー操作の同期コールスタック内で毎回アンロック関数を呼ぶ
    unlockAudioContext();
    unlockSpeechSynthesis();

    if (!audioUnlocked) {
      if (!silent) {
        if (voiceEnabledRef.current) {
          speak('音声読み上げ機能を有効化しました。');
        } else {
          playChime();
        }
      }
      setAudioUnlocked(true);
    }
  };


  // 新規タイマー追加
  const handleAddTimer = (label: string, hours: number, minutes: number, seconds: number, autoStart = true) => {
    unlockAudio();
    const duration = hours * 3600 + minutes * 60 + seconds;
    const id = Math.random().toString(36).substring(2, 11);
    const newTimer = createTimer(id, label, duration, autoStart, Date.now());
    updateTimers((prev) => [newTimer, ...prev]);
  };

  // 一時停止
  const handlePause = (id: string) => {
    const now = Date.now();
    updateTimers((prev) => prev.map((t) => (t.id === id ? pauseTimer(t, now) : t)));
  };

  // 再開
  const handleResume = (id: string) => {
    unlockAudio();
    const now = Date.now();
    updateTimers((prev) => prev.map((t) => (t.id === id ? resumeTimer(t, now) : t)));
  };

  // リセット
  const handleReset = (id: string, autoStart = true) => {
    unlockAudio();
    stopAlarm(id);
    const now = Date.now();
    updateTimers((prev) => prev.map((t) => (t.id === id ? resetTimer(t, autoStart, now) : t)));
  };

  // 削除
  const handleDelete = (id: string) => {
    stopAlarm(id);
    updateTimers((prev) => prev.filter((t) => t.id !== id));
  };

  // 全て一時停止
  const handlePauseAll = () => {
    const now = Date.now();
    updateTimers((prev) => prev.map((t) => pauseTimer(t, now)));
  };

  // 全て再開
  const handleResumeAll = () => {
    unlockAudio();
    const now = Date.now();
    updateTimers((prev) => prev.map((t) => resumeTimer(t, now)));
  };

  // 全て削除
  const handleClearAll = () => {
    if (window.confirm('すべてのタイマーを削除しますか？')) {
      timersRef.current.forEach((t) => stopAlarm(t.id));
      updateTimers(() => []);
    }
  };

  const activeCount = timers.filter((t) => t.status === 'running').length;
  const pausedCount = timers.filter((t) => t.status === 'paused').length;
  const completedCount = timers.filter((t) => t.status === 'completed').length;

  return (
    <div className="app-container" onClick={() => unlockAudio(false)}>
      <header className="app-header glass">
        <div className="header-brand">
          <div>
            <h1>Time-Secretary</h1>
            <p className="subtitle">予告・読み上げ機能付きマルチタイマー</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="header-toggle-container" onClick={(e) => e.stopPropagation()}>
            <span className="toggle-label-header">
              {voiceEnabled ? '音声読み上げ: ON' : '音声読み上げ: OFF'}
            </span>
            <label className="switch">
              <input
                type="checkbox"
                checked={voiceEnabled}
                onChange={(e) => {
                  const val = e.target.checked;
                  unlockAudio(true); // サイレントアンロックを実行
                  setVoiceEnabled(val);
                  // オンオフ切り替え時の即時フィードバック
                  if (val) {
                    speak('音声読み上げを有効にしました。');
                  } else {
                    playChime();
                  }
                }}
              />
              <span className="slider round"></span>
            </label>
          </div>
        </div>
      </header>

      <main className="main-content">
        <section className="control-sidebar">
          <TimerForm onAddTimer={handleAddTimer} />

          <div className="dashboard-stats glass">
            <h3>ステータス</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-val text-running">{activeCount}</span>
                <span className="stat-label">実行中</span>
              </div>
              <div className="stat-item">
                <span className="stat-val text-paused">{pausedCount}</span>
                <span className="stat-label">一時停止</span>
              </div>
              <div className="stat-item">
                <span className="stat-val text-completed">{completedCount}</span>
                <span className="stat-label">完了</span>
              </div>
            </div>
            
            {timers.length > 0 && (
              <div className="bulk-actions">
                {activeCount > 0 && (
                  <button onClick={handlePauseAll} className="btn btn-secondary">
                    すべて一時停止
                  </button>
                )}
                {pausedCount > 0 && (
                  <button onClick={handleResumeAll} className="btn btn-primary">
                    {timers.some((t) => t.status === 'paused' && t.accumulatedElapsedMs === 0)
                      ? '一斉スタート'
                      : 'すべて再開'}
                  </button>
                )}
                <button onClick={handleClearAll} className="btn btn-danger">
                  すべてクリア
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="timers-display-section">
          {timers.length === 0 ? (
            <div className="empty-state glass">
              <h2>タイマーが登録されていません</h2>
              <p>左側のフォームからタイマーを追加して、マルチタスクを開始しましょう。</p>
              <p className="hint">※タブがバックグラウンドでも残り時間は正確に計測されます。ただしブラウザの省電力制御により、予告・通知が最大1分ほど遅れることがあります。スマートフォンで画面がスリープした場合は通知されません。</p>
            </div>
          ) : (
            <div className="timers-grid">
              {timers.map((timer) => (
                <TimerCard
                  key={timer.id}
                  timer={timer}
                  onPause={handlePause}
                  onResume={handleResume}
                  onReset={handleReset}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="app-footer">
        <p>© 2026 Time-Secretary. Deployable on Cloudflare Pages.</p>
      </footer>
    </div>
  );
}

export default App;
