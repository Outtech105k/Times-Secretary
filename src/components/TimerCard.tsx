import React from 'react';
import type { Timer } from '../types/timer';

interface TimerCardProps {
  timer: Timer;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onReset: (id: string, autoStart?: boolean) => void;
  onDelete: (id: string) => void;
}

export const TimerCard: React.FC<TimerCardProps> = ({
  timer,
  onPause,
  onResume,
  onReset,
  onDelete,
}) => {
  const { label, duration, remaining, status } = timer;

  // 時間のフォーマット表示 (HH:MM:SS)
  const formatTime = (totalSeconds: number): string => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const pad = (num: number) => String(num).padStart(2, '0');

    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  // プログレスサークルの計算
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const progress = duration > 0 ? remaining / duration : 0;
  const strokeDashoffset = circumference - progress * circumference;

  const isCompleted = status === 'completed';

  return (
    <div className={`timer-card glass ${status} ${isCompleted ? 'completed-pulse' : ''}`}>
      <div className="timer-header">
        <h3 className="timer-label" title={label}>
          {label}
        </h3>
      </div>

      <div className="timer-display-container">
        {/* 円形プログレスバー */}
        <div className="progress-circle-wrapper">
          <svg aria-hidden="true" className="progress-circle" width="160" height="160" viewBox="0 0 160 160">
            {/* 背景サークル */}
            <circle
              className="progress-bg"
              cx="80"
              cy="80"
              r={radius}
              strokeWidth="8"
            />
            {/* 進捗サークル */}
            <circle
              className="progress-bar"
              cx="80"
              cy="80"
              r={radius}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 80 80)"
              strokeLinecap="round"
            />
          </svg>
          <div className="timer-digital-display">
            <span className="time-text" role="timer" aria-label={`残り ${formatTime(remaining)}`}>{formatTime(remaining)}</span>
            <span className="total-time">初期設定: {formatTime(duration)}</span>
          </div>
        </div>
      </div>

      <div className="timer-controls">
        {isCompleted ? (
          <>
            {/* アラームは止めるまで鳴り続ける。止めたタイマーは削除せず初期時間に戻す */}
            <button
              onClick={() => onReset(timer.id, false)}
              className="btn btn-control btn-reset"
              title="アラームを止める（初期時間に戻す）"
              aria-label="アラームを止める（初期時間に戻す）"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="6" y="6" width="12" height="12" />
              </svg>
            </button>
            <button
              onClick={() => onReset(timer.id, true)}
              className="btn btn-control btn-resume"
              title="アラームを止めて再スタート"
              aria-label="アラームを止めて再スタート"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(timer.id)}
              className="btn btn-control btn-danger"
              title="削除"
              aria-label="削除"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </>
        ) : (
          <>
            {status === 'running' ? (
              <button
                onClick={() => onPause(timer.id)}
                className="btn btn-control btn-pause"
                title="一時停止"
                aria-label="一時停止"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => onResume(timer.id)}
                className="btn btn-control btn-resume"
                title="再開"
                aria-label="再開"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </button>
            )}
            <button
              onClick={() => onReset(timer.id)}
              className="btn btn-control btn-reset"
              title="リセット"
              aria-label="リセット"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(timer.id)}
              className="btn btn-control btn-danger"
              title="削除"
              aria-label="削除"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
