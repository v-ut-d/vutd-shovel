# Contributing

## Setup

### commit/pushさえできればいい人
1. このリポジトリをクローンします(`main`ブランチにいることを確認してください)。
2. クローン先のディレクトリで`npm i --ignore-script`を実行し、パッケージ類をインストールします。
3. `npx prisma generate`も実行します。これによりデータベース関係の型が生成されます。

### 自分のPCで動かしたい人
1. このリポジトリをクローンします(`main`ブランチにいることを確認してください)。
2. クローン先のディレクトリで`npm i`を実行し、パッケージ類をインストールします。
3. `npx prisma generate`も実行します。これによりデータベース関係の型が生成されます。
4. (ここからは`.env`ファイルを作っていきます)
5. Postgresqlをインストールします。

- dockerを使う場合(手軽だがやや重いかも)

  1. dockerをインストールします。
  2. `docker pull postgres`でpostgresのdockerイメージを取ってきます。
  3. `docker run --rm -d -p 5432:5432 -v postgres-tmp:/var/lib/postgresql/data -e POSTGRES_DB=vutd-shovel-dev -e POSTGRES_USER=vutd-shovel-devuser -e POSTGRES_PASSWORD=change_me postgres`を実行するとpostgresが動き始めます(危ないので外部からアクセスできる状態にしてはいけません)。
  4. データベースの接続文字列を次のように`.env`に追記します(ユーザー名、パスワード、データベース名を変えたらそれに応じて変更してください)。
  ```
  DATABASE_URL="postgresql://vutd-shovel-devuser:change_me@localhost:5432/vutd-shovel-dev?schema=public"
  ```

- dockerを使わない場合(dockerより軽く、細かい設定が可能だが面倒)

  1. Postgresqlをインストールします。
  2. pgAdminでもpsqlでもいいので

    - ボット用のユーザー(パスワードも設定してください。ログイン権限もつけてね！)
    - ボット用のデータベース(上のユーザー向けのアクセス権限をお忘れなく)

      を作成します。
  3. データベースの接続文字列を次のように`.env`に追記します。
  ```
  DATABASE_URL="postgresql://ユーザー名:パスワード@localhost:5432/データベース名?schema=public"
  ```

6. ボットを準備していきます。まずは[Discord Developer Portal](https://discord.com/developers/applications)からテスト用のボットを作成します。
7. `OAuth2`->`URL Generator`を開き、 `SCOPES`では`bot`と`applications.commands`、`BOT PERMISSIONS`では`Send Messages`、`Send Messages in Threads`、`Embed Links`、`Connect`、`Speak`にチェックを入れ、一番下の`GENERATED URL`をコピーします。
8. ブラウザのアドレスバーに`GENERATED URL`を貼り付けて開きます(その後は普通にテストに使うDiscordサーバーにボットを追加してください)。
9. Discord Developer Portalに戻ります。`Bot`を開いてください。
10. `Add Bot`を押します(確認画面が出たらそのまま進んで、Botを追加してください)。
11. `PUBLIC BOT`は`OFF`にします(別にしなくてもいいですがPUBLICにする必要はないので…)
12. `TOKEN`をコピーします。
13. トークンを次のように`.env`に追記します。
```
BOT_TOKEN=トークン
```
14. (ここまでで`.env`は書き終わりました)
15. 次にデータベースをセットアップします。`npx prisma deploy`を実行してください。
16. 音声データをセットアップします。[tohoku-f01](https://github.com/icn-lab/htsvoice-tohoku-f01)を使う場合、voiceフォルダを次のように作成します。
```
/voice
  └ tohoku-f01
      ├ tohoku-f01-angry.htsvoice
      ├ tohoku-f01-happy.htsvoice
      ├ tohoku-f01-neutral.htsvoice
      └ tohoku-f01-sad.htsvoice
```
17. ここまでの作業が終われば、`npm run dev:watch`でボットを実行できるはずです。お疲れさまでした。