# はじめに

**Dice!Next 3.0** へようこそ。次世代の TRPG ダイスボットです。

## Dice!Next とは

Dice!Next は Dice! を全面的に作り直したものです。CoolQ 向けの単一 DLL だった構成を、バックエンドとフロントエンドを分離したモダンな構成に再構築しました。

- **バックエンド（C++）**：drogon フレームワークを基盤に、HTTP REST API と WebSocket による通知を提供
- **フロントエンド（React）**：Vite・shadcn/ui・Tailwind CSS で作られた SPA の管理パネル
- **プロトコル層**：OneBot v11 にそのまま対応（正方向 / 逆方向 WS）。プラグイン式のアダプター構成でプロトコルを追加できます

## 主な特徴

| 特徴 | 説明 |
|------|------|
| <Icon name="dices" />充実したダイス機能 | COC7 / DND / BRP の判定とハウスルール、フェイトダイス、シークレットダイス、ボーナス・ペナルティダイス。従来のコマンドと互換 |
| <Icon name="languages" />多言語 | 簡体字中国語・繁体字中国語・英語・日本語で返信。カスタム言語パックにも対応 |
| <Icon name="layout-dashboard" />Web パネル | グループ、プレイヤー、デッキ、ルール、ログ、定期タスク、通知などをすべてブラウザで管理 |
| <Icon name="puzzle" />拡張エコシステム | 元祖 Dice! の Lua mod と SealDice の JS プラグインに対応。ルールパックはワンクリックで導入 |
| <Icon name="bot" />AI 機能 | 大規模言語モデルを任意で接続し、返信の調整、翻訳、会話、NPC ロールプレイ、ツール呼び出しに利用 |
| <Icon name="package" />展開してすぐ使える | Windows 版はランタイムを同梱。ダブルクリックで起動し、タスクトレイに常駐、Windows 起動時の自動起動も可能 |
| <Icon name="zap" />ホットリロード | 設定の変更は自動で反映され、パネルでの変更はすぐに保存されます |

## クイックリンク

- [インストール](/ja/guide/install)：ダウンロード、起動、アップグレード
- [クイックスタート](/ja/guide/quickstart)：5 分で Dice!Next を使い始める
- [データ移行](/ja/guide/migration)：旧版 Dice! からデータを移行する
- [デプロイと運用](/ja/guide/deploy)：長期運用、バックアップ、セキュリティ
- [トラブルシューティング](/ja/guide/troubleshooting)：開けない・接続できない・異常終了するときは

## 動作環境

| 用途 | 要件 |
|------|------|
| リリースパッケージの実行 | 64 ビット版 Windows 10 / 11（よく使われるランタイムは圧縮ファイルに同梱） |
| Linux / Docker | Linux amd64 / arm64 のリリースパッケージと Docker イメージ。デプロイ方法はリリースノートを参照 |
| ソースからのビルド | Visual Studio 2019+ / cmake 3.20 以上 / vcpkg。[ソースからビルド](/ja/develop/build)を参照 |

## バージョンについて

現在の **Dice!Next 3.0 は公開ベータ版** で、AGPLv3 ライセンスのオープンソースです。問題は [GitHub Issues](https://github.com/DiceZone/Dice-Next/issues) からお知らせください。
