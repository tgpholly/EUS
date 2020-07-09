#!/bin/bash
git clone https://github.com/tgpethan/Revolution.git
cd Revolution
npm i
wget https://raw.githubusercontent.com/tgpethan/EUS/master/EUS.js -P modules/
rm modules/example_request_handler.js
cp config/config.example.json config/config.json
npm i connect-busboy randomstring diskusage get-folder-size
