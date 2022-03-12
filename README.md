# vutd-shovel

Discord用のTTS botです．cod氏の[shovel](https://cod-sushi.com/shovel-how-to-use/)のクローンです．

# 使い方

## voiceディレクトリをセットアップする

tohoku-f01を使う場合，voiceフォルダを次のように作成します．
```
/voice
  └ tohoku-f01
      ├ tohoku-f01-angry.htsvoice
      ├ tohoku-f01-happy.htsvoice
      ├ tohoku-f01-neutral.htsvoice
      └ tohoku-f01-sad.htsvoice
```
フォルダ名を`folder`としたとき，その中のファイル名は`${folder}-${name}.htsvoice`となっている必要があります．


## docker

```sh
mkdir vutd-shovel
cd vutd-shovel

# setup voice directory

wget https://github.com/v-ut-d/vutd-shovel/raw/main/docker-compose.yml
docker-compose up [-d]
```

## npm

```sh
git clone https://github.com/v-ut-d/vutd-shovel.git
cd vutd-shovel

npm i
npx prisma generate
npm run build

# setup voice directory

# setup postgres server
npx prisma migrate dev

npm start
```

# Copyrights

- src/data/alkana.json \
The original data is from [alkana](https://github.com/cod-sushi/alkana.py). \
Copyright 2019 by cod \
Copyright 1999-2002 by Bilingual Emacspeak Project


# License

GPLv2
