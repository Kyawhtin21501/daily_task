# Task Note

既存のFastAPIに接続する、HTML・CSS・JavaScriptだけのシングルページUIです。フロントエンド用のライブラリやビルド作業は不要です。

## 起動

```sh
docker compose up --build
```

ブラウザで http://localhost:8000 を開きます。APIドキュメントは http://localhost:8000/docs です。FastAPIからUIも配信するため、別サーバーやCORS設定は不要です。HTMLを直接開かず、上記URLを使用してください。

## ファイル

- `frontend/index.html`: 画面の構造
- `frontend/style.css`: PC・スマートフォン向けのスタイル
- `frontend/app.js`: API通信、一覧表示、追加、編集、削除、完了切り替え、検索・絞り込み
- `api/main.py`: 既存APIルートの後ろに静的ファイル配信を追加

## 現在のAPIについて

`GET /tasks` と `POST /tasks` は、練習用のメモリ上のリストを使用しています。UIからタスクを追加し、一覧を表示できます。サーバーの再起動や開発中の自動リロードでデータは消えます。単一プロセスでの動作を想定しています。

編集・削除・完了切り替えのAPI処理はまだ `pass` です。これらの操作はデータに反映されません。

作成用のスキーマは `api/routers/task.py` の `TaskCreate` です。UIとの通信形式は次のとおりです。

| 操作 | メソッド・パス | JSONリクエスト |
| --- | --- | --- |
| 一覧取得 | `GET /tasks` | なし |
| 追加 | `POST /tasks` | `{ "title": "タスク名" }` |
| 編集 | `PUT /tasks/{task_id}` | `{ "title": "変更後のタスク名" }` |
| 削除 | `DELETE /tasks/{task_id}` | なし |
| 完了 | `PUT /tasks/{task_id}/done` | なし |
| 未完了に戻す | `DELETE /tasks/{task_id}/done` | なし |

一覧の想定レスポンス:

```json
[{ "id": 1, "title": "最初のタスク", "done": false }]
```

更新操作は成功ステータス（2xx）を確認後、一覧を再取得します。検索と絞り込みは取得済みデータを対象にブラウザで行います。
# daily_task
