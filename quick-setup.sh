#!/bin/bash
git clone https://github.com/tgpethan/Revolution.git
cd Revolution
npm i
cd modules
wget https://raw.githubusercontent.com/tgpethan/EUS/master/EUS.js
cd ..
cd config
cp config.example.json config.json
cd ..
npm i connect-busboy randomstring
