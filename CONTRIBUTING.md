# Contributing

## Setup

### commit/pushさえできればいい人
1. このリポジトリをクローンします(`main`ブランチにいることを確認してください)。
2. クローン先のディレクトリで`npm i --ignore-script`を実行し、パッケージ類をインストールします。
3. `npx prisma generate`も実行します。これによりデータベース関係の型が生成されます。

### 自分のPCで動かしたい人
1. このリポジトリをクローンします(`main`ブランチにいることを確認してください)。
2. node-openjtalk-bindingのビルドのため、ビルドに必要なツールをインストールします。Windowsを使っている方は、[Visual Studio 2022](https://visualstudio.microsoft.com/ja/downloads)または[Build Tools for Visual Studio 2022](https://visualstudio.microsoft.com/ja/downloads/#build-tools-for-visual-studio-2022)をインストールしてください(たぶん後者の方が軽量)。
3. クローン先のディレクトリで`npm i`を実行し、パッケージ類をインストールします。
4. `npx prisma generate`も実行します。これによりデータベース関係の型が生成されます。
5. (ここからは`.env`ファイルを作っていきます)
6. Postgresqlをインストールします。dockerでもいいでしょう。
7. データベースの接続文字列を次のように`.env`に追記します。
```
DATABASE_URL="postgresql://ユーザー名:パスワード@localhost:5432/データベース名?schema=public"
```
8. [Discord Developer Portal](https://discord.com/developers/applications)からテスト用のボットを作成します。
9. `OAuth2`->`URL Generator`を開き、 `SCOPES`では`bot`と`applications.commands`、`BOT PERMISSIONS`では`Send Messages`、`Send Messages in Threads`、`Embed Links`、`Connect`、`Speak`にチェックを入れ、一番下の`GENERATED URL`をコピーします。
10. ブラウザのアドレスバーに`GENERATED URL`を貼り付けて開きます(その後は普通にテスト用Discordサーバーにボットを追加してください)。
11. Discord Developer Portalに戻ります。`Bot`を開いてください。
12. `Add Bot`を押します(確認画面が出たらそのまま進んで、Botを追加してください)。
13. `PUBLIC BOT`は`OFF`にします(別にしなくてもいいですがPUBLICではないので…)
14. `TOKEN`をコピーします。
15. トークンを次のように`.env`に追記します。
```
BOT_TOKEN=トークン
```
16. 続いて`GUILD_ID`と`MANAGE_ID`も書いていきましょう。
17. `GUILD_ID`は先ほどボットを追加したサーバーのID、`MANAGE_ID`はボットの管理者のユーザーID、すなわちあなたのユーザーIDです。次のように追記します。
```
GUILD_ID=先ほどボットを追加したサーバーのID
MANAGE_ID=あなたのユーザーID
```
18. (ここまでで`.env`は書き終わりました)
19. 次にデータベースをセットアップします。`npx prisma deploy`を実行してください。
20. 辞書をセットアップします。Git Bashでディレクトリを開き、`bash script/dict.sh`を実行してください。(少し時間がかかるでしょう)
21. 音声データをセットアップします。[tohoku-f01](https://github.com/icn-lab/htsvoice-tohoku-f01)を使う場合、voiceフォルダを次のように作成します。
```
/voice
  └ tohoku-f01
      ├ tohoku-f01-angry.htsvoice
      ├ tohoku-f01-happy.htsvoice
      ├ tohoku-f01-neutral.htsvoice
      └ tohoku-f01-sad.htsvoice
```
22. ここまでの作業が終われば、`npm run dev:watch`でボットを実行できるはずです。お疲れさまでした。