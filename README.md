# ts-node-template

Template Repository for TypeScript + Node.js Application

## Setup

```sh
# リポジトリ作成時
npm init -y
# 以降
npm i
```

## Git Hooks

以下のコマンドが`git commit`時に自動で実行される．

```sh
npm run check  # 静的型チェック
npm run format # コード整形
```

以下のコマンドが`git push`時に自動で実行される．
```sh
npm test       # 単体テストチェック
```

いずれかがエラーを吐くと`git commit/push`できないので注意．

## Scripts

主に使うのは太字の2つ．

* `npm run build`
  * `tsc`
  * `src/**/*.ts`をもとに`dist/**/*.js`を生成する
  * 本番環境用
* `npm run check`
  * `tsc --noEmit`
  * `src/**/*.ts`の静的型エラーがないか確認する
  * `dist/**/*.js`を生成しない
  * `git commit`時の自動実行その1
* `npm run dev`
  * `ts-node src/index.ts`
  * `dist/**/*.js`を生成せずに直接実行する
* **`npm run dev:watch`**
  * `ts-node-dev src/index.ts`
  * `dist/**/*.js`を生成せずに直接実行する
  * `src/**/*.ts`に変更があったときに自動で再起動する
* `npm run lint-staged`
  * `lint-staged`
  * ワークスペース内のコード等を整形する
  * `git commit`時の自動実行その2
* `npm run prepare`
  * `husky install`
  * `npm install`時に自動実行される；それ以外では実行しなくてよい
* `npm start`
  * `node dist/index.js`
  * コンパイルされた.jsを実行する
  * 本番環境用
* **`npm test`**
  * `jest`
  * `src/**/*.test.ts`にあるテストを実行する
  * `git push`時の自動実行

# Deploy

* `docker-compose.yml`
```yml
services:
  [name]:
    env_file: ./[path].env
    build: ./[path]
```

* `docker` command
```sh
docker build . -t [name]
docker run -d [name]
```
