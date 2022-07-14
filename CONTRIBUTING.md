# Contributing

## Setup

### commit/pushさえできればいい人

1. このリポジトリをクローンします(`main`ブランチにいることを確認してください)。
2. クローン先のディレクトリで`npm i --ignore-script`を実行し、パッケージ類をインストールします。
3. `npx prisma generate`も実行します。これによりデータベース関係の型が生成されます。

### 自分のPCで動かしたい人(VSCode DevContainerを使う)

VSCode DevContainerを用いると面倒な環境構築をスキップすることができます(Node.jsすらインストールする必要がありません)。詳細は[VSCodeのドキュメント](https://code.visualstudio.com/docs/remote/containers)を参照してください。  
事前にVSCodeとDockerを入れておいてください。

Windowsを使っている場合、Hyper-Vを有効にするとDockerが効率的に動作します。(ただし、Home Editionでは、Hyper-Vが使えません。)

※東京大学の学生はEducation Editionを使うことができます。詳細は[東京大学のサイト](https://www.u-tokyo.ac.jp/adm/dics/ja/mslicense_win10.html)を参照してください。

1. このリポジトリをクローンします(`main`ブランチにいることを確認してください)。
2. VSCodeでクローンしたリポジトリを開きます。左下に`><`に似たアイコンがあるので、これをクリックし、 `Reopen in Container` を選択してください(もしくは、`Ctrl+Shift+P` や `Command+Shift+P` により `Remote-Containers: Reopen in Container` を実行します)。
3. VSCodeがリロードされ、左下に `Dev Container: Node.js & PostgreSQL` と表示されたら成功です。これであなたは今、予めNode.jsやPostgreSQLがセットアップされたDev Containerの中にいます。
4. `Ctrl + @` などを押してVSCode内でTerminalを開きます。 `npm i` を実行しパッケージ類をインストールします。
5. `npx prisma generate`も実行します。これによりデータベース関係の型が生成されます。
6. ボットを準備していきます。まずは[Discord Developer Portal](https://discord.com/developers/applications)からテスト用のボットを作成します。
7. `Bot`を開き、`Add Bot`を押します(確認画面が出たらそのまま進んで、Botを追加してください)。
8. `PUBLIC BOT`は`OFF`にします(別にしなくてもいいですがPUBLICにする必要はないので…)
9. `TOKEN`をコピーします。
10. `.env` というファイルをプロジェクトの最上部に作成し、トークンを次のように`.env`に追記します。

    ```text
    BOT_TOKEN=トークン
    ```

11. `OAuth2`->`URL Generator`を開き、 `SCOPES`では`bot`と`applications.commands`、`BOT PERMISSIONS`では`Send Messages`、`Send Messages in Threads`、`Embed Links`、`Connect`、`Speak`にチェックを入れ、一番下の`GENERATED URL`をコピーします。
12. ブラウザのアドレスバーに`GENERATED URL`を貼り付けて開きます(その後は普通にテストに使うDiscordサーバーにボットを追加してください)。
13. 次にデータベースをセットアップします。`npx prisma migrate deploy`を実行してください。
14. 音声データをセットアップします。[tohoku-f01](https://github.com/icn-lab/htsvoice-tohoku-f01)を使う場合、voiceフォルダを次のように作成します。

    ```text
    /voice
      └ tohoku-f01
          ├ tohoku-f01-angry.htsvoice
          ├ tohoku-f01-happy.htsvoice
          ├ tohoku-f01-neutral.htsvoice
          └ tohoku-f01-sad.htsvoice
    ```

15. 辞書をセットアップします。`npm run compile-dict`を実行してください。
16. ここまでの作業が終われば、`npm run dev:watch`でボットを実行できるはずです。お疲れさまでした。

### 自分のPCで動かしたい人(VSCode DevContainerを使わない)

PCのパフォーマンスの都合などによりDevContainerを使わない場合はこちらを参照してください。

1. このリポジトリをクローンします(`main`ブランチにいることを確認してください)。
2. クローン先のディレクトリで`npm i`を実行し、パッケージ類をインストールします。
3. `npx prisma generate`も実行します。これによりデータベース関係の型が生成されます。
4. (ここからは`.env`ファイルを作っていきます)
5. Postgresqlをインストール・設定します。

    - dockerを使う場合(手軽だがやや重いかも)

      1. dockerをインストールします。
      2. `docker pull postgres`でpostgresのdockerイメージを取ってきます。
      3. `docker run --rm -d -p 5432:5432 -v postgres-tmp:/var/lib/postgresql/data -e POSTGRES_DB=vutd-shovel-dev -e POSTGRES_USER=vutd-shovel-devuser -e POSTGRES_PASSWORD=change_me postgres`を実行するとpostgresが動き始めます(危ないので外部からアクセスできる状態にしてはいけません)。
      4. データベースの接続文字列を次のように`.env`に追記します(ユーザー名、パスワード、データベース名を変えたらそれに応じて変更してください)。

      ```text
      DATABASE_URL="postgresql://vutd-shovel-devuser:change_me@localhost:5432/vutd-shovel-dev?schema=public"
      ```

    - dockerを使わない場合(dockerより軽く、細かい設定が可能だが面倒)

      1. Postgresqlをインストールします。
      2. pgAdminかpsqlで

          - ボット用のユーザー(パスワードも設定してください。ログイン権限もつけてね！)
          - ボット用のデータベース(上のユーザー向けのアクセス権限をお忘れなく)

          を作成します。
      3. データベースの接続文字列を次のように`.env`に追記します。

      ```text
      DATABASE_URL="postgresql://ユーザー名:パスワード@localhost:5432/データベース名?schema=public"
      ```

6. ボットを準備していきます。まずは[Discord Developer Portal](https://discord.com/developers/applications)からテスト用のボットを作成します。
7. `Bot`を開き、`Add Bot`を押します(確認画面が出たらそのまま進んで、Botを追加してください)。
8. `PUBLIC BOT`は`OFF`にします(別にしなくてもいいですがPUBLICにする必要はないので…)
9. `TOKEN`をコピーします。
10. トークンを次のように`.env`に追記します。

    ```text
    BOT_TOKEN=トークン
    ```

11. (ここまでで`.env`は書き終わりました)
12. `OAuth2`->`URL Generator`を開き、 `SCOPES`では`bot`と`applications.commands`、`BOT PERMISSIONS`では`Send Messages`、`Send Messages in Threads`、`Embed Links`、`Connect`、`Speak`にチェックを入れ、一番下の`GENERATED URL`をコピーします。
13. ブラウザのアドレスバーに`GENERATED URL`を貼り付けて開きます(その後は普通にテストに使うDiscordサーバーにボットを追加してください)。
14. 次にデータベースをセットアップします。`npx prisma migrate deploy`を実行してください。
15. 音声データをセットアップします。[tohoku-f01](https://github.com/icn-lab/htsvoice-tohoku-f01)を使う場合、voiceフォルダを次のように作成します。

    ```text
    /voice
      └ tohoku-f01
          ├ tohoku-f01-angry.htsvoice
          ├ tohoku-f01-happy.htsvoice
          ├ tohoku-f01-neutral.htsvoice
          └ tohoku-f01-sad.htsvoice
    ```

16. 辞書をセットアップします。`npm run compile-dict`を実行してください。
17. ここまでの作業が終われば、`npm run dev:watch`でボットを実行できるはずです。お疲れさまでした。
