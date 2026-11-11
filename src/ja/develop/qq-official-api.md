# QQ 公式 API v2

このページは [QQ 公式 API v2 のドキュメント](https://bot.q.qq.com/wiki/develop/api-v2/)に基づき、Dice!Next の現在の公式アダプターの API とイベントの入口を扱います。ドキュメントに API があっても、すべてのボットのアカウントが呼び出せる権限を持っているとは限りません。グループメンバーやグループ情報などの機能には招待や許可リストが必要な場合があり、グループの管理操作にはボットがグループの管理者であることが必要な場合もあります。

## バックエンドからの呼び出し入口

### 視覚的な編集

**高度な返信 → カードとボタン** で編集ページを開きます。個別の QQ 公式アダプターのカードの「その他 → カードとボタン」からも入れます。ボットのアカウントを選ぶと、設定はその AppID にだけ公開されます。旧来の `/qq-official` のページのアドレスも引き続き使えます。

- **グローバルメニュー**：既存の設定を読み込み、追加・変更・削除と並べ替えができます。メッセージの送信、HTTPS のリンク、サブメニュー、スイッチに対応しています。レイアウトとリクエストのプレビューでコマンドが実行されることはありません。
- **コマンドパネル**：1 対 1 チャット、グループチャット、テキストのサブチャンネル、チャンネルのダイレクトメッセージで絞り込み、ページごとに読み込みます。作成、変更、削除、管理者の制限、メモに対応しています。既存のパネルの場面と範囲は、内容を変更しても変わりません。
- **関連付ける対象**：1 対 1 チャットではユーザーの OpenID、グループチャットではグループの OpenID を使います。新規作成時は最大 20 個まで入力でき、その後は「関連付けの管理」で少しずつ追加・削除します。今回の入力で既存の関連付けの一覧全体を置き換えることはありません。

編集中の内容はタブを切り替えても保持され、ページを離れたりアカウントを切り替えたりすると、未公開の下書きを破棄するか確認します。公開の前にプラットフォームの版を読み、ほかの変更が見つかれば上書きを止めます。これはプラットフォーム側のアトミックなロックではないため、複数人での同時公開は避けてください。メニューの公開は古いメニューを完全に上書きし、項目を空にして公開するとメニューが消えます。操作の前に確認します。

プラットフォームに拒否された場合やネットワークが失敗した場合は下書きを残します。タイムアウトした後は状態を読み直して確認し、重複して作成しないようにしてください。文字数、項目数、HTTPS のアドレスはフロントエンドで確認しますが、実際の権限と最終的な確認は QQ が決めます。未知の項目は保持し、認識できない種類の項目があると公開を止めるため、明示的に変更か削除をしてください。

### REST のアクション

ログイン済みの管理画面のセッション、または管理画面で設定した `X-API-Key` を使って、次にアクセスします。

```http
GET /api/adapters/{adapterId}/qq-official-actions
POST /api/adapters/{adapterId}/qq-official-actions
```

GET は現在のアカウントが対応する `actions` と `capabilities` を返します。POST のリクエストは常に次の構造です。これは管理画面の API キーで、QQ の AppSecret や AccessToken ではありません。

```json
{
  "action": "qq_generate_share_url",
  "params": { "callbackData": "my-dice" }
}
```

成功した応答の `data` には、プラットフォームが返したデータがそのまま入ります。共有リンクはプラットフォームの応答の `data.url` にあるため、管理画面の API の成功した応答では `data.data.url` になります。呼び出しに失敗すると読めるエラーを返し、未認可、頻度制限、業務上のエラーを成功として扱うことはありません。この入口は一覧にあるアクションだけを許可し、任意の URL や HTTP メソッドの代理はしません。

グループ／ユーザーの識別子には、現在のボットのアカウントの OpenID か、関連付け済みの裸の公開のグループ番号／ユーザー番号を使えます。ボットの AppID が異なる接続先を混ぜて使うことはできません。メンバーに関する一括の操作は 1 回あたり最大 20 人、参加申請のページは 1 ページ最大 50 件、グループのブラックリストのページは 1 ページ最大 100 件です。

## アクションの分類

| 機能 | アクション |
| --- | --- |
| グループ情報、メンバー、ボットの役割 | `qq_group_info`、`qq_bot_state`、`qq_group_members`、`qq_group_member` |
| ミュート | `qq_get_mute`、`qq_set_mute` |
| 参加の承認 | `qq_join_requests`、`qq_approve_join` |
| 自動承認のポリシー | `qq_list_join_strategies`、`qq_create_join_strategy`、`qq_update_join_strategy`、`qq_delete_join_strategy`、`qq_execute_join_strategy`、`qq_update_join_whitelist` |
| メンバーの除外とグループのブラックリスト | `qq_remove_members`、`qq_blacklist`、`qq_set_blacklist` |
| メッセージと取り消し | `qq_send_message`、`qq_recall`、`qq_stream_message` |
| 個人チャットの入力中の状態とインタラクションでの呼び戻し | `qq_input_notify`、`qq_wakeup_message` |
| 共有リンク | `qq_generate_share_url` |
| グローバルメニュー | `qq_get_menu`、`qq_set_menu` |
| コマンドパネル | `qq_list_panels`、`qq_create_panel`、`qq_get_panel`、`qq_update_panel`、`qq_delete_panel`、`qq_panel_target` |
| リッチメディアと分割アップロード | `qq_media_files`、`qq_upload_prepare`、`qq_upload_part_finish` |
| Markdown の画像素材 | `qq_material_prepare`、`qq_material_complete`、`qq_material_list`、`qq_material_delete` |
| チャンネルとボットのプロフィール | `qq_me`、`qq_my_guilds`、`qq_guild`、`qq_guild_channels`、`qq_create_channel`、`qq_channel`、`qq_update_channel`、`qq_delete_channel`、`qq_gateway` |
| インタラクションへの応答 | `qq_interaction` |

基本のパラメーターには `groupId`、`userOpenId`、`memberOpenId`、`strategyId`、`panelId`、`guildId`、`channelId`、`interactionId`、`messageId` などの項目を使います。プラットフォームの設定全体を送る必要があるアクション（メニュー、パネル、ポリシー、ストリーミングのメッセージ、メッセージ、アップロード）は、公式ドキュメントのオブジェクトを `params.body` で送ります。プラットフォームの範囲、権限、頻度制限、項目の制限は引き続き有効です。

### グローバルメニューとパネル

`qq_set_menu` の `body` は完全な `{ "menu": { "items": [...] } }` の設定で、既存のメニューを上書きします。1 対 1 チャットのメニューはメッセージの送信、HTTPS のリンク、サブメニュー、`switch` の種類に対応しています。スイッチの `switch_id` の状態は、その後のメッセージの場面の拡張から読み取れますが、Dice!Next のグローバルな AI の設定を自動で変えることはありません。

パネルの一覧では `scope`、`cursor`、`limit` を使い、作成と変更には公式のパネルの `body` を使います。関連付ける対象には `panelId`、`op: "add" | "del"`、`userOpenIds`／`groupOpenIds` を使い、1 回あたり最大 20 個です。グローバルなパネルや関連付けに対応していない場面はプラットフォームが拒否し、ローカルでこっそり変換することはありません。

### Markdown の画像素材

[公式の素材管理の API](https://bot.q.qq.com/wiki/develop/api-v2/server-inter/message/material-management.html)に基づき、次の管理画面のアクションを提供しています。

| アクション | `params` | 用途 |
| --- | --- | --- |
| `qq_material_upload` | `fileName`、`base64` | 申請、画像の直接アップロード、ダイジェストの確認、アップロードの確定を一度に行う |
| `qq_material_prepare` | `body: { file_name, file_size, content_type, md5, sha1 }` | アップロードを申請し、`upload_id` と `presigned_url` を返す |
| `qq_material_complete` | `body: { upload_id, md5 }` | アップロードを確定し、素材の参照を得る |
| `qq_material_list` | 任意の `cursor` | このアカウントの素材をページごとに一覧表示 |
| `qq_material_delete` | `imageId` | 指定した素材を削除 |

呼び出し側は prepare と complete のあいだに、プラットフォームが返した署名付きのアドレスへ、申請時の Content-Type でファイルのバイナリを PUT します。このアップロードには QQ の AccessToken を付けません。`qq_material_upload` はサーバーがこの 3 段階を自動で行い、プラットフォームが返した HTTPS の COS のアップロード先だけを受け付け、呼び出し側が指定する任意のアップロード先の URL は受け付けません。

ファイルは PNG、JPEG、GIF、WebP に限られ、最大 10 MB です。ファイル名の拡張子は MIME タイプと一致する必要があり、MD5 は 32 桁、SHA-1 は 40 桁の 16 進数です。素材は現在のボットのアカウントのもので、AppID をまたいで使い回すべきではありません。Markdown を送るときは返された `qqbot-media://image/v1/...` の参照を使い、一時的な `preview_url` は永続的な画像のアドレスには向きません。「カードとボタン → 画像素材」で、アップロード、ページごとの表示、必要に応じたプレビュー、画像コードのコピー、削除ができます。一覧では画像を自動で読み込みません。1 アカウントあたり最大 100 枚で、90 日続けて使われない素材は期限切れになります。実際の期限はプラットフォームの応答によります。

### 画像と文章のカードと全員への @

`qq_send_message` は `params.body` で新しい画像と文章のカードをそのまま送れます：`msg_type: 8`、`card.type: "tuwen"`。カードの内容とリンクには [公式のグループメッセージの API](https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_groups_group_openid_messages.post.html)で定義された項目を使います。「カードとボタン → メッセージと画像と文章のカード」で、タイトル（1–50 文字）、説明（1–200 文字）、HTTPS の移動先と画像のアドレスを入力できます。現在の AppID のグループまたはユーザーの OpenID を指定し、確認したときだけ実際に送ります。既存のメッセージに返信する場合は有効なメッセージ ID を入力でき、自発的な送信は引き続きプラットフォームの割り当て量の制限を受けます。

Markdown を明示的に使う返信やネイティブのメッセージのリクエストでは、`<qqbot-at-everyone />` がそのまま QQ に送られます。ボットにはグループの管理者の身分が必要で、プラットフォームの「1 グループにつき 1 日 1 回」の制限を受けます。一般のユーザーの文章が自動で全員へのメンションに変わることはありません。メッセージの編集ページを Markdown に切り替えた後、「全員への @ を挿入」でこのタグを追加できます。Markdown の画像素材の参照もそのまま保持されます。これらの機能は[公式の変更記録](https://bot.q.qq.com/wiki/develop/api-v2/changelog.html)とアカウントの実際の権限によります。

### ショートカットのボタン

QQ のメッセージのボタンのタイトルは最大 10 文字です。Next は操作の説明から、読点の後ろの例などの付け足しを取り除きます。それでも長すぎるタイトルには省略記号を残し、コマンドの引数全体は切り詰めません。「もう一度判定」は元のコマンド（接頭辞、技能の修正、有利／不利、理由を含む）をそのまま使い、クリックした後にユーザーが確認して送信します。ボタン自体が自動でもう一度振ることはありません。

### 入力中の状態

```json
{
  "action": "qq_input_notify",
  "params": { "userOpenId": "ユーザーの OpenID", "seconds": 30, "msg_id": "受け取ったメッセージの ID" }
}
```

個人チャットでのみ使え、継続時間は 1–60 秒です。通常のメッセージの `msg_id` か、イベントへの返信の `event_id` のどちらか一方を使います。

### インタラクションでの呼び戻しとストリーミングのメッセージ

`qq_wakeup_message` は `userOpenId` とメッセージの `body` を使い、`is_wakeup: true` を自動で加えます。`msg_id`／`event_id` と同時には指定できません。呼び戻しの割り当て量は QQ が管理し、この入口が自分から一斉送信したり、ユーザーの代わりに呼び戻しのメッセージを自動で送ったりすることはありません。

`qq_stream_message` は個人チャット専用で、`body` には `input_mode`、`input_state`、`index`、`content_type`、`content_raw`、`stream_msg_id` などの公式の項目をそのまま入れます。最初の断片で返された `id` を後続の断片に使い、順序と内容の先頭部分の管理は呼び出し側が行います。これは API の機能であり、既存の AI の会話が既定でストリーミングで送られるようになるという意味ではありません。

## JS のネイティブのイベントフック

以下は **Dice!Next が追加したネイティブのフック** で、SealDice の標準のインターフェースの宣言ではありません。既存の SealDice 形式のイベントのインターフェースは元のシグネチャのままです。

```javascript
ext.onQQInteraction = (ctx, event, msg) => {
  // event.interaction_id はインタラクションへの応答の ID。外側の event_id と混同しないこと。
  // event.interaction_data.resolved にはボタン、メニュー、フィードバック、認可のデータが入る。
  if (event.interaction_type === 11) {
    seal.replyToSender(ctx, msg, 'ボタンの操作を受け取りました。');
  }
};

ext.onQQSubscriptionStatus = (ctx, event, msg) => {
  // event.subscription_results にはテンプレート、許可/拒否、購読 ID、時刻が入る。
};

ext.onQQOfficialEvent = (ctx, event, msg) => {
  // そのほかの公式のメッセージ以外のイベント（友だちの削除、チャンネルの情報の変更など）。
};
```

`event.groupId`、`userId`、`operatorId` は統一した公開の身元を使い、`event.data` にはプラットフォームのイベントの本体がそのまま入ります。インタラクションや認可の通知で操作者の権限が上がることはなく、フックは引き続きプラグインのオン・オフとグループのスイッチに従います。

自動応答が有効なときは `event.interaction_ack_automatic` が真になり、プラグインが重ねて応答を送るべきではありません。手動で応答する必要がある場合は、アダプターの「インタラクションイベントに自動で応答する」をオフにしてから、`interactionId` と `body: { "code": 0 }` を渡して `qq_interaction` を呼び出します。応答コードは 0–5 で、同じインタラクションには 1 回しか応答できません。ほかの種類のインタラクションには通常応答は不要で、ボタンのデータがダイスのコマンドとして自動で実行されることはありません。

通常の公式のメッセージの `msg.qqOfficial` には、`message_type`、`message_scene`、`ark_data`、添付ファイル、参照のインデックスがあります。メッセージの場面の `auth_token` はこのオブジェクトには出さず、メニューのスイッチなどの認証情報ではない拡張は保持します。既存の `msg.segment` でも引用されたメッセージの要素にアクセスできます。カード、音声認識、引用の中の文字が、新しいコマンドとしてつなぎ合わされることはありません。

現在のメッセージを引用するときはプラットフォームが提供する `msg_idx` を使い、受動的な返信の `msg_id` とは別に扱います。古いメッセージや過去の指定の引用にインデックスがない場合も本文は通常どおり送り、論理的なメッセージ ID を参照のインデックスとして偽ることはありません。複数に分けた返信で繰り返し引用することもありません。

## 範囲と確認

API とイベントには、オフラインでのリクエストの対応付け、重複した送信、パラメーターの制限、タイムスタンプ、プラグインのコールバックの回帰テストがあります。まだ認可されていない実際のアカウントについて、これをもってオンラインでの確認が完了したとは見なせません。

参考：[グループメンバーの参加イベント](https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/group_member_add.html)、[インタラクションのイベント](https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/interaction_create.html)、[インタラクションへの応答](https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/interactions_interaction_id.put.html)、[購読の認可の状態](https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/subscribe_message_status.html)、[グローバルメニュー](https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_menu.put.html)、[共有リンクの生成](https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_generate_url_link.post.html)。
