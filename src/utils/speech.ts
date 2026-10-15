/**
 * Web Speech API (speechSynthesis) を使用した音声読み上げサービス
 */

import { getChimeRemainingMs, setChimeHold } from './audio';

// 発話キューを管理するための簡易ロック
let isSpeaking = false;
const speechQueue: string[] = [];

// SafariのGC（ガベージコレクション）による発話バグを防ぐための参照保持用Set
const activeUtterances = new Set<SpeechSynthesisUtterance>();

// チャイムの鳴り終わりを待つためのタイマー
let chimeWaitId: ReturnType<typeof setTimeout> | null = null;

// 読み上げ中・待機中はアラームのチャイムを控え、音声と重ならないようにする
setChimeHold(() => isSpeaking || speechQueue.length > 0);

const processQueue = () => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  // Safariのポーズバグ対策として、再生前にresumeを実行
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }

  if (isSpeaking || speechQueue.length === 0 || chimeWaitId) return;

  // チャイムの再生中は、鳴り終わってから読み上げる
  const chimeRemainingMs = getChimeRemainingMs();
  if (chimeRemainingMs > 0) {
    chimeWaitId = setTimeout(() => {
      chimeWaitId = null;
      processQueue();
    }, chimeRemainingMs);
    return;
  }

  const nextText = speechQueue.shift();
  if (!nextText) return;

  isSpeaking = true;
  const utterance = new SpeechSynthesisUtterance(nextText);
  utterance.lang = 'ja-JP';

  // 参照を保持してGCを防ぐ
  activeUtterances.add(utterance);

  // 日本語の音声を探す
  const voices = window.speechSynthesis.getVoices();
  const jaVoice = voices.find(
    (v) => v.lang === 'ja-JP' || v.lang.replace('_', '-').toLowerCase().startsWith('ja')
  );
  if (jaVoice) {
    utterance.voice = jaVoice;
  }

  // Safari等のブラウザで、onendやonerrorが呼ばれずにフリーズするバグに対するセーフティネット
  // 発話文字列の長さに応じてタイムアウト時間を変動させる (1文字あたり300ms, 最低5秒)
  const timeoutDuration = Math.max(5000, nextText.length * 300);
  let isCleanedUp = false;

  const cleanup = () => {
    if (isCleanedUp) return;
    isCleanedUp = true;
    clearTimeout(timeoutId);
    activeUtterances.delete(utterance);
    isSpeaking = false;
  };

  const timeoutId = setTimeout(() => {
    console.warn('Speech synthesis timed out, forcing next queue item:', nextText);
    cleanup();
    processQueue();
  }, timeoutDuration);

  utterance.onend = () => {
    cleanup();
    processQueue();
  };

  utterance.onerror = (e) => {
    console.error('Speech synthesis error:', e);
    cleanup();
    processQueue();
  };

  window.speechSynthesis.speak(utterance);
};

export const speak = (text: string) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('Speech synthesis is not supported in this browser.');
    return;
  }

  speechQueue.push(text);
  processQueue();
};

/**
 * Safariなどの自動再生ポリシー対策用。
 * ユーザーのクリックイベント等の同期コールスタック内で空の発話を実行し、再生許可を得る。
 */
export const unlockSpeechSynthesis = () => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  try {
    // すでに発話中またはキューが存在する場合はアンロックダミーは不要
    if (isSpeaking || speechQueue.length > 0) return;

    // Safariでのアンロック用ダミー発話 (無音のスペース文字)
    const dummyUtterance = new SpeechSynthesisUtterance(' ');
    dummyUtterance.volume = 0;
    dummyUtterance.lang = 'ja-JP';

    activeUtterances.add(dummyUtterance);
    dummyUtterance.onend = () => {
      activeUtterances.delete(dummyUtterance);
    };
    dummyUtterance.onerror = () => {
      activeUtterances.delete(dummyUtterance);
    };

    // ポーズバグ対策
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    
    window.speechSynthesis.speak(dummyUtterance);
  } catch (e) {
    console.warn('SpeechSynthesis unlock failed:', e);
  }
};

// ページのロードなどで音声リストが非同期に更新された場合のイベントハンドリング
if (typeof window !== 'undefined' && window.speechSynthesis) {
  // 初期ボイスリスト読み込みを促す
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    // 日本語の音声が利用可能になったらキューを再開可能にする
    processQueue();
  };
}
