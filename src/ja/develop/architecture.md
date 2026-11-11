# システム構成

Dice!Next 3.0 は、バックエンドとフロントエンドを分離した階層構成を採用しています。C++ のバックエンドがプロトコルの接続、コマンドの処理、データの保存を担い、React のフロントエンドは純粋な REST API のクライアントです。

## 技術スタック

| 層 | 技術 | 説明 |
|------|------|------|
| ビルドシステム | CMake ≥ 3.20（C++20 + C99） | クロスプラットフォームでのバックエンドと式の互換ライブラリのビルド |
| パッケージ管理 | vcpkg | Microsoft 公式の C++ パッケージ管理 |
| HTTP/WS | drogon | 非同期・ノンブロッキングの C++ Web フレームワーク |
| JSON / YAML | nlohmann/json · yaml-cpp | 設定 / 旧形式の解析 |
| データベース | SQLite3 + sqlite_orm | 軽量で設定不要の永続化 |
| ログ | spdlog | 高性能な非同期のログ |
| JS エンジン | quickjs-ng | JS プラグインのサブシステム（SealDice 互換） |
| Lua エンジン | Lua 5.4 | Lua mod のサブシステム（元祖 Dice! の mod 互換） |
| ダイス | 独自のエンジン + onedice-cpp-lib + dicescript-c-lib | 設定可能なネイティブ、OneDice、DiceScript C99 の安全な代替の連鎖 |
| 圧縮 | zlib · zstd | ログサイトへのアップロード / DiceNext のログ形式 |
| フロントエンド | Vite + React + shadcn/ui + Tailwind CSS | SPA の管理パネル |

## 階層の構成

```
┌────────────────────────────────────────────────┐
│               Web 管理パネル (web/)               │
│   React SPA：HTTP REST API + WebSocket での通知   │
└───────────────────────┬────────────────────────┘
                        │
┌───────────────────────▼────────────────────────┐
│             C++ バックエンド (server/src)         │
│                                                  │
│  サービス層 service/  REST のルート · ログの整理 │
│                    · 通知 · AI ゲートウェイ       │
│                    （文章調整/翻訳/会話/記憶/     │
│                    ツール/NPC/画像/バックグラウンド）│
│  コア層 core/      コマンドの振り分け · ダイスの  │
│                    エンジン · キャラクターシート ·│
│                    デッキ · カスタム返信 · 因果   │
│                    ルール · ペルソナ · Lua/JS     │
│                    プラグインの管理               │
│  保存層 storage/   SQLite（6 つに分割）· データ移行│
│  プラットフォーム層 platform/ トレイ · 自動起動 · │
│                    クラッシュ診断(Win)            │
│  アダプター層 adapter/ OneBot v11（差し替え可能な │
│                    マルチプラットフォーム）       │
└─────────────────────────────────────────────────┘
```

## プロジェクトの構成（バックエンド `server/src`）

```
server/src/
├── main.cpp                 # 入口：各コンポーネントの組み立て、メッセージの処理の流れ、ルートの登録、drogon の起動
├── adapter/                 # アダプター層
│   ├── adapter_interface.h  # IAdapter の抽象 + Message/BotEvent のイベントのモデル
│   ├── adapter_manager.h    # アダプターの管理 / メッセージ・イベントの一括の振り分け
│   ├── onebot_v11_adapter.h # OneBot v11 の実装（正方向/逆方向 WS）
│   └── self_echo_filter.h   # 自分の発言の重複除去（ボット自身のメッセージは処理の流れに入れない）
├── core/                    # コア層
│   ├── command_router.h     # コマンドの振り分け / 内蔵のコマンドの実装（中心となる処理）
│   ├── dice/                # ダイスのエンジン（式 / ハウスルール / 狂気の症状の表）
│   ├── character/           # キャラクターシートの保存
│   ├── deck/                # デッキ
│   ├── reply/               # カスタム返信
│   ├── causal/              # 因果ルール / クールダウン / カウンター
│   ├── persona/             # ボットのペルソナ
│   ├── mod/                 # プラグインのサブシステム
│   │   ├── lua_plugin_manager.*  # Lua mod（元祖 Dice! の mod 互換）
│   │   └── js_plugin_manager.*   # JS プラグイン（SealDice 互換）
│   └── rules_lock.h         # ルールのデータの読み書きのロック
├── service/                 # サービス層
│   ├── api_service.h        # REST API のルート（本体）
│   ├── log_service.h        # セッションログの整理 / 描画 / アップロード
│   ├── notice_manager.h     # 通知の仕組み（ウィンドウへの送信 / SMTP / Webhook / 監査）
│   ├── broadcast_manager.h  # 反応型の一斉送信
│   ├── ai_gateway.h         # AI ゲートウェイ（OpenAI 互換の API）
│   ├── ai_polish.h / ai_translate.h / ai_chat.h / ai_memory.h
│   ├── ai_tools.h / ai_npc.h / ai_vision.h / ai_worker.h
│   ├── chat_image.h / image_host.h / image_send.h   # 画像の処理の流れ
│   ├── group_chat_buffer.h  # グループチャットの文脈のバッファー
│   ├── web_auth.h           # WebUI のログインパスワード（Cookie）
│   └── parquet_writer.h     # ログの出力の形式
├── storage/
│   ├── database.{h,cpp}     # SQLite + sqlite_orm（6 つに分割）
│   ├── legacy_importer.*    # 元祖 V2 のデータ移行
│   ├── legacy_import_v2.h / legacy_dice2.h  # 元祖のファイル形式の解読
│   └── migration.{h,cpp}    # スキーマの移行
├── platform/                # プラットフォーム固有（Windows のトレイ / 自動起動 / クラッシュ診断 / 単一インスタンス）
├── i18n/                    # 多言語のエンジン + 言語の解決
├── message/                 # CQ コードの解析 / メッセージの整形
├── config/                  # 設定の管理（config/*.json。機能ごとに分割）
└── common/                  # ログ / ホットリロード / ツール / バージョン
```

フロントエンドは独立したリポジトリ `Dice-Next-WebUI`（Vite + React、`src/pages`、`src/components`、`src/i18n`）、ドキュメントサイトは独立したリポジトリ `Dice-Next-Doc`（VitePress）です。バックエンドのメインリポジトリ `Dice-Next` には `server/` とパッケージ作成のスクリプトだけが含まれ、コンパイルには同じ階層の `onedice-cpp-lib` と `dicescript-c-lib` のリポジトリも必要です。

## データベースの分割

データは用途ごとに 6 つの SQLite のデータベースに分かれており（既定では `data/` にある）、それぞれ独立してバックアップ / 削除できます。

| データベース | 内容 |
|----|------|
| `dice.db` | メイン：グループ / プレイヤー / ブラックリスト・ホワイトリスト / 定期タスク / 文面の上書きなど |
| `cards.db` | キャラクターシート |
| `logs.db` | セッションログ |
| `chat.db` | チャットの永続化（チャットのシミュレーター / AI の記憶） |
| `lua_mod.db` | Lua mod の変数とシートのデータ |
| `plugins.db` | JS プラグインの永続的な KV の保存領域 |

## メッセージの処理の流れ

メッセージがアダプターから入ってくると、次の順序で処理されます（`main.cpp` の `onMessage`。前の段階で処理されるとそこで止まります）。

```
アダプターがメッセージを受け取る（自分の発言の重複除去はアダプター層で済んでいる）
 1. 複数のボットでの沈黙：ほかのボットを @ していて、このボットのコマンドではない → 無視
 2. ブラックリスト・ホワイトリスト：ブラックリストのユーザー/グループ（ホワイトリストモードではリスト外）→ 無視
 3. グループの自動化：「自動キック/ミュート」のキーワードに一致 → 実行して終了
 4. 内蔵のコマンド：CommandRouter.handleMessage（ルールパックのカスタムコマンドを含む）
 5. JS プラグインのコマンド：SealDice 互換のプラグインが登録したコマンド
 6. Lua mod の因果の返信：元祖の mod の msg_reply / msg_order
 7. 因果ルール：WebUI で設定した条件 + アクションのルール
 8. カスタム返信：キーワード/正規表現の返信
 9. JS のコマンド以外のフック：onNotCommandReceived / onMessageReceived
10. AI の会話 / NPC：有効なときに @/キーワード/待機中の確率で反応（バックグラウンドのスレッド）
最後にまとめて送信：{self} の解決 → AI の文章調整 → AI 翻訳 → .link の転送
             → ログの記録 → 分割/まとめた転送 → アダプターから送信
```

AI による後処理が必要な返信は、まとめて AI のバックグラウンドの作業スレッド（`ai_worker`）に渡して実行するため、AI のリクエストがタイムアウトしても後続のコマンドが止まることはありません。

## ホットリロードの仕組み

設定のホットリロードは **ファイルの監視** で実現しています。`HotReloadMonitor` が `config/`（と `data/`）フォルダーの変更を監視し（Windows では ReadDirectoryChangesW）、変更があると自動で読み込み直すため、再起動は不要です。管理パネルで変更した設定もすぐに保存されて反映されます。デッキ / ルールパック / プラグインにはそれぞれ専用の再読み込みの仕組みがあります（パネルからワンクリックで再読み込み）。
