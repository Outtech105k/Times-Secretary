export interface Timer {
  id: string;
  label: string;
  duration: number; // 初期設定時間（秒数）
  remaining: number; // 残り時間（秒数）
  status: 'running' | 'paused' | 'completed';
  createdAt: number; // 作成時刻のタイムスタンプ
  startedAt?: number; // 最後にカウントダウンを開始したタイムスタンプ（ミリ秒）
  accumulatedElapsedMs: number; // 過去のセッションで経過した時間（ミリ秒）
  voiced30Min: boolean; // 30分前予告の音声再生フラグ
  voiced10Min: boolean; // 10分前予告の音声再生フラグ
  voicedEnd: boolean; // 終了音声の再生フラグ
}
