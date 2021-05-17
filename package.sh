#!/bin/sh
rm -rf ./dist/trade.links
mkdir -p dist
mkdir ./dist/trade.links

cp -a ./js ./dist/trade.links/js
cp -a ./images ./dist/trade.links/images
cp -a ./css ./dist/trade.links/css
cp -a ./views ./dist/trade.links/views
cp -a ./manifest.json ./dist/trade.links/manifest.json
cp -a ./README.md ./dist/trade.links/README.md
cp -a ./LICENSE ./dist/trade.links/LICENSE

cd ./dist/trade.links

zip -r trade.links.zip ./*

cd -

mv ./dist/trade.links/trade.links.zip ./dist/trade.links.zip
