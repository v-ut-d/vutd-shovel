#!/bin/sh

mkdir -p dictionary/tmp
cd dictionary/tmp
rm -r ./*

cp -r ../../node_modules/node-openjtalk-binding/openjtalk/mecab-naist-jdic/* ./
curl -L -o tdmelodic_openjtalk.csv https://github.com/sarulab-speech/tdmelodic_openjtalk/raw/main/tdmelodic_openjtalk.csv

npx mecab-dict-index -d ./ -o ../

cp char.bin matrix.bin sys.dic unk.dic ../
