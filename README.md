# Time-Secretary
> 予告・読み上げ機能付きマルチタイマー Web アプリケーション

複数のタイマーを同時に管理・実行できる、高性能でスタイリッシュなタイマーアプリです。Cloudflare Pages などの静的サイトホスティングサービスに簡単にデプロイできます。

## ✨ 主な機能

*   **複数タイマーの同時管理**: 各タイマーにラベルを設定し、並行してカウントダウンを実行できます。
*   **高精度な時間計測**: `Date.now()` を用いて経過時間を算出するため、タブがバックグラウンドに移行しても時間のズレが発生しません。
*   **音声予告 (TTS)**: Web Speech API を利用した日本語音声読み上げ機能を搭載。
    *   **10分前予告**: すべてのタイマーで「[ラベル名]、残り10分前。」と読み上げます。
    *   **30分前予告**: 設定時間が60分を超えるタイマーのみ、残り30分時点で「[ラベル名]、残り30分前。」と読み上げます。
    *   **完了通知**: タイマー完了時に「[ラベル名]が終了しました。」と読み上げます。
*   **状態の永続化**: タイマーの進行状況は自動的に `localStorage` に保存され、ページをリロードしたりブラウザを閉じたりしても、バックグラウンドでの経過時間を反映して再開されます。
*   **レスポンシブデザイン**: スマートフォン、タブレット、PCに対応した美しいダークテーマ（ガラスモフィズム）のUI。
*   **一括操作機能**: すべてのタイマーの一時停止、再開、削除がワンクリックで行えます。

---

## 🛠️ 技術スタック

*   **Frontend**: React, TypeScript, Vite
*   **Styling**: Vanilla CSS (CSS Variables, Flexbox, Grid, CSS Transitions, keyframe animation)
*   **Voice Engine**: Web Speech API (`SpeechSynthesis`)
*   **Deployment**: Cloudflare Pages 互換

---

## 🚀 開発環境のセットアップ

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 開発サーバーの起動
```bash
npm run dev
```

---

## 🌐 Cloudflare Pages へのデプロイ

本プロジェクトは静的 SPA (Single Page Application) としてビルドされるため、Cloudflare Pages に容易にデプロイできます。

### Cloudflare Pages 設定値:
*   **Framework Preset**: `Vite` (または `None`)
*   **Build command**: `npm run build`
*   **Output directory**: `dist`
*   **Root directory**: `/` (プロジェクトのルート)

ビルドは以下のコマンドで実行できます：
```bash
npm run build
```
ビルド完了後、`dist` ディレクトリの内容を Cloudflare Pages にアップロードしてください。
