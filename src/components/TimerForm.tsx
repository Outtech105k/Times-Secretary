import React, { useState } from 'react';
import { normalizeTimeInputs } from '../utils/time';

interface TimerFormProps {
  onAddTimer: (label: string, hours: number, minutes: number, seconds: number, autoStart?: boolean) => void;
}

export const TimerForm: React.FC<TimerFormProps> = ({ onAddTimer }) => {
  const [label, setLabel] = useState('');
  const [hours, setHours] = useState<number | ''>(0);
  const [minutes, setMinutes] = useState<number | ''>(0);
  const [seconds, setSeconds] = useState<number | ''>(0);
  const [autoStart, setAutoStart] = useState<boolean>(true);

  const getDefaultLabel = (h: number, m: number, s: number) => {
    const totalSeconds = h * 3600 + m * 60 + s;
    if (totalSeconds % 60 === 0) {
      return `${totalSeconds / 60}分タイマー`;
    } else if (totalSeconds < 60) {
      return `${totalSeconds}秒タイマー`;
    } else {
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      return `${mins}分${secs}秒タイマー`;
    }
  };

  const handleNormalize = () => {
    const h = typeof hours === 'number' ? hours : 0;
    const m = typeof minutes === 'number' ? minutes : 0;
    const s = typeof seconds === 'number' ? seconds : 0;

    const normalized = normalizeTimeInputs(h, m, s);
    setHours(normalized.hours);
    setMinutes(normalized.minutes);
    setSeconds(normalized.seconds);
    return normalized;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const normalized = handleNormalize();
    const { hours: h, minutes: m, seconds: s } = normalized;

    const totalSeconds = h * 3600 + m * 60 + s;
    if (totalSeconds <= 0) {
      alert('1秒以上の時間を設定してください。');
      return;
    }

    const finalLabel = label.trim() || getDefaultLabel(h, m, s);
    onAddTimer(finalLabel, h, m, s, autoStart);

    // フォームリセット
    setLabel('');
    setHours(0);
    setMinutes(0);
    setSeconds(0);
  };

  const applyPreset = (h: number, m: number, s: number, presetLabel: string) => {
    setHours(h);
    setMinutes(m);
    setSeconds(s);
    if (!label.trim() || label.endsWith('分タイマー') || label.endsWith('秒タイマー')) {
      setLabel(presetLabel);
    }
  };

  return (
    <form className="timer-form glass" onSubmit={handleSubmit}>
      <h2 className="form-title">新規タイマーの追加</h2>
      
      <div className="form-group">
        <label htmlFor="timer-label">ラベル</label>
        <input
          id="timer-label"
          type="text"
          placeholder="例: パスタを茹でる、ミーティング準備..."
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          maxLength={30}
          className="input-text"
        />
      </div>

      <div className="time-inputs-container">
        <div className="form-group time-input-field">
          <label htmlFor="timer-hours">時</label>
          <input
            id="timer-hours"
            type="number"
            min="0"
            value={hours}
            onChange={(e) => {
              const val = e.target.value;
              setHours(val === '' ? '' : Math.max(0, parseInt(val, 10) || 0));
            }}
            onBlur={handleNormalize}
            placeholder="0"
            className="input-number"
          />
        </div>
        <div className="form-group time-input-field">
          <label htmlFor="timer-minutes">分</label>
          <input
            id="timer-minutes"
            type="number"
            min="0"
            value={minutes}
            onChange={(e) => {
              const val = e.target.value;
              setMinutes(val === '' ? '' : Math.max(0, parseInt(val, 10) || 0));
            }}
            onBlur={handleNormalize}
            placeholder="0"
            className="input-number"
          />
        </div>
        <div className="form-group time-input-field">
          <label htmlFor="timer-seconds">秒</label>
          <input
            id="timer-seconds"
            type="number"
            min="0"
            value={seconds}
            onChange={(e) => {
              const val = e.target.value;
              setSeconds(val === '' ? '' : Math.max(0, parseInt(val, 10) || 0));
            }}
            onBlur={handleNormalize}
            placeholder="0"
            className="input-number"
          />
        </div>
      </div>

      <div className="presets-container">
        <span className="presets-title">クイック設定:</span>
        <div className="presets-buttons">
          <button
            type="button"
            className="btn btn-preset"
            onClick={() => applyPreset(0, 3, 0, '3分タイマー')}
          >
            3分
          </button>
          <button
            type="button"
            className="btn btn-preset"
            onClick={() => applyPreset(0, 5, 0, '5分タイマー')}
          >
            5分
          </button>
          <button
            type="button"
            className="btn btn-preset"
            onClick={() => applyPreset(0, 10, 0, '10分タイマー')}
          >
            10分
          </button>
          <button
            type="button"
            className="btn btn-preset"
            onClick={() => applyPreset(0, 25, 0, '25分タイマー')}
          >
            25分
          </button>
          <button
            type="button"
            className="btn btn-preset"
            onClick={() => applyPreset(0, 45, 0, '45分タイマー')}
          >
            45分
          </button>
          <button
            type="button"
            className="btn btn-preset"
            onClick={() => applyPreset(1, 15, 0, '75分タイマー')}
          >
            75分
          </button>
        </div>
      </div>

      <div className="toggle-container" style={{ marginTop: '20px', marginBottom: '20px' }}>
        <span className="toggle-label">
          {autoStart ? '追加後に即時開始する' : '一時停止状態で追加する'}
        </span>
        <label className="switch">
          <input
            type="checkbox"
            checked={autoStart}
            aria-label="追加後に即時開始する"
            onChange={(e) => setAutoStart(e.target.checked)}
          />
          <span className="slider round"></span>
        </label>
      </div>

      <button type="submit" className="btn btn-submit">
        {autoStart ? 'タイマーを開始する' : 'タイマーを追加する'}
      </button>
    </form>
  );
};

